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

// Add manufacturing event
router.post('/manufacture', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== ROLES.MANUFACTURER) {
      return res.status(403).json({
        success: false,
        error: 'Only manufacturers can perform manufacturing operations'
      });
    }

    const {
      batchId,
      parentEventId,
      productName,
      productType,
      quantity,
      unit,
      expiryDate,
      notes,
      phone
    } = req.body;

    if (!batchId || !parentEventId || !productName || !quantity) {
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

    const mfgEventId = fabricService.generateEventId('MANUFACTURING');

    let imageHash = null;
    if (req.file) {
      const imageUpload = await ipfsService.uploadFile(
        req.file.buffer,
        `manufacturing-${mfgEventId}.jpg`,
        req.file.mimetype
      );

      if (imageUpload.success) {
        imageHash = imageUpload.ipfsHash;
      }
    }

    // Create manufacturing metadata
    const mfgData = {
      batchId,
      eventId: mfgEventId,
      parentEventId,
      manufacturer: user.name,
      productName,
      productType: productType || 'Herbal Product',
      productForm: 'Various',
      quantity: parseFloat(quantity),
      unit: unit || 'units',
      batchSize: parseFloat(quantity),
      expiryDate: expiryDate || '',
      packaging: {
        material: 'Food Grade',
        size: 'Standard',
        labels: []
      },
      qualityTests: [],
      certifications: [],
      standards: [],
      manufacturingDate: new Date().toISOString().split('T')[0],
      notes: notes || '',
      images: imageHash ? [imageHash] : []
    };

    const metadataUpload = await ipfsService.createManufacturingMetadata(mfgData);
    if (!metadataUpload.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload manufacturing metadata to IPFS'
      });
    }

    // Generate QR code
    const qrResult = await qrService.generateManufacturingQR(
      batchId,
      mfgEventId,
      parentEventId,
      user.name,
      productName
    );

    if (!qrResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate QR code'
      });
    }

    // Add event to blockchain
    const fabricResult = await fabricService.createManufacturingEvent(
      batchId,
      parentEventId,
      user.name,
      productName,
      productType || 'Herbal Product',
      parseFloat(quantity),
      unit || 'units',
      expiryDate || '',
      notes || '',
      metadataUpload.ipfsHash,
      qrResult.qrHash
    );

    if (!fabricResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add manufacturing event to Fabric network',
        details: fabricResult.error
      });
    }

    // Send SMS notification
    if (phone) {
      await smsService.sendManufacturingNotification(phone, batchId, productName, mfgEventId);
    }

    res.json({
      success: true,
      message: 'Manufacturing event recorded successfully',
      data: {
        batchId,
        eventId: mfgEventId,
        parentEventId,
        product: {
          name: productName,
          type: productType || 'Herbal Product',
          quantity: parseFloat(quantity),
          unit: unit || 'units',
          expiryDate
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
    console.error('Manufacturing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record manufacturing event',
      details: error.message
    });
  }
});

module.exports = router;