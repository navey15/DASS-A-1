import React from 'react';

const ManageParticipants = () => {
  return (
    <div className="page-container">
      <h1>Manage Participants</h1>

      <div className="filters">
        <input type="text" placeholder="Search participants..." className="search-input" />
        <select className="filter-select">
          <option>All Types</option>
          <option>IIITH Students</option>
          <option>External Participants</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>College</th>
              <th>Registrations</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>
                No participants found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageParticipants;
