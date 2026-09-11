import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

// Lazy-loaded Auth pages
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

// Lazy-loaded Farmer pages
const FarmerDashboard = lazy(() => import('@/pages/FarmerDashboard'));
const CropDoctor = lazy(() => import('@/pages/CropDoctor'));
const OutbreakRadar = lazy(() => import('@/pages/OutbreakRadar'));
const HarvestGuardian = lazy(() => import('@/pages/HarvestGuardian'));
const MarketCopilot = lazy(() => import('@/pages/MarketCopilot'));
const AskKisanMitra = lazy(() => import('@/pages/AskKisanMitra'));
const ConversationHistory = lazy(() => import('@/pages/ConversationHistory'));
const Preferences = lazy(() => import('@/pages/Preferences'));
const Profile = lazy(() => import('@/pages/Profile'));

// Lazy-loaded Admin pages
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminFarmers = lazy(() => import('@/pages/AdminFarmers'));
const AdminDiseaseAlerts = lazy(() => import('@/pages/AdminDiseaseAlerts'));
const AdminMarketData = lazy(() => import('@/pages/AdminMarketData'));
const AdminConversations = lazy(() => import('@/pages/AdminConversations'));
const AdminAudit = lazy(() => import('@/pages/AdminAudit'));

// Layouts
import FarmerLayout from '@/components/kisan/FarmerLayout';
import AdminLayout from '@/components/kisan/AdminLayout';

const RouteFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full p-8">
    <div className="w-8 h-8 border-3 border-emerald-200 border-t-[#005A3C] rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-xs">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-[#005A3C] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected farmer routes */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<FarmerLayout />}>
            <Route path="/dashboard" element={<FarmerDashboard />} />
            <Route path="/crop-doctor" element={<CropDoctor />} />
            <Route path="/outbreak-radar" element={<OutbreakRadar />} />
            <Route path="/harvest-guardian" element={<HarvestGuardian />} />
            <Route path="/market-copilot" element={<MarketCopilot />} />
            <Route path="/chat" element={<AskKisanMitra />} />
            <Route path="/ask-kisan-mitra" element={<Navigate to="/chat" replace />} />
            <Route path="/conversations" element={<ConversationHistory />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          {/* Protected admin routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/farmers" element={<AdminFarmers />} />
            <Route path="/admin/disease-alerts" element={<AdminDiseaseAlerts />} />
            <Route path="/admin/market-data" element={<AdminMarketData />} />
            <Route path="/admin/conversations" element={<AdminConversations />} />
            <Route path="/admin/audit" element={<AdminAudit />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App