# HerbionYX Kaleido Besu Setup Guide - Direct Deployment

## Prerequisites

### 1. Create Kaleido Account
- Go to [https://console.kaleido.io](https://console.kaleido.io)
- Sign up for a free account
- Free tier includes 2 nodes which is perfect for our setup

### 2. Install Node.js and Dependencies
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install project dependencies
npm install
cd server && npm install
```

## Kaleido Network Setup

### 1. Create Consortium
1. **Login to Kaleido Console**
   - Navigate to [https://console.kaleido.io](https://console.kaleido.io)
   - Click "Create Consortium"

2. **Configure Consortium**
   - **Name**: HerbionYX-Consortium
   - **Description**: Ayurvedic Herb Traceability Network
   - **Protocol**: Ethereum
   - **Consensus**: IBFT 2.0
   - **Region**: Choose your preferred region

3. **Create Environment**
   - **Name**: HerbionYX-Production (or HerbionYX-Sandbox for testing)
   - **Description**: Production environment for herb traceability
   - **Consensus**: IBFT 2.0

### 2. Add Nodes
1. **Create First Node**
   - **Name**: Collector-Tester-Node
   - **Description**: Node for Collector and Tester organizations
   - **Size**: Small (free tier)

2. **Create Second Node**
   - **Name**: Processor-Manufacturer-Node
   - **Description**: Node for Processor and Manufacturer organizations
   - **Size**: Small (free tier)

### 3. Get Connection Details
1. **Navigate to your Environment**
2. **Click on "Connect"**
3. **Copy the following details**:
   - **RPC Endpoint**: `https://your-consortium-id-your-environment-id-connect.us0-aws.kaleido.io`
   - **API Key**: Generate and copy your API key
   - **Signing Key**: Generate and copy your signing key

## Smart Contract Deployment (Direct Method - No MetaMask)

### 1. Prepare Contract for Deployment

Create a deployment script that will compile and deploy directly to Kaleido:

```bash
# Create deployment directory
mkdir deployment
cd deployment

# Install required packages
npm init -y
npm install --save ethers@^6.8.1 solc@^0.8.19 dotenv
```

### 2. Create Deployment Script

Create `deploy.js`:

```javascript
const { ethers } = require('ethers');
const solc = require('solc');
const fs = require('fs');
require('dotenv').config();

async function deployContract() {
    // Read the contract source code
    const contractSource = fs.readFileSync('../contracts/HerbTraceability.sol', 'utf8');
    
    // Compile the contract
    const input = {
        language: 'Solidity',
        sources: {
            'HerbTraceability.sol': {
                content: contractSource
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            },
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    };
    
    console.log('Compiling contract...');
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors) {
        output.errors.forEach(error => {
            console.error(error.formattedMessage);
        });
        if (output.errors.some(error => error.severity === 'error')) {
            process.exit(1);
        }
    }
    
    const contract = output.contracts['HerbTraceability.sol']['HerbTraceability'];
    const bytecode = contract.evm.bytecode.object;
    const abi = contract.abi;
    
    // Save ABI for later use
    fs.writeFileSync('HerbTraceability.json', JSON.stringify({
        abi: abi,
        bytecode: bytecode
    }, null, 2));
    
    // Connect to Kaleido
    const provider = new ethers.JsonRpcProvider(process.env.KALEIDO_API_URL, {
        name: 'kaleido',
        chainId: parseInt(process.env.CHAIN_ID || '1337')
    });
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    
    console.log('Deploying from address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'ETH');
    
    // Create contract factory
    const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    // Deploy contract
    console.log('Deploying contract...');
    const deployedContract = await contractFactory.deploy({
        gasLimit: 3000000 // Set appropriate gas limit
    });
    
    // Wait for deployment
    await deployedContract.waitForDeployment();
    const contractAddress = await deployedContract.getAddress();
    
    console.log('Contract deployed successfully!');
    console.log('Contract Address:', contractAddress);
    console.log('Transaction Hash:', deployedContract.deploymentTransaction().hash);
    
    // Register organizations
    console.log('Registering organizations...');
    
    const organizations = [
        {
            address: process.env.COLLECTOR_ADDRESS,
            name: "Collector Organization",
            type: 0 // COLLECTOR
        },
        {
            address: process.env.TESTER_ADDRESS,
            name: "Tester Organization", 
            type: 1 // TESTER
        },
        {
            address: process.env.PROCESSOR_ADDRESS,
            name: "Processor Organization",
            type: 2 // PROCESSOR
        },
        {
            address: process.env.MANUFACTURER_ADDRESS,
            name: "Manufacturer Organization",
            type: 3 // MANUFACTURER
        }
    ];
    
    for (const org of organizations) {
        try {
            const tx = await deployedContract.registerOrganization(
                org.address,
                org.name,
                org.type,
                { gasLimit: 200000 }
            );
            await tx.wait();
            console.log(`✅ Registered ${org.name} at ${org.address}`);
        } catch (error) {
            console.error(`❌ Failed to register ${org.name}:`, error.message);
        }
    }
    
    // Save deployment info
    const deploymentInfo = {
        contractAddress: contractAddress,
        transactionHash: deployedContract.deploymentTransaction().hash,
        deployedAt: new Date().toISOString(),
        network: 'Kaleido Besu',
        organizations: organizations
    };
    
    fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n🎉 Deployment completed successfully!');
    console.log('📄 Contract details saved to deployment.json');
    console.log('📄 ABI saved to HerbTraceability.json');
    
    return {
        contractAddress,
        abi,
        deploymentInfo
    };
}

// Run deployment
deployContract()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Deployment failed:', error);
        process.exit(1);
    });
```

### 3. Create Environment Configuration

Create `.env` file in deployment directory:

```bash
# Kaleido Network Configuration
KALEIDO_API_URL=https://your-consortium-id-your-environment-id-connect.us0-aws.kaleido.io
KALEIDO_API_KEY=your_actual_api_key_here
CHAIN_ID=1337

# Deployer Account (should have ETH for gas)
DEPLOYER_PRIVATE_KEY=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d

# Organization Addresses
COLLECTOR_ADDRESS=0x627306090abab3a6e1400e9345bc60c78a8bef57
TESTER_ADDRESS=0xf17f52151ebef6c7334fad080c5704d77216b732
PROCESSOR_ADDRESS=0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef
MANUFACTURER_ADDRESS=0x821aea9a577a9b44299b9c15c88cf3087f3b5544
```

### 4. Deploy the Contract

```bash
# Navigate to deployment directory
cd deployment

# Run deployment
node deploy.js
```

Expected output:
```
Compiling contract...
Deploying from address: 0x627306090abab3a6e1400e9345bc60c78a8bef57
Balance: 100.0 ETH
Deploying contract...
Contract deployed successfully!
Contract Address: 0x1234567890123456789012345678901234567890
Transaction Hash: 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
Registering organizations...
✅ Registered Collector Organization at 0x627306090abab3a6e1400e9345bc60c78a8bef57
✅ Registered Tester Organization at 0xf17f52151ebef6c7334fad080c5704d77216b732
✅ Registered Processor Organization at 0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef
✅ Registered Manufacturer Organization at 0x821aea9a577a9b44299b9c15c88cf3087f3b5544

🎉 Deployment completed successfully!
```

## Backend Configuration

### 1. Update server/.env

```bash
# Kaleido Besu Configuration
KALEIDO_API_URL=https://your-consortium-id-your-environment-id-connect.us0-aws.kaleido.io
KALEIDO_API_KEY=your_actual_api_key_here
KALEIDO_SIGNING_KEY=your_actual_signing_key_here

# Smart Contract Configuration (from deployment.json)
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# Organization Addresses
COLLECTOR_ADDRESS=0x627306090abab3a6e1400e9345bc60c78a8bef57
TESTER_ADDRESS=0xf17f52151ebef6c7334fad080c5704d77216b732
PROCESSOR_ADDRESS=0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef
MANUFACTURER_ADDRESS=0x821aea9a577a9b44299b9c15c88cf3087f3b5544

# Organization Private Keys
COLLECTOR_PRIVATE_KEY=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
TESTER_PRIVATE_KEY=0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1
PROCESSOR_PRIVATE_KEY=0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c
MANUFACTURER_PRIVATE_KEY=0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913

# IPFS Configuration (Pinata)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# Application Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 2. Copy Contract ABI

```bash
# Copy the generated ABI to server directory
cp deployment/HerbTraceability.json server/contracts/
```

## Testing the Deployment

### 1. Test Contract Functions

Create `test-contract.js`:

```javascript
const { ethers } = require('ethers');
const contractData = require('./HerbTraceability.json');
require('dotenv').config();

async function testContract() {
    const provider = new ethers.JsonRpcProvider(process.env.KALEIDO_API_URL);
    const wallet = new ethers.Wallet(process.env.COLLECTOR_PRIVATE_KEY, provider);
    
    const contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        contractData.abi,
        wallet
    );
    
    console.log('Testing contract functions...');
    
    // Test organization registration check
    const org = await contract.organizations(process.env.COLLECTOR_ADDRESS);
    console.log('Collector organization:', org);
    
    // Test batch creation
    const batchId = `HERB-${Date.now()}-TEST`;
    const eventId = `COLLECTION-${Date.now()}-TEST`;
    
    try {
        const tx = await contract.createCollectionEvent(
            batchId,
            eventId,
            "Ashwagandha",
            "Test Collector",
            1000, // 1000 grams
            "2024-01-15",
            "Himalayan Region",
            "A+",
            "Test collection",
            "QmTestIPFSHash",
            "TestQRHash",
            { gasLimit: 500000 }
        );
        
        await tx.wait();
        console.log('✅ Test batch created successfully');
        console.log('Batch ID:', batchId);
        console.log('Transaction:', tx.hash);
        
        // Test batch retrieval
        const batch = await contract.batches(batchId);
        console.log('Retrieved batch:', batch);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testContract();
```

### 2. Run Tests

```bash
cd deployment
node test-contract.js
```

## Production Workflow

### 1. Start Backend Server
```bash
cd server
npm run dev
```

### 2. Start Frontend
```bash
# In a new terminal
npm run dev
```

### 3. Access Application
- Open [http://localhost:5173](http://localhost:5173)
- Use demo credentials to login
- Test the complete workflow

### 4. Verify Blockchain Transactions
1. **Login as Admin**
2. **Go to Dashboard**
3. **Check "Recent Blockchain Transactions" section**
4. **Click "Refresh Transactions" to fetch from Kaleido**

## Gas Optimization Features

The optimized contract includes:

1. **Packed Structs**: Using smaller data types (uint16, uint32) where appropriate
2. **Calldata Parameters**: Using `calldata` instead of `memory` for external functions
3. **Efficient Mappings**: Direct batch-to-events mapping for faster lookups
4. **Reduced Storage**: Optimized data structures to minimize storage slots
5. **Event Count Tracking**: Using uint8 for event counting instead of array length
6. **Input Validation**: Early validation to prevent unnecessary gas consumption

## Monitoring and Maintenance

### 1. Kaleido Console Monitoring
- Monitor node health in Kaleido console
- Check transaction throughput
- Monitor gas usage patterns

### 2. Contract Interaction Logs
```bash
# Monitor backend logs
cd server
npm run dev

# Check for successful transactions
tail -f logs/blockchain.log
```

### 3. Performance Metrics
- Average gas per transaction: ~150,000 gas
- Block confirmation time: ~3-5 seconds
- Transaction throughput: ~100 TPS

## Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check private key has sufficient balance
   - Verify Kaleido API URL and credentials
   - Ensure contract compiles without errors

2. **Transaction Failures**
   - Increase gas limit in function calls
   - Check organization permissions
   - Verify contract address is correct

3. **Connection Issues**
   - Verify Kaleido nodes are running
   - Check API key permissions
   - Test network connectivity

### Gas Optimization Tips

1. **Use appropriate data types**: uint16 instead of uint256 where possible
2. **Pack structs efficiently**: Group small data types together
3. **Use calldata for external functions**: Saves gas on parameter passing
4. **Minimize storage operations**: Read from storage once, use memory variables
5. **Batch operations**: Combine multiple operations in single transaction

This completes the direct deployment setup for HerbionYX on Kaleido Besu without MetaMask dependency.