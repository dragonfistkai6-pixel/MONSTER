const express = require('express');
const { authenticateToken, users } = require('./auth');
const blockchainService = require('../services/blockchainService');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

// Get dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const batches = await blockchainService.getAllBatches();
    
    let totalEvents = 0;
    let totalParticipants = new Set();
    let eventsByType = {
      collection: 0,
      quality_test: 0,
      processing: 0,
      manufacturing: 0
    };

    // Calculate statistics
    for (const batch of batches) {
      const events = await blockchainService.getBatchEvents(batch.batchId);
      totalEvents += events.length;

      events.forEach(event => {
        totalParticipants.add(event.participant);
        
        switch (event.eventType) {
          case 0: eventsByType.collection++; break;
          case 1: eventsByType.quality_test++; break;
          case 2: eventsByType.processing++; break;
          case 3: eventsByType.manufacturing++; break;
        }
      });
    }

    // User statistics
    const usersByRole = {
      collectors: 0,
      testers: 0,
      processors: 0,
      manufacturers: 0,
      admins: 0
    };

    for (const [address, user] of users.entries()) {
      switch (user.role) {
        case ROLES.COLLECTOR: usersByRole.collectors++; break;
        case ROLES.TESTER: usersByRole.testers++; break;
        case ROLES.PROCESSOR: usersByRole.processors++; break;
        case ROLES.MANUFACTURER: usersByRole.manufacturers++; break;
        case ROLES.ADMIN: usersByRole.admins++; break;
      }
    }

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalBatches: batches.length,
          totalEvents,
          totalParticipants: totalParticipants.size,
          activeBatches: batches.filter(batch => {
            const daysSinceCreation = (Date.now() - (batch.creationTime * 1000)) / (1000 * 60 * 60 * 24);
            return daysSinceCreation <= 30; // Active in last 30 days
          }).length
        },
        events: eventsByType,
        users: usersByRole,
        recentActivity: batches
          .sort((a, b) => b.creationTime - a.creationTime)
          .slice(0, 5)
          .map(batch => ({
            batchId: batch.batchId,
            herbSpecies: batch.herbSpecies,
            creationTime: batch.creationTime,
            eventCount: batch.eventCount
          }))
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      details: error.message
    });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userList = [];
    
    for (const [address, user] of users.entries()) {
      const blockchainUserInfo = await blockchainService.getUserInfo(address);
      
      userList.push({
        address,
        name: user.name,
        organization: user.organization,
        role: user.role,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt,
        isActive: user.isActive,
        blockchain: blockchainUserInfo
      });
    }

    res.json({
      success: true,
      users: userList
    });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
      details: error.message
    });
  }
});

// Approve harvesting zone for collector
router.post('/approve-zone', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { collectorAddress, zone } = req.body;

    if (!collectorAddress || !zone) {
      return res.status(400).json({
        success: false,
        error: 'Collector address and zone are required'
      });
    }

    const result = await blockchainService.approveZoneForCollector(collectorAddress, zone);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to approve zone',
        details: result.error
      });
    }

    res.json({
      success: true,
      message: 'Zone approved successfully',
      transactionHash: result.transactionHash
    });
  } catch (error) {
    console.error('Zone approval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve zone',
      details: error.message
    });
  }
});

// Get batch analytics
router.get('/analytics/:batchId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const events = await blockchainService.getBatchEvents(batchId);
    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }

    // Build detailed analytics
    const analytics = {
      batchId,
      timeline: events.map(event => ({
        eventId: event.eventId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        participant: event.participant
      })).sort((a, b) => a.timestamp - b.timestamp),
      
      participantFlow: {},
      branchingAnalysis: {},
      timeAnalysis: {
        totalDuration: 0,
        averageStepTime: 0,
        bottlenecks: []
      }
    };

    // Calculate time analysis
    if (events.length > 1) {
      const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
      analytics.timeAnalysis.totalDuration = sortedEvents[sortedEvents.length - 1].timestamp - sortedEvents[0].timestamp;
      analytics.timeAnalysis.averageStepTime = analytics.timeAnalysis.totalDuration / (events.length - 1);
    }

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch analytics',
      details: error.message
    });
  }
});

module.exports = router;