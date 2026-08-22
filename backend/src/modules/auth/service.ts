import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { config } from '../../config';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from './dto';
import { ApiError } from '../../middleware/errorHandler';
import { Role } from '../../types/enums';

// Dummy bcrypt hash for constant-time comparison on invalid emails (mitigates timing attacks)
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';

export class AuthService {
  async register(data: RegisterInput) {
    const email = data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const assignedRole = data.role || Role.CUSTOMER;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: data.name.trim(),
          phone: data.phone?.trim() || null,
          role: assignedRole,
          walletBalance: assignedRole === Role.CUSTOMER ? 5000.0 : 0.0,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          walletBalance: true,
          createdAt: true,
        },
      });

      // If registered as Agent, automatically create the Agent fleet profile
      if (assignedRole === Role.AGENT) {
        await tx.agent.create({
          data: {
            userId: user.id,
            isAvailable: true,
          },
        });
      }

      return user;
    });

    const token = this.generateToken(result.id, result.email, result.role as Role);

    return { user: result, token };
  }

  async login(data: LoginInput) {
    const email = data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        agent: true,
      },
    });

    // Timing attack mitigation: always execute bcrypt compare
    const passwordToCompare = user ? user.password : DUMMY_HASH;
    const isValidPassword = await bcrypt.compare(data.password, passwordToCompare);

    if (!user || !isValidPassword) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const token = this.generateToken(user.id, user.email, user.role as Role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        walletBalance: user.walletBalance,
        agent: user.agent ? { id: user.agent.id, isAvailable: user.agent.isAvailable } : null,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        walletBalance: true,
        createdAt: true,
        agent: {
          select: { id: true, isAvailable: true, currentZone: true },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User account not found.');
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'User account not found.');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        walletBalance: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'User account not found.');
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'Current password does not match.');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully.' };
  }

  async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        walletBalance: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWallet(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletBalance: true,
        walletTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User account not found.');
    }

    return {
      balance: user.walletBalance,
      transactions: user.walletTransactions,
    };
  }

  async topupWallet(userId: string, amount: number) {
    const topupNum = Number(amount);
    if (isNaN(topupNum) || topupNum <= 0) {
      throw new ApiError(400, 'Top-up amount must be a positive number.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: topupNum } },
        select: { id: true, walletBalance: true },
      });

      const txRecord = await tx.walletTransaction.create({
        data: {
          userId,
          amount: topupNum,
          type: 'CREDIT',
          description: `Delivero Wallet Top-up (Instant Credit)`,
        },
      });

      return { balance: user.walletBalance, transaction: txRecord };
    });

    return updated;
  }

  private generateToken(userId: string, email: string, role: Role): string {
    return jwt.sign({ userId, email, role }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }
}
