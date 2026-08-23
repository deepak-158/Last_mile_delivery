import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ChooseRegisterTypePage from './pages/auth/ChooseRegisterTypePage';
import CustomerRegisterPage from './pages/auth/CustomerRegisterPage';
import AgentRegisterPage from './pages/auth/AgentRegisterPage';
import AdminRegisterPage from './pages/auth/AdminRegisterPage';

// Customer Pages (Pure Last-Mile Parcel Logistics)
import CustomerHomePage from './pages/customer/CustomerHomePage';
import CustomerTrackOrderPage from './pages/customer/CustomerTrackOrderPage';
import CustomerOrdersListPage from './pages/customer/CustomerOrdersListPage';
import CustomerOrderDetailViewPage from './pages/customer/CustomerOrderDetailViewPage';
import CustomerOffersPage from './pages/customer/CustomerOffersPage';
import CustomerPaymentMethodsPage from './pages/customer/CustomerPaymentMethodsPage';
import CustomerWalletPage from './pages/customer/CustomerWalletPage';
import CustomerReferEarnPage from './pages/customer/CustomerReferEarnPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import CustomerHelpSupportPage from './pages/customer/CustomerHelpSupportPage';
import CreateOrderPage from './pages/customer/CreateOrderPage';
import AddressBookPage from './pages/customer/AddressBookPage';

// Agent Pages
import AgentDashboardOverview from './pages/agent/AgentDashboardOverview';
import AgentDeliveryFlowPage from './pages/agent/AgentDeliveryFlowPage';
import AgentDeliveriesListPage from './pages/agent/AgentDeliveriesListPage';
import AgentEarningsPage from './pages/agent/AgentEarningsPage';
import AgentWalletPage from './pages/agent/AgentWalletPage';
import AgentProfilePage from './pages/agent/AgentProfilePage';

// Admin Pages
import AdminDashboardOverview from './pages/admin/AdminDashboardOverview';
import AdminOrdersManagement from './pages/admin/AdminOrdersManagement';
import AdminAssignmentsPage from './pages/admin/AdminAssignmentsPage';
import AdminUsersManagement from './pages/admin/AdminUsersManagement';
import AdminAgentsPage from './pages/admin/AdminAgentsPage';
import AdminLiveTrackingPage from './pages/admin/AdminLiveTrackingPage';
import AdminEarningsPage from './pages/admin/AdminEarningsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminDisputesPage from './pages/admin/AdminDisputesPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminActivityLogsPage from './pages/admin/AdminActivityLogsPage';
import ZonesPage from './pages/admin/ZonesPage';
import RateCardsPage from './pages/admin/RateCardsPage';
import CODConfigPage from './pages/admin/CODConfigPage';
import UserNotificationsPage from './pages/shared/UserNotificationsPage';

// Role Guard Component
function RoleRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
        <span className="w-8 h-8 border-3 border-[#5046e4]/30 border-t-[#5046e4] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'AGENT') return <Navigate to="/agent/dashboard" replace />;
    return <Navigate to="/customer/home" replace />;
  }

  return children;
}

// Default Landing Handler
function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
        <span className="w-8 h-8 border-3 border-[#5046e4]/30 border-t-[#5046e4] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'AGENT') return <Navigate to="/agent/dashboard" replace />;
  return <Navigate to="/customer/home" replace />;
}

import FCMNotificationHandler from './components/FCMNotificationHandler';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <FCMNotificationHandler />
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<ChooseRegisterTypePage />} />
          <Route path="/register/customer" element={<CustomerRegisterPage />} />
          <Route path="/register/agent" element={<AgentRegisterPage />} />
          <Route path="/register/admin" element={<AdminRegisterPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            {/* ─── CUSTOMER ROUTES ─── */}
            <Route
              path="/customer/home"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <CustomerHomePage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/track"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN', 'AGENT']}>
                  <CustomerTrackOrderPage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/orders"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <CustomerOrdersListPage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/orders/new"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <CreateOrderPage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/orders/:id"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN', 'AGENT']}>
                  <CustomerOrderDetailViewPage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/offers"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <CustomerOffersPage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/addresses"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <AddressBookPage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/payments"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <CustomerPaymentMethodsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/wallet"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <CustomerWalletPage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/refer"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <CustomerReferEarnPage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/profile"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <CustomerProfilePage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/support"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <CustomerHelpSupportPage />
                </RoleRoute>
              }
            />
            <Route
              path="/customer/notifications"
              element={
                <RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <UserNotificationsPage />
                </RoleRoute>
              }
            />

            {/* ─── AGENT ROUTES ─── */}
            <Route
              path="/agent/dashboard"
              element={
                <RoleRoute allowedRoles={['AGENT', 'ADMIN']}>
                  <AgentDashboardOverview />
                </RoleRoute>
              }
            />
            <Route
              path="/agent/orders"
              element={
                <RoleRoute allowedRoles={['AGENT', 'ADMIN']}>
                  <AgentDeliveriesListPage />
                </RoleRoute>
              }
            />
            <Route
              path="/agent/delivery-flow"
              element={
                <RoleRoute allowedRoles={['AGENT', 'ADMIN']}>
                  <AgentDeliveryFlowPage />
                </RoleRoute>
              }
            />
            <Route
              path="/agent/earnings"
              element={
                <RoleRoute allowedRoles={['AGENT', 'ADMIN']}>
                  <AgentEarningsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/agent/wallet"
              element={
                <RoleRoute allowedRoles={['AGENT', 'ADMIN']}>
                  <AgentWalletPage />
                </RoleRoute>
              }
            />
            <Route
              path="/agent/profile"
              element={
                <RoleRoute allowedRoles={['AGENT', 'ADMIN']}>
                  <AgentProfilePage />
                </RoleRoute>
              }
            />
            <Route
              path="/agent/notifications"
              element={
                <RoleRoute allowedRoles={['AGENT', 'ADMIN']}>
                  <UserNotificationsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/agent/support"
              element={
                <RoleRoute allowedRoles={['AGENT', 'ADMIN']}>
                  <CustomerHelpSupportPage />
                </RoleRoute>
              }
            />
            <Route
              path="/agent/settings"
              element={
                <RoleRoute allowedRoles={['AGENT', 'ADMIN']}>
                  <AgentProfilePage />
                </RoleRoute>
              }
            />

            {/* ─── ADMIN ROUTES ─── */}
            <Route
              path="/admin/dashboard"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardOverview />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminOrdersManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/assignments"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminAssignmentsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminUsersManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/agents"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminAgentsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/live-tracking"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminLiveTrackingPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/earnings"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminEarningsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminReportsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/disputes"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminDisputesPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminNotificationsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminSettingsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/activity-logs"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminActivityLogsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/zones"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <ZonesPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/rate-cards"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <RateCardsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/cod-config"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <CODConfigPage />
                </RoleRoute>
              }
            />
          </Route>

          {/* Catch-all: redirect any wrong/unmatched path directly to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
