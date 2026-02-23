import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./TeamChat.css";

// Use environment variable for socket URL
const SOCKET_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000';

const TeamChat = () => {
    const { teamId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    // Initialize Socket and fetch history
    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        // Fetch History
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/chat/${teamId}`);
                if (res.messages) {
                    setMessages(res.messages);
                }
            } catch (err) {
                console.error("Failed to load chat history", err);
                if (err.response && err.response.status === 403) {
                    alert("You are not a member of this team.");
                    navigate("/participant/dashboard");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        // Join Room
        if (user && user._id) {
            newSocket.emit("join_team", { teamId, userId: user._id });
        }

        // Listeners
        newSocket.on("receive_message", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        newSocket.on("user_typing", ({ userId, userName }) => {
            if (userId !== user._id) {
                setTypingUsers((prev) => {
                    const existing = prev.find(u => u.userId === userId);
                    if (!existing) {
                        return [...prev, { userId, userName }];
                    }
                    return prev;
                });
            }
        });

        newSocket.on("user_stop_typing", ({ userId }) => {
            setTypingUsers((prev) => prev.filter(u => u.userId !== userId));
        });

        return () => {
            newSocket.disconnect();
        };
    }, [teamId, user, navigate]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        // Don't send empty message unless there is a file
        if (!newMessage.trim() && !file) return;
        if (!socket) return;

        let fileUrl = null;
        let fileName = null;
        let type = "text";

        if (file) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("teamId", teamId);
            
            try {
                const res = await api.post("/chat/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                if (res.success) {
                    fileUrl = res.fileUrl;
                    fileName = res.fileName;
                    type = file.type.startsWith("image/") ? "image" : "file";
                }
            } catch (err) {
                console.error("File upload failed", err);
                alert("Failed to upload file");
                return;
            }
        }

        const messageData = {
            teamId,
            sender: user._id,
            content: newMessage,
            type,
            fileUrl,
            fileName
        };

        socket.emit("send_message", messageData);
        
        // Stop typing immediately after send
        socket.emit("stop_typing", { teamId, userId: user._id });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        setNewMessage("");
        setFile(null);
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        
        if (!socket) return;
        socket.emit("typing", { teamId, userId: user._id, userName: user.firstName });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop_typing", { teamId, userId: user._id });
        }, 2000);
    };

    if (loading) return <div className="loading">Loading chat...</div>;

    return (
        <div className="chat-container" style={{maxWidth: '800px', margin: '20px auto', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white'}}>
            <div className="chat-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
                <h3 style={{margin: 0}}>Team Chat</h3>
                <button 
                    onClick={() => navigate("/participant/my-events")} 
                    style={{
                        padding: '5px 10px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Back
                </button>
            </div>

            <div className="chat-messages" style={{height: '400px', overflowY: 'auto', marginBottom: '20px', padding: '10px', border: '1px solid #f0f0f0', borderRadius: '4px'}}>
                {messages.map((msg, idx) => {
                    const senderId = msg.sender._id || msg.sender;
                    const isMe = senderId === user._id;
                    const senderName = msg.sender.firstName ? `${msg.sender.firstName} ${msg.sender.lastName}` : "Member";
                    
                    return (
                        <div key={idx} className={`message ${isMe ? "me" : "other"}`} style={{
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                            marginBottom: '15px'
                        }}>
                            {!isMe && <div className="message-sender" style={{ fontSize: '0.8em', color: '#666', marginBottom: '2px' }}>
                                {senderName}
                            </div>}
                            
                            <div className="message-bubble" style={{ 
                                background: isMe ? '#2196F3' : '#f5f5f5',
                                color: isMe ? 'white' : 'black',
                                padding: '10px',
                                borderRadius: '10px',
                                maxWidth: '70%',
                                wordWrap: 'break-word'
                            }}>
                                {msg.type === 'image' && (
                                    <div className="message-image" style={{marginBottom: '5px'}}>
                                        <img src={`${SOCKET_URL}/${msg.fileUrl}`} alt="shared" style={{maxWidth: '100%', borderRadius: '5px'}} />
                                    </div>
                                )}
                                
                                {msg.type === 'file' && (
                                    <div className="message-file" style={{marginBottom: '5px'}}>
                                         <a href={`${SOCKET_URL}/${msg.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{display: 'flex', alignItems: 'center', textDecoration: 'none', color: isMe ? 'white' : '#333'}}>
                                            <span style={{fontSize: '24px', marginRight: '5px'}}>📄</span>
                                            <span style={{textDecoration: 'underline'}}>{msg.fileName || "Download File"}</span>
                                         </a>
                                    </div>
                                )}

                                {msg.content && <p style={{margin: 0}}>{msg.content}</p>}
                            </div>
                            <div className="message-time" style={{ fontSize: '0.7em', color: '#999', marginTop: '2px' }}>
                                {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {typingUsers.length > 0 && (
                <div className="typing-indicator" style={{ padding: '0 10px 10px', fontStyle: 'italic', color: '#888', fontSize: '0.9em' }}>
                    {typingUsers.map(u => u.userName).join(", ")} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
            )}

            <form onSubmit={handleSendMessage} className="chat-input-area" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <label htmlFor="chat-file" style={{cursor: 'pointer', fontSize: '1.5em', padding: '0 10px'}}>
                    📎
                </label>
                <input 
                    type="file" 
                    id="chat-file"
                    style={{display: 'none'}}
                    onChange={(e) => setFile(e.target.files[0])}
                />
                
                <div style={{flex: 1}}>
                     {file && (
                         <div style={{
                             background: '#eee', 
                             padding: '5px', 
                             borderRadius: '4px',
                             fontSize: '0.8em',
                             marginBottom: '5px',
                             display: 'flex',
                             justifyContent: 'space-between',
                             alignItems: 'center'
                         }}>
                             <span>File: {file.name}</span>
                             <button type="button" onClick={() => setFile(null)} style={{marginLeft: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'red', fontWeight: 'bold'}}>x</button>
                         </div>
                     )}
                    <input 
                        type="text" 
                        placeholder="Type a message..." 
                        value={newMessage}
                        onChange={handleTyping}
                        style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd'}}
                    />
                </div>

                <button type="submit" style={{
                    padding: '10px 20px', 
                    borderRadius: '4px', 
                    border: 'none', 
                    background: '#2196F3', 
                    color: 'white', 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}>Send</button>
            </form>
        </div>
    );
};

export default TeamChat;
