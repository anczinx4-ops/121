// Kaleido Besu configuration for HerbionYX
export const KALEIDO_CONFIG = {
  API_URL: process.env.KALEIDO_API_URL || 'https://your-consortium-id-your-environment-id-connect.us0-aws.kaleido.io',
  API_KEY: process.env.KALEIDO_API_KEY || 'your_api_key_here',
  SIGNING_KEY: process.env.KALEIDO_SIGNING_KEY || 'your_signing_key_here',
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  CHAIN_ID: 1337
};

export const NETWORK_CONFIG = {
  name: "HerbionYX Kaleido Network",
  type: "Ethereum Besu",
  version: "22.10.2",
  consensus: "IBFT 2.0"
};

// Organization addresses
export const ORGANIZATIONS = {
  COLLECTOR: {
    address: process.env.COLLECTOR_ADDRESS || '0x0000000000000000000000000000000000000001',
    privateKey: process.env.COLLECTOR_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001'
  },
  TESTER: {
    address: process.env.TESTER_ADDRESS || '0x0000000000000000000000000000000000000002',
    privateKey: process.env.TESTER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000002'
  },
  PROCESSOR: {
    address: process.env.PROCESSOR_ADDRESS || '0x0000000000000000000000000000000000000003',
    privateKey: process.env.PROCESSOR_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000003'
  },
  MANUFACTURER: {
    address: process.env.MANUFACTURER_ADDRESS || '0x0000000000000000000000000000000000000004',
    privateKey: process.env.MANUFACTURER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000004'
  }
};

// Contract function names
export const CONTRACT_FUNCTIONS = {
  CREATE_COLLECTION: "createCollectionEvent",
  CREATE_QUALITY_TEST: "createQualityTestEvent", 
  CREATE_PROCESSING: "createProcessingEvent",
  CREATE_MANUFACTURING: "createManufacturingEvent",
  GET_BATCH_EVENTS: "getBatchEvents",
  GET_ALL_BATCHES: "getAllBatches",
  GET_ALL_EVENTS: "getAllEvents"
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