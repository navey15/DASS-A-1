import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import moment from 'moment';

const ManageParticipants = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  // filters state
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (type) params.participantType = type;

      const response = await adminService.getAllParticipants(params);
      if (response.success && response.data) {
        setParticipants(response.data.participants || []);
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, type]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  return (
    <div className="page-container">
      <h1>Manage Participants</h1>

      <div className="filters">
        <input 
          type="text" 
          placeholder="Search participants..." 
          className="search-input" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="filter-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="IIIT">IIIT Students</option>
          <option value="Non-IIIT">External Participants</option>
        </select>
      </div>

      <div className="table-container">
        {loading ? (
             <p style={{ textAlign: 'center', padding: '20px' }}>Loading participants...</p>
        ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>College</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {participants.length > 0 ? (
              participants.map((participant) => (
                <tr key={participant._id}>
                  <td>{participant.firstName} {participant.lastName}</td>
                  <td>{participant.email}</td>
                  <td>
                    <span className={`badge ${participant.participantType === 'IIIT' ? 'badge-primary' : 'badge-secondary'}`}>
                      {participant.participantType}
                    </span>
                  </td>
                  <td>{participant.collegeName || 'N/A'}</td>
                  <td>{moment(participant.createdAt).format('MMM D, YYYY')}</td>
                </tr>
              ))
            ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No participants found.
                  </td>
                </tr>
            )}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};


export default ManageParticipants;
