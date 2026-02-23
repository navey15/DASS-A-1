import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
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
          <p>Total Users: 0</p>
          <p>Total Events: 0</p>
          <p>Total Registrations: 0</p>
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
