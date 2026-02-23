import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService, authService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, Calendar, MapPin, Sparkles, SlidersHorizontal } from 'lucide-react';

const EventsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [userFollows, setUserFollows] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [eligibilityFilter, setEligibilityFilter] = useState('all');
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const promises = [
          eventService.getAllEvents(),
          eventService.getTrendingEvents()
        ];
        
        if (user) {
            promises.push(authService.getCurrentUser());
        }

        const results = await Promise.all(promises);
        const allEventsRes = results[0];
        const trendingRes = results[1];
        const userRes = user ? results[2] : null;

        if (allEventsRes.success) setEvents(allEventsRes.data.events || []);
        if (trendingRes.success) setTrendingEvents(trendingRes.data.events || []);
        
        if (userRes && userRes.success) {
            setUserFollows(userRes.data.user.clubsToFollow || []);
        } else if (user) {
            setUserFollows(user.clubsToFollow || []);
        }
        
      } catch (err) {
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.eventName?.toLowerCase().includes(search.toLowerCase()) || 
                          event.organizer?.organizerName?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || event.eventType?.toLowerCase() === typeFilter;
    const matchesEligibility = eligibilityFilter === 'all' || event.eligibility === eligibilityFilter;
    
    let matchesTime = true;
    if (timeFilter === 'upcoming') {
      matchesTime = new Date(event.eventStartDate) >= new Date();
    } else if (timeFilter === 'past') {
      matchesTime = new Date(event.eventEndDate) < new Date();
    }

    let matchesFollowed = true;
    if (showFollowedOnly && userFollows) {
       const followedIds = userFollows.map(club => 
         (typeof club === 'object' && club !== null) ? club._id : club
       ).map(id => String(id));
       const organizerId = event.organizer?._id ? String(event.organizer._id) : '';
       matchesFollowed = followedIds.includes(organizerId);
    } else if (showFollowedOnly) {
         matchesFollowed = false;
    }

    return matchesSearch && matchesType && matchesEligibility && matchesTime && matchesFollowed;
  });

  return (
    <div className="page-container" style={{maxWidth: '1200px', margin: '0 auto', padding: '2rem'}}>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
           <h1 style={{fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem'}}>Browse Events</h1>
           <p style={{color: 'var(--text-secondary)'}}>Discover and register for amazing events happening around you.</p>
        </div>
      </header>

      {/* Trending Section */}
      {trendingEvents.length > 0 && (
        <section style={{marginBottom: '3rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem'}}>
             <Sparkles size={20} color="var(--warning)" />
             <h2 style={{fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0}}>Trending Now</h2>
          </div>
          <div className="events-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'}}>
            {trendingEvents.slice(0, 4).map(event => (
               <div 
                 key={event._id} 
                 className="dashboard-card" 
                 onClick={() => navigate(`/events/${event._id}`)} 
                 style={{cursor: 'pointer', borderLeft: '4px solid var(--warning)', padding: '1.5rem'}}
               >
                 <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                    <span className="status-badge" style={{background: 'var(--warning-light)', color: 'var(--warning-dark)'}}>Trending</span>
                 </div>
                 <h3 style={{fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)'}}>{event.eventName}</h3>
                 <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <MapPin size={14} /> {event.organizer?.organizerName}
                 </p>
               </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Filters Bar */}
      <div className="surface" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <div style={{flex: 1, minWidth: '250px', position: 'relative'}}>
                <Search size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
                <input 
                type="text" 
                placeholder="Search events or organizers..." 
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            <button 
               className="btn"
               style={{
                   background: showFollowedOnly ? 'var(--primary-light)' : 'var(--surface)', 
                   border: showFollowedOnly ? '1px solid var(--primary)' : '1px solid var(--border)', 
                   color: showFollowedOnly ? 'var(--primary)' : 'var(--text-secondary)'
               }}
               onClick={() => setShowFollowedOnly(!showFollowedOnly)}
            >
               {showFollowedOnly ? 'Following Only' : 'All Organizers'}
            </button>
        </div>

        <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center'}}>
            <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
               <SlidersHorizontal size={16} /> Filters:
            </span>
            <select className="filter-select" style={{background: 'var(--surface)', color: 'var(--text-primary)', borderColor: 'var(--border)'}} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="normal">Normal</option>
                <option value="merchandise">Merchandise</option>
            </select>

            <select className="filter-select" style={{background: 'var(--surface)', color: 'var(--text-primary)', borderColor: 'var(--border)'}} value={eligibilityFilter} onChange={(e) => setEligibilityFilter(e.target.value)}>
                <option value="all">Any Eligibility</option>
                <option value="IIIT Only">IIIT Only</option>
                <option value="Non-IIIT Only">Non-IIIT Only</option>
            </select>

            <select className="filter-select" style={{background: 'var(--surface)', color: 'var(--text-primary)', borderColor: 'var(--border)'}} value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                <option value="all">Any Time</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
            </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="events-grid">
        {loading && (
             <div style={{gridColumn: '1/-1', display: 'flex', justifyContent: 'center', padding: '3rem'}}>
                 <div className="spinner"></div>
             </div>
        )}
        
        {!loading && !error && filteredEvents.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <Filter size={48} color="var(--text-muted)" style={{marginBottom: '1rem'}} />
            <h3 style={{color: 'var(--text-secondary)', marginBottom: '0.5rem'}}>No events found</h3>
            <p style={{color: 'var(--text-muted)'}}>Try adjusting your filters or search query.</p>
            <button onClick={() => {setSearch(''); setTypeFilter('all'); setTimeFilter('all');}} className="btn btn-secondary" style={{marginTop: '1rem'}}>
               Clear Filters
            </button>
          </div>
        )}

        {!loading && !error && filteredEvents.map((event) => (
          <div 
            key={event._id}
            className="event-card"
            onClick={() => navigate(`/events/${event._id}`)}
          >
            <div className="event-card-header">
              <span className={`status-badge ${event.eventType === 'merchandise' ? 'draft' : 'published'}`}>
                {event.eventType}
              </span>
              {event.status === 'Open' && <span className="status-badge" style={{background: 'var(--success-light)', color: 'var(--success)'}}>Open</span>}
            </div>
            
            <div style={{marginBottom: '1rem'}}>
                 <h3 style={{fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)'}}>{event.eventName}</h3>
                 <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <MapPin size={14} /> {event.organizer?.organizerName || 'Organizer'}
                 </p>
            </div>

            <div style={{marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                 <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem'}}>
                    <Calendar size={14} />
                    {event.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString() : 'TBA'}
                 </div>
                 <span style={{color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '500'}}>View &rarr;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsList;
