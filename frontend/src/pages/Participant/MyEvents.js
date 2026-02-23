import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrationService } from '../../services';

const MyEvents = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchRegistrations = async (type = activeTab) => {
    try {
      setLoading(true);
      setError('');
      const params = { type };
      if (type === 'cancelled') {
        params.status = 'Cancelled';
      }
      const response = await registrationService.getMyRegistrations(params);
      if (response.success) {
        setRegistrations(response.data.registrations || []);
      } else {
        setError(response.message || 'Failed to load registrations');
      }
    } catch (err) {
      setError(err.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleCancel = async (registrationId) => {
    try {
      setActionMessage('');
      await registrationService.cancelRegistration(registrationId);
      setActionMessage('Registration cancelled');
      fetchRegistrations(activeTab);
    } catch (err) {
      setActionMessage(err.message || 'Could not cancel');
    }
  };

  return (
    <div className="page-container">
      <h1>My Events</h1>
      <p>View and manage your event registrations</p>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
        <button 
          className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveTab('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {actionMessage && <p className="alert alert-info">{actionMessage}</p>}
      {error && <p className="alert alert-error">{error}</p>}
      {loading && <p>Loading registrations...</p>}

      {!loading && !error && registrations.length === 0 && (
        <div className="events-list">
          <p>No events found. Start exploring and register for events!</p>
        </div>
      )}

      {!loading && !error && registrations.length > 0 && (
        <div className="events-list">
          {registrations.map((reg) => (
            <div key={reg._id} className="event-card">
              <div className="event-card-header">
                <span className={`status-badge ${reg.status?.toLowerCase()}`}>{reg.status}</span>
                <span className="event-type">{reg.event?.eventType}</span>
              </div>
              <h3>{reg.event?.eventName}</h3>
              <p className="event-date">
                {reg.event?.eventStartDate ? new Date(reg.event.eventStartDate).toLocaleString() : 'Date TBA'}
              </p>
              <p className="event-organizer">{reg.event?.organizer?.organizerName || 'Organizer'}</p>
              
              {reg.isTeamRegistration && reg.team && (
                <div style={{ marginTop: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                  {reg.team.inviteCode && (
                    <div style={{ marginBottom: '10px', padding: '10px', background: '#e3f2fd', borderRadius: '4px', border: '1px solid #90caf9' }}>
                      <p style={{ margin: 0, fontWeight: 'bold', color: '#1565c0' }}>Team Invite Code:</p>
                      <p style={{ margin: '5px 0 0', fontSize: '1.2em', fontFamily: 'monospace', letterSpacing: '2px' }}>{reg.team.inviteCode}</p>
                      <p style={{ margin: '5px 0 0', fontSize: '0.8em', color: '#555' }}>Share this code with your teammates to join your team.</p>
                      <p style={{ margin: '5px 0 0', fontSize: '0.8em', color: '#333'}}>Target Team Size: {reg.team.targetTeamSize || 'N/A'}</p>
                    </div>
                  )}
                  
                  <h4 style={{fontSize: '0.9rem', color: '#333', marginTop: '10px', display: 'flex', justifyContent:'space-between'}}>
                      <span>Team: {reg.team.teamName}</span>
                      <span>{reg.team.teamMembers.length + 1} / {reg.team.targetTeamSize || reg.event.teamSize.max} Members</span>
                  </h4>
                  <ul style={{listStyle: 'none', padding: 0, marginTop: '5px', fontSize: '0.9rem'}}>
                      {/* Leader - check if participant is populated properly, otherwise might be ID */}
                      <li style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee'}}>
                          <span><strong>Leader:</strong> {(reg.participant?.firstName) ? `${reg.participant.firstName} ${reg.participant.lastName}` : 'Team Leader'}</span>
                          <span style={{color: 'green'}}>Joined</span>
                      </li>
                      {reg.team.teamMembers.map((member, idx) => (
                          <li key={idx} style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee'}}>
                              <span>{member.name}</span>
                              <span style={{color: 'green'}}>Joined</span>
                          </li>
                      ))}
                  </ul>
                  <button 
                      onClick={() => navigate(`/team/${reg._id}/chat`)}
                      style={{
                          marginTop: '10px',
                          padding: '8px 12px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          width: '100%'
                      }}
                  >
                      Open Team Chat
                  </button>
                  {reg.status === 'Pending' && (
                      <p style={{fontSize: '0.8rem', color: 'orange', marginTop: '5px'}}>
                          * Registration completes when team is full.
                      </p>
                  )}
                </div>
              )}

              {activeTab === 'upcoming' && reg.status !== 'Cancelled' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  {reg.status === 'Confirmed' && reg.ticketId && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setSelectedTicket(reg)}
                    >
                      View Ticket
                    </button>
                  )}
                  {reg.status === 'Pending' && (
                    <span style={{ padding: '8px 12px', background: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.9rem' }}>
                      {reg.payment?.required ? 'Awaiting Payment Approval' : 'Registration Pending'}
                    </span>
                  )}
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleCancel(reg._id)}
                  >
                    Cancel Registration
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{textAlign: 'center'}}>
            <h2>Entry Ticket</h2>
            <p><strong>Event:</strong> {selectedTicket.event?.eventName}</p>
            <p><strong>Ticket ID:</strong> {selectedTicket.ticketId || selectedTicket._id}</p>
            
            {selectedTicket.qrCode ? (
                <img src={selectedTicket.qrCode} alt="Ticket QR" style={{ width: '200px', height: '200px', margin: '20px 0' }} />
            ) : (
                <div style={{ padding: '40px', background: '#f0f0f0', margin: '20px 0', borderRadius: '8px' }}>QR Code Not Available</div>
            )}
            
            <p className="helper-text">Please show this QR code at the entrance.</p>
            <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEvents;
