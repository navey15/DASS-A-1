import React, { useEffect, useState } from 'react';
import { adminService } from '../../services'; // Import correct service

const PasswordRequests = () => {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); // Use generic success message state

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      // Use proper naming that matches adminService implementation
      const response = await adminService.getPasswordResetRequests({ status: activeTab }); 
      
      if (response && response.success) {
        setRequests(response.data.requests || []);
        console.log('Requests loaded:', response.data.requests);
      } else {
        setError(response?.message || 'Failed to load requests.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when tab changes
  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleApprove = async (id) => {
    // Only prompt once
    if (!window.confirm('Are you sure you want to approve this request? A new password will be generated for the organizer.')) return;
    
    try {
      setActionLoading(true);
      const response = await adminService.approvePasswordReset(id, { adminComments: 'Approved by admin' });
      
      if (response.success) {
        setSuccessMessage(`Success! New Password for Organizer: "${response.data.newPassword}" (Copy only the text inside quotes)`);
        fetchRequests(); // Refresh the list to remove the processed item
      } else {
        alert(response.message || 'Failed to approve request');
      }
    } catch (err) {
      console.error(err);
      alert('Error approving request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this password reset request?')) return;

    try {
        setActionLoading(true);
        const response = await adminService.rejectPasswordReset(id, { adminComments: 'Rejected by admin' });
        
        if (response.success) {
            setSuccessMessage('Request rejected successfully.');
            fetchRequests();
        } else {
            alert(response.message || 'Failed to reject');
        }
    } catch (err) {
        console.error(err);
        alert('Error rejecting request');
    } finally {
        setActionLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Password Reset Requests</h1>

      {/* Success/Message Alert */}
      {successMessage && (
        <div className="alert alert-success" style={{
            background: 'var(--success-bg)', 
            color: 'var(--success)', 
            marginBottom: '1rem', 
            padding: '1rem', 
            border: '1px solid var(--success)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div>
              <strong>Action Completed: </strong> {successMessage}
            </div>
            <button 
                onClick={() => setSuccessMessage('')} 
                style={{
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: 'inherit'
                }}
            >
                ✕
            </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['Pending', 'Approved', 'Rejected'].map(status => (
            <button 
                key={status}
                className={`tab-btn ${activeTab === status ? 'active' : ''}`}
                onClick={() => { setActiveTab(status); setSuccessMessage(''); }}
            >
                {status}
            </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
          <div className="loading-container"><div className="spinner"></div></div>
      ) : error ? (
          <div className="alert alert-error">{error}</div>
      ) : requests.length === 0 ? (
        <div className="surface" style={{padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)'}}>
            <p>No {activeTab.toLowerCase()} password reset requests found.</p>
        </div>
      ) : (
        <div className="requests-list" style={{display: 'grid', gap: '1rem'}}>
           {requests.map(req => (
               <div key={req._id} className="surface" style={{padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: req.status === 'Pending' ? '4px solid var(--warning)' : '4px solid var(--border)'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                       <h3 style={{fontSize: '1.1rem', color: 'var(--primary)', margin: 0}}>
                           {req.organizer?.organizerName || 'Unknown Organizer'}
                       </h3>
                       <span 
                         className="status-badge" 
                         style={{
                             background: req.status === 'Pending' ? 'var(--warning-bg)' : req.status === 'Approved' ? 'var(--success-bg)' : 'var(--danger-bg)',
                             color: req.status === 'Pending' ? 'var(--warning)' : req.status === 'Approved' ? 'var(--success)' : 'var(--danger)'
                         }}
                       >
                           {req.status}
                       </span>
                   </div>
                   
                   <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}><strong>Email:</strong> {req.organizer?.email}</p>
                   <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}><strong>Requested:</strong> {new Date(req.requestedAt).toLocaleString()}</p>
                   
                   <div style={{background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem'}}>
                       <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>REASON FOR RESET</p>
                       <p style={{fontStyle: 'italic', color: 'var(--text-primary)'}}>"{req.reason}"</p>
                   </div>

                   {/* Admin Actions for Pending requests */}
                   {req.status === 'Pending' && (
                       <div className="request-actions" style={{marginTop: '1rem', display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)'}}>
                           <button 
                               className="btn btn-success" 
                               onClick={() => handleApprove(req._id)}
                               disabled={actionLoading}
                           >
                               Approve & Generate Password
                           </button>
                           <button 
                               className="btn btn-danger" 
                               onClick={() => handleReject(req._id)}
                               disabled={actionLoading}
                           >
                               Reject Request
                           </button>
                       </div>
                   )}
                   
                   {/* Review Info for processed requests */}
                   {req.status !== 'Pending' && req.reviewedAt && (
                       <div style={{marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right'}}>
                           Processed on {new Date(req.reviewedAt).toLocaleString()}
                       </div>
                   )}
               </div>
           ))}
        </div>
      )}
    </div>
  );
};


export default PasswordRequests;
