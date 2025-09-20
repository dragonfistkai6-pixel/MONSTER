const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');

// Create batch (collection event)
router.post('/batch', async (req, res) => {
  try {
    const result = await blockchainService.createBatch(req.body.userAddress, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add quality test event
router.post('/quality', async (req, res) => {
  try {
    const result = await blockchainService.addQualityTestEvent(req.body.userAddress, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add processing event
router.post('/processing', async (req, res) => {
  try {
    const result = await blockchainService.addProcessingEvent(req.body.userAddress, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add manufacturing event
router.post('/manufacturing', async (req, res) => {
  try {
    const result = await blockchainService.addManufacturingEvent(req.body.userAddress, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all batches
router.get('/batches', async (req, res) => {
  try {
    const result = await blockchainService.getAllBatches();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get batch events
router.get('/batch/:id/events', async (req, res) => {
  try {
    const result = await blockchainService.getBatchEvents(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
