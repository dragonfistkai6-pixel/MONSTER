import { API_CONFIG, createAuthHeaders, ApiResponse, ApiError } from '../config/api';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...createAuthHeaders(),
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.details
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('API request failed:', error);
      throw new ApiError(
        'Network error - please check if the backend server is running',
        0,
        (error as Error).message
      );
    }
  }

  // Authentication APIs
  async login(email: string, password: string) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(userData: any) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getProfile() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
  }

  async getPrivateKey() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.PRIVATE_KEY);
  }

  // Collection APIs
  async createCollection(formData: FormData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.COLLECTION.CREATE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
  }

  async getHerbs() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.COLLECTION.HERBS);
  }

  async getZones() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.COLLECTION.ZONES);
  }

  async validateZone(latitude: string, longitude: string, zone: string) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.COLLECTION.VALIDATE_ZONE, {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, zone })
    });
  }

  // Quality Testing APIs
  async createQualityTest(formData: FormData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.QUALITY.TEST, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
  }

  // Processing APIs
  async createProcessing(formData: FormData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.PROCESSING.PROCESS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
  }

  async getProcessingMethods() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.PROCESSING.METHODS);
  }

  // Manufacturing APIs
  async createManufacturing(formData: FormData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.MANUFACTURING.MANUFACTURE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
  }

  // Tracking APIs
  async getBatchInfo(eventId: string) {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.TRACKING.BATCH}/${eventId}`);
  }

  async getEventPath(eventId: string) {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.TRACKING.PATH}/${eventId}`);
  }

  async getBatchStats(batchId: string) {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.TRACKING.STATS}/${batchId}`);
  }

  async getAllBatches() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.TRACKING.BATCHES);
  }

  // Blockchain APIs
  async initializeBlockchain() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.BLOCKCHAIN.INITIALIZE, {
      method: 'POST'
    });
  }

  async generateBatchId() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.BLOCKCHAIN.GENERATE_BATCH_ID);
  }

  async generateEventId(eventType: string) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.BLOCKCHAIN.GENERATE_EVENT_ID, {
      method: 'POST',
      body: JSON.stringify({ eventType })
    });
  }

  // IPFS APIs
  async uploadToIPFS(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.makeRequest(API_CONFIG.ENDPOINTS.IPFS.UPLOAD_FILE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
  }

  async uploadJSONToIPFS(jsonData: any, name: string) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.IPFS.UPLOAD_JSON, {
      method: 'POST',
      body: JSON.stringify({ jsonData, name })
    });
  }

  async getFromIPFS(ipfsHash: string) {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.IPFS.GET_FILE}/${ipfsHash}`);
  }
}

export const apiService = new ApiService();
export default apiService;