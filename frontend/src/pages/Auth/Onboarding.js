import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services';
import './Auth.css';

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

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, savePreferences } = useAuth();
  
  const [step, setStep] = useState(1);
  const [organizers, setOrganizers] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedClubs, setSelectedClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch organizers on mount
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const response = await userService.getOrganizers();
        if (response.success) {
          setOrganizers(response.data.organizers || []);
        }
      } catch (err) {
        console.error('Failed to load organizers', err);
      }
    };
    fetchOrganizers();
  }, []);

  const organizerOptions = useMemo(() => organizers.map((org) => ({
    id: org._id,
    label: org.organizerName,
    category: org.category
  })), [organizers]);

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleClub = (clubId) => {
    setSelectedClubs((prev) => 
      prev.includes(clubId)
        ? prev.filter(id => id !== clubId)
        : [...prev, clubId]
    );
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleSkip = async () => {
    // If skipping, we just navigate to dashboard without saving preferences
    // Or we could save empty preferences. The doc says "Configure Later", so simply navigating away is fine.
    navigate('/dashboard');
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await savePreferences({
        areasOfInterest: selectedInterests,
        clubsToFollow: selectedClubs
      });

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Failed to save preferences');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container onboarding-container">
      <div className="auth-card onboarding-card">
        <div className="auth-header">
          <h1>Welcome, {user?.firstName}!</h1>
          <p>Let's personalize your experience</p>
          <div className="step-indicator">
            <span className={`dot ${step === 1 ? 'active' : 'completed'}`}></span>
            <span className={`dot ${step === 2 ? 'active' : ''}`}></span>
          </div>
        </div>

        {step === 1 && (
          <div className="onboarding-step">
            <h2>What are you interested in?</h2>
            <p className="helper-text">Select topics to get event recommendations</p>
            
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

            <div className="onboarding-actions">
              <button className="btn btn-text" onClick={handleSkip}>Skip for now</button>
              <button className="btn btn-primary" onClick={handleNext}>Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h2>Follow Clubs & Organizers</h2>
            <p className="helper-text">Stay updated with their latest events</p>

            <div className="organizer-list-scroll">
              {organizerOptions.length === 0 && <p>Loading clubs...</p>}
              {organizerOptions.map((org) => (
                <label key={org.id} className="organizer-item">
                  <input
                    type="checkbox"
                    checked={selectedClubs.includes(org.id)}
                    onChange={() => toggleClub(org.id)}
                  />
                  <div className="org-info">
                    <span className="org-name">{org.label}</span>
                    <span className="org-cat">{org.category}</span>
                  </div>
                </label>
              ))}
            </div>

            {error && <p className="alert alert-error">{error}</p>}

            <div className="onboarding-actions">
              <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={loading}>Back</button>
              <button className="btn btn-primary" onClick={handleFinish} disabled={loading}>
                {loading ? 'Saving...' : 'Finish'}
              </button>
            </div>
            <button className="btn btn-text center-text" onClick={handleSkip} disabled={loading}>Skip set up</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
