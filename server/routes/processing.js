const express = require('express');
const multer = require('multer');
const { authenticateToken, users } = require('./auth');
const fabricService = require('../services/fabricService');
const ipfsService = require('../services/ipfsService');
const qrService = require('../services/qrService');
const smsService = require('../services/smsService');
const { ROLES, PROCESSING_METHODS } = require('../config/constants');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Get available processing methods
router.get('/methods', (req, res) => {
  res.json({
    success: true,
    methods: PROCESSING_METHODS
  });
});

// Add processing event
router.post('/process', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== ROLES.PROCESSOR) {
      return res.status(403).json({
        success: false,
        error: 'Only processors can perform processing operations'
      });
    }

    const {
      batchId,
      parentEventId,
      method,
      temperature,
      yield: processYield,
      duration,
      notes,
      phone
    } = req.body;

    if (!batchId || !parentEventId || !method || !processYield) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const user = users.get(req.user.address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const processEventId = fabricService.generateEventId('PROCESSING');

    let imageHash = null;
    if (req.file) {
      const imageUpload = await ipfsService.uploadFile(
        req.file.buffer,
        `processing-${processEventId}.jpg`,
        req.file.mimetype
      );

      if (imageUpload.success) {
        imageHash = imageUpload.ipfsHash;
      }
    }

    // Create processing metadata
    const processData = {
      batchId,
      eventId: processEventId,
      parentEventId,
      processor: user.name,
      method,
      temperature: temperature ? parseFloat(temperature) : null,
      duration: duration || '',
      yield: parseFloat(processYield),
      processDate: new Date().toISOString().split('T')[0],
      equipment: '',
      parameters: {},
      notes: notes || '',
      images: imageHash ? [imageHash] : []
    };

    const metadataUpload = await ipfsService.createProcessingMetadata(processData);
    if (!metadataUpload.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload processing metadata to IPFS'
      });
    }

    // Generate QR code
    const qrResult = await qrService.generateProcessingQR(
      batchId,
      processEventId,
      parentEventId,
      user.name,
      method
    );

    if (!qrResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate QR code'
      });
    }

    // Add event to blockchain
    const fabricResult = await fabricService.createProcessingEvent(
      batchId,
      parentEventId,
      user.name,
      method,
      temperature ? parseFloat(temperature) : null,
      duration,
      parseFloat(processYield),
      notes,
      metadataUpload.ipfsHash,
      qrResult.qrHash
    );

    if (!fabricResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add processing event to Fabric network',
        details: fabricResult.error
      });
    }

    // Send SMS notification
    if (phone) {
      await smsService.sendProcessingNotification(phone, batchId, method, processEventId);
    }

    res.json({
      success: true,
      message: 'Processing event recorded successfully',
      data: {
        batchId,
        eventId: processEventId,
        parentEventId,
        processing: {
          method,
          temperature: temperature ? parseFloat(temperature) : null,
          yield: parseFloat(processYield),
          duration
        },
        ipfs: {
          metadataHash: metadataUpload.ipfsHash,
          imageHash
        },
        qr: {
          hash: qrResult.qrHash,
          dataURL: qrResult.dataURL,
          trackingUrl: qrResult.trackingUrl
        },
        fabric: fabricResult
      }
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record processing event',
      details: error.message
    });
  }
});

module.exports = router;