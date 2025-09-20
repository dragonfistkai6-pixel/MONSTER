# 🚀 HerbionYX Deployment Guide

Complete guide for deploying HerbionYX to production environments.

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Network**: Stable internet connection

### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- Git
- Hyperledger Fabric binaries 2.5.4

## 🌐 Frontend Deployment (Netlify)

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

2. **Connect to Netlify**
- Go to [netlify.com](https://netlify.com)
- Click "New site from Git"
- Connect your GitHub repository
- Configure build settings:
  - **Build command**: `npm run build`
  - **Publish directory**: `dist`

3. **Environment Variables**
```bash
# In Netlify dashboard > Site settings > Environment variables
VITE_API_URL=https://your-backend-url.railway.app
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud
VITE_ENABLE_SMS=true
```

### Method 2: Manual Deployment

1. **Build Frontend**
```bash
npm install
npm run build
```

2. **Deploy to Netlify**
- Drag and drop the `dist` folder to netlify.com
- Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

## 🖥️ Backend Deployment (Railway)

### Step 1: Prepare Backend

1. **Create Railway Account**
- Sign up at [railway.app](https://railway.app)
- Install Railway CLI:
```bash
npm install -g @railway/cli
railway login
```

2. **Prepare Backend Code**
```bash
cd server
# Ensure package.json has correct start script
```

### Step 2: Deploy to Railway

1. **Initialize Railway Project**
```bash
railway init
railway link
```

2. **Set Environment Variables**
```bash
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set JWT_SECRET=herbionyx_production_secret_2024
railway variables set PINATA_API_KEY=your_pinata_api_key
railway variables set PINATA_SECRET_KEY=your_pinata_secret_key
railway variables set FAST2SMS_API_KEY=your_fast2sms_api_key
railway variables set FRONTEND_URL=https://your-netlify-site.netlify.app
```

3. **Deploy**
```bash
railway deploy
```

4. **Get Deployment URL**
```bash
railway status
# Note the deployment URL for frontend configuration
```

### Alternative: Heroku Deployment

1. **Install Heroku CLI**
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
heroku login
```

2. **Create and Deploy**
```bash
cd server
heroku create herbionyx-backend
git init
git add .
git commit -m "Initial deployment"
heroku git:remote -a herbionyx-backend
git push heroku main
```

3. **Configure Environment**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set PINATA_API_KEY=your_pinata_key
heroku config:set PINATA_SECRET_KEY=your_pinata_secret
```

## 🔗 Hyperledger Fabric Network Deployment

### Local Development Network

1. **Start Network**
```bash
cd fabric-network/scripts
./network.sh up
./network.sh createChannel
./network.sh deployCC
```

2. **Verify Network**
```bash
docker ps
# Should show: orderer, peer, ca, couchdb containers
```

### Production Network Deployment

1. **Server Setup**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Fabric binaries
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.4 1.5.7
```

2. **Configure Network**
```bash
# Update docker-compose.yaml for production
# Replace localhost with actual server IPs/domains
# Configure TLS certificates
# Set up proper firewall rules
```

3. **Deploy Network**
```bash
cd fabric-network/scripts
chmod +x *.sh
./network.sh up
./network.sh createChannel
./network.sh deployCC
```

## 📱 External Service Setup

### IPFS/Pinata Configuration

1. **Create Pinata Account**
- Sign up at [pinata.cloud](https://pinata.cloud)
- Generate API keys

2. **Configure in Backend**
```bash
# Set environment variables
PINATA_API_KEY=your_api_key
PINATA_SECRET_KEY=your_secret_key
```

### SMS Service Setup (Fast2SMS)

1. **Create Fast2SMS Account**
- Sign up at [fast2sms.com](https://fast2sms.com)
- Get API key

2. **Configure SMS**
```bash
FAST2SMS_API_KEY=your_api_key
```

### Weather API Setup

1. **OpenWeatherMap Account**
- Sign up at [openweathermap.org](https://openweathermap.org)
- Get free API key

2. **Configure Weather**
```bash
OPENWEATHER_API_KEY=your_api_key
```

## 🔄 Daily Operations

### Starting the Application

1. **Check Prerequisites**
```bash
# Ensure Docker is running
docker --version
docker-compose --version

# Check if ports are available
netstat -tulpn | grep -E ':(5000|5173|7050|7051|7054|5984)'
```

2. **Start Services in Order**
```bash
# Terminal 1: Start Fabric Network
cd fabric-network/scripts
./network.sh up

# Wait 30 seconds for network to be ready

# Terminal 2: Start Backend
cd ../../server
npm run dev

# Terminal 3: Start Frontend (development)
cd ..
npm run dev
```

3. **Verify Everything is Running**
```bash
# Check containers
docker ps

# Check backend
curl http://localhost:5000/health

# Check frontend
# Open http://localhost:5173 in browser
```

### Stopping the Application

```bash
# Stop frontend (Ctrl+C in terminal)

# Stop backend (Ctrl+C in terminal)

# Stop Fabric network
cd fabric-network/scripts
./network.sh down
```

### Production Monitoring

1. **Health Checks**
```bash
# Backend health
curl https://your-backend.railway.app/health

# Frontend health
curl https://your-site.netlify.app

# Fabric network health
docker ps
```

2. **Log Monitoring**
```bash
# Backend logs (Railway)
railway logs

# Fabric logs
docker logs orderer.herbionyx.com
docker logs peer0.org1.herbionyx.com
```

## 🛡️ Security Considerations

### Production Security Checklist

- [ ] **Change Default Passwords**: Update all default credentials
- [ ] **TLS Certificates**: Configure proper SSL/TLS for all services
- [ ] **Firewall Rules**: Restrict access to necessary ports only
- [ ] **API Rate Limiting**: Configure rate limiting for all endpoints
- [ ] **Input Validation**: Ensure all inputs are properly validated
- [ ] **Audit Logging**: Enable comprehensive audit logging
- [ ] **Backup Strategy**: Implement regular backup procedures
- [ ] **Monitoring**: Set up monitoring and alerting
- [ ] **Access Control**: Implement proper role-based access control
- [ ] **Data Encryption**: Encrypt sensitive data at rest and in transit

### Network Security

1. **Fabric Network Security**
```bash
# Use TLS for all communications
# Configure proper MSP policies
# Set up proper channel access controls
# Regular certificate rotation
```

2. **API Security**
```bash
# JWT token expiration
# CORS configuration
# Request size limits
# SQL injection prevention
```

## 📊 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Implement lazy loading
- **Image Optimization**: Compress and optimize images
- **CDN**: Use CDN for static assets
- **Caching**: Implement proper caching strategies

### Backend Optimization
- **Database Indexing**: Optimize CouchDB queries
- **Connection Pooling**: Implement connection pooling
- **Caching**: Redis for session management
- **Load Balancing**: Multiple backend instances

### Fabric Network Optimization
- **Peer Configuration**: Optimize peer settings
- **Chaincode Optimization**: Efficient chaincode queries
- **Block Size**: Configure optimal block sizes
- **Endorsement Policies**: Optimize endorsement requirements

## 🔧 Maintenance Procedures

### Regular Maintenance Tasks

1. **Weekly Tasks**
- Check system logs
- Monitor disk space
- Verify backup integrity
- Update security patches

2. **Monthly Tasks**
- Certificate renewal check
- Performance analysis
- User access review
- Capacity planning

3. **Quarterly Tasks**
- Security audit
- Disaster recovery testing
- Documentation updates
- System optimization review

### Backup Procedures

1. **Fabric Ledger Backup**
```bash
# Backup peer data
docker cp peer0.org1.herbionyx.com:/var/hyperledger/production ./backup/

# Backup orderer data
docker cp orderer.herbionyx.com:/var/hyperledger/production ./backup/
```

2. **Configuration Backup**
```bash
# Backup certificates and configuration
tar -czf fabric-backup-$(date +%Y%m%d).tar.gz fabric-network/organizations/
```

This deployment guide ensures your HerbionYX system runs reliably in production with proper security, monitoring, and maintenance procedures.