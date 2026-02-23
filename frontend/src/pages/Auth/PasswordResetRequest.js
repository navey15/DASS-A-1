import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services';
import './Auth.css';

const PasswordResetRequest = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    reason: '',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.reason.length < 10) {
      setError('Reason must be at least 10 characters long.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.requestPasswordReset(formData);
      setSuccess('Password reset request submitted successfully. The admin will review your request.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Request a password reset from the admin (Organizers Only)</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success" style={{background: 'var(--success-bg)', color: 'var(--success)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem'}}>{success}</div>}

          <div className="form-group">
            <label htmlFor="email">Organizer Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your registered email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason for Reset</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              placeholder="Why do you need a password reset? (e.g., Forgot password)"
              disabled={loading}
              rows="4"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                resize: 'vertical'
              }}
            />
            <small className="helper-text">Minimum 10 characters.</small>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
          
          <div className="auth-footer">
            <p>Remember your password? <Link to="/login">Login</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetRequest;
