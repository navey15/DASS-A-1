import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { organizerService } from "../../services";
import { CheckCircle, ExternalLink, ArrowLeft } from "lucide-react";

const PaymentApprovals = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await organizerService.getEventRegistrations(id, { status: 'Pending' });
      if (response.success) {
        // Filter only those with payment pending
        const pendingPayments = response.data.registrations.filter(
            r => r.payment && r.payment.status === 'Pending' && r.payment.proofImage
        );
        setRegistrations(pendingPayments);
      } else {
        setError("Failed to load registrations");
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateStatus = async (regId, status) => {
    try {
      setActionLoading(regId);
      setMessage("");
      const response = await organizerService.updatePaymentStatus(regId, status);
      
      if (response.success) {
        setMessage(`Payment ${status.includes("Approved") ? "Approved" : "Rejected"} successfully`);
        // Refresh list
        const updatedList = registrations.filter(r => r._id !== regId);
        setRegistrations(updatedList);
      } else {
        setError(response.message || "Failed to update status");
      }
    } catch (err) {
      setError(err.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px"}}>
        <ArrowLeft size={16} /> Back to Event
      </button>

      <h1>Payment Approvals</h1>
      <p style={{color: "var(--text-secondary)"}}>Review and approve payment proofs for registrations.</p>
      
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {registrations.length === 0 ? (
        <div className="surface" style={{padding: "2rem", textAlign: "center", color: "var(--text-muted)"}}>
           <CheckCircle size={48} style={{marginBottom: "1rem", opacity: 0.5}} />
           <p>No pending payment approvals found.</p>
        </div>
      ) : (
        <div className="grid" style={{gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem"}}>
           {registrations.map(reg => (
             <div key={reg._id} className="surface" style={{padding: "1.5rem"}}>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: "1rem"}}>
                   <span className="status-badge pending">Pending Approval</span>
                   <span style={{fontWeight: "bold"}}>₹{reg.payment?.amount}</span>
                </div>
                
                <h3 style={{fontSize: "1.1rem", marginBottom: "0.5rem"}}>
                   {reg.participant.firstName} {reg.participant.lastName}
                </h3>
                <p style={{fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem"}}>
                   {reg.participant.email}
                </p>

                {reg.payment?.proofImage ? (
                   <div style={{marginBottom: "1rem"}}>
                      <p style={{fontSize: "0.8rem", fontWeight: "bold", marginBottom: "0.5rem"}}>Payment Proof:</p>
                      <a 
                        href={`http://localhost:5000/${reg.payment.proofImage}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{display: "inline-flex", alignItems: "center", gap: "5px", width: "100%", justifyContent: "center"}}
                      >
                        <ExternalLink size={14} /> View Proof Image
                      </a>
                   </div>
                ) : (
                   <div style={{padding: "1rem", background: "#f5f5f5", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.85rem"}}>
                      No proof uploaded
                   </div>
                )}

                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px"}}>
                   <button 
                     className="btn btn-danger"
                     onClick={() => handleUpdateStatus(reg._id, 'Rejected')}
                     disabled={actionLoading === reg._id}
                   >
                     Reject
                   </button>
                   <button 
                     className="btn btn-success"
                     onClick={() => handleUpdateStatus(reg._id, 'Approved')}
                     disabled={actionLoading === reg._id}
                   >
                     {actionLoading === reg._id ? "Processing..." : "Approve"}
                   </button>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default PaymentApprovals;
