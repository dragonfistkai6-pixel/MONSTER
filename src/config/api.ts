// API configuration for HerbionYX Frontend
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      PROFILE: '/api/auth/profile',
      PRIVATE_KEY: '/api/auth/private-key'
    },
    // Collection
    COLLECTION: {
      CREATE: '/api/collection/create',
      HERBS: '/api/collection/herbs',
      ZONES: '/api/collection/zones',
      SMS_COLLECT: '/api/collection/sms-collect',
      VALIDATE_ZONE: '/api/collection/location/validate-zone'
    },
    // Quality Testing
    QUALITY: {
      TEST: '/api/quality/test'
    },
    // Processing
    PROCESSING: {
      PROCESS: '/api/processing/process',
      METHODS: '/api/processing/methods'
    },
    // Manufacturing
    MANUFACTURING: {
      MANUFACTURE: '/api/manufacturing/manufacture'
    },
    // Tracking
    TRACKING: {
      BATCH: '/api/tracking/batch',
      PATH: '/api/tracking/path',
      STATS: '/api/tracking/stats',
      BATCHES: '/api/tracking/batches'
    },
    // Blockchain
    BLOCKCHAIN: {
      INITIALIZE: '/api/blockchain/initialize',
      CREATE_BATCH: '/api/blockchain/create-batch',
      ADD_QUALITY_TEST: '/api/blockchain/add-quality-test',
      ADD_PROCESSING: '/api/blockchain/add-processing',
      ADD_MANUFACTURING: '/api/blockchain/add-manufacturing',
      GENERATE_BATCH_ID: '/api/blockchain/generate-batch-id',
      GENERATE_EVENT_ID: '/api/blockchain/generate-event-id'
    },
    // IPFS
    IPFS: {
      UPLOAD_JSON: '/api/ipfs/upload-json',
      UPLOAD_FILE: '/api/ipfs/upload-file',
      GET_FILE: '/api/ipfs/get-file',
      CREATE_COLLECTION_METADATA: '/api/ipfs/create-collection-metadata',
      CREATE_QUALITY_TEST_METADATA: '/api/ipfs/create-quality-test-metadata',
      CREATE_PROCESSING_METADATA: '/api/ipfs/create-processing-metadata',
      CREATE_MANUFACTURING_METADATA: '/api/ipfs/create-manufacturing-metadata'
    }
  },
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
};

// Request interceptor for authentication
export const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}

// Error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}