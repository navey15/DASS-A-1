import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, authService } from '../../services';
// import { useAuth } from '../../context/AuthContext';

const OrganizersList = () => {
  const navigate = useNavigate();
  // const { user } = useAuth();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followedIds, setFollowedIds] = useState([]); // Local state for immediate UI feedback

  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        setLoading(true);
        const [orgRes, userRes] = await Promise.all([
           userService.getOrganizers(),
           authService.getCurrentUser()
        ]);
        
        if (orgRes.success) {
            setOrganizers(orgRes.data.organizers || []);
        }
        
        if (userRes.success) {
            setFollowedIds(userRes.data.user.clubsToFollow || []);
        }

      } catch (err) {
        setError('Failed to load organizers');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizers();
  }, []);

  const handleFollow = async (e, orgId) => {
    e.stopPropagation();
    try {
        const response = await userService.toggleFollowOrganizer(orgId);
        if (response.success) {
            setFollowedIds(prev => 
                prev.includes(orgId) 
                ? prev.filter(id => id !== orgId) 
                : [...prev, orgId]
            );
        }
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div className="page-container">
      <h1>Clubs & Organizers</h1>
      <p>Discover and follow clubs to stay updated with their events.</p>

      {loading && <p>Loading...</p>}
      {error && <p className="alert alert-error">{error}</p>}

      <div className="organizer-list">
        {organizers.map((org) => {
           const isFollowing = followedIds.includes(org._id);
           return (
            <div key={org._id} className="surface" onClick={() => navigate(`/organizers/${org._id}`)} style={{cursor: 'pointer', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'}}>
                <div style={{flex: 1}}>
                    <h3 style={{marginBottom: '5px', color: 'var(--text-primary)'}}>{org.organizerName}</h3>
                    <span className="badge" style={{background: 'var(--bg-secondary)', color: 'var(--text-secondary)', marginBottom: '8px', display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>{org.category}</span>
                    <p style={{color: 'var(--text-secondary)', fontSize: '14px'}}>{org.description || 'No description provided.'}</p>
                </div>
                <button 
                    className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={(e) => handleFollow(e, org._id)}
                >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default OrganizersList;