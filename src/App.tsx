import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ReportCase from './pages/ReportCase';
import Lab from './pages/Lab';
import Analytics from './pages/Analytics';
import Outbreaks from './pages/Outbreaks';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import 'leaflet/dist/leaflet.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Protected Routes with AppLayout */}
      <Route element={<AppLayout />}>
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/report" 
          element={
            <ProtectedRoute allowedRoles={['reporter', 'district_officer', 'national_officer', 'admin']}>
              <ReportCase />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lab" 
          element={
            <ProtectedRoute allowedRoles={['lab_tech', 'admin']}>
              <Lab />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute allowedRoles={['district_officer', 'national_officer', 'admin']}>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/outbreaks" 
          element={
            <ProtectedRoute allowedRoles={['district_officer', 'national_officer', 'admin']}>
              <Outbreaks />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <div>File Upload (Coming Soon)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Admin />
            </ProtectedRoute>
          } 
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}