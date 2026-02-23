import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService, authService } from '../../services';
import { Edit2, Save, X } from 'lucide-react';

const INTEREST_OPTIONS = [
  'Coding',
  'Hackathon',
  'AI/ML',
  'Robotics',
  'Music',
  'Dance',
  'Drama',
  'Entrepreneurship',
  'Sports',
  'Gaming',
  'Product Design',
  'Photography'
];

const Profile = () => {
  const { user, savePreferences, updateUser } = useAuth();
  const [organizers, setOrganizers] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState(user?.areasOfInterest || []);
  const [selectedClubs, setSelectedClubs] = useState(
    (user?.clubsToFollow || []).map((club) => club?.toString())
  );
  
  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    college: user?.college || '',
    contactNumber: user?.contactNumber || ''
  });

  const [preferencesMessage, setPreferencesMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
        setSelectedInterests(user.areasOfInterest || []);
        setSelectedClubs((user.clubsToFollow || []).map((club) => club?.toString()));
        setProfileData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            college: user.college || '',
            contactNumber: user.contactNumber || ''
        });
    }
  }, [user]);

  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const response = await userService.getOrganizers();
        if (response.success) {
          setOrganizers(response.data.organizers || []);
        }
      } catch (error) {
        console.error('Failed to load organizers', error);
      }
    };

    fetchOrganizers();
  }, []);

  const organizerOptions = useMemo(() => organizers.map((org) => ({
    id: org._id,
    label: org.organizerName,
    category: org.category
  })), [organizers]);

  const canSavePreferences = selectedInterests.length >= 3;

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  const toggleClub = (clubId) => {
    setSelectedClubs((prev) =>
      prev.includes(clubId)
        ? prev.filter((id) => id !== clubId)
        : [...prev, clubId]
    );
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setPreferencesMessage('');
    const payload = {
      areasOfInterest: selectedInterests,
      clubsToFollow: selectedClubs,
    };

    const result = await savePreferences(payload);
    if (result.success) {
      setPreferencesMessage('Preferences updated successfully.');
    } else {
      setPreferencesMessage(result.message || 'Could not save preferences.');
    }
    setSaving(false);
  };

  const handleUpdateProfile = async () => {
     setSavingProfile(true);
     setProfileMessage('');

     try {
         const response = await authService.updateProfile(profileData);
         if (response.success) {
             setProfileMessage('Profile updated successfully!');
             updateUser(response.data.user);
             setIsEditing(false);
         } else {
             setProfileMessage(response.message || 'Failed to update profile');
         }
     } catch (err) {
         setProfileMessage(err.message || 'Failed to update profile');
     } finally {
         setSavingProfile(false);
     }
  };

  const handleProfileChange = (e) => {
      const { name, value } = e.target;
      setProfileData(prev => ({
          ...prev,
          [name]: value
      }));
  };

  return (
    <div className="page-container">
      <h1>My Profile</h1>
      
      <div className="profile-card surface">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h2 style={{margin: 0}}>Personal Information</h2>
            {!isEditing ? (
                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                    <Edit2 size={16} /> Edit
                </button>
            ) : (
                <div style={{display: 'flex', gap: '8px'}}>
                    <button className="btn btn-primary btn-sm" onClick={handleUpdateProfile} disabled={savingProfile}>
                        <Save size={16} /> {savingProfile ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setIsEditing(false); setProfileMessage(''); setProfileData({ firstName: user?.firstName || '', lastName: user?.lastName || '', college: user?.college || '', contactNumber: user?.contactNumber || '' }); }}>
                        <X size={16} /> Cancel
                    </button>
                </div>
            )}
        </div>
        
        {profileMessage && <div className={`alert ${profileMessage.includes('success') ? 'alert-success' : 'alert-danger'}`} style={{marginBottom: '1rem'}}>{profileMessage}</div>}

        <div className="profile-info">
          {isEditing ? (
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="form-group">
                      <label>First Name</label>
                      <input 
                          type="text" 
                          name="firstName" 
                          value={profileData.firstName} 
                          onChange={handleProfileChange}
                          placeholder="First Name"
                      />
                  </div>
                  <div className="form-group">
                      <label>Last Name</label>
                      <input 
                          type="text" 
                          name="lastName" 
                          value={profileData.lastName} 
                          onChange={handleProfileChange}
                          placeholder="Last Name"
                      />
                  </div>
                  <div className="form-group">
                      <label>College</label>
                      <input 
                          type="text" 
                          name="college" 
                          value={profileData.college} 
                          onChange={handleProfileChange}
                          placeholder="College Name"
                      />
                  </div>
                  <div className="form-group">
                      <label>Contact Number</label>
                      <input 
                          type="tel" 
                          name="contactNumber" 
                          value={profileData.contactNumber} 
                          onChange={handleProfileChange}
                          placeholder="Contact Number"
                      />
                  </div>
              </div>
          ) : (
             <>
                <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Type:</strong> {user?.participantType}</p>
                <p><strong>College:</strong> {user?.college || 'Not specified'}</p>
                <p><strong>Contact:</strong> {user?.contactNumber || 'Not specified'}</p>
             </>
          )}
        </div>
      </div>

      <div className="profile-card surface">
        <h2>Areas of Interest</h2>
        <p className="helper-text">Pick at least three topics you’d love to hear about.</p>
        <div className="chip-grid">
          {INTEREST_OPTIONS.map((interest) => (
            <button
              key={interest}
              type="button"
              className={`chip ${selectedInterests.includes(interest) ? 'active' : ''}`}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div className="profile-card surface">
        <h2>Follow Clubs & Organizers</h2>
        <p className="helper-text">We’ll highlight events from the organizers you follow.</p>
        <div className="organizer-list">
          {organizerOptions.length === 0 && <p>Loading organizers...</p>}
          {organizerOptions.map((org) => (
            <label key={org.id} className="organizer-item">
              <input
                type="checkbox"
                checked={selectedClubs.includes(org.id)}
                onChange={() => toggleClub(org.id)}
              />
              <div>
                <p>{org.label}</p>
                <small>{org.category}</small>
              </div>
            </label>
          ))}
        </div>
        {!canSavePreferences && (
          <p className="alert alert-error">
            Select at least three interests to tailor your recommendations.
          </p>
        )}
        {preferencesMessage && (
          <p className="alert alert-info">{preferencesMessage}</p>
        )}
        <button
          className="btn btn-primary"
          onClick={handleSavePreferences}
          disabled={saving || !canSavePreferences}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      <div className="profile-card surface">
        <h2>Security</h2>
        <p>Use the password section in settings to keep your account safe.</p>
      </div>
    </div>
  );
};

export default Profile;
