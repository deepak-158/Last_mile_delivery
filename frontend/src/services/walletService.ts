import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  orderId?: string;
  createdAt: string;
}

export const walletService = {
  /**
   * Fetch wallet balance and ledger history with automatic self-healing ledger sync
   */
  async getWallet(): Promise<{ balance: number; transactions: WalletTransaction[] }> {
    const user = auth.currentUser;
    if (!user) return { balance: 5000, transactions: [] };

    // 1. Fetch transactions ledger
    let transactions: WalletTransaction[] = [];
    try {
      const txSnap = await getDocs(
        query(collection(db, 'wallet_transactions'), where('userId', '==', user.uid))
      );
      transactions = txSnap.docs.map((d) => ({ id: d.id, ...d.data() } as WalletTransaction));
      // Sort newest first
      transactions.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (err) {
      console.warn('Transactions read note:', err);
    }

    // 2. Fetch or initialize user profile document
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let baseBalance = 5000;
    if (userSnap.exists() && typeof userSnap.data().initialCredit === 'number') {
      baseBalance = userSnap.data().initialCredit;
    }

    // Compute balance from ledger
    const totalCredits = transactions
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalDebits = transactions
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const ledgerBalance = Math.max(0, Math.round((baseBalance + totalCredits - totalDebits) * 100) / 100);

    // Sync to user profile in Firestore
    try {
      await setDoc(userRef, { walletBalance: ledgerBalance, initialCredit: baseBalance }, { merge: true });
    } catch {
      // ignore
    }

    // Update localStorage user cache
    const savedUserStr = localStorage.getItem('user');
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        parsed.walletBalance = ledgerBalance;
        localStorage.setItem('user', JSON.stringify(parsed));
      } catch {
        // ignore
      }
    }

    return { balance: ledgerBalance, transactions };
  },

  /**
   * Top-up wallet balance
   */
  async topup(amount: number): Promise<{ balance: number; message: string }> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const txData = {
      userId: user.uid,
      amount: Number(amount),
      type: 'CREDIT',
      description: `Wallet top-up (+₹${amount})`,
      createdAt: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'wallet_transactions'), txData);

    const wallet = await this.getWallet();
    return { balance: wallet.balance, message: `Wallet topped up by ₹${amount} successfully!` };
  },

  /**
   * Deduct prepaid amount for an order booking
   */
  async deduct(userId: string, amount: number, orderId: string, description: string): Promise<number> {
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) return 0;

    const txData = {
      userId,
      amount: numAmount,
      type: 'DEBIT',
      orderId,
      description,
      createdAt: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'wallet_transactions'), txData);

    // Fetch and sync updated balance
    const wallet = await this.getWallet();
    return wallet.balance;
  },
};
