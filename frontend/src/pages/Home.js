import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-container">
      <header className="hero-section">
        <h1>Felicity Event Management System</h1>
        <p>Your Gateway to Amazing Events and Experiences</p>
        
        {!isAuthenticated ? (
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </div>
        ) : (
          <div className="user-welcome">
            <h2>Welcome back, {user?.firstName || user?.organizerName || 'User'}!</h2>
            <Link 
              to={
                user?.role === 'admin' ? '/admin/dashboard' :
                user?.role === 'organizer' ? '/organizer/dashboard' :
                '/dashboard'
              } 
              className="btn btn-primary"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </header>

      <section className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>📅 Browse Events</h3>
            <p>Discover exciting events from technical workshops to cultural programs</p>
          </div>
          <div className="feature-card">
            <h3>🎫 Easy Registration</h3>
            <p>Quick and simple event registration with instant confirmation</p>
          </div>
          <div className="feature-card">
            <h3>👥 Team Events</h3>
            <p>Form teams for hackathons and collaborative competitions</p>
          </div>
          <div className="feature-card">
            <h3>💬 Discussion Forums</h3>
            <p>Engage with organizers and fellow participants</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of participants in Felicity's amazing events!</p>
        <Link to="/events" className="btn btn-large">Browse Events</Link>
      </section>
    </div>
  );
};

export default Home;
