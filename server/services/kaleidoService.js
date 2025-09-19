const { ethers } = require('ethers');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class KaleidoService {
    constructor() {
        this.apiUrl = process.env.KALEIDO_API_URL;
        this.apiKey = process.env.KALEIDO_API_KEY;
        this.signingKey = process.env.KALEIDO_SIGNING_KEY;
        this.contractAddress = process.env.CONTRACT_ADDRESS;
        
        // Organization addresses and private keys
        this.organizations = {
            COLLECTOR: {
                address: process.env.COLLECTOR_ADDRESS,
                privateKey: process.env.COLLECTOR_PRIVATE_KEY
            },
            TESTER: {
                address: process.env.TESTER_ADDRESS,
                privateKey: process.env.TESTER_PRIVATE_KEY
            },
            PROCESSOR: {
                address: process.env.PROCESSOR_ADDRESS,
                privateKey: process.env.PROCESSOR_PRIVATE_KEY
            },
            MANUFACTURER: {
                address: process.env.MANUFACTURER_ADDRESS,
                privateKey: process.env.MANUFACTURER_PRIVATE_KEY
            }
        };
        
        this.provider = null;
        this.contract = null;
        this.wallets = {};
        
        this.initializeProvider();
    }
    
    initializeProvider() {
        try {
            // Create provider for Kaleido
            this.provider = new ethers.JsonRpcProvider(this.apiUrl, {
                name: 'kaleido',
                chainId: 1337 // Default Kaleido chain ID
            });
            
            // Load contract ABI
            const abiPath = path.join(__dirname, '../contracts/HerbTraceability.json');
            let contractABI;
            
            if (fs.existsSync(abiPath)) {
                const contractData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
                contractABI = contractData.abi || contractData;
            } else {
                // Fallback ABI if file doesn't exist
                contractABI = this.getContractABI();
            }
            
            // Create contract instance
            if (this.contractAddress && this.contractAddress !== '0x0000000000000000000000000000000000000000') {
                this.contract = new ethers.Contract(this.contractAddress, contractABI, this.provider);
            }
            
            // Initialize wallets for each organization
            Object.keys(this.organizations).forEach(orgType => {
                const org = this.organizations[orgType];
                if (org.privateKey && org.privateKey !== '0x0000000000000000000000000000000000000000000000000000000000000001') {
                    this.wallets[orgType] = new ethers.Wallet(org.privateKey, this.provider);
                }
            });
            
            console.log('✅ Kaleido service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Kaleido service:', error);
        }
    }
    
    getContractABI() {
        // Load ABI from deployed contract
        try {
            const contractData = require('../contracts/HerbTraceability.json');
            return contractData.abi;
        } catch (error) {
            console.error('Could not load contract ABI:', error);
            // Fallback minimal ABI
            return [
                "function createCollectionEvent(string,string,string,string,uint256,string,string,string,string,string,string) external",
                "function createQualityTestEvent(string,string,string,string,uint16,uint16,uint32,string,string,string,string) external",
                "function createProcessingEvent(string,string,string,string,string,uint16,string,uint256,string,string,string) external",
                "function createManufacturingEvent(string,string,string,string,string,string,uint256,string,string,string,string,string) external",
                "function getBatchEvents(string) view returns (string[])",
                "function getAllBatches() view returns (string[])",
                "function getAllEvents() view returns (string[])",
                "function batches(string) view returns (tuple(string,string,address,uint256,uint256,string,bool,uint8))",
                "function events(string) view returns (tuple(string,string,string,uint8,address,uint256,string,string,string,string,bool))",
                "function organizations(address) view returns (tuple(string,uint8,address,bool,uint256))",
                "event BatchCreated(string indexed batchId, string herbSpecies, address indexed creator)",
                "event EventAdded(string indexed eventId, string indexed batchId, uint8 eventType, address indexed participant)"
            ];
        }
    }
    
    async deployContract() {
        try {
            if (!this.wallets.COLLECTOR) {
                throw new Error('Collector wallet not initialized');
            }
            
            // Contract bytecode (this would be generated from Remix)
            const contractBytecode = "0x608060405234801561001057600080fd5b50..."; // This will be replaced with actual bytecode
            
            const contractFactory = new ethers.ContractFactory(
                this.getContractABI(),
                contractBytecode,
                this.wallets.COLLECTOR
            );
            
            console.log('Deploying contract...');
            const contract = await contractFactory.deploy();
            await contract.waitForDeployment();
            
            const contractAddress = await contract.getAddress();
            console.log('✅ Contract deployed at:', contractAddress);
            
            // Update contract address in environment
            this.contractAddress = contractAddress;
            this.contract = contract;
            
            return {
                success: true,
                contractAddress,
                transactionHash: contract.deploymentTransaction().hash
            };
        } catch (error) {
            console.error('❌ Contract deployment failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async registerOrganizations() {
        try {
            if (!this.contract || !this.wallets.COLLECTOR) {
                throw new Error('Contract or wallet not initialized');
            }
            
            const contractWithSigner = this.contract.connect(this.wallets.COLLECTOR);
            
            const orgTypes = ['COLLECTOR', 'TESTER', 'PROCESSOR', 'MANUFACTURER'];
            const results = [];
            
            for (let i = 0; i < orgTypes.length; i++) {
                const orgType = orgTypes[i];
                const org = this.organizations[orgType];
                
                if (org.address && org.address !== '0x0000000000000000000000000000000000000000') {
                    console.log(`Registering ${orgType}...`);
                    
                    const tx = await contractWithSigner.registerOrganization(
                        org.address,
                        `${orgType} Organization`,
                        i // OrgType enum value
                    );
                    
                    await tx.wait();
                    results.push({
                        orgType,
                        address: org.address,
                        transactionHash: tx.hash
                    });
                    
                    console.log(`✅ ${orgType} registered`);
                }
            }
            
            return { success: true, results };
        } catch (error) {
            console.error('❌ Organization registration failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async createCollectionEvent(orgType, eventData) {
        try {
            const wallet = this.wallets[orgType];
            if (!wallet) {
                throw new Error(`Wallet for ${orgType} not found`);
            }
            
            const contractWithSigner = this.contract.connect(wallet);
            
            const tx = await contractWithSigner.createCollectionEvent(
                eventData.batchId,
                eventData.eventId,
                eventData.herbSpecies,
                eventData.collectorName,
                Math.floor(eventData.weight * 100), // Convert to integer
                eventData.harvestDate,
                eventData.location,
                eventData.qualityGrade || '',
                eventData.notes || '',
                eventData.ipfsHash || '',
                eventData.qrCodeHash || ''
            );
            
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error('❌ Collection event creation failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async createQualityTestEvent(orgType, eventData) {
        try {
            const wallet = this.wallets[orgType];
            if (!wallet) {
                throw new Error(`Wallet for ${orgType} not found`);
            }
            
            const contractWithSigner = this.contract.connect(wallet);
            
            const tx = await contractWithSigner.createQualityTestEvent(
                eventData.eventId,
                eventData.batchId,
                eventData.parentEventId,
                eventData.testerName,
                Math.min(Math.floor(eventData.moistureContent * 100), 65535), // uint16 max
                Math.min(Math.floor(eventData.purity * 100), 65535), // uint16 max
                Math.min(Math.floor(eventData.pesticideLevel * 1000000), 4294967295), // uint32 max
                eventData.testMethod || 'Standard Test',
                eventData.notes || '',
                eventData.ipfsHash || '',
                eventData.qrCodeHash || ''
            );
            
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error('❌ Quality test event creation failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async createProcessingEvent(orgType, eventData) {
        try {
            const wallet = this.wallets[orgType];
            if (!wallet) {
                throw new Error(`Wallet for ${orgType} not found`);
            }
            
            const contractWithSigner = this.contract.connect(wallet);
            
            const tx = await contractWithSigner.createProcessingEvent(
                eventData.eventId,
                eventData.batchId,
                eventData.parentEventId,
                eventData.processorName,
                eventData.method,
                Math.min(Math.floor((eventData.temperature || 0) * 100), 65535), // uint16 max
                eventData.duration || '',
                eventData.yield || 0, // Keep as uint256 for yield amount
                eventData.notes || '',
                eventData.ipfsHash || '',
                eventData.qrCodeHash || ''
            );
            
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error('❌ Processing event creation failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async createManufacturingEvent(orgType, eventData) {
        try {
            const wallet = this.wallets[orgType];
            if (!wallet) {
                throw new Error(`Wallet for ${orgType} not found`);
            }
            
            const contractWithSigner = this.contract.connect(wallet);
            
            const tx = await contractWithSigner.createManufacturingEvent(
                eventData.eventId,
                eventData.batchId,
                eventData.parentEventId,
                eventData.manufacturerName,
                eventData.productName,
                eventData.productType || 'Herbal Product',
                eventData.quantity || 0, // Keep as uint256 for quantity
                eventData.unit || 'units',
                eventData.expiryDate || '',
                eventData.notes || '',
                eventData.ipfsHash || '',
                eventData.qrCodeHash || ''
            );
            
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error('❌ Manufacturing event creation failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getBatchEvents(batchId) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            
            const eventIds = await this.contract.getBatchEvents(batchId);
            const events = [];
            
            for (const eventId of eventIds) {
                const event = await this.contract.events(eventId);
                if (event.exists) {
                    events.push({
                        eventId: event.eventId,
                        batchId: event.batchId,
                        parentEventId: event.parentEventId,
                        eventType: event.eventType,
                        participant: event.participant,
                        timestamp: Number(event.timestamp),
                        ipfsHash: event.ipfsHash,
                        qrCodeHash: event.qrCodeHash,
                        location: event.location,
                        notes: event.notes
                    });
                }
            }
            
            return { success: true, data: events };
        } catch (error) {
            console.error('❌ Failed to get batch events:', error);
            return { success: false, error: error.message, data: [] };
        }
    }
    
    async getAllBatches() {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            
            const batchIds = await this.contract.getAllBatches();
            const batches = [];
            
            for (const batchId of batchIds) {
                const batch = await this.contract.batches(batchId);
                if (batch.exists) {
                    batches.push({
                        batchId: batch.batchId,
                        herbSpecies: batch.herbSpecies,
                        creator: batch.creator,
                        createdAt: Number(batch.createdAt),
                        lastUpdated: Number(batch.lastUpdated),
                        eventIds: batch.eventIds,
                        currentStatus: batch.currentStatus
                    });
                }
            }
            
            return { success: true, data: batches };
        } catch (error) {
            console.error('❌ Failed to get all batches:', error);
            return { success: false, error: error.message, data: [] };
        }
    }
    
    async getAllTransactions() {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            
            // Get all events from the contract
            const filter = this.contract.filters.EventAdded();
            const events = await this.contract.queryFilter(filter);
            
            const transactions = events.map(event => ({
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                eventId: event.args.eventId,
                batchId: event.args.batchId,
                eventType: event.args.eventType,
                participant: event.args.participant,
                timestamp: new Date(event.args.timestamp * 1000).toISOString()
            }));
            
            return { success: true, data: transactions };
        } catch (error) {
            console.error('❌ Failed to get all transactions:', error);
            return { success: false, error: error.message, data: [] };
        }
    }
    
    generateBatchId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `HERB-${timestamp}-${random}`;
    }
    
    generateEventId(eventType) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${eventType}-${timestamp}-${random}`;
    }
}

module.exports = new KaleidoService();