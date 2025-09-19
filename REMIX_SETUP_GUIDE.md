# 🌿 HerbionYX - Complete Manual Setup Guide with Remix IDE

## Step-by-Step Manual Setup (No Automation)

### Phase 1: Environment Setup

#### 1.1 Create Environment File
First, create your environment configuration:

**Create `server/.env` file:**
```bash
# Kaleido Besu Configuration
KALEIDO_API_URL=https://your-consortium-id-your-environment-id-connect.us0-aws.kaleido.io
KALEIDO_API_KEY=your_actual_api_key_here
KALEIDO_SIGNING_KEY=your_actual_signing_key_here

# Smart Contract Configuration (will be filled after deployment)
CONTRACT_ADDRESS=

# Organization Addresses (will be filled after Kaleido setup)
COLLECTOR_ADDRESS=
TESTER_ADDRESS=
PROCESSOR_ADDRESS=
MANUFACTURER_ADDRESS=

# Organization Private Keys (will be filled after Kaleido setup)
COLLECTOR_PRIVATE_KEY=
TESTER_PRIVATE_KEY=
PROCESSOR_PRIVATE_KEY=
MANUFACTURER_PRIVATE_KEY=

# IPFS Configuration (Pinata)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# Application Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=herbionyx_enterprise_secret_key_2024
```

#### 1.2 Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### Phase 2: Kaleido Network Setup

