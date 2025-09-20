import apiService from './apiService';

class IPFSService {
  private isBackendAvailable = false;

  constructor() {
    this.checkBackendAvailability();
  }

  private async checkBackendAvailability() {
    try {
      await fetch('http://localhost:5000/health');
      this.isBackendAvailable = true;
    } catch {
      this.isBackendAvailable = false;
    }
  }

  async uploadJSON(jsonData: any, name: string) {
    try {
      if (this.isBackendAvailable) {
        return await apiService.uploadJSONToIPFS(jsonData, name);
      } else {
        // Demo mode - simulate IPFS upload
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      
      return {
        success: true,
        ipfsHash: mockHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}`
      };
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async uploadFile(file: File) {
    try {
      if (this.isBackendAvailable) {
        return await apiService.uploadToIPFS(file);
      } else {
        // Demo mode - simulate file upload
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      
      return {
        success: true,
        ipfsHash: mockHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}`
      };
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getFile(ipfsHash: string) {
    try {
      if (this.isBackendAvailable) {
        return await apiService.getFromIPFS(ipfsHash);
      } else {
        // Demo mode - return mock metadata
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return {
        success: true,
        data: {
          type: 'collection',
          herbSpecies: 'Ashwagandha',
          collector: 'John Collector',
          weight: 500,
          notes: 'High quality herbs collected from approved zone'
        }
      };
    } catch (error) {
      console.error('Error retrieving file from IPFS:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async createCollectionMetadata(collectionData: any) {
    const metadata = {
      type: 'collection',
      timestamp: new Date().toISOString(),
      ...collectionData
    };
    
    if (this.isBackendAvailable) {
      try {
        return await apiService.makeRequest('/api/ipfs/create-collection-metadata', {
          method: 'POST',
          body: JSON.stringify({ collectionData: metadata })
        });
      } catch (error) {
        console.log('Backend unavailable, using demo mode');
      }
    }
    
    return await this.uploadJSON(metadata, `collection-${collectionData.batchId}`);
  }

  async createQualityTestMetadata(testData: any) {
    const metadata = {
      type: 'quality_test',
      timestamp: new Date().toISOString(),
      ...testData
    };
    
    if (this.isBackendAvailable) {
      try {
        return await apiService.makeRequest('/api/ipfs/create-quality-test-metadata', {
          method: 'POST',
          body: JSON.stringify({ testData: metadata })
        });
      } catch (error) {
        console.log('Backend unavailable, using demo mode');
      }
    }
    
    return await this.uploadJSON(metadata, `quality-test-${testData.eventId}`);
  }

  async createProcessingMetadata(processData: any) {
    const metadata = {
      type: 'processing',
      timestamp: new Date().toISOString(),
      ...processData
    };
    
    if (this.isBackendAvailable) {
      try {
        return await apiService.makeRequest('/api/ipfs/create-processing-metadata', {
          method: 'POST',
          body: JSON.stringify({ processData: metadata })
        });
      } catch (error) {
        console.log('Backend unavailable, using demo mode');
      }
    }
    
    return await this.uploadJSON(metadata, `processing-${processData.eventId}`);
  }

  async createManufacturingMetadata(mfgData: any) {
    const metadata = {
      type: 'manufacturing',
      timestamp: new Date().toISOString(),
      ...mfgData
    };
    
    if (this.isBackendAvailable) {
      try {
        return await apiService.makeRequest('/api/ipfs/create-manufacturing-metadata', {
          method: 'POST',
          body: JSON.stringify({ mfgData: metadata })
        });
      } catch (error) {
        console.log('Backend unavailable, using demo mode');
      }
    }
    
    return await this.uploadJSON(metadata, `manufacturing-${mfgData.eventId}`);
  }
}

export const ipfsService = new IPFSService();
export default ipfsService;