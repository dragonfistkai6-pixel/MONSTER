const express = require('express');
const multer = require('multer');
const { authenticateToken, users } = require('./auth');
const fabricService = require('../services/fabricService');
const ipfsService = require('../services/ipfsService');
const qrService = require('../services/qrService');
const geolocationService = require('../services/geolocationService');
const smsService = require('../services/smsService');
const { AYURVEDIC_HERBS, ROLES } = require('../config/constants');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get available herb species
router.get('/herbs', (req, res) => {
  res.json({
    success: true,
    herbs: AYURVEDIC_HERBS
  });
});

// Get approved harvesting zones
router.get('/zones', (req, res) => {
  res.json({
    success: true,
    zones: geolocationService.getApprovedZones()
  });
});

// Create new collection batch
router.post('/create', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    // Verify user role
    if (req.user.role !== ROLES.COLLECTOR) {
      return res.status(403).json({
        success: false,
        error: 'Only collectors can create batches'
      });
    }

    const {
      herbSpecies,
      weight,
      harvestDate,
      latitude,
      longitude,
      zone,
      qualityGrade,
      notes,
      phone
    } = req.body;

    // Validate required fields
    if (!herbSpecies || !weight || !latitude || !longitude || !zone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate coordinates
    const coordinateValidation = geolocationService.validateCoordinates(latitude, longitude);
    if (!coordinateValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: coordinateValidation.error
      });
    }

    // Validate harvesting zone
    const zoneValidation = geolocationService.validateHarvestingZone(latitude, longitude, zone);
    if (!zoneValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Collection not allowed in this zone. ${zoneValidation.error}`,
        distance: zoneValidation.distance
      });
    }

    // Get user data
    const user = users.get(req.user.address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate batch and event IDs
    const batchId = fabricService.generateBatchId();
    const collectionEventId = fabricService.generateEventId('COLLECTION');

    let imageHash = null;
    if (req.file) {
      // Upload image to IPFS
      const imageUpload = await ipfsService.uploadFile(
        req.file.buffer,
        `collection-${collectionEventId}.jpg`,
        req.file.mimetype
      );

      if (!imageUpload.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image to IPFS',
          details: imageUpload.error
        });
      }

      imageHash = imageUpload.ipfsHash;
    }

    // Create collection metadata
    const collectionData = {
      batchId,
      herbSpecies,
      collector: user.name,
      weight: parseFloat(weight),
      harvestDate: harvestDate || new Date().toISOString().split('T')[0],
      location: {
        latitude,
        longitude,
        zone,
        address: await geolocationService.reverseGeocode(latitude, longitude)
      },
      qualityGrade: qualityGrade || '',
      notes: notes || '',
      images: imageHash ? [imageHash] : []
    };

    // Upload metadata to IPFS
    const metadataUpload = await ipfsService.createCollectionMetadata(collectionData);
    if (!metadataUpload.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload metadata to IPFS',
        details: metadataUpload.error
      });
    }

    // Generate QR code
    const qrResult = await qrService.generateCollectionQR(
      batchId,
      collectionEventId,
      herbSpecies,
      user.name
    );

    if (!qrResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate QR code',
        details: qrResult.error
      });
    }

    // Create batch on blockchain
    const fabricResult = await fabricService.createCollectionEvent(
      batchId,
      herbSpecies,
      user.name,
      parseFloat(weight),
      harvestDate || new Date().toISOString().split('T')[0],
      { latitude, longitude, zone },
      qualityGrade || '',
      notes || '',
      metadataUpload.ipfsHash,
      qrResult.qrHash
    );

    if (!fabricResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create batch on Fabric network',
        details: fabricResult.error
      });
    }

    // Send SMS confirmation if phone number provided
    if (phone) {
      await smsService.sendCollectionConfirmation(phone, batchId, collectionEventId);
    }

    res.json({
      success: true,
      message: 'Collection batch created successfully',
      data: {
        batchId,
        eventId: collectionEventId,
        herbSpecies,
        weight: parseFloat(weight),
        location: zoneValidation,
        ipfs: {
          metadataHash: metadataUpload.ipfsHash,
          metadataUrl: metadataUpload.pinataUrl,
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
    console.error('Collection creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create collection batch',
      details: error.message
    });
  }
});

// Handle SMS collection (fallback for offline scenarios)
router.post('/sms-collect', async (req, res) => {
  try {
    const { phoneNumber, smsText } = req.body;

    if (!phoneNumber || !smsText) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and SMS text are required'
      });
    }

    // Parse SMS command
    const parsedSMS = smsService.parseSMSCommand(smsText, phoneNumber);
    if (!parsedSMS.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SMS format',
        details: parsedSMS.error
      });
    }

    const smsData = parsedSMS.data;
    
    if (smsData.type !== 'collection') {
      return res.status(400).json({
        success: false,
        error: 'Invalid SMS type for collection endpoint'
      });
    }

    // For SMS collections, we need to handle without user authentication
    // This would require a separate SMS user registry or pre-registered phone numbers
    
    // Generate batch and event IDs
    const batchId = fabricService.generateBatchId();
    const collectionEventId = fabricService.generateEventId('COLLECTION');

    // Create basic collection metadata (no image for SMS)
    const collectionData = {
      batchId,
      herbSpecies: smsData.herbSpecies,
      collector: phoneNumber, // Use phone as identifier
      weight: smsData.weight,
      harvestDate: new Date().toISOString().split('T')[0],
      location: {
        latitude: '0', // SMS doesn't provide GPS
        longitude: '0',
        zone: smsData.zone,
        address: 'Via SMS'
      },
      qualityGrade: '',
      notes: 'Created via SMS',
      images: []
    };

    // Upload metadata to IPFS
    const metadataUpload = await ipfsService.createCollectionMetadata(collectionData);
    if (!metadataUpload.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload metadata to IPFS'
      });
    }

    // Generate QR code
    const qrResult = await qrService.generateCollectionQR(
      batchId,
      collectionEventId,
      smsData.herbSpecies,
      phoneNumber
    );

    if (!qrResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate QR code'
      });
    }

    // Send confirmation SMS with QR code
    await smsService.sendCollectionConfirmation(phoneNumber, batchId, collectionEventId);

    res.json({
      success: true,
      message: 'SMS collection processed successfully',
      data: {
        batchId,
        eventId: collectionEventId,
        herbSpecies: smsData.herbSpecies,
        phone: phoneNumber,
        qrCode: collectionEventId
      }
    });
  } catch (error) {
    console.error('SMS collection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process SMS collection',
      details: error.message
    });
  }
});

// Get current location (helper endpoint for frontend)
router.post('/location/reverse-geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const address = await geolocationService.reverseGeocode(latitude, longitude);
    
    res.json({
      success: true,
      address
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get address',
      details: error.message
    });
  }
});

// Validate harvesting zone
router.post('/location/validate-zone', async (req, res) => {
  try {
    const { latitude, longitude, zone } = req.body;

    if (!latitude || !longitude || !zone) {
      return res.status(400).json({
        success: false,
        error: 'Latitude, longitude, and zone are required'
      });
    }

    const validation = geolocationService.validateHarvestingZone(latitude, longitude, zone);
    
    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('Zone validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate zone',
      details: error.message
    });
  }
});

module.exports = router;