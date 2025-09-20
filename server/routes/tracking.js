const express = require('express');
const fabricService = require('../services/fabricService');
const ipfsService = require('../services/ipfsService');
const { users } = require('./auth');

const router = express.Router();

// Get batch provenance by event ID
router.get('/batch/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }

    // Get all batches to find the one containing this event
    const batchesResult = await fabricService.getAllBatches();
    if (!batchesResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get batches from Fabric network'
      });
    }
    
    const batches = batchesResult.data;
    let targetBatch = null;

    for (const batch of batches) {
      const eventsResult = await fabricService.getBatchEvents(batch.Record.batchId);
      if (eventsResult.success && eventsResult.data.find(event => event.eventId === eventId)) {
        targetBatch = batch.Record;
        break;
      }
    }

    if (!targetBatch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found for this event ID'
      });
    }

    // Get all events for the batch
    const eventsResult = await fabricService.getBatchEvents(targetBatch.batchId);
    if (!eventsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get batch events from Fabric network'
      });
    }
    
    const batchEvents = eventsResult.data;
    
    // Enhance events with IPFS metadata and user information
    const enhancedEvents = await Promise.all(
      batchEvents.map(async (event) => {
        const metadata = await ipfsService.getFile(event.ipfsHash);
        
        // Get participant information from users map
        let participantInfo = null;
        for (const [address, user] of users.entries()) {
          if (address.toLowerCase() === event.participant.toLowerCase()) {
            participantInfo = {
              name: user.name,
              organization: user.organization,
              role: user.role
            };
            break;
          }
        }

        return {
          ...event,
          metadata: metadata.success ? metadata.data : null,
          participant: {
            address: event.participant,
            info: participantInfo
          }
        };
      })
    );

    // Build provenance tree
    const provenanceTree = buildProvenanceTree(enhancedEvents);

    res.json({
      success: true,
      batch: {
        ...targetBatch,
        events: enhancedEvents,
        provenanceTree
      }
    });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch tracking information',
      details: error.message
    });
  }
});

// Get provenance path from collection to specific event
router.get('/path/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get all batches to find the target event
    const batchesResult = await fabricService.getAllBatches();
    if (!batchesResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get batches from Fabric network'
      });
    }
    
    const batches = batchesResult.data;
    let targetBatch = null;
    let targetEvent = null;

    for (const batch of batches) {
      const eventsResult = await fabricService.getBatchEvents(batch.Record.batchId);
      if (!eventsResult.success) continue;
      
      const foundEvent = eventsResult.data.find(event => event.eventId === eventId);
      if (foundEvent) {
        targetBatch = batch.Record;
        targetEvent = foundEvent;
        break;
      }
    }

    if (!targetBatch || !targetEvent) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Get all events for the batch
    const eventsResult = await fabricService.getBatchEvents(targetBatch.batchId);
    if (!eventsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get batch events from Fabric network'
      });
    }
    
    const allEvents = eventsResult.data;
    
    // Find the path from collection to target event
    const path = findEventPath(allEvents, eventId);
    
    // Enhance path events with metadata
    const enhancedPath = await Promise.all(
      path.map(async (event) => {
        const metadata = await ipfsService.getFile(event.ipfsHash);
        
        // Get participant information
        let participantInfo = null;
        for (const [address, user] of users.entries()) {
          if (address.toLowerCase() === event.participant.toLowerCase()) {
            participantInfo = {
              name: user.name,
              organization: user.organization,
              role: user.role
            };
            break;
          }
        }

        return {
          ...event,
          metadata: metadata.success ? metadata.data : null,
          participant: {
            address: event.participant,
            info: participantInfo
          }
        };
      })
    );

    res.json({
      success: true,
      batch: targetBatch,
      targetEvent: {
        ...targetEvent,
        metadata: enhancedPath[enhancedPath.length - 1]?.metadata
      },
      path: enhancedPath
    });
  } catch (error) {
    console.error('Path tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event path',
      details: error.message
    });
  }
});

