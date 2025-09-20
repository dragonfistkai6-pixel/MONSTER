# 🌿 HerbionYX - Hyperledger Fabric-Based Ayurvedic Herb Traceability System

A comprehensive blockchain-based traceability system for Ayurvedic herbs using Hyperledger Fabric with enterprise-grade security and real QR code generation.

## 🏗️ System Architecture

### Frontend Architecture (React + TypeScript)
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
├─────────────────────────────────────────────────────────────┤
│  Components/                                                │
│  ├── Auth/           → Authentication & Role Management     │
│  ├── Collection/     → Herb Collection Interface           │
│  ├── Quality/        → Testing Labs Interface              │
│  ├── Processing/     → Processing Unit Interface           │
│  ├── Manufacturing/  → Manufacturing Plant Interface       │
│  ├── Consumer/       → Product Verification & Rating       │
│  ├── Tracking/       → Batch Tracking & Audit Log         │
│  └── Common/         → Shared Components (QR Display)      │
│                                                             │
│  Services/                                                  │
│  ├── blockchainService.ts → Fabric Network Communication   │
│  ├── ipfsService.ts       → IPFS Storage Management        │
│  └── qrService.ts         → QR Code Generation/Parsing     │
│                                                             │
│  Hooks/                                                     │
│  └── useAuth.tsx          → Authentication State Management │
└─────────────────────────────────────────────────────────────┘
```

### Backend Architecture (Node.js + Hyperledger Fabric)
```
┌─────────────────────────────────────────────────────────────┐
│                Backend API Server (Node.js)                 │
├─────────────────────────────────────────────────────────────┤
│  Routes/                                                    │
│  ├── auth.js         → User Authentication & JWT           │
│  ├── collection.js   → Collection Event Management         │
│  ├── quality.js      → Quality Test Recording              │
│  ├── processing.js   → Processing Event Recording          │
│  ├── manufacturing.js→ Manufacturing Event Recording       │
│  ├── tracking.js     → Batch Tracking & Provenance        │
│  ├── blockchain.js   → Direct Fabric Interaction          │
│  └── ipfs.js         → IPFS File Management                │
│                                                             │
│  Services/                                                  │
│  ├── fabricService.js     → Fabric Network Gateway         │
│  ├── blockchainService.js → Chaincode Interaction          │
│  ├── ipfsService.js       → IPFS/Pinata Integration        │
│  ├── qrService.js         → QR Code Generation             │
│  ├── geolocationService.js→ GPS & Zone Validation          │
│  └── smsService.js        → SMS Notifications              │
└─────────────────────────────────────────────────────────────┘
```

### Hyperledger Fabric Network Architecture
```
┌─────────────────────────────────────────────────────────────┐
│              Hyperledger Fabric Network                     │
├─────────────────────────────────────────────────────────────┤
│  Channel: herbionyx-channel                                 │
│  ├── Orderer: orderer.herbionyx.com:7050                   │
│  ├── Peer: peer0.org1.herbionyx.com:7051                   │
│  ├── CA: ca.org1.herbionyx.com:7054                        │
│  └── CouchDB: couchdb0:5984                                │
│                                                             │
│  Chaincode: herbionyx-chaincode (Node.js)                  │
│  ├── createCollectionEvent()                               │
│  ├── createQualityTestEvent()                              │
│  ├── createProcessingEvent()                               │
│  ├── createManufacturingEvent()                            │
│  ├── queryBatch()                                          │
│  ├── getBatchEvents()                                      │
│  └── getAllBatches()                                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Collector  │    │ Testing Lab │    │ Processing  │    │Manufacturing│
│   Group     │    │             │    │    Unit     │    │    Plant    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend Interface                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │Collection   │ │Quality Test │ │Processing   │ │Manufacturing│   │
│  │Form + QR    │ │Form + QR    │ │Form + QR    │ │Form + QR    │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend API Server                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │Auth Service │ │IPFS Service │ │QR Service   │ │Fabric Service│   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 Hyperledger Fabric Network                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   Orderer   │ │    Peer     │ │     CA      │ │   CouchDB   │   │
│  │   :7050     │ │   :7051     │ │   :7054     │ │   :5984     │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                     │
│  Chaincode: herbionyx-chaincode                                     │
│  ├── Collection Events                                              │
│  ├── Quality Test Events                                            │
│  ├── Processing Events                                              │
│  └── Manufacturing Events                                           │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    External Services                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │IPFS/Pinata  │ │OpenWeather  │ │Fast2SMS     │ │Geolocation  │   │
│  │(Metadata)   │ │(Weather)    │ │(SMS Alerts) │ │(GPS/Zones)  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## 🚀 Technology Stack

