import React, { useEffect, useMemo, useState } from 'react';
import { adminService } from '../../services';

const initialFormState = {
  organizerName: '',
  email: '',
  category: 'Club',
  description: '',
  contactEmail: '',
};

const ManageOrganizers = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [creating, setCreating] = useState(false);
  const [creationInfo, setCreationInfo] = useState(null);
  const [activeOrganizer, setActiveOrganizer] = useState(null);
  const [manageForm, setManageForm] = useState({
    category: 'Club',
    description: '',
    contactEmail: '',
    isApproved: true,
  });
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    const loadOrganizers = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (filters.category) {
          params.category = filters.category;
        }
        if (filters.status) {
          params.isApproved = filters.status === 'Approved';
        }
        const response = await adminService.getAllOrganizers(params);
        if (response.success) {
          setOrganizers(response.data.organizers);
        } else {
          setError(response.message || 'Unable to load organizers.');
        }
      } catch (err) {
        setError(err.message || 'Unable to load organizers.');
      } finally {
        setLoading(false);
      }
    };

    loadOrganizers();
  }, [filters.category, filters.status]);

  const filteredOrganizers = useMemo(() => {
    if (!filters.search.trim()) {
      return organizers;
    }
    const searchTerm = filters.search.toLowerCase();
    return organizers.filter((org) => {
      return (
        org.organizerName?.toLowerCase().includes(searchTerm) ||
        org.email?.toLowerCase().includes(searchTerm)
      );
    });
  }, [organizers, filters.search]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateOrganizer = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError('');
    setCreationInfo(null);

    try {
      const payload = {
        organizerName: formData.organizerName.trim(),
        email: formData.email.trim(),
        category: formData.category,
        description: formData.description.trim(),
        contactEmail: formData.contactEmail.trim() || formData.email.trim(),
      };

      const response = await adminService.createOrganizer(payload);
      if (response.success) {
        setCreationInfo({
          message: response.message,
          email: response.data?.organizer?.email,
          password: response.data?.temporaryPassword,
        });
        setStatusMessage({ type: 'success', text: 'Organizer created successfully.' });
        setFormData(initialFormState);
        setShowForm(false);
        setOrganizers((prev) => [response.data.organizer, ...prev]);
      } else {
        setError(response.message || 'Failed to create organizer.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create organizer.');
    } finally {
      setCreating(false);
    }
  };

  const openManagePanel = (organizer) => {
    setActiveOrganizer(organizer);
    setManageForm({
      category: organizer.category || 'Club',
      description: organizer.description || '',
      contactEmail: organizer.contactEmail || organizer.email,
      isApproved: Boolean(organizer.isApproved),
    });
  };

  const closeManagePanel = () => {
    setActiveOrganizer(null);
    setManaging(false);
  };

  const handleManageChange = (event) => {
    const { name, value, type, checked } = event.target;
    setManageForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUpdateOrganizer = async (event) => {
    event.preventDefault();
    if (!activeOrganizer) return;
    setManaging(true);
    setStatusMessage(null);
    setError('');

    try {
      const response = await adminService.updateOrganizer(activeOrganizer._id, {
        category: manageForm.category,
        description: manageForm.description,
        contactEmail: manageForm.contactEmail,
        isApproved: manageForm.isApproved,
      });

      if (response.success) {
        const updated = response.data.organizer;
        setOrganizers((prev) => prev.map((org) => (org._id === updated._id ? updated : org)));
        setStatusMessage({ type: 'success', text: 'Organizer details updated.' });
        closeManagePanel();
      } else {
        setError(response.message || 'Failed to update organizer.');
      }
    } catch (err) {
      setError(err.message || 'Failed to update organizer.');
    } finally {
      setManaging(false);
    }
  };

  const handleDeleteOrganizer = async () => {
    if (!activeOrganizer) return;
    const confirmed = window.confirm(
      'Deleting this organizer is permanent. Make sure their events are reassigned or deleted. Continue?'
    );
    if (!confirmed) {
      return;
    }

    setManaging(true);
    setError('');
    setStatusMessage(null);
    try {
      const response = await adminService.deleteOrganizer(activeOrganizer._id);
      if (response.success) {
        setOrganizers((prev) => prev.filter((org) => org._id !== activeOrganizer._id));
        setStatusMessage({ type: 'success', text: 'Organizer removed successfully.' });
        closeManagePanel();
      } else {
        setError(response.message || 'Failed to delete organizer.');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete organizer.');
    } finally {
      setManaging(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Manage Organizers</h1>
          <p className="helper-text">Create new organizer accounts or manage existing ones.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? 'Close Form' : 'Create New Organizer'}
        </button>
      </div>

      {statusMessage && (
        <div className={`alert ${statusMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {statusMessage.text}
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      {creationInfo && (
        <div className="alert alert-success">
          <p>{creationInfo.message || 'Organizer created successfully.'}</p>
          {creationInfo.email && (
            <p>
              Email: <strong>{creationInfo.email}</strong>
            </p>
          )}
          {creationInfo.password && (
            <p>
              Temporary Password: <strong>{creationInfo.password}</strong>
            </p>
          )}
        </div>
      )}

      {showForm && (
        <div className="surface" style={{ padding: '24px', marginBottom: '30px' }}>
          <h2>Create Organizer</h2>
          <form onSubmit={handleCreateOrganizer} className="form-grid">
            <div className="form-group">
              <label htmlFor="organizerName">Organizer Name</label>
              <input
                id="organizerName"
                name="organizerName"
                value={formData.organizerName}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email (optional)</label>
              <input
                id="contactEmail"
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
              >
                <option value="Club">Club</option>
                <option value="Council">Council</option>
                <option value="Fest Team">Fest Team</option>
                <option value="Department">Department</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Tell participants what this organizer handles."
              ></textarea>
            </div>

            <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
              <button className="btn btn-primary" type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Organizer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filters">
        <input
          type="text"
          placeholder="Search organizers..."
          className="search-input"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
        />
        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
        >
          <option value="">All Categories</option>
          <option value="Club">Club</option>
          <option value="Council">Council</option>
          <option value="Fest Team">Fest Team</option>
          <option value="Department">Department</option>
        </select>
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
        >
          <option value="">All Status</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <p>Loading organizers...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Email</th>
                <th>Events</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrganizers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    No organizers found. Create the first organizer account.
                  </td>
                </tr>
              ) : (
                filteredOrganizers.map((org) => (
                  <tr key={org._id}>
                    <td>
                      <strong>{org.organizerName}</strong>
                      <br />
                      <small>{org.description || 'No description yet'}</small>
                    </td>
                    <td>{org.category || '—'}</td>
                    <td>{org.email}</td>
                    <td>{org.eventsCount ?? '—'}</td>
                    <td>
                      <span className={`badge ${org.isApproved ? 'badge-success' : 'badge-pending'}`}>
                        {org.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px' }}
                        onClick={() => openManagePanel(org)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {activeOrganizer && (
        <div className="modal-backdrop" onClick={closeManagePanel}>
          <div className="modal-panel surface" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{activeOrganizer.organizerName}</h2>
                <p className="helper-text">Update organizer details or approval status.</p>
              </div>
              <button className="btn btn-secondary" onClick={closeManagePanel}>
                Close
              </button>
            </div>
            <p>
              Email: <strong>{activeOrganizer.email}</strong>
            </p>

            <form onSubmit={handleUpdateOrganizer} className="form-grid" style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label htmlFor="manageCategory">Category</label>
                <select
                  id="manageCategory"
                  name="category"
                  value={manageForm.category}
                  onChange={handleManageChange}
                >
                  <option value="Club">Club</option>
                  <option value="Council">Council</option>
                  <option value="Fest Team">Fest Team</option>
                  <option value="Department">Department</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="manageContactEmail">Contact Email</label>
                <input
                  id="manageContactEmail"
                  type="email"
                  name="contactEmail"
                  value={manageForm.contactEmail}
                  onChange={handleManageChange}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="manageDescription">Description</label>
                <textarea
                  id="manageDescription"
                  name="description"
                  rows="3"
                  value={manageForm.description}
                  onChange={handleManageChange}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isApproved"
                    checked={manageForm.isApproved}
                    onChange={handleManageChange}
                  />
                  <span>Approved organizer</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteOrganizer}
                  disabled={managing}
                >
                  Remove Organizer
                </button>
                <button className="btn btn-primary" type="submit" disabled={managing}>
                  {managing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrganizers;
