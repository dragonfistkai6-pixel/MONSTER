const express = require('express');
const { authenticateToken, users } = require('./auth');
const fabricService = require('../services/fabricService');

const router = express.Router();

// Initialize Fabric service
router.post('/initialize', async (req, res) => {
  try {
    const result = await fabricService.connect();
    res.json({
      success: true,
      message: 'Fabric service connected successfully',
      result
    });
  } catch (error) {
    console.error('Fabric initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize Fabric service',
      details: error.message
    });
  }
});

// Create batch
router.post('/create-batch', authenticateToken, async (req, res) => {
  try {
    const { userAddress, batchData } = req.body;
    
    if (!userAddress || !batchData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get user role from our user system
    const user = users.get(req.user.address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const result = await fabricService.createCollectionEvent(
      batchData.batchId,
      batchData.herbSpecies,
      user.name,
      batchData.weight || 0,
      batchData.harvestDate || new Date().toISOString().split('T')[0],
      batchData.location || {},
      batchData.qualityGrade || '',
      batchData.notes || '',
      batchData.ipfsHash || '',
      batchData.qrCodeHash || ''
    );
    
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Batch created successfully on Fabric network' : 'Failed to create batch'
    });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create batch',
      details: error.message
    });
  }
});

// Add quality test event
router.post('/add-quality-test', authenticateToken, async (req, res) => {
  try {
    const { userAddress, eventData } = req.body;
    
    if (!userAddress || !eventData) {
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

    const result = await fabricService.createQualityTestEvent(
      eventData.batchId,
      eventData.parentEventId,
      user.name,
      eventData.moistureContent || 0,
      eventData.purity || 0,
      eventData.pesticideLevel || 0,
      eventData.testMethod || 'Standard Test',
      eventData.notes || '',
      eventData.ipfsHash || '',
      eventData.qrCodeHash || ''
    );
    
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Quality test event added successfully' : 'Failed to add quality test event'
    });
  } catch (error) {
    console.error('Add quality test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add quality test event',
      details: error.message
    });
  }
});

// Add processing event
router.post('/add-processing', authenticateToken, async (req, res) => {
  try {
    const { userAddress, eventData } = req.body;
    
    if (!userAddress || !eventData) {
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

    const result = await fabricService.createProcessingEvent(
      eventData.batchId,
      eventData.parentEventId,
      user.name,
      eventData.method || 'Standard Processing',
      eventData.temperature || null,
      eventData.duration || '',
      eventData.yield || 0,
      eventData.notes || '',
      eventData.ipfsHash || '',
      eventData.qrCodeHash || ''
    );
    
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Processing event added successfully' : 'Failed to add processing event'
    });
  } catch (error) {
    console.error('Add processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add processing event',
      details: error.message
    });
  }
});

// Add manufacturing event
router.post('/add-manufacturing', authenticateToken, async (req, res) => {
  try {
    const { userAddress, eventData } = req.body;
    
    if (!userAddress || !eventData) {
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

    const result = await fabricService.createManufacturingEvent(
      eventData.batchId,
      eventData.parentEventId,
      user.name,
      eventData.productName || 'Herbal Product',
      eventData.productType || 'Capsules',
      eventData.quantity || 0,
      eventData.unit || 'units',
      eventData.expiryDate || '',
      eventData.notes || '',
      eventData.ipfsHash || '',
      eventData.qrCodeHash || ''
    );
    
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Manufacturing event added successfully' : 'Failed to add manufacturing event'
    });
  } catch (error) {
    console.error('Add manufacturing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add manufacturing event',
      details: error.message
    });
  }
});

// Generate batch ID
router.get('/generate-batch-id', (req, res) => {
  try {
    const batchId = fabricService.generateBatchId();
    
    res.json({
      success: true,
      data: { batchId }
    });
  } catch (error) {
    console.error('Generate batch ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch ID',
      details: error.message
    });
  }
});

// Generate event ID
router.post('/generate-event-id', (req, res) => {
  try {
    const { eventType } = req.body;
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Event type is required'
      });
    }

    const eventId = fabricService.generateEventId(eventType);
    
    res.json({
      success: true,
      data: { eventId }
    });
  } catch (error) {
    console.error('Generate event ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate event ID',
      details: error.message
    });
  }
});

module.exports = router;