### Frontend Technologies
- **React 18.3.1** - Modern UI library with hooks
- **TypeScript 5.5.3** - Type-safe JavaScript
- **Vite 5.4.2** - Fast build tool and dev server
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Lucide React 0.344.0** - Beautiful icon library
- **QRCode 1.5.4** - QR code generation

### Backend Technologies
- **Node.js 18+** - JavaScript runtime
- **Express.js 4.18.2** - Web application framework
- **Hyperledger Fabric 2.5** - Enterprise blockchain platform
- **fabric-network 2.2.19** - Fabric Node.js SDK
- **fabric-ca-client 2.2.19** - Certificate Authority client
- **CouchDB** - Document database for rich queries

### Blockchain & Storage
- **Hyperledger Fabric 2.5.4** - Permissioned blockchain network
- **Node.js Chaincode** - Smart contracts in JavaScript
- **IPFS/Pinata** - Decentralized file storage
- **Docker Compose** - Container orchestration

### External APIs
- **Fast2SMS** - SMS notifications
- **OpenWeatherMap** - Weather data
- **Pinata** - IPFS pinning service
- **OpenCellID** - Cell tower geolocation

## 📋 API Endpoints

### Authentication APIs
```javascript
POST /api/auth/register    // User registration
POST /api/auth/login       // User login
GET  /api/auth/profile     // Get user profile
GET  /api/auth/private-key // Get user's private key
```

### Collection APIs
```javascript
GET  /api/collection/herbs           // Get available herbs
GET  /api/collection/zones           // Get approved zones
POST /api/collection/create          // Create collection batch
POST /api/collection/sms-collect     // SMS-based collection
POST /api/collection/location/validate-zone // Validate harvesting zone
```

### Quality Testing APIs
```javascript
POST /api/quality/test               // Record quality test
```

### Processing APIs
```javascript
GET  /api/processing/methods         // Get processing methods
POST /api/processing/process         // Record processing event
```

### Manufacturing APIs
```javascript
POST /api/manufacturing/manufacture  // Record manufacturing event
```

### Tracking APIs
```javascript
GET  /api/tracking/batch/:eventId    // Get batch provenance
GET  /api/tracking/path/:eventId     // Get provenance path
GET  /api/tracking/stats/:batchId    // Get batch statistics
GET  /api/tracking/batches           // Get all batches
```

### Blockchain APIs
```javascript
POST /api/blockchain/initialize      // Initialize Fabric service
POST /api/blockchain/create-batch    // Create batch on blockchain
POST /api/blockchain/add-quality-test // Add quality test event
POST /api/blockchain/add-processing  // Add processing event
POST /api/blockchain/add-manufacturing // Add manufacturing event
GET  /api/blockchain/generate-batch-id // Generate new batch ID
POST /api/blockchain/generate-event-id // Generate new event ID
```

### IPFS APIs
```javascript
POST /api/ipfs/upload-json           // Upload JSON metadata
POST /api/ipfs/upload-file           // Upload file to IPFS
GET  /api/ipfs/get-file/:hash        // Retrieve file from IPFS
POST /api/ipfs/create-collection-metadata     // Create collection metadata
POST /api/ipfs/create-quality-test-metadata   // Create test metadata
POST /api/ipfs/create-processing-metadata     // Create processing metadata
POST /api/ipfs/create-manufacturing-metadata  // Create manufacturing metadata
```

## 🔧 Code Structure

### Chaincode Functions (Smart Contracts)
```javascript
// Collection Event
async createCollectionEvent(ctx, batchId, herbSpecies, collectorName, 
  weight, harvestDate, location, qualityGrade, notes, ipfsHash, qrCodeHash)

// Quality Test Event  
async createQualityTestEvent(ctx, batchId, parentEventId, testerName,
  moistureContent, purity, pesticideLevel, testMethod, notes, ipfsHash, qrCodeHash)

// Processing Event
async createProcessingEvent(ctx, batchId, parentEventId, processorName,
  method, temperature, duration, yieldAmount, notes, ipfsHash, qrCodeHash)

// Manufacturing Event
async createManufacturingEvent(ctx, batchId, parentEventId, manufacturerName,
  productName, productType, quantity, unit, expiryDate, notes, ipfsHash, qrCodeHash)

// Query Functions
async queryBatch(ctx, batchId)
async getBatchEvents(ctx, batchId)
async getAllBatches(ctx)
```

