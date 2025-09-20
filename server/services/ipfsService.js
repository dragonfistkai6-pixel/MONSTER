const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

class IPFSService {
  constructor() {
    this.pinataApiUrl = 'https://api.pinata.cloud';
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_API_KEY;
    
    // Validate API keys on initialization
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn('⚠️  Pinata API keys not configured. IPFS uploads will fail.');
      console.warn('Please set PINATA_API_KEY and PINATA_SECRET_API_KEY in your .env file');
    }
  }

  // ---------- Upload JSON ----------
  async uploadJSON(jsonData, name) {
    try {
      const url = `${this.pinataApiUrl}/pinning/pinJSONToIPFS`;

      const payload = {
        pinataContent: jsonData,
        pinataMetadata: { name: name || 'herb-metadata' }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        }
      });

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
      };
    } catch (err) {
      console.error('Error uploading JSON to IPFS:', err.response?.data || err.message);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        return { success: false, error: 'Invalid Pinata API credentials. Please check PINATA_API_KEY and PINATA_SECRET_KEY in .env file' };
      }
      
      return { success: false, error: err.message };
    }
  }

  // ---------- Upload File ----------
  async uploadFile(fileBuffer, fileName, mimeType) {
    try {
      const url = `${this.pinataApiUrl}/pinning/pinFileToIPFS`;

      const formData = new FormData();
      formData.append('file', fileBuffer, { filename: fileName, contentType: mimeType });
      formData.append('pinataMetadata', JSON.stringify({ name: fileName }));

      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
      };
    } catch (err) {
      console.error('Error uploading file to IPFS:', err.response?.data || err.message);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        return { success: false, error: 'Invalid Pinata API credentials. Please check PINATA_API_KEY and PINATA_SECRET_KEY in .env file' };
      }
      
      return { success: false, error: err.message };
    }
  }

  // ---------- Get File ----------
  async getFile(ipfsHash) {
    try {
      const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      const response = await axios.get(url);

      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error retrieving file from IPFS:', err.message);
      return { success: false, error: err.message };
    }
  }

  // ---------- Metadata Generators ----------
  async createCollectionMetadata(data) {
    const metadata = {
      type: 'collection',
      timestamp: new Date().toISOString(),
      ...data,
      location: {
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
        zone: data.location?.zone,
        address: data.location?.address || ''
      },
      qualityGrade: data.qualityGrade || '',
      notes: data.notes || '',
      images: data.images || []
    };

    return await this.uploadJSON(metadata, `collection-${data.batchId}`);
  }

  async createQualityTestMetadata(data) {
    const metadata = {
      type: 'quality_test',
      timestamp: new Date().toISOString(),
      ...data,
      testResults: {
        moistureContent: data.moistureContent,
        purity: data.purity,
        pesticideLevel: data.pesticideLevel,
        heavyMetals: data.heavyMetals || {},
        microbiological: data.microbiological || {},
        activeCompounds: data.activeCompounds || {}
      },
      testMethod: data.testMethod || '',
      certification: data.certification || '',
      notes: data.notes || '',
      images: data.images || []
    };

    return await this.uploadJSON(metadata, `quality-test-${data.eventId}`);
  }

  async createProcessingMetadata(data) {
    const metadata = {
      type: 'processing',
      timestamp: new Date().toISOString(),
      ...data,
      processingDetails: {
        method: data.method,
        temperature: data.temperature,
        duration: data.duration,
        yield: data.yield,
        equipment: data.equipment || '',
        parameters: data.parameters || {}
      },
      outputProduct: data.outputProduct || '',
      qualityMetrics: data.qualityMetrics || {},
      notes: data.notes || '',
      images: data.images || []
    };

    return await this.uploadJSON(metadata, `processing-${data.eventId}`);
  }

  async createManufacturingMetadata(data) {
    const metadata = {
      type: 'manufacturing',
      timestamp: new Date().toISOString(),
      ...data,
      product: {
        name: data.productName,
        type: data.productType,
        form: data.productForm,
        quantity: data.quantity,
        unit: data.unit,
        batchSize: data.batchSize,
        expiryDate: data.expiryDate
      },
      packaging: {
        material: data.packaging?.material || '',
        size: data.packaging?.size || '',
        labels: data.packaging?.labels || []
      },
      qualityControl: {
        tests: data.qualityTests || [],
        certifications: data.certifications || [],
        standards: data.standards || []
      },
      notes: data.notes || '',
      images: data.images || []
    };

    return await this.uploadJSON(metadata, `manufacturing-${data.eventId}`);
  }
}

module.exports = new IPFSService();
