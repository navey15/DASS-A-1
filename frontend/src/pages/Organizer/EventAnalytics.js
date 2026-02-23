import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizerService } from '../../services';
import { Download, Edit, Search, Filter } from 'lucide-react';

const EventAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [participants, setParticipants] = useState([]);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await organizerService.getEventAnalytics(id);
        if (response.success) {
          setAnalytics(response.data);
        } else {
          setError(response.message || 'Failed to load analytics');
        }

        // Also fetch participant list
        const regResponse = await organizerService.getEventRegistrations(id);
        if (regResponse.success) {
            setParticipants(regResponse.data.registrations || []);
        }

      } catch (err) {
        setError('Failed to load analytics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [id]);

  const handleExport = async () => {
    try {
        const response = await organizerService.exportRegistrations(id);
        if (response.success) {
            // Helper function to convert data array to CSV string
            const convertToCSV = (arr) => {
                const header = Object.keys(arr[0] || {}).join(',');
                const rows = arr.map(obj => 
                   Object.values(obj).map(val => 
                     typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
                   ).join(',')
                );
                return [header, ...rows].join('\n');
            };

            const csvData = convertToCSV(response.data.data);
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'registrations.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            alert("Failed to export.");
        }
    } catch (e) {
        console.error(e);
        alert("Export failed.");
    }
  };

  const filteredParticipants = participants.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      // Match name, email, ticketId
      const matchesSearch = 
         (p.participant?.firstName?.toLowerCase().includes(searchLower)) ||
         (p.participant?.lastName?.toLowerCase().includes(searchLower)) ||
         (p.participant?.email?.toLowerCase().includes(searchLower)) ||
         (p.ticketId?.toLowerCase().includes(searchLower));

      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
  });

  const handlePaymentUpdate = async (registrationId, newStatus) => {
    try {
      if (!window.confirm(`Are you sure you want to mark this payment as ${newStatus}?`)) return;
      
      const response = await organizerService.updatePaymentStatus(registrationId, newStatus, 'Updated from Dashboard');
      if (response.success) {
         // Update local state
         setParticipants(prev => prev.map(p => {
            if (p._id === registrationId) {
                return { 
                    ...p, 
                    payment: { ...p.payment, status: newStatus },
                    status: newStatus === 'Approved' ? 'Confirmed' : (newStatus === 'Rejected' ? 'Cancelled' : p.status)
                };
            }
            return p;
         }));
      } else {
         alert(response.message || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update payment status');
    }
  };

  if (loading) return <div className="page-container">Loading analytics...</div>;
  if (error) return <div className="page-container"><p className="alert alert-error">{error}</p></div>;
  if (!analytics) return <div className="page-container">No data found</div>;

  const { registrations, revenue, attendance, event } = analytics;

  return (
    <div className="page-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
         <h1 style={{margin: 0}}>Event Analytics: {event?.eventName}</h1>
         <button 
           className="btn btn-secondary" 
           onClick={() => navigate(`/organizer/events/${id}/edit`)}
           style={{display: 'flex', alignItems: 'center', gap: '8px'}}
         >
            <Edit size={16} /> Edit Event
         </button>
      </div>
      
      <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="dashboard-card" style={{ textAlign: 'center' }}>
          <h3>Total Registrations</h3>
          <p className="big-number" style={{ fontSize: '36px', color: 'var(--primary)', fontWeight: 'bold' }}>
            {registrations?.total || 0}
          </p>
        </div>

        <div className="dashboard-card" style={{ textAlign: 'center' }}>
          <h3>Confirmed</h3>
          <p className="big-number" style={{ fontSize: '36px', color: 'var(--success)', fontWeight: 'bold' }}>
            {registrations?.confirmed || 0}
          </p>
        </div>

        <div className="dashboard-card" style={{ textAlign: 'center' }}>
          <h3>Attendance</h3>
          <p className="big-number" style={{ fontSize: '36px', color: 'var(--warning)', fontWeight: 'bold' }}>
             {attendance?.present || 0}
          </p>
        </div>

        <div className="dashboard-card" style={{ textAlign: 'center' }}>
          <h3>Revenue</h3>
          <p className="big-number" style={{ fontSize: '36px', color: 'var(--success)', fontWeight: 'bold' }}>
            ₹{revenue?.total || 0}
          </p>
        </div>
      </div>

      <div className="participants-section">
          <h2>Detailed Breakdown</h2>
          <div className="surface" style={{ padding: '20px', marginTop: '20px', marginBottom: '40px' }}>
              <p><strong>Pending Registrations:</strong> {registrations?.pending || 0}</p>
              <p><strong>Cancelled:</strong> {registrations?.cancelled || 0}</p>
              <p><strong>Registration Limit:</strong> {event?.registrationLimit}</p>
              <p><strong>Views:</strong> {event?.views}</p>
          </div>

          <h2>Participant List</h2>
          
          <div className="surface" style={{padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center'}}>
              <div style={{flex: 1, position: 'relative', minWidth: '200px'}}>
                  <Search size={18} style={{position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)'}} />
                  <input 
                      type="text" 
                      placeholder="Search participants by name, email or ticket ID..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{paddingLeft: '35px', width: '100%', boxSizing: 'border-box'}}
                  />
              </div>
              
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <Filter size={18} color="var(--text-secondary)" />
                  <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)'}}
                  >
                      <option value="All">All Status</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                  </select>
              </div>

              <button 
                  className="btn btn-primary" 
                  onClick={handleExport}
                  style={{display: 'flex', alignItems: 'center', gap: '8px'}}
              >
                  <Download size={16} /> Export CSV
              </button>
          </div>

          <div className="table-container surface">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Ticket ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((reg) => (
                    <tr key={reg._id}>
                      <td>{reg.participant?.firstName} {reg.participant?.lastName}</td>
                      <td>{reg.participant?.email}</td>
                      <td>{reg.participant?.participantType}</td>
                      <td>
                        <span className={`status-badge status-${reg.status.toLowerCase()}`}>
                            {reg.status}
                        </span>
                      </td>
                      <td>
                         {reg.payment?.required ? (
                            <span className={`status-badge status-${reg.payment.status?.toLowerCase() || 'pending'}`}>
                                {reg.payment.status} ({reg.payment.amount})
                            </span>
                         ) : '-'}
                      </td>
                      <td>{reg.ticketId}</td>
                      <td>
                        {reg.payment?.required && reg.payment?.status === 'Pending' && (
                            <div style={{display: 'flex', gap: '5px'}}>
                                <button 
                                  className="btn btn-sm btn-success" 
                                  style={{backgroundColor: 'var(--success)', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}
                                  onClick={() => handlePaymentUpdate(reg._id, 'Approved')}
                                >
                                    Approve
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  style={{backgroundColor: 'var(--error)', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}
                                   onClick={() => handlePaymentUpdate(reg._id, 'Rejected')}
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>No participants found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default EventAnalytics;