// Get batch statistics
router.get('/stats/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    const eventsResult = await fabricService.getBatchEvents(batchId);
    if (!eventsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get batch events from Fabric network'
      });
    }
    
    const events = eventsResult.data;
    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }

    // Calculate statistics
    const eventTypes = events.reduce((acc, event) => {
      const type = getEventTypeName(event.eventType);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const participants = [...new Set(events.map(event => event.participant))];
    const timeSpan = {
      start: Math.min(...events.map(event => event.timestamp)),
      end: Math.max(...events.map(event => event.timestamp)),
      duration: Math.max(...events.map(event => event.timestamp)) - 
                Math.min(...events.map(event => event.timestamp))
    };

    // Build branching statistics
    const branches = calculateBranches(events);

    res.json({
      success: true,
      batchId,
      statistics: {
        totalEvents: events.length,
        eventTypes,
        participants: participants.length,
        timeSpan,
        branches
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch statistics',
      details: error.message
    });
  }
});

// Get all active batches (admin endpoint)
router.get('/batches', async (req, res) => {
  try {
    const batchesResult = await fabricService.getAllBatches();
    if (!batchesResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get batches from Fabric network'
      });
    }
    
    const batches = batchesResult.data;
    // Enhance with basic event statistics
    const enhancedBatches = await Promise.all(
      batches.map(async (batch) => {
        const eventsResult = await fabricService.getBatchEvents(batch.Record.batchId);
        const events = eventsResult.success ? eventsResult.data : [];
        
        return {
          ...batch.Record,
          eventCount: events.length,
          lastUpdated: events.length > 0 ? Math.max(...events.map(event => new Date(event.timestamp).getTime())) : 0,
          participants: [...new Set(events.map(event => event.participantName || event.collectorName || event.testerName || event.processorName || event.manufacturerName))].length
        };
      })
    );

    res.json({
      success: true,
      batches: enhancedBatches
    });
  } catch (error) {
    console.error('Batches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batches',
      details: error.message
    });
  }
});

// Helper function to build provenance tree structure
function buildProvenanceTree(events) {
  const eventMap = new Map(events.map(event => [event.eventId, event]));
  const roots = [];
  const children = new Map();

  // Initialize children map
  events.forEach(event => {
    children.set(event.eventId, []);
  });

  // Build parent-child relationships
  events.forEach(event => {
    if (event.parentEventId && event.parentEventId !== '') {
      if (children.has(event.parentEventId)) {
        children.get(event.parentEventId).push(event.eventId);
      }
    } else {
      roots.push(event.eventId);
    }
  });

  // Build tree structure
  function buildNode(eventId) {
    const event = eventMap.get(eventId);
    const childNodes = children.get(eventId).map(childId => buildNode(childId));
    
    return {
      ...event,
      children: childNodes
    };
  }

  return roots.map(rootId => buildNode(rootId));
}

// Helper function to find path from root to target event
function findEventPath(events, targetEventId) {
  const eventMap = new Map(events.map(event => [event.eventId, event]));
  const path = [];
  
  let currentEventId = targetEventId;
  
  while (currentEventId) {
    const event = eventMap.get(currentEventId);
    if (!event) break;
    
    path.unshift(event);
    currentEventId = event.parentEventId && event.parentEventId !== '' ? 
                    event.parentEventId : null;
  }
  
  return path;
}

// Helper function to get event type name
function getEventTypeName(eventType) {
  const types = {
    0: 'Collection',
    1: 'Quality Test',
    2: 'Processing',
    3: 'Manufacturing'
  };
  return types[eventType] || 'Unknown';
}

// Helper function to calculate branch statistics
function calculateBranches(events) {
  const parentCount = {};
  
  events.forEach(event => {
    if (event.parentEventId && event.parentEventId !== '') {
      parentCount[event.parentEventId] = (parentCount[event.parentEventId] || 0) + 1;
    }
  });

  return {
    totalBranches: Object.keys(parentCount).length,
    maxBranchingFactor: Math.max(...Object.values(parentCount), 0),
    branchingPoints: parentCount
  };
}

module.exports = router;