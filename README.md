# 🌿 HerbionYX - Kaleido Besu-Based Ayurvedic Herb Traceability System

A comprehensive Kaleido Besu-based traceability system for Ayurvedic herbs with enterprise-grade blockchain technology and real QR code generation.

## 🚀 Features

### Core Functionality
- **Enterprise Blockchain**: Kaleido Besu with IBFT 2.0 consensus
- **Demo Mode**: No backend required, works entirely in browser
- **Role-Based Access**: Collector, Tester, Processor, Manufacturer, Admin roles
- **QR-Based Workflow**: Each process starts with QR code scanning
- **Real QR Generation**: Actual QR codes with tracking links
- **Simulated IPFS**: Demo IPFS functionality for development
- **Glass Morphism UI**: Modern, beautiful interface design
- **140 Herb Species**: Complete Ayurvedic herb database

### Smart Contracts
- **HerbTraceability**: Complete supply chain event recording in Solidity
- **Role-Based Permissions**: Built-in access control
- **Event Tracking**: Collection, Quality Test, Processing, Manufacturing events

### Technology Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Blockchain**: Kaleido Besu with IBFT 2.0
- **Smart Contracts**: Solidity
- **Network**: Permissioned Ethereum network
- **Deployment**: Kaleido Cloud Platform
- **QR Codes**: Real QR code generation with tracking

## 🏗️ Architecture

```
Frontend (React + Vite)     →    Browser-based Demo
Smart Contract (Solidity)   →    Kaleido Besu Network
Backend API                 →    Ethers.js SDK
Deployment                  →    Kaleido Cloud Platform
```

## 📋 Prerequisites

- Node.js 18+
- Kaleido account (free tier available)
- Remix IDE for contract compilation
- 4GB+ RAM recommended

## 🛠️ Quick Setup Guide

### 1. Create Kaleido Environment
```bash
# 1. Go to https://console.kaleido.io
# 2. Create a new consortium
# 3. Choose Ethereum/Besu protocol
# 4. Set consensus to IBFT 2.0
# 5. Create 2 nodes (free tier limit)
# 6. Get your API URL and keys

# Install dependencies
npm install
cd server && npm install
```

### 2. Deploy Smart Contract
```bash
# 1. Open Remix IDE (https://remix.ethereum.org)
# 2. Copy contracts/HerbTraceability.sol
# 3. Compile with Solidity 0.8.19
# 4. Deploy to your Kaleido network
# 5. Update .env with contract address and keys
```

### 3. Configure Environment
```bash
# Update server/.env with your Kaleido details
KALEIDO_API_URL=https://your-consortium-id-your-environment-id-connect.us0-aws.kaleido.io
KALEIDO_API_KEY=your_api_key_here
CONTRACT_ADDRESS=your_deployed_contract_address
```

