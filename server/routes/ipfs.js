const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('./auth');
const ipfsService = require('../services/ipfsService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ---------- Upload JSON ----------
router.post('/upload-json', authenticateToken, async (req, res) => {
  try {
    const { jsonData, name } = req.body;
    if (!jsonData) {
      return res.status(400).json({ success: false, error: 'JSON data is required' });
    }

    const result = await ipfsService.uploadJSON(jsonData, name || 'metadata');
    res.json({
      success: result.success,
      data: result,
      message: result.success
        ? '✅ JSON uploaded to IPFS successfully'
        : '❌ Failed to upload JSON to IPFS'
    });
  } catch (err) {
    console.error('Upload JSON error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- Upload File ----------
router.post('/upload-file', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File is required' });
    }

    const result = await ipfsService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: result.success,
      data: result,
      message: result.success
        ? '✅ File uploaded to IPFS successfully'
        : '❌ Failed to upload file to IPFS'
    });
  } catch (err) {
    console.error('Upload file error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- Get File ----------
router.get('/get-file/:ipfsHash', async (req, res) => {
  try {
    const { ipfsHash } = req.params;
    if (!ipfsHash) {
      return res.status(400).json({ success: false, error: 'IPFS hash is required' });
    }

    const result = await ipfsService.getFile(ipfsHash);
    res.json({
      success: result.success,
      data: result.data,
      message: result.success
        ? '✅ File retrieved from IPFS successfully'
        : '❌ Failed to retrieve file from IPFS'
    });
  } catch (err) {
    console.error('Get file error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- Metadata Generators ----------
const metadataRoutes = [
  { path: '/create-collection-metadata', key: 'collectionData', fn: 'createCollectionMetadata' },
  { path: '/create-quality-test-metadata', key: 'testData', fn: 'createQualityTestMetadata' },
  { path: '/create-processing-metadata', key: 'processData', fn: 'createProcessingMetadata' },
  { path: '/create-manufacturing-metadata', key: 'mfgData', fn: 'createManufacturingMetadata' },
];

metadataRoutes.forEach(route => {
  router.post(route.path, authenticateToken, async (req, res) => {
    try {
      const payload = req.body[route.key];
      if (!payload) {
        return res.status(400).json({ success: false, error: `${route.key} is required` });
      }

      const result = await ipfsService[route.fn](payload);
      res.json({
        success: result.success,
        data: result,
        message: result.success
          ? `✅ ${route.fn} created successfully`
          : `❌ Failed to create ${route.fn}`
      });
    } catch (err) {
      console.error(`${route.fn} error:`, err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });
});

module.exports = router;
