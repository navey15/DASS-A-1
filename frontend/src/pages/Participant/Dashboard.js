import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services';
import { Calendar, CheckCircle, TrendingUp, Search, User, ArrowRight } from 'lucide-react';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await userService.getDashboardStats();
        if (response.success) {
          setStats(response.data.stats);
          setUpcomingEvents(response.data.upcomingEvents);
          setRecommendedEvents(response.data.recommendedEvents);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{maxWidth: '1200px', margin: '0 auto', padding: '2rem'}}>
      <header style={{marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem'}}>Welcome back, {user?.firstName}!</h1>
          <p style={{color: 'var(--text-secondary)'}}>Your personal event dashboard</p>
        </div>
        <Link to="/events" className="btn btn-primary" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Search size={18} /> Browse Events
        </Link>
      </header>

      {/* Stats Grid */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem'}}>
        <div className="surface" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid var(--info)'}}>
          <div style={{background: 'var(--info-bg)', padding: '12px', borderRadius: '50%', color: 'var(--info)'}}>
            <Calendar size={24} />
          </div>
          <div>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px'}}>Total Events</p>
            <h3 style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-dark)'}}>{stats.total || 0}</h3>
          </div>
        </div>

        <div className="surface" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid var(--success)'}}>
          <div style={{background: 'var(--success-bg)', padding: '12px', borderRadius: '50%', color: 'var(--success)'}}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px'}}>Upcoming</p>
            <h3 style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-dark)'}}>{stats.upcoming || 0}</h3>
          </div>
        </div>

        <div className="surface" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid #8b5cf6'}}>
          <div style={{background: '#f3e8ff', padding: '12px', borderRadius: '50%', color: '#8b5cf6'}}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px'}}>Completed</p>
            <h3 style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-dark)'}}>{stats.completed || 0}</h3>
          </div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem'}}>
        {/* Upcoming Section */}
        <section>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h2 style={{fontSize: '1.25rem', color: 'var(--primary-dark)'}}>Upcoming Events</h2>
            <Link to="/my-events" style={{color: 'var(--accent)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500'}}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
              <div key={event._id} className="surface" style={{padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <h4 style={{fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem'}}>{event.eventName}</h4>
                  <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                    {new Date(event.eventStartDate).toLocaleDateString()}
                  </p>
                </div>
                <Link to={`/events/${event._id}`} className="btn btn-secondary" style={{padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                  Details
                </Link>
              </div>
            )) : (
              <div className="surface" style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>
                <p>No upcoming events.</p>
                <Link to="/events" className="btn btn-primary" style={{marginTop: '1rem'}}>Browse Events</Link>
              </div>
            )}
          </div>
        </section>

        {/* Recommended Section */}
        <section>
          <h2 style={{fontSize: '1.25rem', color: 'var(--primary-dark)', marginBottom: '1.5rem'}}>Recommended for You</h2>
           <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {recommendedEvents.length > 0 ? recommendedEvents.map(event => (
              <div key={event._id} className="surface" style={{padding: '1.25rem', borderLeft: '4px solid var(--accent)'}}>
                <h4 style={{fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem'}}>{event.eventName}</h4>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem'}}>
                   <span style={{fontSize: '0.75rem', background: 'var(--bg-body)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-secondary)'}}>
                     {event.organizerName}
                   </span>
                   <Link to={`/events/${event._id}`} style={{color: 'var(--accent)', fontSize: '0.875rem', fontWeight: '500'}}>View</Link>
                </div>
              </div>
            )) : (
              <div className="surface" style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>
                <p>Complete your profile to get recommendations!</p>
                <Link to="/profile" className="btn btn-secondary" style={{marginTop: '1rem'}}>Update Profile</Link>
              </div>
            )}
          </div>
        </section>
      </div>

    </div>
  );
};

export default ParticipantDashboard;
