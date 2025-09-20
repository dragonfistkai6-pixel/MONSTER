// Fabric network configuration for HerbionYX
// Update these settings for your Hyperledger Fabric network

export const FABRIC_CONFIG = {
  CHANNEL_NAME: "herbionyx-channel",
  CHAINCODE_NAME: "herbionyx-chaincode",
  ORG_MSP_ID: "Org1MSP",
  PEER_ENDPOINT: "grpcs://localhost:7051",
  CA_ENDPOINT: "https://localhost:7054"
};

export const NETWORK_CONFIG = {
  name: "HerbionYX Fabric Network",
  type: "Hyperledger Fabric",
  version: "2.5",
  consensus: "Raft"
};

// Chaincode function names
export const CHAINCODE_FUNCTIONS = {
  CREATE_COLLECTION: "createCollectionEvent",
  CREATE_QUALITY_TEST: "createQualityTestEvent", 
  CREATE_PROCESSING: "createProcessingEvent",
  CREATE_MANUFACTURING: "createManufacturingEvent",
  QUERY_BATCH: "queryBatch",
  GET_BATCH_EVENTS: "getBatchEvents",
  GET_ALL_BATCHES: "getAllBatches",
  QUERY_EVENT: "queryEvent"
};

// Role mappings
export const ROLES = {
  NONE: 0,
  COLLECTOR: 1,
  TESTER: 2,
  PROCESSOR: 3,
  MANUFACTURER: 4,
  ADMIN: 5,
  CONSUMER: 6
};