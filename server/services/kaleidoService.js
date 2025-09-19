const { ethers } = require('ethers');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class KaleidoService {
    constructor() {
        this.apiUrl = process.env.KALEIDO_API_URL;
        this.apiKey = process.env.KALEIDO_API_KEY;
        this.signingKey = process.env.KALEIDO_SIGNING_KEY;
        this.coreContractAddress = process.env.CORE_CONTRACT_ADDRESS;
        this.storageContractAddress = process.env.STORAGE_CONTRACT_ADDRESS;
        
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
        this.coreContract = null;
        this.storageContract = null;
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
            const coreAbiPath = path.join(__dirname, '../contracts/HerbTraceabilityCore.json');
            const storageAbiPath = path.join(__dirname, '../contracts/HerbTraceabilityStorage.json');
            let contractABI;
            let storageABI;
            
            if (fs.existsSync(coreAbiPath)) {
                const contractData = JSON.parse(fs.readFileSync(coreAbiPath, 'utf8'));
                contractABI = contractData.abi || contractData;
            } else {
                // Fallback ABI if file doesn't exist
                contractABI = this.getCoreContractABI();
            }
            
            if (fs.existsSync(storageAbiPath)) {
                const storageData = JSON.parse(fs.readFileSync(storageAbiPath, 'utf8'));
                storageABI = storageData.abi || storageData;
            } else {
                storageABI = this.getStorageContractABI();
            }
            
            // Create contract instance
            if (this.coreContractAddress && this.coreContractAddress !== '0x0000000000000000000000000000000000000000') {
                this.coreContract = new ethers.Contract(this.coreContractAddress, contractABI, this.provider);
            }
            
            if (this.storageContractAddress && this.storageContractAddress !== '0x0000000000000000000000000000000000000000') {
                this.storageContract = new ethers.Contract(this.storageContractAddress, storageABI, this.provider);
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
    
    getCoreContractABI() {
        // Load ABI from deployed contract
        try {
            const contractData = require('../contracts/HerbTraceabilityCore.json');
            return contractData.abi;
        } catch (error) {
            console.error('Could not load core contract ABI:', error);
            // Fallback minimal ABI
            return [
                "function createCollectionEvent(string,string,string,string,uint256,string,string,string,string,string,string) external",
                "function createQualityTestEvent(string,string,string,string,uint16,uint16,uint32,string,string,string,string) external",
                "function createProcessingEvent(string,string,string,string,string,uint16,string,uint256,string,string,string) external",
                "function createManufacturingEvent(string,string,string,string,string,string,uint256,string,string,string,string,string) external",
                "function getBatchEvents(string) view returns (string[])",
                "function getAllBatches() view returns (string[])",
                "function getAllEvents() view returns (string[])",
                "function getBatchCount() view returns (uint256)",
                "function getEventCount() view returns (uint256)",
                "event BatchCreated(string indexed batchId, string herbSpecies, address indexed creator)",
                "event EventAdded(string indexed eventId, string indexed batchId, uint8 eventType, address indexed participant)",
                "function registerOrganization(address,string,uint8) external"
            ];
        }
    }
    
    getStorageContractABI() {
        try {
            const storageData = require('../contracts/HerbTraceabilityStorage.json');
            return storageData.abi;
        } catch (error) {
            console.error('Could not load storage contract ABI:', error);
            return [
                "function batches(string) view returns (tuple(string,string,address,uint256,uint256,string,bool))",
                "function events(string) view returns (tuple(string,string,string,uint8,address,uint256,string,string,string,string,bool))",
                "function organizations(address) view returns (tuple(string,uint8,address,bool,uint256))",
                "function setCoreContract(address) external",
                "function owner() view returns (address)"
            ];
        }
    }
    
    async deployContract() {
        try {
            if (!this.wallets.COLLECTOR) {
                throw new Error('Collector wallet not initialized');
            }
            
            // Contract bytecode (this would be generated from Remix)
            const storageBytecode = "0x608060405234801561001057600080fd5b50..."; // Storage contract bytecode
            const coreBytecode = "0x608060405234801561001057600080fd5b50..."; // Core contract bytecode
            
            // Deploy storage contract first
            const storageFactory = new ethers.ContractFactory(
                this.getStorageContractABI(),
                storageBytecode,
                this.wallets.COLLECTOR
            );
            
            console.log('Deploying storage contract...');
            const storageContract = await storageFactory.deploy();
            await storageContract.waitForDeployment();
            
            const storageAddress = await storageContract.getAddress();
            console.log('✅ Storage contract deployed at:', storageAddress);
            
            // Deploy core contract with storage address
            const coreFactory = new ethers.ContractFactory(
                this.getCoreContractABI(),
                coreBytecode,
                this.wallets.COLLECTOR
            );
            
            console.log('Deploying core contract...');
            const coreContract = await coreFactory.deploy(storageAddress);
            await coreContract.waitForDeployment();
            
            const coreAddress = await coreContract.getAddress();
            console.log('✅ Core contract deployed at:', coreAddress);
            
            // Link contracts
            console.log('Linking contracts...');
            const linkTx = await storageContract.setCoreContract(coreAddress);
            await linkTx.wait();
            console.log('✅ Contracts linked successfully');
            
            // Update contract addresses
            this.coreContractAddress = coreAddress;
            this.storageContractAddress = storageAddress;
            this.coreContract = coreContract;
            this.storageContract = storageContract;
            
            return {
                success: true,
                coreContractAddress: coreAddress,
                storageContractAddress: storageAddress,
                coreTransactionHash: coreContract.deploymentTransaction().hash,
                storageTransactionHash: storageContract.deploymentTransaction().hash
            };
        } catch (error) {
            console.error('❌ Contract deployment failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async registerOrganizations() {
        try {
            if (!this.coreContract || !this.wallets.COLLECTOR) {
                throw new Error('Contract or wallet not initialized');
            }
            
            const contractWithSigner = this.coreContract.connect(this.wallets.COLLECTOR);
            
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
            
            const contractWithSigner = this.coreContract.connect(wallet);
            
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
            
            const contractWithSigner = this.coreContract.connect(wallet);
            
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
            
            const contractWithSigner = this.coreContract.connect(wallet);
            
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
            
            const contractWithSigner = this.coreContract.connect(wallet);
            
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
            if (!this.coreContract) {
                throw new Error('Contract not initialized');
            }
            
            const eventIds = await this.coreContract.getBatchEvents(batchId);
            const events = [];
            
            for (const eventId of eventIds) {
                const event = await this.storageContract.events(eventId);
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
            if (!this.coreContract) {
                throw new Error('Contract not initialized');
            }
            
            const batchIds = await this.coreContract.getAllBatches();
            const batches = [];
            
            for (const batchId of batchIds) {
                const batch = await this.storageContract.batches(batchId);
                if (batch.exists) {
                    batches.push({
                        batchId: batch.batchId,
                        herbSpecies: batch.herbSpecies,
                        creator: batch.creator,
                        createdAt: Number(batch.createdAt),
                        lastUpdated: Number(batch.lastUpdated),
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
            if (!this.coreContract) {
                throw new Error('Contract not initialized');
            }
            
            // Get all events from the contract
            const filter = this.coreContract.filters.EventAdded();
            const events = await this.coreContract.queryFilter(filter);
            
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