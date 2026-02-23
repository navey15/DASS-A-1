import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TopBar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user?.organizerName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email;   
  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'organizer' ? 'Organizer' : 'Participant';        

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <Link to="/">Felicity EMS</Link>
      </div>

      {isAuthenticated && (
        <nav className="topbar-nav">
          {/* Participant Links */}
          {user?.role === 'participant' && (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/events">Browse Events</Link>
              <Link to="/organizers">Clubs/Organizers</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/my-events">My Events</Link>
            </>
          )}

          {/* Organizer Links */}
          {user?.role === 'organizer' && (
            <>
              <Link to="/organizer/dashboard">Dashboard</Link>
              <Link to="/organizer/create-event">Create Event</Link>
              <Link to="/organizer/events">Manage Events</Link>
              <Link to="/organizer/dashboard">Profile</Link>
            </>
          )}

          {/* Admin Links */}
          {user?.role === 'admin' && (
            <>
              <Link to="/admin/dashboard">Dashboard</Link>
              <Link to="/admin/organizers">Organizers</Link>
              <Link to="/admin/participants">Participants</Link>
              <Link to="/admin/password-requests">Password Requests</Link>
            </>
          )}
        </nav>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="topbar-actions">
        <button 
          onClick={toggleTheme} 
          className="btn-icon" 
          aria-label="Toggle Dark Mode"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {isAuthenticated ? (
          <>
            <div className="topbar-user">
              <span className="topbar-name">{displayName}</span>
              <span className="topbar-role">{roleLabel}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
