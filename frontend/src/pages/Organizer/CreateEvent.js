import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { organizerService, eventService } from '../../services';

const initialFormState = {
  eventName: '',
  eventDescription: '',
  eventType: 'Normal',
  eligibility: 'All',
  eventStartDate: '',
  eventEndDate: '',
  registrationDeadline: '',
  registrationLimit: '',
  registrationFee: '0',
  eventTags: [],
  isTeamEvent: false,
  teamSizeMin: 1,
  teamSizeMax: 1,
};

const INITIAL_TAGS = [
  'Coding', 'Hackathon', 'AI/ML', 'Robotics', 'Music', 
  'Dance', 'Drama', 'Entrepreneurship', 'Sports', 
  'Gaming', 'Product Design', 'Photography', 'Quiz', 'Workshop'
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' }
];

const CreateEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Check if editing
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Custom Form Builder State
  const [customFields, setCustomFields] = useState([]);
  // Merchandise State
  const [merchItems, setMerchItems] = useState([]);

  useEffect(() => {
     if (id) {
         // Edit mode: fetch event details
         const fetchEvent = async () => {
             try {
                await organizerService.getEventAnalytics(id); 
                // Or eventService.getEventById(id), but organizer endpoint might give more data
                // Since getEventAnalytics returns { event: ... }, let's try to map it
                // Actually even better to use eventService.getEventById but ensure we have organizer access
                // Let's use eventService for public data + some organizer specific endpoints if needed
                // But wait, createEvent needs raw data. 
                const res = await eventService.getEventById(id);
                if (res.success && res.data.event) {
                    const e = res.data.event;
                    setFormData({
                        eventName: e.eventName,
                        eventDescription: e.eventDescription,
                        eventType: e.eventType,
                        eligibility: e.eligibility,
                        // Convert UTC dates to local datetime-local format
                        eventStartDate: e.eventStartDate ? new Date(new Date(e.eventStartDate).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
                        eventEndDate: e.eventEndDate ? new Date(new Date(e.eventEndDate).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
                        registrationDeadline: e.registrationDeadline ? new Date(new Date(e.registrationDeadline).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
                        registrationLimit: e.registrationLimit,
                        registrationFee: e.registrationFee,
                        eventTags: e.eventTags,
                        isTeamEvent: e.isTeamEvent,
                        teamSizeMin: e.teamSize?.min || 1,
                        teamSizeMax: e.teamSize?.max || 1
                    });
                    
                    if (e.customRegistrationForm?.fields) {
                        setCustomFields(e.customRegistrationForm.fields);
                    }
                    if (e.merchandiseDetails?.items) {
                        // Normalize arrays to comma-separated strings for editing form consistency
                        // OR keep them as is and handle in payload builder? 
                        // It's cleaner to handle normalization here if we want to potentially edit them later (though edit UI for existing items might be limited)
                        // Actually, looking at the UI, we only have inputs for *new* items. We might need a way to see existing items.
                        // For now, let's just make sure buildPayload doesn't crash.
                        setMerchItems(e.merchandiseDetails.items);
                    }
                }
             } catch (err) {
                 console.error("Failed to fetch event for edit", err);
                 setError("Could not load event data.");
             }
         };
         fetchEvent();
     }
  }, [id]);

  const [newField, setNewField] = useState({
    label: '',
    fieldType: 'text',
    required: false,
    options: ''
  });

  // Merchandise Form State
  // merchItems state is already defined above
  const [newMerchItem, setNewMerchItem] = useState({
      name: '',
      price: '',
      stockQuantity: '',
      maxPerParticipant: 1,
      size: '',
      color: '',
      variants: ''
  });

  const handleMerchChange = (e) => {
      const { name, value } = e.target;
      setNewMerchItem(prev => ({ ...prev, [name]: value }));
  };

  const addMerchItem = () => {
      if (!newMerchItem.name || !newMerchItem.price || !newMerchItem.stockQuantity) return;
      setMerchItems(prev => [...prev, { ...newMerchItem }]);
      setNewMerchItem({ name: '', price: '', stockQuantity: '', maxPerParticipant: 1, size: '', color: '', variants: '' });
  };

  const removeMerchItem = (index) => {
      setMerchItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      eventTags: (prev.eventTags || []).includes(tag) 
        ? prev.eventTags.filter(t => t !== tag)
        : [...(prev.eventTags || []), tag]
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewField(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addCustomField = () => {
    if (!newField.label) return;
    
    setCustomFields(prev => [...prev, {
      fieldName: newField.label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      label: newField.label,
      fieldType: newField.fieldType,
      required: newField.required,
      options: ['select', 'checkbox', 'radio'].includes(newField.fieldType) 
        ? newField.options.split(',').map(s => s.trim()).filter(s => s) 
        : []
    }]);
    
    setNewField({
      label: '',
      fieldType: 'text',
      required: false,
      options: ''
    });
  };

  const removeCustomField = (index) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const buildPayload = (status) => ({
    eventName: formData.eventName.trim(),
    eventDescription: formData.eventDescription.trim(),
    eventType: formData.eventType,
    eligibility: formData.eligibility,
    eventStartDate: new Date(formData.eventStartDate),
    eventEndDate: new Date(formData.eventEndDate),
    registrationDeadline: new Date(formData.registrationDeadline),
    registrationLimit: Number(formData.registrationLimit),
    registrationFee: Number(formData.registrationFee || 0),
    eventTags: formData.eventTags || [],
    isTeamEvent: formData.isTeamEvent,
    teamSize: formData.isTeamEvent ? {
      min: Number(formData.teamSizeMin),
      max: Number(formData.teamSizeMax)
    } : undefined,
    customRegistrationForm: {
      fields: customFields
    },
    merchandiseDetails: formData.eventType === 'Merchandise' ? {
        items: merchItems.map(m => {
            // Helper to get array from comma-separated string OR existing array
            const getArray = (val) => {
               if (Array.isArray(val)) return val;
               if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(s => s);
               return [];
            };

            return {
                name: m.name,
                price: Number(m.price),
                stockQuantity: Number(m.stockQuantity),
                maxPerParticipant: Number(m.maxPerParticipant),
                size: getArray(m.size),
                color: getArray(m.color),
                variants: getArray(m.variants)
            };
        })
    } : undefined,
    status,
  });

  const handleSubmit = async (status) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = buildPayload(status || formData.status || 'Published'); // Default to published if not draft/etc
      
      let response;
      if (id) {
         response = await organizerService.updateEvent(id, payload);
      } else {
         response = await organizerService.createEvent(payload);
      }

      if (response.success) {
        setSuccess(id ? 'Event updated successfully!' : 'Event created successfully!');
        if (!id) setFormData(initialFormState);
        setTimeout(() => navigate('/organizer/events'), 800);
      } else {
        setError(response.message || 'Action failed.');
      }
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting || !formData.eventName || !formData.eventDescription || !formData.eventStartDate || !formData.eventEndDate || !formData.registrationDeadline || !formData.registrationLimit;

  return (
    <div className="page-container">
      <h1>{id ? 'Edit Event' : 'Create New Event'}</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <form
        className="create-event-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit('Published'); 
        }}
      >
        <div className="form-group">
          <label htmlFor="eventName">Event Name *</label>
          <input
            id="eventName"
            name="eventName"
            type="text"
            placeholder="Enter event name"
            value={formData.eventName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventDescription">Event Description *</label>
          <textarea
            id="eventDescription"
            name="eventDescription"
            rows="4"
            placeholder="Describe your event"
            value={formData.eventDescription}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="eventType">Event Type *</label>
            <select
              id="eventType"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
            >
              <option value="Normal">Normal</option>
              <option value="Merchandise">Merchandise</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="eligibility">Eligibility *</label>
            <select
              id="eligibility"
              name="eligibility"
              value={formData.eligibility}
              onChange={handleChange}
            >
              <option value="All">All</option>
              <option value="IIIT Only">IIIT Only</option>
              <option value="Non-IIIT Only">Non-IIIT Only</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="eventStartDate">Start Date *</label>
            <input
              id="eventStartDate"
              name="eventStartDate"
              type="datetime-local"
              value={formData.eventStartDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="eventEndDate">End Date *</label>
            <input
              id="eventEndDate"
              name="eventEndDate"
              type="datetime-local"
              value={formData.eventEndDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="registrationDeadline">Registration Deadline *</label>
            <input
              id="registrationDeadline"
              name="registrationDeadline"
              type="datetime-local"
              value={formData.registrationDeadline}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="registrationLimit">Registration Limit *</label>
            <input
              id="registrationLimit"
              name="registrationLimit"
              type="number"
              min="1"
              placeholder="Max participants"
              value={formData.registrationLimit}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row" style={{ marginTop: '1rem', marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <input
              id="isTeamEvent"
              name="isTeamEvent"
              type="checkbox"
              checked={formData.isTeamEvent}
              onChange={(e) => setFormData(prev => ({ ...prev, isTeamEvent: e.target.checked }))}
              style={{ width: 'auto', margin: 0 }}
            />
            <label htmlFor="isTeamEvent" style={{ margin: 0 }}>Is this a Team Event?</label>
          </div>

          {formData.isTeamEvent && (
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label htmlFor="teamSizeMin">Min Team Size *</label>
                <input
                  id="teamSizeMin"
                  name="teamSizeMin"
                  type="number"
                  min="1"
                  value={formData.teamSizeMin}
                  onChange={handleChange}
                  required={formData.isTeamEvent}
                />
              </div>
              <div className="form-group">
                <label htmlFor="teamSizeMax">Max Team Size *</label>
                <input
                  id="teamSizeMax"
                  name="teamSizeMax"
                  type="number"
                  min="1"
                  value={formData.teamSizeMax}
                  onChange={handleChange}
                  required={formData.isTeamEvent}
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="registrationFee">Registration Fee</label>
          <input
            id="registrationFee"
            name="registrationFee"
            type="number"
            min="0"
            placeholder="0 for free events"
            value={formData.registrationFee}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Event Tags</label>
          <div className="tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {INITIAL_TAGS.map(tag => (
              <span 
                key={tag} 
                className="interest-tag"
                onClick={() => handleTagToggle(tag)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  backgroundColor: (formData.eventTags || []).includes(tag) ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: (formData.eventTags || []).includes(tag) ? 'white' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s, color 0.2s',
                  userSelect: 'none'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <small className="helper-text" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}>
            Select tags to help recommend your event to interested students.
          </small>
        </div>

        {formData.eventType === 'Normal' && (
          <div className="section-divider">
            <h3>Custom Registration Form</h3>
            <p className="helper-text">Add custom questions for participants.</p>
            
            <div className="field-builder">
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="label"
                    placeholder="Field Label (e.g. T-Shirt Size)"
                    value={newField.label}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="form-group">
                  <select name="fieldType" value={newField.fieldType} onChange={handleFieldChange}>
                    {FIELD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {['select', 'checkbox'].includes(newField.fieldType) && (
                 <div className="form-group">
                   <input
                     type="text"
                     name="options"
                     placeholder="Options (comma separated: S, M, L, XL)"
                     value={newField.options}
                     onChange={handleFieldChange}
                   />
                 </div>
              )}

              <div className="form-row" style={{ alignItems: 'center' }}>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="required"
                    checked={newField.required}
                    onChange={handleFieldChange}
                  />
                  Required Field
                </label>
                <button type="button" className="btn btn-secondary" onClick={addCustomField}>
                  Add Field
                </button>
              </div>
            </div>

            {customFields.length > 0 && (
              <div className="custom-fields-list">
                <h4>Preview Form:</h4>
                {customFields.map((field, index) => (
                   <div key={index} className="preview-field">
                     <div className="preview-header">
                       <span className="field-label">{field.label} {field.required && '*'}</span>
                       <button type="button" className="btn-icon" onClick={() => removeCustomField(index)}>&times;</button>
                     </div>
                     <span className="field-type-badge">{field.fieldType}</span>
                     {field.options && field.options.length > 0 && (
                       <div className="options-preview">
                         Options: {field.options.join(', ')}
                       </div>
                     )}
                   </div>
                ))}
              </div>
            )}
          </div>
        )}

        {formData.eventType === 'Merchandise' && (
          <div className="section-divider">
            <h3>Merchandise Items</h3>
            <p className="helper-text">Add items for sale.</p>
            
            <div className="field-builder">
               <div className="form-row">
                  <div className="form-group">
                      <label>Item Name</label>
                      <input type="text" name="name" value={newMerchItem.name} onChange={handleMerchChange} placeholder="T-Shirt, Hoodie, etc." />
                  </div>
                  <div className="form-group">
                      <label>Price (₹)</label>
                      <input type="number" name="price" value={newMerchItem.price} onChange={handleMerchChange} placeholder="0" />
                  </div>
               </div>
               <div className="form-row">
                  <div className="form-group">
                      <label>Total Stock</label>
                      <input type="number" name="stockQuantity" value={newMerchItem.stockQuantity} onChange={handleMerchChange} placeholder="100" />
                  </div>
                  <div className="form-group">
                      <label>Max Quantity Per Person</label>
                      <input type="number" name="maxPerParticipant" value={newMerchItem.maxPerParticipant} onChange={handleMerchChange} placeholder="1" />
                  </div>
               </div>
               
               <div className="form-row">
                  <div className="form-group">
                      <label>Sizes (Comma separated)</label>
                      <input type="text" name="size" value={newMerchItem.size} onChange={handleMerchChange} placeholder="S, M, L, XL" />
                  </div>
                  <div className="form-group">
                      <label>Colors (Comma separated)</label>
                      <input type="text" name="color" value={newMerchItem.color} onChange={handleMerchChange} placeholder="Red, Blue, Black" />
                  </div>
               </div>
               
               <div className="form-group">
                   <label>Other Variants (Comma separated)</label>
                   <input type="text" name="variants" value={newMerchItem.variants} onChange={handleMerchChange} placeholder="Cotton, Polyester, etc." />
               </div>

               <button type="button" className="btn btn-secondary" onClick={addMerchItem} style={{width: '100%'}}>
                  Add Merchandise Item
               </button>
            </div>

            {merchItems.length > 0 && (
                <div className="custom-fields-list">
                   <h4>Items List:</h4>
                   {merchItems.map((item, index) => (
                       <div key={index} className="preview-field" style={{display: 'flex', justifyContent: 'space-between'}}>
                           <div>
                               <strong>{item.name}</strong> - ₹{item.price}
                               <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                                   Stock: {item.stockQuantity} | Max/User: {item.maxPerParticipant}
                                   <br/>
                                   {item.size && `Sizes: ${item.size}`} {item.color && `| Colors: ${item.color}`}
                               </div>
                           </div>
                           <button type="button" className="btn-icon" onClick={() => removeMerchItem(index)}>&times;</button>
                       </div>
                   ))}
                </div>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isDisabled}
            onClick={() => handleSubmit('Draft')}
          >
            {submitting ? 'Saving...' : 'Save as Draft'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isDisabled}>
            {submitting ? 'Publishing...' : 'Publish Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
