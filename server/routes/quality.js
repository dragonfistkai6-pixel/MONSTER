const express = require('express');
const multer = require('multer');
const { authenticateToken, users } = require('./auth');
const fabricService = require('../services/fabricService');
const ipfsService = require('../services/ipfsService');
const qrService = require('../services/qrService');
const smsService = require('../services/smsService');
const { ROLES } = require('../config/constants');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Add quality test event
router.post('/test', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== ROLES.TESTER) {
      return res.status(403).json({
        success: false,
        error: 'Only testers can perform quality tests'
      });
    }

    const {
      batchId,
      parentEventId,
      moistureContent,
      purity,
      pesticideLevel,
      testMethod,
      notes,
      phone
    } = req.body;

    if (!batchId || !parentEventId || !moistureContent || !purity || !pesticideLevel) {
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

    const testEventId = fabricService.generateEventId('QUALITY_TEST');

    let imageHash = null;
    if (req.file) {
      const imageUpload = await ipfsService.uploadFile(
        req.file.buffer,
        `quality-test-${testEventId}.jpg`,
        req.file.mimetype
      );

      if (imageUpload.success) {
        imageHash = imageUpload.ipfsHash;
      }
    }

    // Create test metadata
    const testData = {
      batchId,
      eventId: testEventId,
      parentEventId,
      tester: user.name,
      moistureContent: parseFloat(moistureContent),
      purity: parseFloat(purity),
      pesticideLevel: parseFloat(pesticideLevel),
      testMethod: testMethod || 'Standard Laboratory Test',
      testDate: new Date().toISOString().split('T')[0],
      notes: notes || '',
      images: imageHash ? [imageHash] : []
    };

    const metadataUpload = await ipfsService.createQualityTestMetadata(testData);
    if (!metadataUpload.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload test metadata to IPFS'
      });
    }

    // Generate QR code
    const qrResult = await qrService.generateQualityTestQR(
      batchId,
      testEventId,
      parentEventId,
      user.name
    );

    if (!qrResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate QR code'
      });
    }

    // Add event to blockchain
    const fabricResult = await fabricService.createQualityTestEvent(
      batchId,
      parentEventId,
      user.name,
      parseFloat(moistureContent),
      parseFloat(purity),
      parseFloat(pesticideLevel),
      testMethod,
      notes,
      metadataUpload.ipfsHash,
      qrResult.qrHash
    );

    if (!fabricResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add quality test to Fabric network',
        details: fabricResult.error
      });
    }

    // Send SMS notification
    if (phone) {
      const status = (purity >= 95 && pesticideLevel <= 0.01) ? 'PASSED' : 'REQUIRES_ATTENTION';
      await smsService.sendQualityTestNotification(phone, batchId, status, testEventId);
    }

    res.json({
      success: true,
      message: 'Quality test recorded successfully',
      data: {
        batchId,
        eventId: testEventId,
        parentEventId,
        testResults: {
          moistureContent: parseFloat(moistureContent),
          purity: parseFloat(purity),
          pesticideLevel: parseFloat(pesticideLevel)
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
    console.error('Quality test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record quality test',
      details: error.message
    });
  }
});

module.exports = router;