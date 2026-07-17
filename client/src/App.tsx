import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import DashboardPage from './pages/DashboardPage.js';

// Features imports
import SearchPage from './features/search/SearchPage.js';
import TimelinePage from './features/timeline/TimelinePage.js';
import GraphPage from './features/graph/GraphPage.js';
import PeoplePage from './features/people/PeoplePage.js';
import FoldersPage from './features/folders/FoldersPage.js';
import AutomationsPage from './features/automations/AutomationsPage.js';
import TeamPage from './features/team/TeamPage.js';
import LoopsPage from './features/loops/LoopsPage.js';
import SettingsPage from './features/settings/SettingsPage.js';

import { useAuthStore } from './store/authStore.js';

// Protected Route Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-memora-bg text-memora-text">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-memora-accent border-t-transparent"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="graph" element={<GraphPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="folders" element={<FoldersPage />} />
        <Route path="automations" element={<AutomationsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="loops" element={<LoopsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
