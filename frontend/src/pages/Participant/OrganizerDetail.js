import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService, eventService } from '../../services';

const OrganizerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            const [orgRes, eventsRes] = await Promise.all([
                userService.getOrganizerProfile(id),
                eventService.getAllEvents({ organizer: id })
            ]);

            if (orgRes.success) setOrganizer(orgRes.data.organizer);
            if (eventsRes.success) setEvents(eventsRes.data.events || []);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="page-container">Loading...</div>;
  if (!organizer) return <div className="page-container">Organizer not found</div>;

  const upcomingEvents = events.filter(e => new Date(e.eventStartDate) >= new Date());
  const pastEvents = events.filter(e => new Date(e.eventEndDate) < new Date());

  return (
    <div className="page-container">
        <div className="surface" style={{padding: '3rem', marginBottom: '2rem'}}>
            <h1 style={{marginBottom: '1rem', color: 'var(--text-primary)'}}>{organizer.organizerName}</h1>
            <span className="badge" style={{background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px'}}>{organizer.category}</span>
            <p style={{marginTop: '1.5rem', fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: '1.6'}}>{organizer.description || 'No description provided.'}</p>
            <p style={{marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Contact: {organizer.contactEmail}</p>
        </div>

        <h2 style={{marginTop: '40px', marginBottom: '20px'}}>Upcoming Events</h2>
        {upcomingEvents.length === 0 ? <p>No upcoming events.</p> : (
            <div className="events-grid">
                {upcomingEvents.map(event => (
                    <div key={event._id} className="event-card" onClick={() => navigate(`/events/${event._id}`)}>
                        <div className="event-card-header">
                            <span className={`status-badge ${event.status?.toLowerCase()}`}>{event.status}</span>
                            <span className="event-type">{event.eventType}</span>
                        </div>
                        <h3>{event.eventName}</h3>
                        <p className="event-date">{new Date(event.eventStartDate).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        )}

        <h2 style={{marginTop: '40px', marginBottom: '20px'}}>Past Events</h2>
        {pastEvents.length === 0 ? <p>No past events recorded.</p> : (
            <div className="events-grid" style={{opacity: 0.7}}>
                {pastEvents.map(event => (
                    <div key={event._id} className="event-card" onClick={() => navigate(`/events/${event._id}`)}>
                        <h3>{event.eventName}</h3>
                        <p className="event-date">{new Date(event.eventStartDate).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default OrganizerDetail;