### Frontend Service Integration
```typescript
// Blockchain Service
class BlockchainService {
  async createBatch(userAddress: string, batchData: any)
  async addQualityTestEvent(userAddress: string, eventData: any)
  async addProcessingEvent(userAddress: string, eventData: any)
  async addManufacturingEvent(userAddress: string, eventData: any)
  async getBatchEvents(batchId: string)
  async getAllBatches()
}

// IPFS Service
class IPFSService {
  async uploadJSON(jsonData: any, name: string)
  async uploadFile(file: File)
  async createCollectionMetadata(collectionData: any)
  async createQualityTestMetadata(testData: any)
}

// QR Service
class QRService {
  async generateCollectionQR(batchId, eventId, herbSpecies, collector)
  async generateQualityTestQR(batchId, eventId, parentEventId, tester)
  parseQRData(qrString: string)
}
```

## 🔄 Workflow Process

### 1. Collection Workflow
```
Collector Group → Fill Form → GPS Capture → Weather Data → Zone Validation
     ↓
Upload to IPFS → Generate QR Code → Record on Fabric → SMS Notification
     ↓
QR Code Available for Next Stage
```

### 2. Quality Testing Workflow
```
Testing Lab → Scan Previous QR → Auto-fill Batch ID → Enter Test Results
     ↓
Add Custom Parameters → Upload Test Images → Record on Fabric
     ↓
Generate New QR Code for Processing Stage
```

### 3. Processing Workflow
```
Processing Unit → Scan QR → Enter Processing Details → Calculate Yield %
     ↓
Record Start/End Dates → Upload Images → Record on Fabric
     ↓
Generate QR Code for Manufacturing
```

### 4. Manufacturing Workflow
```
Manufacturing Plant → Scan QR → Enter Product Details → Add Certifications
     ↓
Set Manufacture/Expiry Dates → Record on Fabric
     ↓
Generate Final Consumer QR Code
```

### 5. Consumer Verification
```
Consumer → Scan Final QR → View Complete Journey → Rate Platform
     ↓
No Login Required → Web2 Rating System
```

## 📱 SMS Integration

### SMS Commands for Offline Collection
```
Send SMS to: [Your SMS Gateway Number]

Collection Format:
COLLECT
SPECIES:Ashwagandha
WEIGHT:500
ZONE:Himalayan Region

Quality Test Format:
TEST
BATCH:HERB-1234567890-1234
MOISTURE:10.5
PURITY:98.7
PESTICIDE:0.005
```

## 🌍 Deployment Guide

### Frontend Deployment (Netlify)

1. **Build the Frontend**
```bash
npm run build
```

2. **Deploy to Netlify**
```bash
# Option 1: Drag and drop dist folder to netlify.com
# Option 2: Connect GitHub repository

# Option 3: Netlify CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

3. **Environment Variables on Netlify**
```
VITE_API_URL=https://your-backend-url.herokuapp.com
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud
```

### Backend Deployment (Railway/Heroku)

#### Railway Deployment (Recommended - Free Tier)
1. **Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

2. **Deploy Backend**
```bash
cd server
railway deploy
```

3. **Set Environment Variables**
```bash
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set JWT_SECRET=your_jwt_secret
railway variables set PINATA_API_KEY=your_pinata_key
railway variables set PINATA_SECRET_KEY=your_pinata_secret
railway variables set FAST2SMS_API_KEY=your_sms_api_key
```

#### Heroku Deployment (Alternative)
1. **Install Heroku CLI**
```bash
# Install from https://devcenter.heroku.com/articles/heroku-cli
heroku login
```

2. **Create Heroku App**
```bash
cd server
heroku create herbionyx-backend
```

3. **Deploy**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

4. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set PINATA_API_KEY=your_pinata_key
heroku config:set PINATA_SECRET_KEY=your_pinata_secret
```

### Fabric Network Deployment (Production)

1. **Server Requirements**
- Ubuntu 20.04+ or CentOS 8+
- 4+ CPU cores, 8+ GB RAM, 50+ GB storage
- Docker and Docker Compose installed

2. **Deploy Fabric Network**
```bash
# On your server
git clone <your-repo>
cd fabric-network/scripts
chmod +x *.sh
./network.sh up
./network.sh createChannel
./network.sh deployCC
```

3. **Configure Domain Names**
Update `fabric-network/docker-compose.yaml`:
```yaml
# Replace localhost with your domain
- CORE_PEER_ADDRESS=peer0.org1.yourdomain.com:7051
- ORDERER_GENERAL_LISTENADDRESS=orderer.yourdomain.com:7050
```

