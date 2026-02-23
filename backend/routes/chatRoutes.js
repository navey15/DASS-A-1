const express = require('express');
const router = express.Router();
const TeamMessage = require('../models/TeamMessage');
const Registration = require('../models/Registration');
const { authenticate } = require('../middleware/auth');
const { uploadChatFile } = require('../middleware/upload'); // New chat upload middleware

// Get all messages for a team
router.get('/:teamId', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // Verify user belongs to this team
    // teamId in the message model refers to the Registration ID of the team leader (or whoever holds the team data)
    // However, our Registration model has 'team' embedded.
    // If 'teamId' is the Registration ID:
    const registration = await Registration.findById(teamId);
    
    if (!registration || !registration.isTeamRegistration) {
       return res.status(404).json({ message: 'Team not found' });
    }

    const isMember = registration.participant.toString() === req.user._id.toString() ||
                     registration.team.teamMembers.some(m => m.userId.toString() === req.user._id.toString());
                     
    if (!isMember) {
        return res.status(403).json({ message: 'Not authorized to view this team chat' });
    }

    const messages = await TeamMessage.find({ teamId })
      .populate('sender', 'firstName lastName')
      .sort({ createdAt: 1 });
      
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload file for chat
router.post('/upload', authenticate, uploadChatFile.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded or file type not supported' });
    }
    // Return relative path for frontend to use
    // Note: frontend might expect just 'uploads/chat/...'
    res.json({ 
        success: true, 
        fileUrl: req.file.path, 
        fileName: req.file.originalname 
    });
});

module.exports = router;
