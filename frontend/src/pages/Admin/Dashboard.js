import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: { totalParticipants: 0 },
    events: { totalEvents: 0 },
    registrations: { totalRegistrations: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getStatistics();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>System Overview and Management</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Manage Organizers</h3>
          <p>Create and manage organizer accounts</p>
          <Link to="/admin/organizers" className="btn btn-primary">Manage</Link>
        </div>

        <div className="dashboard-card">
          <h3>Participants</h3>
          <p>View all registered participants</p>
          <Link to="/admin/participants" className="btn btn-primary">View</Link>
        </div>

        <div className="dashboard-card">
          <h3>Password Requests</h3>
          <p>Approve password reset requests</p>
          <Link to="/admin/password-requests" className="btn btn-primary">Review</Link>
        </div>

        <div className="dashboard-card">
          <h3>System Stats</h3>
          {loading ? (
             <p>Loading...</p>
          ) : (
            <>
              <p>Total Users: {stats.users?.totalParticipants || 0}</p>
              <p>Total Events: {stats.events?.totalEvents || 0}</p>
              <p>Total Registrations: {stats.registrations?.totalRegistrations || 0}</p>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Recent Activity</h2>
        <p>System activity log will appear here</p>
      </div>

      <div className="dashboard-section">
        <h2>Pending Actions</h2>
        <p>Items requiring admin attention</p> 
      </div>
    </div>
  );
};

export default AdminDashboard;