### 4. Start Backend and Frontend
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev
```

## 🎯 User Workflow

### 1. Landing Page
- Beautiful glass morphism design
- Credits to SENTINELS
- Enter button to access platform

### 2. Login System
Demo credentials available:
- **Collector**: collector@demo.com / demo123
- **Tester**: tester@demo.com / demo123
- **Processor**: processor@demo.com / demo123
- **Manufacturer**: manufacturer@demo.com / demo123
- **Admin**: admin@demo.com / demo123
- **Consumer**: consumer@demo.com / demo123

### 3. QR-Based Process Flow
The system supports 4 organizations across 2 Kaleido nodes:

#### Collection (Farmer/Collector)
1. Login as collector
2. Fill herb details (species, weight, location)
3. Upload herb image (optional)
4. Submit → Creates batch on Kaleido network
5. **Real QR code generated** with tracking URL
#### Quality Testing
1. Login as tester
2. **Scan/paste QR code** from collection
3. Auto-fills batch and parent event IDs
4. Enter test results (moisture, purity, pesticide levels)
5. Submit → Records on Kaleido network
6. **New QR code generated**
#### Processing
1. Login as processor
2. **Scan/paste QR code** from quality test
3. Select processing method and parameters
4. Submit → Records on Kaleido network
5. **New QR code generated**
#### Manufacturing
1. Login as manufacturer
2. **Scan/paste QR code** from processing
3. Enter final product details
4. Submit → Records on Kaleido network
5. **Final consumer QR code generated**
#### Consumer Verification
1. Login as consumer (or public access)
2. **Scan final product QR code**
3. View complete supply chain journey
4. Verify authenticity and quality

## 🔧 Technical Implementation

### Demo Mode Features
- **Browser-Only**: No backend server required
- **Mock Authentication**: Demo users with different roles
- **Simulated Kaleido**: Real smart contract structure, demo transactions
- **Real QR Codes**: Actual QR code generation and scanning
- **Responsive UI**: Works on all device sizes

### UI/UX Features
- **Multiple User Roles**: Switch between different user types
- **Glass Morphism**: Modern, translucent design elements
- **Responsive**: Works on all device sizes
- **Real-time**: Live Kaleido network interaction
- **Error Handling**: Comprehensive error messages

## 🌿 Supported Herbs (140 Species)

The system includes a comprehensive database of Ayurvedic herbs:

**Popular Herbs Include:**
- Ashwagandha (Withania somnifera)
- Brahmi (Bacopa monnieri)
- Tulsi (Ocimum tenuiflorum)
- Neem (Azadirachta indica)
- Amla (Emblica officinalis)

Complete list of Ayurvedic herbs including:
Talispatra, Chirmati, Katha, Vatsnabh, Atees, Vach, Adusa, Bael, Shirish, Ghritkumari, Smaller Galangal, Greater Galangal, Saptaparna, Silarasa, Akarkara, Kalmegh, Agar, Artemisia, Shatavari, Atropa, Neem, Brahmi, Daruhaldi, Pashanbheda, Punarnava, Patang, Senna, Sadabahar, Malkangani, Mandukparni, Safed Musli, Tejpatta, Dalchini, Kapoor, Arni, Aparajita, Patharchur, Hrivera, Guggul, Shankhpushpi, Mamira, Peela Chandan, Varun, Krishnasariva, Kali Musli, Tikhur, Nannari, Salampanja, Sarivan, Foxglove, Ratalu, Bhringraj, Vai, Vidang, Amla, Somlata, Hing, Kokum, Trayamana, Ginkgo, Kalihari, Mulethi, Gambhari, Gudmar, Kapurkachari, Anantmool, Seabuckthorn, Kutaj, Khurasani Ajwain, Pushkarmool, Giant Potato, Vriddhadaruka, Trivrit, Hapusha, Dhoop, Indian Crocus, Chandrasur, Jivanti, Litsea, Ghanera, Nagakeshar, Sahjan, Konch, Jatamansi, Tulsi, Ratanjot, Syonaka, Ginseng, Bhumi Amlaki, Kutki, Kababchini, Pippali, Isabgol, Rasna, Leadwort, Chitrak, Bankakri, Mahameda, Agnimanth, Moovila, Bakuchi, Beejasar, Raktachandan, Vidarikand, Sarpagandha, Archa, Manjishtha, Saptarangi, Chandan, Ashok, Kuth, Bala, Hriddhatri, Katheli, Makoy, Patala, Madhukari, Chirata, Lodh, Rohitak, Thuner, Sharapunkha, Arjuna, Bahera, Harad, Giloy, Barhanta, Patol, Jeevani, Damabooti, Prishnaparni, Tagar, Indian Valerian, Mandadhupa, Khas, Banafsha, Nirgundi, Ashwagandha, Dhataki, Timoo

## 🚀 Production Deployment

### Kaleido Network Deployment
1. **Create Kaleido consortium** with 2+ nodes
2. **Deploy smart contract** using Remix IDE
3. **Configure API keys** and contract address
4. **Register organizations** on the contract

### Frontend Deployment
1. **Build**: `npm run build`
2. **Deploy**: Upload `dist` folder to any static hosting
3. **Configure**: Update Kaleido endpoints after deployment

## 🔐 Security Features

- **Role-based Access Control**: Chaincode enforced permissions  
- **Demo Authentication**: Secure demo user system
- **Blockchain Immutability**: Permanent record keeping with IBFT 2.0 consensus
- **QR Code Verification**: Cryptographic hash verification
- **Input Validation**: Comprehensive form validation
- **Permissioned Network**: Only authorized participants can join

## 🤝 Contributing

This is a demo system ready for production enhancement. To contribute:
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

For technical support:
- Review the Kaleido documentation
- Check smart contract deployment on Kaleido network
- Test with demo credentials provided
- Verify QR code generation and scanning

## 📄 License

MIT License - Open source and free to use for educational and commercial purposes.

## 👥 Credits

**Built by SENTINELS Team**
- Revolutionary Kaleido Besu-based traceability
- Production-ready architecture
- Modern UI/UX design
- Comprehensive documentation

**🌱 Revolutionizing Ayurvedic Supply Chain with Kaleido Besu**

## 🎯 Quick Start Commands

```bash
# Install dependencies
npm install
cd server && npm install

# Deploy smart contract to Kaleido
# 1. Use Remix IDE
# 2. Deploy HerbTraceability.sol
# 3. Update .env with contract details

# Start backend (new terminal)
cd server
npm run dev
```

# Start frontend (new terminal)  
cd ..
npm run dev

# Access at http://localhost:5173
**Demo Login**: Use the provided demo credentials to test different user roles!