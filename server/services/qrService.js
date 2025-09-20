const QRCode = require('qrcode');
const crypto = require('crypto');

class QRService {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'https://herbionyx.netlify.app';
  }

  // Generate QR code for batch tracking
  async generateBatchQR(eventId, eventType, batchId) {
    try {
      const qrData = {
        eventId,
        eventType,
        batchId,
        trackingUrl: `${this.baseUrl}/track/${eventId}`,
        timestamp: Date.now(),
        version: '1.0'
      };

      const qrString = JSON.stringify(qrData);
      const qrHash = crypto.createHash('sha256').update(qrString).digest('hex');
      
      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#2D5A27', // Ayurvedic green
          light: '#FFFFFF'
        },
        width: 256
      });

      // Generate QR code as SVG for scalability
      const qrCodeSVG = await QRCode.toString(qrString, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#2D5A27',
          light: '#FFFFFF'
        },
        width: 256
      });

      return {
        success: true,
        qrHash,
        qrData,
        dataURL: qrCodeDataURL,
        svg: qrCodeSVG,
        trackingUrl: qrData.trackingUrl
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate collection QR code
  async generateCollectionQR(batchId, collectionEventId, herbSpecies, collectorName) {
    const qrData = {
      type: 'collection',
      batchId,
      eventId: collectionEventId,
      herbSpecies,
      collector: collectorName,
      trackingUrl: `${this.baseUrl}/track/${collectionEventId}`,
      timestamp: Date.now()
    };

    return await this.generateQRFromData(qrData, `Collection-${batchId}`);
  }

  // Generate quality test QR code
  async generateQualityTestQR(batchId, testEventId, parentEventId, testerName) {
    const qrData = {
      type: 'quality_test',
      batchId,
      eventId: testEventId,
      parentEventId,
      tester: testerName,
      trackingUrl: `${this.baseUrl}/track/${testEventId}`,
      timestamp: Date.now()
    };

    return await this.generateQRFromData(qrData, `QualityTest-${testEventId}`);
  }

  // Generate processing QR code
  async generateProcessingQR(batchId, processEventId, parentEventId, processorName, method) {
    const qrData = {
      type: 'processing',
      batchId,
      eventId: processEventId,
      parentEventId,
      processor: processorName,
      method,
      trackingUrl: `${this.baseUrl}/track/${processEventId}`,
      timestamp: Date.now()
    };

    return await this.generateQRFromData(qrData, `Processing-${processEventId}`);
  }

  // Generate manufacturing QR code
  async generateManufacturingQR(batchId, mfgEventId, parentEventId, manufacturerName, productName) {
    const qrData = {
      type: 'manufacturing',
      batchId,
      eventId: mfgEventId,
      parentEventId,
      manufacturer: manufacturerName,
      productName,
      trackingUrl: `${this.baseUrl}/track/${mfgEventId}`,
      timestamp: Date.now()
    };

    return await this.generateQRFromData(qrData, `Manufacturing-${mfgEventId}`);
  }

  // Helper method to generate QR from data object
  async generateQRFromData(qrData, filename) {
    try {
      const qrString = JSON.stringify(qrData);
      const qrHash = crypto.createHash('sha256').update(qrString).digest('hex');
      
      // Generate multiple formats
      const [dataURL, svg, buffer] = await Promise.all([
        QRCode.toDataURL(qrString, this.getQROptions()),
        QRCode.toString(qrString, { ...this.getQROptions(), type: 'svg' }),
        QRCode.toBuffer(qrString, this.getQROptions())
      ]);

      return {
        success: true,
        qrHash,
        qrData,
        dataURL,
        svg,
        buffer,
        filename: `${filename}.png`,
        trackingUrl: qrData.trackingUrl
      };
    } catch (error) {
      console.error('Error generating QR from data:', error);
      return { success: false, error: error.message };
    }
  }

  // Standard QR code options
  getQROptions() {
    return {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#2D5A27', // Ayurvedic green
        light: '#FFFFFF'
      },
      width: 300
    };
  }

  // Parse QR code data
  parseQRData(qrString) {
    try {
      const qrData = JSON.parse(qrString);
      
      // Validate required fields
      if (!qrData.eventId || !qrData.type || !qrData.batchId) {
        throw new Error('Invalid QR code format');
      }

      return {
        success: true,
        data: qrData
      };
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate QR code integrity
  validateQRHash(qrString, providedHash) {
    const calculatedHash = crypto.createHash('sha256').update(qrString).digest('hex');
    return calculatedHash === providedHash;
  }

  // Generate batch tracking URL
  generateTrackingUrl(eventId) {
    return `${this.baseUrl}/track/${eventId}`;
  }

  // Generate SMS-friendly short URL (for offline scenarios)
  generateShortUrl(eventId) {
    const shortHash = crypto.createHash('md5').update(eventId).digest('hex').substring(0, 8);
    return `${this.baseUrl}/s/${shortHash}`;
  }
}

module.exports = new QRService();