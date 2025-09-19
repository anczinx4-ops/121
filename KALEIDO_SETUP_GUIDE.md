# HerbionYX Kaleido Besu Setup Guide

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

## Smart Contract Deployment

### 1. Open Remix IDE
- Go to [https://remix.ethereum.org](https://remix.ethereum.org)
- Create a new file: `HerbTraceability.sol`

### 2. Copy Smart Contract Code
```solidity
// Copy the entire content from contracts/HerbTraceability.sol
// Paste it into Remix IDE
```

### 3. Compile Contract
1. **Go to Solidity Compiler tab**
2. **Select Compiler Version**: 0.8.19
3. **Click "Compile HerbTraceability.sol"**
4. **Ensure no compilation errors**

### 4. Deploy Contract
1. **Go to Deploy & Run Transactions tab**
2. **Environment**: Select "Injected Provider - MetaMask" or "External Http Provider"
3. **If using External Http Provider**:
   - Enter your Kaleido RPC endpoint
   - Use your API key for authentication
4. **Select Contract**: HerbTraceability
5. **Click "Deploy"**
6. **Copy the deployed contract address**

### 5. Generate Organization Accounts
```bash
# You can use any Ethereum wallet generator or create accounts in MetaMask
# For demo purposes, you can use these test accounts:

# Collector Organization
Address: 0x627306090abab3a6e1400e9345bc60c78a8bef57
Private Key: 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d

# Tester Organization  
Address: 0xf17f52151ebef6c7334fad080c5704d77216b732
Private Key: 0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1

# Processor Organization
Address: 0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef
Private Key: 0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c

# Manufacturer Organization
Address: 0x821aea9a577a9b44299b9c15c88cf3087f3b5544
Private Key: 0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913
```

## Environment Configuration

### 1. Update server/.env
```bash
# Kaleido Besu Configuration
KALEIDO_API_URL=https://your-consortium-id-your-environment-id-connect.us0-aws.kaleido.io
KALEIDO_API_KEY=your_actual_api_key_here
KALEIDO_SIGNING_KEY=your_actual_signing_key_here

# Smart Contract Configuration
CONTRACT_ADDRESS=your_deployed_contract_address_here

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

## Register Organizations

### 1. Start Backend Server
```bash
cd server
npm run dev
```

### 2. Deploy Contract and Register Organizations
```bash
# Make a POST request to deploy and register
curl -X POST http://localhost:5000/api/blockchain/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

### 3. Verify Registration
```bash
# Check if organizations are registered
curl -X GET http://localhost:5000/api/blockchain/transactions \
  -H "Authorization: Bearer your_jwt_token"
```

## Testing the System

### 1. Start Frontend
```bash
# In a new terminal
npm run dev
```

### 2. Access Application
- Open [http://localhost:5173](http://localhost:5173)
- Use demo credentials to login
- Test the complete workflow

### 3. Verify Blockchain Transactions
1. **Login as Admin**
2. **Go to Dashboard**
3. **Check "Recent Blockchain Transactions" section**
4. **Click "Refresh Transactions" to fetch from Kaleido**

## Production Deployment

### 1. Kaleido Production Environment
- Create a production consortium
- Use production-grade node sizes
- Enable monitoring and alerting
- Set up backup and disaster recovery

### 2. Security Considerations
- Use hardware security modules (HSM) for key management
- Implement proper key rotation
- Set up network security groups
- Enable audit logging

### 3. Monitoring
- Set up Kaleido monitoring dashboards
- Configure alerts for node health
- Monitor transaction throughput
- Track gas usage and costs

## Troubleshooting

### Common Issues

1. **Contract Deployment Fails**
   - Check Solidity compiler version (use 0.8.19)
   - Ensure sufficient balance in deployer account
   - Verify network connectivity to Kaleido

2. **Transaction Failures**
   - Check gas limits in contract calls
   - Verify organization permissions
   - Ensure proper private key configuration

3. **Connection Issues**
   - Verify API URL and keys
   - Check network firewall settings
   - Ensure Kaleido nodes are running

### Gas Optimization

The smart contract is designed to minimize gas usage:
- Uses `uint256` for decimal values (multiplied by 100/1000000)
- Efficient storage patterns
- Minimal external calls
- Optimized for batch operations

### Support Resources

- [Kaleido Documentation](https://docs.kaleido.io/)
- [Ethereum Solidity Documentation](https://docs.soliditylang.org/)
- [Ethers.js Documentation](https://docs.ethers.org/)

This completes the Kaleido Besu setup for the HerbionYX traceability system.