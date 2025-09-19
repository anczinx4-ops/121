# 🚀 Step-by-Step Remix Deployment Guide

## Quick Deployment Steps for Kaleido Sandbox

### Step 1: Prepare Remix IDE
1. Open [https://remix.ethereum.org](https://remix.ethereum.org)
2. Create new workspace: "HerbionYX-Optimized"
3. Create folder: "contracts"

### Step 2: Upload Contracts
1. Create `contracts/HerbTraceabilityStorage.sol`
2. Create `contracts/HerbTraceabilityCore.sol`
3. Copy the contract code from the files above

### Step 3: Compile Contracts
```bash
# Compiler Settings:
- Solidity Version: 0.8.19
- Enable Optimization: ✅
- Optimization Runs: 200
- Advanced Settings:
  - Enable viaIR: ✅ (CRITICAL - prevents stack too deep errors)
  - EVM Version: default
```

**Compilation Order:**
1. Compile `HerbTraceabilityStorage.sol` first
2. Then compile `HerbTraceabilityCore.sol`
3. Verify both show green checkmarks (no errors)

### Step 4: Connect to Kaleido Network
1. In MetaMask, add Kaleido network:
   - Network Name: "HerbionYX Kaleido Sandbox"
   - RPC URL: `https://your-consortium-id-your-environment-id-connect.us0-aws.kaleido.io`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

2. In Remix Deploy tab:
   - Environment: "Injected Provider - MetaMask"
   - Account: Select your deployer account
   - Gas Limit: 3000000

### Step 5: Deploy Storage Contract
1. Select "HerbTraceabilityStorage" from dropdown
2. Click "Deploy"
3. Confirm transaction in MetaMask
4. Wait for confirmation
5. **SAVE THE ADDRESS**: Copy deployed contract address (e.g., `0x1234...`)

### Step 6: Deploy Core Contract
1. Select "HerbTraceabilityCore" from dropdown
2. In constructor parameters, paste Storage contract address from Step 5
3. Click "Deploy"
4. Confirm transaction in MetaMask
5. Wait for confirmation
6. **SAVE THE ADDRESS**: Copy deployed contract address (e.g., `0x5678...`)

### Step 7: Link Contracts
1. In deployed Storage contract section, find "setCoreContract" function
2. Paste Core contract address from Step 6
3. Click "transact"
4. Confirm in MetaMask
5. Wait for confirmation

### Step 8: Register Organizations
Create 4 test wallets in MetaMask and register them:

```bash
# In Core contract, use "registerOrganization" function:

# Collector (orgType: 0)
registerOrganization("0xCollectorAddress", "Himalayan Herbs Collector", 0)

# Tester (orgType: 1)  
registerOrganization("0xTesterAddress", "Quality Testing Lab", 1)

# Processor (orgType: 2)
registerOrganization("0xProcessorAddress", "Herbal Processing Unit", 2)

# Manufacturer (orgType: 3)
registerOrganization("0xManufacturerAddress", "Ayurvedic Products Manufacturer", 3)
```

### Step 9: Test Deployment
Test these functions in Remix:
1. `getBatchCount()` - should return 0
2. `getEventCount()` - should return 0
3. `organizations(yourAddress)` - should show your registered org

### Step 10: Update Backend Configuration
Update `server/.env` with deployed addresses:
```env
CORE_CONTRACT_ADDRESS=0x5678... # From Step 6
STORAGE_CONTRACT_ADDRESS=0x1234... # From Step 5
```

## Gas Estimates

### Deployment Costs:
- **Storage Contract**: ~1,800,000 gas
- **Core Contract**: ~1,000,000 gas
- **Total Deployment**: ~2,800,000 gas (60% reduction from original)

### Function Call Costs:
- **createCollectionEvent**: ~180,000 gas
- **createQualityTestEvent**: ~160,000 gas
- **createProcessingEvent**: ~150,000 gas
- **createManufacturingEvent**: ~170,000 gas

## Troubleshooting

### Common Issues:

1. **"Stack too deep" Error**
   - ✅ Fixed in optimized contracts
   - Ensure "viaIR" is enabled in compiler

2. **"Contract creation code storage out of gas"**
   - Increase gas limit to 3,000,000
   - Use optimization with 200 runs

3. **"Invalid opcode" Error**
   - Check Solidity version is 0.8.19
   - Verify network compatibility

4. **Transaction Fails**
   - Ensure sufficient ETH in deployer account
   - Check gas limit is adequate
   - Verify network connection

### Success Indicators:
- ✅ Both contracts compile without errors
- ✅ Deployment transactions succeed
- ✅ Contract linking completes
- ✅ Test functions return expected values
- ✅ Organizations can be registered

## Next Steps
After successful deployment:
1. Update backend environment variables
2. Copy contract ABIs to backend
3. Test complete workflow
4. Deploy to production when ready

**🎉 Your optimized contracts are now deployed on Kaleido!**