#### 2.1 Create Kaleido Account
1. Go to [https://console.kaleido.io](https://console.kaleido.io)
2. Sign up for a free account
3. Verify your email

#### 2.2 Create Consortium
1. **Click "Create Consortium"**
2. **Fill in details:**
   - **Name**: `HerbionYX-Consortium`
   - **Description**: `Ayurvedic Herb Traceability Network`
   - **Protocol**: `Ethereum`
   - **Consensus**: `IBFT 2.0`
   - **Region**: Choose your preferred region
3. **Click "Create"**

#### 2.3 Create Environment
1. **In your consortium, click "Create Environment"**
2. **Fill in details:**
   - **Name**: `HerbionYX-Production`
   - **Description**: `Production environment for herb traceability`
   - **Consensus**: `IBFT 2.0`
3. **Click "Create"**

#### 2.4 Add Nodes
1. **Create First Node:**
   - **Name**: `Collector-Tester-Node`
   - **Description**: `Node for Collector and Tester organizations`
   - **Size**: `Small` (free tier)
   - **Click "Create"**

2. **Create Second Node:**
   - **Name**: `Processor-Manufacturer-Node`
   - **Description**: `Node for Processor and Manufacturer organizations`
   - **Size**: `Small` (free tier)
   - **Click "Create"**

#### 2.5 Get Connection Details
1. **Navigate to your Environment**
2. **Click on "Connect" tab**
3. **Copy these details and update your `.env` file:**
   - **RPC Endpoint** → `KALEIDO_API_URL`
   - **API Key** → `KALEIDO_API_KEY`
   - **Signing Key** → `KALEIDO_SIGNING_KEY`

#### 2.6 Create Wallet Addresses
1. **Go to "Wallets" section in Kaleido**
2. **Create 4 wallets:**
   - `Collector-Wallet`
   - `Tester-Wallet`
   - `Processor-Wallet`
   - `Manufacturer-Wallet`
3. **Copy addresses and private keys to your `.env` file**

### Phase 3: Smart Contract Deployment with Remix

#### 3.1 Open Remix IDE
1. Go to [https://remix.ethereum.org](https://remix.ethereum.org)
2. Create a new file: `HerbTraceability.sol`
3. Copy the entire contract code from `contracts/HerbTraceability.sol`

#### 3.2 Compile Contract in Remix
1. **Go to "Solidity Compiler" tab (📄 icon)**
2. **Set compiler version to `0.8.19`**
3. **Enable optimization:**
   - Check "Enable optimization"
   - Set runs to `200`
   - **IMPORTANT**: Check "Enable viaIR" to fix stack too deep error
4. **Click "Compile HerbTraceability.sol"**
5. **Verify no errors (should show green checkmark)**

#### 3.3 Connect Remix to Kaleido
1. **Go to "Deploy & Run Transactions" tab (🚀 icon)**
2. **Environment**: Select "Injected Provider - MetaMask"
3. **If you don't have MetaMask:**
   - Install MetaMask browser extension
   - Create/import wallet
   - Add Kaleido network:
     - **Network Name**: `HerbionYX Kaleido`
     - **RPC URL**: Your `KALEIDO_API_URL`
     - **Chain ID**: `1337` (or check Kaleido console)
     - **Currency Symbol**: `ETH`

#### 3.4 Deploy Contract
1. **Select contract**: `HerbTraceability`
2. **Click "Deploy"**
3. **Confirm transaction in MetaMask**
4. **Wait for deployment confirmation**
5. **Copy deployed contract address**
6. **Update `.env` file with `CONTRACT_ADDRESS`**

#### 3.5 Register Organizations
After deployment, you'll see the contract in "Deployed Contracts" section:

1. **Expand the deployed contract**
2. **Find `registerOrganization` function**
3. **Register each organization:**

   **For Collector:**
   - `_orgAddress`: Your collector wallet address
   - `_name`: "Collector Organization"
   - `_orgType`: `0` (COLLECTOR)
   - Click "transact"

   **For Tester:**
   - `_orgAddress`: Your tester wallet address
   - `_name`: "Tester Organization"
   - `_orgType`: `1` (TESTER)
   - Click "transact"

   **For Processor:**
   - `_orgAddress`: Your processor wallet address
   - `_name`: "Processor Organization"
   - `_orgType`: `2` (PROCESSOR)
   - Click "transact"

   **For Manufacturer:**
   - `_orgAddress`: Your manufacturer wallet address
   - `_name`: "Manufacturer Organization"
   - `_orgType`: `3` (MANUFACTURER)
   - Click "transact"

### Phase 4: Backend Configuration

#### 4.1 Update Backend Configuration
1. **Copy contract ABI from Remix:**
   - In Remix, go to "Solidity Compiler" tab
   - Scroll down to "Compilation Details"
   - Click on "HerbTraceability"
   - Copy the ABI
   - Create `server/contracts/HerbTraceability.json`:
   ```json
   {
     "abi": [PASTE_ABI_HERE]
   }
   ```

#### 4.2 Test Backend Connection
```bash
cd server
node -e "
const { ethers } = require('ethers');
require('dotenv').config();

async function test() {
  const provider = new ethers.JsonRpcProvider(process.env.KALEIDO_API_URL);
  const blockNumber = await provider.getBlockNumber();
  console.log('✅ Connected to Kaleido! Block number:', blockNumber);
}
test().catch(console.error);
"
```

### Phase 5: IPFS Setup (Pinata)

#### 5.1 Create Pinata Account
1. Go to [https://pinata.cloud](https://pinata.cloud)
2. Sign up for free account
3. Go to "API Keys" section
4. Create new API key with full permissions
5. Copy API Key and Secret to your `.env` file

### Phase 6: Start the Application

#### 6.1 Start Backend
```bash
cd server
npm run dev
```
**Expected output:**
```
🌿 HerbionYX API Server running on port 5000
🔗 Health check: http://localhost:5000/health
🌐 Environment: development
```

#### 6.2 Start Frontend (New Terminal)
```bash
npm run dev
```
**Expected output:**
```
  VITE v5.4.2  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Phase 7: Test the System

#### 7.1 Access Application
1. Open [http://localhost:5173](http://localhost:5173)
2. You should see the beautiful landing page
3. Click "ENTER PLATFORM"

#### 7.2 Test Login
Use these demo credentials:
- **Collector**: `collector@demo.com` / `demo123`
- **Tester**: `tester@demo.com` / `demo123`
- **Processor**: `processor@demo.com` / `demo123`
- **Manufacturer**: `manufacturer@demo.com` / `demo123`
- **Admin**: `admin@demo.com` / `demo123`

#### 7.3 Test Complete Workflow
1. **Login as Collector** → Create a batch
2. **Login as Tester** → Add quality test (use QR from step 1)
3. **Login as Processor** → Add processing (use QR from step 2)
4. **Login as Manufacturer** → Add manufacturing (use QR from step 3)
5. **Login as Consumer** → Verify final product (use QR from step 4)

### Phase 8: Verify Blockchain Transactions

#### 8.1 Check Kaleido Console
1. Go to your Kaleido environment
2. Click on "Explorer" or "Transactions"
3. You should see your contract deployment and function calls

#### 8.2 Check Application Dashboard
1. Login as Admin
2. Go to Dashboard
3. Check "Recent Blockchain Transactions" section
4. Click "Refresh Transactions" to fetch from Kaleido

## Troubleshooting

### Common Issues and Solutions

#### 1. "Stack too deep" Error
**Solution**: The contract has been fixed with:
- Reduced local variables in functions
- Used storage references instead of memory
- Enabled `viaIR` compilation in Remix

#### 2. MetaMask Connection Issues
**Solution**:
- Make sure you added Kaleido network to MetaMask
- Check RPC URL is correct
- Ensure you have ETH in your wallet for gas

#### 3. Contract Deployment Fails
**Solution**:
- Check you have enough ETH for gas
- Verify Kaleido network is running
- Try increasing gas limit

#### 4. Backend Connection Fails
**Solution**:
- Verify `.env` file has correct Kaleido URL
- Check API keys are valid
- Test network connectivity

#### 5. Frontend Shows Errors
**Solution**:
- Make sure backend is running on port 5000
- Check browser console for specific errors
- Verify all dependencies are installed

## Production Deployment Checklist

- [ ] Kaleido consortium created with 2+ nodes
- [ ] Smart contract deployed and verified
- [ ] All 4 organizations registered
- [ ] Environment variables configured
- [ ] IPFS (Pinata) configured
- [ ] Backend API running and connected
- [ ] Frontend built and deployed
- [ ] End-to-end workflow tested
- [ ] Blockchain transactions verified

## Security Notes

- Keep private keys secure and never commit to version control
- Use environment variables for all sensitive data
- Enable HTTPS in production
- Implement proper authentication and authorization
- Regular security audits of smart contracts

## Support

If you encounter issues:
1. Check Kaleido console for network status
2. Verify all environment variables are set
3. Test each component individually
4. Check browser console for frontend errors
5. Review server logs for backend issues

**🎉 Congratulations! Your HerbionYX system is now running on Kaleido Besu blockchain!**