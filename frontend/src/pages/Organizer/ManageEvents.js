import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { organizerService } from '../../services';

const TABS = [
  { key: 'all', label: 'All Events' },
  { key: 'Published', label: 'Published' },
  { key: 'Draft', label: 'Draft' },
  { key: 'Completed', label: 'Completed' },
];

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await organizerService.getOrganizerEvents();
        if (response.success) {
          setEvents(response.data.events || []);
        } else {
          setError(response.message || 'Failed to load events.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load events.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handlePublish = async (eventId) => {
    if (!window.confirm("Are you sure you want to publish this event?")) return;
    try {
      const response = await organizerService.publishEvent(eventId);
      if (response.success) {
        setEvents(events.map(e => e._id === eventId ? { ...e, status: 'Published' } : e));
        alert("Event published successfully!");
      } else {
        alert(response.message || "Failed to publish event.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while publishing.");
    }
  };

  const filteredEvents = useMemo(() => {
    if (activeTab === 'all') {
      return events;
    }
    return events.filter((event) => event.status === activeTab);
  }, [events, activeTab]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Manage Events</h1>
          <p className="helper-text">Track drafts, publish events, and monitor completed experiences.</p>
        </div>
        <Link to="/organizer/create-event" className="btn btn-primary">
          Create Event
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading events...</p>
      ) : filteredEvents.length === 0 ? (
        <div className="events-table">
          <p>No events found. Create your first event!</p>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map((event) => (
            <div key={event._id} className="event-card">
              <div className="event-card-header">
                <h3>{event.eventName}</h3>
                <span className={`status-badge ${event.status?.toLowerCase()}`}>
                  {event.status}
                </span>
              </div>
              <p className="event-date">
                {new Date(event.eventStartDate).toLocaleDateString()} –{' '}
                {new Date(event.eventEndDate).toLocaleDateString()}
              </p>
              <p className="event-organizer">Registrations: {event.registrationLimit || 'Unlimited'}</p>
              <div className="event-section" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <Link to={`/organizer/events/${event._id}/analytics`} className="btn btn-secondary">
                  View Details
                </Link>
                {event.status === 'Draft' ? (
                  <button 
                    onClick={() => handlePublish(event._id)} 
                    className="btn btn-primary"
                    style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                  >
                    Publish
                  </button>
                ) : (
                  <Link to={`/organizer/events/${event._id}/payments`} className="btn btn-primary">
                    Payments
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageEvents;
