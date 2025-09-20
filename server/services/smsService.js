const axios = require('axios');
const { API_KEYS } = require('../config/constants');

class SMSService {
  constructor() {
    this.apiKey = API_KEYS.FAST2SMS;
    this.baseUrl = 'https://www.fast2sms.com/dev/bulkV2';
  }

  async sendSMS(phoneNumber, message) {
    try {
      const response = await axios.post(this.baseUrl, {
        route: 'v3',
        sender_id: 'FTWSMS',
        message: message,
        language: 'english',
        flash: 0,
        numbers: phoneNumber
      }, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.message_id,
        response: response.data
      };
    } catch (error) {
      console.error('Error sending SMS:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  async sendCollectionConfirmation(phoneNumber, batchId, qrCode) {
    const message = `HerbionYX: Collection recorded successfully! 
Batch ID: ${batchId}
QR Code: ${qrCode}
Track your herb at: https://herbionyx.netlify.app/track/${qrCode}`;
    
    return await this.sendSMS(phoneNumber, message);
  }

  async sendQualityTestNotification(phoneNumber, batchId, status, qrCode) {
    const message = `HerbionYX: Quality test ${status} for Batch ${batchId}
QR Code: ${qrCode}
View results: https://herbionyx.netlify.app/track/${qrCode}`;
    
    return await this.sendSMS(phoneNumber, message);
  }

  async sendProcessingNotification(phoneNumber, batchId, method, qrCode) {
    const message = `HerbionYX: Processing completed using ${method} for Batch ${batchId}
QR Code: ${qrCode}
Track progress: https://herbionyx.netlify.app/track/${qrCode}`;
    
    return await this.sendSMS(phoneNumber, message);
  }

  async sendManufacturingNotification(phoneNumber, batchId, productName, qrCode) {
    const message = `HerbionYX: Manufacturing completed for ${productName}
Original Batch: ${batchId}
Final QR Code: ${qrCode}
Product trace: https://herbionyx.netlify.app/track/${qrCode}`;
    
    return await this.sendSMS(phoneNumber, message);
  }

  parseSMSCommand(smsText, phoneNumber) {
    try {
      const lines = smsText.trim().split('\n');
      const command = lines[0].toUpperCase();
      
      const data = {
        phoneNumber,
        command,
        timestamp: Date.now()
      };

      switch (command) {
        case 'COLLECT':
          return this.parseCollectionSMS(lines, data);
        case 'TEST':
          return this.parseTestSMS(lines, data);
        case 'PROCESS':
          return this.parseProcessSMS(lines, data);
        case 'MANUFACTURE':
          return this.parseManufactureSMS(lines, data);
        default:
          throw new Error('Invalid command');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  parseCollectionSMS(lines, data) {
    // Expected format:
    // COLLECT
    // SPECIES:Ashwagandha
    // WEIGHT:500
    // ZONE:Himalayan Region - Uttarakhand
    
    const parsedData = { ...data, type: 'collection' };
    
    for (let i = 1; i < lines.length; i++) {
      const [key, value] = lines[i].split(':');
      if (key && value) {
        switch (key.toUpperCase()) {
          case 'SPECIES':
            parsedData.herbSpecies = value.trim();
            break;
          case 'WEIGHT':
            parsedData.weight = parseFloat(value.trim());
            break;
          case 'ZONE':
            parsedData.zone = value.trim();
            break;
        }
      }
    }

    return { success: true, data: parsedData };
  }

  parseTestSMS(lines, data) {
    // Expected format:
    // TEST
    // BATCH:HERB-1234567890-1234
    // MOISTURE:10.5
    // PURITY:98.7
    // PESTICIDE:0.005
    
    const parsedData = { ...data, type: 'quality_test' };
    
    for (let i = 1; i < lines.length; i++) {
      const [key, value] = lines[i].split(':');
      if (key && value) {
        switch (key.toUpperCase()) {
          case 'BATCH':
            parsedData.batchId = value.trim();
            break;
          case 'MOISTURE':
            parsedData.moistureContent = parseFloat(value.trim());
            break;
          case 'PURITY':
            parsedData.purity = parseFloat(value.trim());
            break;
          case 'PESTICIDE':
            parsedData.pesticideLevel = parseFloat(value.trim());
            break;
        }
      }
    }

    return { success: true, data: parsedData };
  }

  parseProcessSMS(lines, data) {
    // Expected format:
    // PROCESS
    // BATCH:HERB-1234567890-1234
    // METHOD:Steam Distillation
    // YIELD:250
    // TEMP:60
    
    const parsedData = { ...data, type: 'processing' };
    
    for (let i = 1; i < lines.length; i++) {
      const [key, value] = lines[i].split(':');
      if (key && value) {
        switch (key.toUpperCase()) {
          case 'BATCH':
            parsedData.batchId = value.trim();
            break;
          case 'METHOD':
            parsedData.method = value.trim();
            break;
          case 'YIELD':
            parsedData.yield = parseFloat(value.trim());
            break;
          case 'TEMP':
            parsedData.temperature = parseFloat(value.trim());
            break;
        }
      }
    }

    return { success: true, data: parsedData };
  }

  parseManufactureSMS(lines, data) {
    // Expected format:
    // MANUFACTURE
    // BATCH:HERB-1234567890-1234
    // PRODUCT:Ashwagandha Capsules
    // QUANTITY:1000
    // EXPIRY:2025-12-31
    
    const parsedData = { ...data, type: 'manufacturing' };
    
    for (let i = 1; i < lines.length; i++) {
      const [key, value] = lines[i].split(':');
      if (key && value) {
        switch (key.toUpperCase()) {
          case 'BATCH':
            parsedData.batchId = value.trim();
            break;
          case 'PRODUCT':
            parsedData.productName = value.trim();
            break;
          case 'QUANTITY':
            parsedData.quantity = parseFloat(value.trim());
            break;
          case 'EXPIRY':
            parsedData.expiryDate = value.trim();
            break;
        }
      }
    }

    return { success: true, data: parsedData };
  }
}

module.exports = new SMSService();