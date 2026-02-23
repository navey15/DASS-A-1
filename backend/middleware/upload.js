const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directories exist
const uploadDir = 'uploads/';
const paymentDir = 'uploads/payment-proofs/';
const chatDir = 'uploads/chat/';

[uploadDir, paymentDir, chatDir].forEach(dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
});


// Configure storage for payment proofs
const paymentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/payment-proofs');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for chat files
const chatStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/chat');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});


// File filter (images only) for payment proofs
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// File filter (images + documents) for chat
const chatFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
  } else {
      cb(new Error('File type not supported for chat uploads'), false);
  }
};


const uploadPaymentProof = multer({ 
  storage: paymentStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const uploadRegistrationFiles = multer({ 
  storage: paymentStorage, // Reuse same storage for now
  fileFilter: (req, file, cb) => {
      // Allow images and documents
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
          cb(null, true);
      } else {
          cb(null, false); // Just ignore invalid files instead of throwing error? Or throw error
      }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const uploadChatFile = multer({ 
  storage: chatStorage,
  fileFilter: chatFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = { 
  uploadPaymentProof,
  uploadRegistrationFiles, 
  uploadChatFile 
};
