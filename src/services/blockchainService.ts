import { FABRIC_CONFIG, NETWORK_CONFIG, CHAINCODE_FUNCTIONS } from '../config/fabric';
import apiService from './apiService';

class BlockchainService {
  private initialized = false;
  private isBackendAvailable = false;

  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Try to connect to backend first
      const response = await apiService.initializeBlockchain();
      if (response.success) {
        this.isBackendAvailable = true;
        console.log('✅ Connected to Hyperledger Fabric backend');
      } else {
        throw new Error('Backend not available');
      }
    } catch (error) {
      console.log('⚠️  Backend not available, running in demo mode');
      this.isBackendAvailable = false;
    }

    this.initialized = true;
    return true;
  }

  async createBatch(userAddress: string, batchData: any) {
    try {
      if (this.isBackendAvailable) {
        // Use real backend
        const response = await apiService.makeRequest('/api/blockchain/create-batch', {
          method: 'POST',
          body: JSON.stringify({ userAddress, batchData })
        });
        return response;
      } else {
        // Demo mode - simulate successful Fabric transaction
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return {
        success: true,
        transactionId: `tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating batch:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async addQualityTestEvent(userAddress: string, eventData: any) {
    try {
      if (this.isBackendAvailable) {
        const response = await apiService.makeRequest('/api/blockchain/add-quality-test', {
          method: 'POST',
          body: JSON.stringify({ userAddress, eventData })
        });
        return response;
      } else {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return {
        success: true,
        transactionId: `tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding quality test event:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async addProcessingEvent(userAddress: string, eventData: any) {
    try {
      if (this.isBackendAvailable) {
        const response = await apiService.makeRequest('/api/blockchain/add-processing', {
          method: 'POST',
          body: JSON.stringify({ userAddress, eventData })
        });
        return response;
      } else {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return {
        success: true,
        transactionId: `tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding processing event:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async addManufacturingEvent(userAddress: string, eventData: any) {
    try {
      if (this.isBackendAvailable) {
        const response = await apiService.makeRequest('/api/blockchain/add-manufacturing', {
          method: 'POST',
          body: JSON.stringify({ userAddress, eventData })
        });
        return response;
      } else {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return {
        success: true,
        transactionId: `tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding manufacturing event:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getBatchEvents(batchId: string) {
    try {
      if (this.isBackendAvailable) {
        const response = await apiService.getBatchInfo(batchId);
        return response.data?.events || [];
      } else {
        // Demo mode - return mock events
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return [
        {
          eventId: `COLLECTION-${Date.now()}-1234`,
          eventType: 'COLLECTION',
          collectorName: 'John Collector',
          ipfsHash: 'QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          location: { zone: 'Himalayan Region - Uttarakhand' }
        }
      ];
    } catch (error) {
      console.error('Error getting batch events:', error);
      return [];
    }
  }

  async getAllBatches() {
    try {
      if (this.isBackendAvailable) {
        const response = await apiService.getAllBatches();
        return response.data || [];
      } else {
        // Demo mode - return mock batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return [
        {
          batchId: 'HERB-1234567890-1234',
          herbSpecies: 'Ashwagandha',
          creationTime: new Date(Date.now() - 86400000).toISOString(),
          eventCount: 1
        }
      ];
    } catch (error) {
      console.error('Error getting all batches:', error);
      return [];
    }
  }

  generateBatchId(): string {
    if (this.isBackendAvailable) {
      // In production, this should be called from backend
      // For now, generate locally
    }
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `HERB-${timestamp}-${random}`;
  }

  generateEventId(eventType: string): string {
    if (this.isBackendAvailable) {
      // In production, this should be called from backend
      // For now, generate locally
    }
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${eventType}-${timestamp}-${random}`;
  }

  getConnectionStatus() {
    return {
      initialized: this.initialized,
      backendAvailable: this.isBackendAvailable,
      mode: this.isBackendAvailable ? 'production' : 'demo'
    };
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;