## 🚀 Quick Start Commands

### Initial Setup (One-time)
```bash
# 1. Clone repository
git clone <repository-url>
cd herbionyx-project

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Setup Fabric network
cd fabric-network/scripts
chmod +x *.sh
./network.sh up
./network.sh createChannel
./network.sh deployCC
cd ../..
```

### Daily Development Workflow
```bash
# Terminal 1: Start Fabric Network (if not running)
cd fabric-network/scripts
./network.sh up

# Terminal 2: Start Backend Server
cd server
npm run dev

# Terminal 3: Start Frontend
npm run dev

# Access application at: http://localhost:5173
```

### Production Restart Commands
```bash
# Check if containers are running
docker ps

# If containers stopped, restart network
cd fabric-network/scripts
./network.sh restart

# Start backend
cd ../../server
npm start

# Frontend is served from CDN (Netlify)
```

## 🔐 Security Features

### Authentication & Authorization
- **JWT-based Authentication** - Secure token-based auth
- **Role-based Access Control** - Different interfaces per role
- **Demo Mode Security** - Safe demo credentials
- **Consumer No-Auth Access** - Public verification

### Blockchain Security
- **Hyperledger Fabric** - Permissioned network
- **Certificate-based Identity** - X.509 certificates
- **Endorsement Policies** - Transaction validation
- **Immutable Ledger** - Tamper-proof records

### Data Security
- **IPFS Storage** - Decentralized file storage
- **Encrypted Metadata** - Secure data storage
- **QR Code Hashing** - Cryptographic verification
- **GPS Validation** - Location-based security

## 📊 Monitoring & Analytics

### Audit Trail Features
- **Complete Transaction History** - All blockchain transactions
- **Fabric Network Details** - Channel, chaincode, peer info
- **Event Filtering** - Filter by event type
- **Real-time Updates** - Live transaction monitoring

### Platform Analytics
- **User Ratings** - Consumer feedback system
- **Performance Metrics** - System performance tracking
- **Supply Chain Analytics** - Batch flow analysis
- **Quality Metrics** - Test result analytics

## 🛠️ Development Tools

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Development
```bash
npm run dev          # Start with nodemon
npm run start        # Start production server
npm test             # Run tests
```

### Fabric Network Management
```bash
./network.sh up      # Start network
./network.sh down    # Stop network
./network.sh restart # Restart network
./network.sh deployCC # Deploy chaincode
```

## 🔍 Troubleshooting

### Common Issues

1. **Fabric Network Issues**
```bash
# Check container status
docker ps

# View container logs
docker logs orderer.herbionyx.com
docker logs peer0.org1.herbionyx.com

# Restart network
cd fabric-network/scripts
./network.sh down
./network.sh up
```

2. **Port Conflicts**
- Frontend: 5173
- Backend: 5000
- Fabric Orderer: 7050
- Fabric Peer: 7051
- Fabric CA: 7054
- CouchDB: 5984

3. **Certificate Issues**
```bash
# Regenerate certificates
cd fabric-network/scripts
./generate-certs.sh
```

## 📞 Support & Maintenance

### Log Locations
- **Frontend Logs**: Browser console
- **Backend Logs**: `server/logs/` (if configured)
- **Fabric Logs**: Docker container logs
- **Chaincode Logs**: Peer container logs

### Backup Procedures
- **Fabric Ledger**: Automatic blockchain backup
- **User Data**: Export from localStorage (demo)
- **IPFS Data**: Pinata dashboard backup
- **Certificates**: Backup `fabric-network/organizations/`

## 🎯 Production Checklist

### Security Hardening
- [ ] Replace demo credentials with real authentication
- [ ] Configure TLS certificates for all services
- [ ] Set up firewall rules
- [ ] Enable audit logging
- [ ] Configure backup procedures

### Performance Optimization
- [ ] Configure load balancers
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Optimize chaincode queries
- [ ] Configure CDN for frontend
- [ ] Set up database indexing

### Compliance & Governance
- [ ] GDPR compliance setup
- [ ] Regulatory approval documentation
- [ ] Data retention policies
- [ ] Incident response procedures
- [ ] User training materials

## 📄 License

MIT License - Open source and free to use for educational and commercial purposes.

## 👥 Credits

**Built by SENTINELS Team**
- Revolutionary Hyperledger Fabric-based traceability
- Production-ready architecture with glass morphism UI
- Comprehensive documentation and deployment guides
- Enterprise-grade security and scalability

**🌱 Revolutionizing Ayurvedic Supply Chain with Blockchain Technology**