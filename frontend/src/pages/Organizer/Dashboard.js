import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { organizerService } from '../../services';
import { PlusCircle, Calendar, Users, Activity, BarChart2 } from 'lucide-react';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    activeEvents: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await organizerService.getDashboardStats();
        if (response.success && response.data) {
          setStats(response.data.stats || { totalEvents: 0, totalRegistrations: 0, activeEvents: 0 });
          setUpcomingEvents(response.data.upcomingEvents || []);
          setRecentActivity(response.data.recentActivity || []);
        } else {
             // Fallback if data is missing
             console.log("No data returned from organizer dashboard stats");
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="page-container" style={{maxWidth: '1200px', margin: '0 auto', padding: '2rem'}}>
      <header className="page-header" style={{marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem'}}>Welcome, {user?.organizerName}!</h1>
          <p style={{color: 'var(--text-secondary)'}}>Manage your events and track performance.</p>
        </div>
        <Link to="/organizer/create-event" className="btn btn-primary" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <PlusCircle size={18} /> Create New Event
        </Link>
      </header>

      {/* Stats Overview */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem'}}>
        <div className="surface" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--info)'}}>
          <div style={{background: 'var(--info-bg)', padding: '12px', borderRadius: '50%', color: 'var(--info)'}}>
            <Calendar size={24} />
          </div>
          <div>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px'}}>Total Events</p>
            <h3 style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-dark)'}}>{stats.totalEvents || 0}</h3>
          </div>
        </div>

        <div className="surface" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--success)'}}>
          <div style={{background: 'var(--success-bg)', padding: '12px', borderRadius: '50%', color: 'var(--success)'}}>
            <Users size={24} />
          </div>
          <div>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px'}}>Total Registrations</p>
            <h3 style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-dark)'}}>{stats.totalRegistrations || 0}</h3>
          </div>
        </div>

        <div className="surface" style={{padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning)'}}>
          <div style={{background: 'var(--warning-bg)', padding: '12px', borderRadius: '50%', color: 'var(--warning)'}}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px'}}>Active Events</p>
            <h3 style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-dark)'}}>{stats.activeEvents || 0}</h3>
          </div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem'}}>
        {/* Main Content: Upcoming Events */}
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
             <h2 style={{fontSize: '1.25rem', color: 'var(--text-primary)'}}>Your Upcoming Events</h2>
             <Link to="/organizer/events" style={{color: 'var(--accent)', fontSize: '0.875rem', fontWeight: '500'}}>Manage All Events &rarr;</Link>
          </div>
          
          <div className="events-list" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
              <div key={event._id} className="surface" style={{padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                   <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.5rem'}}>
                      <span className={`status-badge ${event.status?.toLowerCase()}`}>{event.status}</span>
                      <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>{event.eventType}</span>
                   </div>
                   <h3 style={{fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-primary)'}}>{event.eventName}</h3>
                   <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                      <Calendar size={14} style={{display: 'inline', marginRight: '4px'}}/>
                      {new Date(event.eventStartDate).toLocaleString()}
                   </p>
                </div>
                <button 
                  onClick={() => navigate(`/organizer/events/${event._id}/analytics`)} 
                  className="btn btn-secondary"
                  style={{display: 'flex', alignItems: 'center', gap: '6px'}}
                >
                  <BarChart2 size={16} /> Analytics
                </button>
              </div>
            )) : (
              <div className="surface" style={{padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)'}}>
                 <p>You have no upcoming events.</p>
                 <Link to="/organizer/create-event" className="btn btn-primary" style={{marginTop: '1rem'}}>Create One Now</Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Recent Activity */}
        <div>
           <h2 style={{fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1.5rem'}}>Recent Activity</h2>
           <div className="surface" style={{padding: '1.5rem'}}>
              {recentActivity.length > 0 ? (
                <ul style={{listStyle: 'none', padding: 0}}>
                  {recentActivity.map((activity, index) => (
                    <li key={index} style={{
                        paddingBottom: '1rem', 
                        marginBottom: '1rem', 
                        borderBottom: index !== recentActivity.length - 1 ? '1px solid var(--border-light)' : 'none',
                        display: 'flex',
                        gap: '10px'
                    }}>
                       <div style={{minWidth: '8px', height: '8px', borderRadius: '50%', background: 'var(--border)', marginTop: '6px'}}></div>
                       <div>
                          <p style={{fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px'}}>{activity.description || 'Activity logged'}</p>
                          <small style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>
                             {activity.date ? new Date(activity.date).toLocaleDateString() : 'Just now'}
                          </small>
                       </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{color: '#94a3b8', fontSize: '0.9rem'}}>No recent activity to show.</p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
