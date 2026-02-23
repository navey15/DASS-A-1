import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

// Components (to be created)
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import PasswordResetRequest from './pages/Auth/PasswordResetRequest'; // Import updated reset page
import Onboarding from './pages/Auth/Onboarding';
import Home from './pages/Home';
import EventsList from './pages/Events/EventsList';
import EventDetails from './pages/Events/EventDetails';
import TopBar from './components/TopBar';

// Participant Pages
import ParticipantDashboard from './pages/Participant/Dashboard';
import MyEvents from './pages/Participant/MyEvents';
import Profile from './pages/Participant/Profile';
import OrganizersList from './pages/Participant/OrganizersList';
import OrganizerDetail from './pages/Participant/OrganizerDetail';
import TeamChat from './pages/Participant/TeamChat'; // New Chat Component

// Organizer Pages
import OrganizerDashboard from './pages/Organizer/Dashboard';
import CreateEvent from './pages/Organizer/CreateEvent';
import ManageEvents from './pages/Organizer/ManageEvents';
import EventAnalytics from './pages/Organizer/EventAnalytics';
import PaymentApprovals from './pages/Organizer/PaymentApprovals';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import ManageOrganizers from './pages/Admin/ManageOrganizers';
import ManageParticipants from './pages/Admin/ManageParticipants';
import PasswordRequests from './pages/Admin/PasswordRequests';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<EventsList />} />
      <Route path="/events/:id" element={<EventDetails />} />
      
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/reset-password-request" 
        element={
          <PublicRoute>
            <PasswordResetRequest />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      <Route 
        path="/onboarding" 
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <Onboarding />
          </ProtectedRoute>
        } 
      />

      {/* Participant Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <ParticipantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-events"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <MyEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizers"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <OrganizersList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizers/:id"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <OrganizerDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team/:teamId/chat"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <TeamChat />
          </ProtectedRoute>
        }
      />

      {/* Organizer Routes */}
      <Route
        path="/organizer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/create-event"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/events"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <ManageEvents />
          </ProtectedRoute>
        }
      />
      
      {/* Edit Route uses CreateEvent component but will need logic to handle 'edit' mode if passed */}
      <Route
        path="/organizer/events/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/organizer/events/:id/payments"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <PaymentApprovals />
          </ProtectedRoute>
        }
      />
            <Route
        path="/organizer/events/:id/analytics"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <EventAnalytics />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/organizers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageOrganizers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/participants"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageParticipants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/password-requests"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PasswordRequests />
          </ProtectedRoute>
        }
      />

      {/* 404 Not Found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="App">
            <TopBar />
            <AppRoutes />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
