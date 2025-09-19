# 🚀 HerbionYX Quick Start Guide

## TL;DR - Get Running in 30 Minutes

### 1. Prerequisites (5 minutes)
- Node.js 18+ installed
- MetaMask browser extension
- Kaleido account (free at console.kaleido.io)
- Pinata account (free at pinata.cloud)

### 2. Environment Setup (5 minutes)
```bash
# Clone and install
npm install
cd server && npm install

# Create server/.env file with your Kaleido and Pinata credentials
cp server/.env.example server/.env
# Edit server/.env with your actual values
```

### 3. Kaleido Setup (10 minutes)
1. **Create Consortium** at console.kaleido.io
2. **Add 2 nodes** (free tier limit)
3. **Create 4 wallets** for organizations
4. **Copy API URL, keys, and wallet addresses** to `.env`

### 4. Deploy Contract (5 minutes)
1. **Open Remix IDE** (remix.ethereum.org)
2. **Copy contract** from `contracts/HerbTraceability.sol`
3. **Compile with viaIR enabled** (fixes stack too deep error)
4. **Deploy to Kaleido network** via MetaMask
5. **Register 4 organizations** using Remix interface
6. **Copy contract address** to `.env`

### 5. Start Application (5 minutes)
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend  
npm run dev
```

### 6. Test (Demo Mode)
- Open http://localhost:5173
- Login with: `collector@demo.com` / `demo123`
- Create batch → Test → Process → Manufacture → Verify

## Demo Credentials
- **Collector**: collector@demo.com / demo123
- **Tester**: tester@demo.com / demo123  
- **Processor**: processor@demo.com / demo123
- **Manufacturer**: manufacturer@demo.com / demo123
- **Admin**: admin@demo.com / demo123
- **Consumer**: consumer@demo.com / demo123

## Key Files to Configure
- `server/.env` - All your credentials and addresses
- `server/contracts/HerbTraceability.json` - Contract ABI from Remix

## Need Help?
See `REMIX_SETUP_GUIDE.md` for detailed step-by-step instructions.

**🌿 Happy tracing!**