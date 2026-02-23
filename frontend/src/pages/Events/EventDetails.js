import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { eventService, registrationService } from "../../services";
import { Calendar, MapPin, User, Clock, Info, CheckCircle, ArrowLeft, Trophy } from "lucide-react";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [registering, setRegistering] = useState(false);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formResponses, setFormResponses] = useState({});
  const [teamMode, setTeamMode] = useState("create"); // "create" or "join"
  const [teamName, setTeamName] = useState("");
  const [targetTeamSize, setTargetTeamSize] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  
  // Merchandise State
  const [merchSelection, setMerchSelection] = useState({}); 
  // Structure: { itemId: { quantity: 0, size: "", color: "", variant: "" } }

  const currentTotalMerchCost = React.useMemo(() => {
    if (event?.eventType !== 'Merchandise' || !event?.merchandiseDetails?.items) return 0;
    return event.merchandiseDetails.items.reduce((acc, item) => {
      const selection = merchSelection[item._id] || { quantity: 0 };
      return acc + (item.price * (selection.quantity || 0));
    }, 0);
  }, [event, merchSelection]);

  const totalAmountToPay = (event?.registrationFee || 0) + currentTotalMerchCost;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await eventService.getEventById(id);
        if (response.success) {
          setEvent(response.data.event || null);
        } else {
          setError(response.message || "Failed to load event");
        }
      } catch (err) {
        setError(err.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleRegisterClick = () => {
    if (event.isTeamEvent || (event.customRegistrationForm?.fields?.length > 0) || (event.eventType === 'Merchandise' && event.merchandiseDetails?.items?.length > 0)) {
      setShowModal(true);
    } else {
      handleRegister();
    }
  };

  const handleInputChange = (fieldName, value) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const updateMerchSelection = (itemId, field, value) => {
    setMerchSelection(prev => {
       const existing = prev[itemId] || { quantity: 0, size: "", color: "" };
       // If changing quantity, ensure it allows empty string for typing but converts to number storage
       let finalValue = value;
       if (field === 'quantity') {
          finalValue = parseInt(value) || 0;
       }
       return {
          ...prev,
          [itemId]: { ...existing, [field]: finalValue }
       };
    });
  };

  const handleRegister = async () => {
    if (!event) return;
    try {
      setRegistering(true);
      setActionMessage("");
      
      // Validate Required Fields first
      if (event.customRegistrationForm && event.customRegistrationForm.fields) {
         for (const field of event.customRegistrationForm.fields) {
            if (field.required) {
               const val = formResponses[field.fieldName];
               if (!val || (Array.isArray(val) && val.length === 0)) {
                  setActionMessage(`Please fill in the required field: ${field.label}`);
                  setRegistering(false);
                  return;
               }
            }
         }
      }

      // Handle Merchandise Logic
      let merchandisePurchase = [];
      let totalMerchCost = 0;
      
      const merchandiseItems = event.merchandiseDetails?.items || [];

      if (event.eventType === 'Merchandise' && merchandiseItems.length > 0) {
         Object.entries(merchSelection).forEach(([itemId, selection]) => {
            if (selection.quantity > 0) {
               const item = merchandiseItems.find(m => m._id === itemId);
               if (item) {
                  merchandisePurchase.push({
                     itemId: itemId,
                     quantity: selection.quantity,
                     size: selection.size,
                     color: selection.color
                  });
                  totalMerchCost += item.price * selection.quantity;
               }
            }
         });

         if (merchandisePurchase.length === 0) {
             setActionMessage("Please select at least one item.");
             setRegistering(false);
             return;
         }
      }

      let payload;
      let isMultipart = false;

      // Check if we need multipart/form-data (for payment proof OR custom file uploads)
      const hasCustomFiles = Object.values(formResponses).some(val => val instanceof File);
      const totalAmountToPay = (event.registrationFee || 0) + totalMerchCost;

      if (paymentProof || totalAmountToPay > 0 || hasCustomFiles) {
          isMultipart = true;
          payload = new FormData();
          
          // Separate files from text responses for custom form
          const textResponses = {};
          Object.entries(formResponses).forEach(([key, val]) => {
              if (val instanceof File) {
                  payload.append(key, val); // Append files directly with fieldName
              } else {
                  textResponses[key] = val;
              }
          });
          
          payload.append('formResponses', JSON.stringify(textResponses)); // Send non-file responses as JSON
          
          if (merchandisePurchase.length > 0) {
              payload.append('merchandisePurchase', JSON.stringify({ items: merchandisePurchase }));
          }

          if (event.isTeamEvent && teamMode === "create") {
             if (!teamName) {
                setActionMessage("Team name is required");
                setRegistering(false);
                return;
             }
             if (!targetTeamSize) {
                setActionMessage("Target team size is required");
                setRegistering(false);
                return;
             }
             payload.append('isTeamRegistration', 'true'); // FormData values are strings
             payload.append('teamName', teamName);
             payload.append('targetTeamSize', targetTeamSize);
          }
          
          if (paymentProof) {
             payload.append('paymentProof', paymentProof);
          } else if (totalAmountToPay > 0) {
             setActionMessage(`Please upload payment proof for total amount: ₹${totalAmountToPay}`);
             setRegistering(false);
             return;
          }

      } else {
        // Normal JSON payload
        payload = {
            formResponses: formResponses
        };

        if (merchandisePurchase.length > 0) {
            payload.merchandisePurchase = { items: merchandisePurchase };
        }

        if (event.isTeamEvent && teamMode === "create") {
            if (!teamName) {
               setActionMessage("Team name is required");
               setRegistering(false);
               return;
            }
            if (!targetTeamSize) {
               setActionMessage("Target team size is required");
               setRegistering(false);
               return;
            }
            payload.isTeamRegistration = true;
            payload.teamName = teamName;
            payload.targetTeamSize = targetTeamSize;
        }
      }

      const response = await registrationService.registerForEvent(event._id, payload);
      if (response.success) {
        setActionMessage("Registered successfully!");
        setShowModal(false);
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setActionMessage(response.message || "Could not register");
      }
    } catch (err) {
      setActionMessage(err.message || "Could not register");
    } finally {
      setRegistering(false);
    }
  };

  const handleJoinTeam = async () => {
     if (!inviteCode) {
        setActionMessage("Invite code is required");
        return;
     }

     try {
        setRegistering(true);
        setActionMessage("");
        const response = await registrationService.joinTeam(inviteCode);
        
        if (response.success) {
           setActionMessage("Joined team successfully!");
           setShowModal(false);
           setTimeout(() => navigate("/dashboard"), 1500);
        } else {
           setActionMessage(response.message || "Could not join team");
        }
     } catch (err) {
        setActionMessage(err.message || "Could not join team");
     } finally {
        setRegistering(false);
     }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="page-container">
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{marginBottom: "1rem"}}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="alert alert-error">{error || "Event not found"}</div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{maxWidth: "1200px", margin: "0 auto", padding: "2rem"}}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{marginBottom: "2rem", display: "flex", alignItems: "center", gap: "8px", padding: "0.5rem 1rem"}}>
        <ArrowLeft size={16} /> Back to Events
      </button>

      {/* Hero Header */}
      <div className="surface" style={{padding: "2.5rem", marginBottom: "2rem", borderLeft: "6px solid var(--accent)"}}>
         <span className={`status-badge ${event.eventType === "merchandise" ? "draft" : "published"}`} style={{textTransform: "uppercase", marginBottom: "1rem", display: "inline-block"}}>
            {event.eventType}
         </span>
         <h1 style={{fontSize: "2.5rem", marginBottom: "1rem", color: "var(--text-primary)"}}>{event.eventName}</h1>
         
         <div style={{display: "flex", flexWrap: "wrap", gap: "2rem", color: "var(--text-secondary)", fontSize: "1rem"}}>
            <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
               <Calendar size={20} color="var(--accent)" />
               {new Date(event.eventStartDate).toLocaleDateString()}
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
               <Clock size={20} color="var(--accent)" />
               {new Date(event.eventStartDate).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
               <MapPin size={20} color="var(--accent)" />
               {event.eventLocation || "Venue To Be Announced"}
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
               <User size={20} color="var(--accent)" />
               Hosted by {event.organizer?.organizerName}
            </div>
         </div>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem"}}>
         <div style={{flex: "2"}}>
            <div className="surface" style={{padding: "2rem", marginBottom: "2rem"}}>
                <h2 style={{display: "flex", alignItems: "center", gap: "10px", fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: "1rem"}}>
                   <Info size={24} color="var(--accent)" /> About Event
                </h2>
                <div style={{lineHeight: "1.8", color: "var(--text-secondary)", fontSize: "1.1rem"}}>
                   {event.description || "No description provided."}
                </div>
            </div>

            <div className="surface" style={{padding: "2rem"}}>
                <h2 style={{display: "flex", alignItems: "center", gap: "10px", fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: "1rem"}}>
                   <Trophy size={24} color="var(--warning)" /> Why Participate?
                </h2>
                <ul style={{listStyle: "none", padding: 0, display: "grid", gap: "1rem"}}>
                   <li style={{display: "flex", gap: "10px", alignItems: "center", color: "var(--text-secondary)"}}>
                      <CheckCircle size={20} color="var(--success)" /> Network with like-minded peers
                   </li>
                   <li style={{display: "flex", gap: "10px", alignItems: "center", color: "var(--text-secondary)"}}>
                      <CheckCircle size={20} color="var(--success)" /> Gain valuable experience
                   </li>
                   <li style={{display: "flex", gap: "10px", alignItems: "center", color: "var(--text-secondary)"}}>
                      <CheckCircle size={20} color="var(--success)" /> Win exciting prizes and certificates
                   </li>
                </ul>
            </div>
         </div>

         <div style={{flex: "1"}}>
            <div className="surface" style={{padding: "2rem", position: "sticky", top: "100px"}}>
               <h3 style={{fontSize: "1.25rem", marginBottom: "1.5rem", color: "var(--text-primary)"}}>Registration</h3>
               
               <div style={{background: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", border: "1px solid var(--border)"}}>
                  <p style={{fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem"}}>Status</p>
                  <span className="status-badge" style={{display: "inline-block", background: "var(--success-light)", color: "var(--success)"}}>Open for Registration</span>
               </div>

               {actionMessage && (
                 <div className={`alert ${actionMessage.includes("success") ? "alert-success" : "alert-danger"}`} style={{padding: "1rem", marginBottom: "1rem", borderRadius: "var(--radius-md)", background: actionMessage.includes("success") ? "var(--success-light)" : "var(--error-light)", color: actionMessage.includes("success") ? "var(--success)" : "var(--error)"}}>
                   {actionMessage}
                 </div>
               )}

               <button 
                 onClick={handleRegisterClick} 
                 className="btn btn-primary btn-block btn-large" 
                 disabled={registering}
                 style={{width: "100%", justifyContent: "center"}}
               >
                 {registering ? "Registering..." : "Register Now"}
               </button>
               
               <p style={{textAlign: "center", marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-muted)"}}>
                  Limited spots available.
               </p>
            </div>
         </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <div className="modal-header">
              <h2>Complete Registration</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
                style={{padding: "0.5rem"}}
              >✕</button>
            </div>

            <div style={{marginBottom: "2rem"}}>
                 <p style={{color: "var(--text-secondary)"}}>Please provide the following details to complete your registration.</p>
            </div>

            {event.isTeamEvent && (
              <div style={{marginBottom: "2rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px"}}>
                <div style={{display: "flex", gap: "1rem", marginBottom: "1rem"}}>
                  <button 
                    className={`btn ${teamMode === "create" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setTeamMode("create")}
                  >
                    Create New Team
                  </button>
                  <button 
                    className={`btn ${teamMode === "join" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setTeamMode("join")}
                  >
                    Join Existing Team
                  </button>
                </div>
                
                {teamMode === "create" ? (
                  <>
                  <div className="form-group">
                    <label>Team Name *</label>
                    <input 
                      type="text" 
                      placeholder="Enter a cool team name" 
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{marginTop: "1rem"}}>
                     <label>Target Team Size * (Min: {event.teamSize?.min || 1}, Max: {event.teamSize?.max || 4})</label>
                     <input 
                        type="number"
                        min={event.teamSize?.min || 1}
                        max={event.teamSize?.max || 4}
                        placeholder={`Enter team size (max ${event.teamSize?.max || 4})`}
                        value={targetTeamSize}
                        onChange={(e) => setTargetTeamSize(e.target.value)}
                     />
                     <small style={{color: "var(--text-secondary)"}}>Registration will be complete when this many members join.</small>
                  </div>
                  </>
                ) : (
                   <div className="form-group">
                    <label>Team Invite Code *</label>
                    <input 
                      type="text" 
                      placeholder="Enter invite code from your team leader" 
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            
            {(!event.isTeamEvent || teamMode === "create") && (
            <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
              
              {/* Merchandise Selection */}
              {event.eventType === 'Merchandise' && event.merchandiseDetails?.items?.map(item => (
                <div key={item._id} style={{marginBottom: "1rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--surface)"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem"}}>
                        <h4 style={{margin: 0}}>{item.name}</h4>
                        <span style={{fontWeight: "bold", color: "var(--accent)"}}>₹{item.price}</span>
                    </div>
                    {item.description && <p style={{fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem"}}>{item.description}</p>}
                    
                    <div style={{display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "end"}}>
                        <div className="form-group" style={{width: "100px", marginBottom: 0}}>
                            <label style={{fontSize: "0.8rem"}}>Quantity</label>
                            <input 
                               type="number" 
                               min="0"
                               max={item.maxPerParticipant || 5}
                               value={(merchSelection[item._id]?.quantity) || 0}
                               onChange={(e) => updateMerchSelection(item._id, 'quantity', e.target.value)}
                               style={{padding: "0.5rem"}}
                            />
                        </div>
                        
                        {item.size && item.size.length > 0 && (
                            <div className="form-group" style={{flex: 1, minWidth: "120px", marginBottom: 0}}>
                                <label style={{fontSize: "0.8rem"}}>Size</label>
                                <select 
                                   value={(merchSelection[item._id]?.size) || ""}
                                   onChange={(e) => updateMerchSelection(item._id, 'size', e.target.value)}
                                   disabled={!(merchSelection[item._id]?.quantity > 0)}
                                   required={merchSelection[item._id]?.quantity > 0}
                                   style={{padding: "0.5rem"}}
                                >
                                   <option value="">Select Size</option>
                                   {item.size.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}

                        {item.color && item.color.length > 0 && (
                            <div className="form-group" style={{flex: 1, minWidth: "120px", marginBottom: 0}}>
                                <label style={{fontSize: "0.8rem"}}>Color</label>
                                <select 
                                   value={(merchSelection[item._id]?.color) || ""}
                                   onChange={(e) => updateMerchSelection(item._id, 'color', e.target.value)}
                                   disabled={!(merchSelection[item._id]?.quantity > 0)}
                                   required={merchSelection[item._id]?.quantity > 0}
                                   style={{padding: "0.5rem"}}
                                >
                                   <option value="">Select Color</option>
                                   {item.color.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
              ))}

              {/* Total Summary */}
              {event.eventType === 'Merchandise' && (
                  <div style={{textAlign: "right", marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "bold"}}>
                      Total Amount: ₹{totalAmountToPay}
                  </div>
              )}

              {totalAmountToPay > 0 && (
                <div style={{marginBottom: "2rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--warning)"}}>
                  <p style={{fontWeight: "bold", marginBottom: "0.5rem"}}>
                      Total Payment Required: ₹{totalAmountToPay}
                  </p>
                  <div className="form-group">
                    <label>Upload Payment Proof (Screenshot) *</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setPaymentProof(e.target.files[0])}
                      required
                    />
                    <small style={{color: "var(--text-secondary)"}}>Please upload a screenshot of your payment.</small>
                  </div>
                </div>
              )}

              {event.customRegistrationForm?.fields?.map((field, index) => (
                <div key={index} className="form-group">
                  <label>{field.label} {field.required && '*'}</label>
                  
                  {field.fieldType === 'textarea' && (
                    <textarea
                      required={field.required}
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      style={{minHeight: "100px"}}
                    />
                  )}

                  {field.fieldType === 'select' && (
                    <select
                      required={field.required}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Select an option</option>
                      {field.options && field.options.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {(field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'number' || field.fieldType === 'date' || field.fieldType === 'tel' || field.fieldType === 'url') && (
                    <input
                      type={field.fieldType}
                      required={field.required}
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                    />
                  )}
                  
                  {field.fieldType === 'file' && (
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <input
                          type="file"
                          required={field.required}
                          onChange={(e) => handleInputChange(field.fieldName, e.target.files[0])}
                        />
                        <small style={{color: 'var(--text-muted)'}}>Upload a document.</small>
                    </div>
                  )}

                  {field.fieldType === 'checkbox' && (
                     field.options && field.options.length > 0 ? (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px'}}>
                           {field.options.map((opt, i) => (
                              <label key={i} style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal'}}>
                                <input 
                                  type="checkbox" 
                                  value={opt}
                                  onChange={(e) => {
                                      const currentVal = formResponses[field.fieldName] || [];
                                      let newVal;
                                      if (e.target.checked) {
                                          newVal = [...currentVal, opt];
                                      } else {
                                          newVal = currentVal.filter(v => v !== opt);
                                      }
                                      handleInputChange(field.fieldName, newVal);
                                  }}
                                  style={{width: 'auto', margin: 0}}
                                />
                                {opt}
                              </label>
                           ))}
                        </div>
                     ) : (
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <input
                              type="checkbox"
                              required={field.required}
                              onChange={(e) => handleInputChange(field.fieldName, e.target.checked)}
                              style={{width: '20px', height: '20px', margin: 0}}
                            />
                            <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Yes, {field.label}</span>
                        </div>
                     )
                  )}
                </div>
              ))}
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={registering}>
                  {registering ? "Submitting..." : (event.isTeamEvent ? "Create Team & Register" : "Confirm Registration")}
                </button>
              </div>
            </form>
            )}

            {event.isTeamEvent && teamMode === "join" && (
              <div className="modal-actions">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="button" onClick={handleJoinTeam} className="btn btn-primary" disabled={registering}>
                     {registering ? "Joining..." : "Join Team"}
                  </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
