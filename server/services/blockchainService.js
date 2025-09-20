const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

class BlockchainService {
    constructor() {
        this.channelName = 'herbionyx-channel';
        this.chaincodeName = 'herbionyx-chaincode';
        this.mspId = 'Org1MSP';
        this.walletPath = path.join(process.cwd(), 'wallet');
        this.gateway = null;
        this.contract = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            if (this.isConnected) {
                return { success: true, message: 'Already connected' };
            }

            // Initialize wallet
            const wallet = await this.initializeWallet();
            
            // Create gateway
            this.gateway = new Gateway();
            
            // Connect to gateway with connection profile
            const connectionProfile = this.getConnectionProfile();
            await this.gateway.connect(connectionProfile, {
                wallet,
                identity: 'appUser',
                discovery: { enabled: true, asLocalhost: true }
            });

            // Get network and contract
            const network = await this.gateway.getNetwork(this.channelName);
            this.contract = network.getContract(this.chaincodeName);
            
            this.isConnected = true;
            console.log('✅ Connected to Hyperledger Fabric network');
            
            return { success: true, message: 'Connected to Fabric network' };
        } catch (error) {
            console.error('Failed to connect to Fabric network:', error);
            return { success: false, error: error.message };
        }
    }

    async initializeWallet() {
        try {
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // Check if admin identity exists
            const adminIdentity = await wallet.get('admin');
            if (!adminIdentity) {
                console.log('Creating admin identity...');
                await this.enrollAdmin(wallet);
            }

            // Check if user identity exists
            const userIdentity = await wallet.get('appUser');
            if (!userIdentity) {
                console.log('Creating user identity...');
                await this.registerUser(wallet);
            }

            return wallet;
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
            throw error;
        }
    }

    async enrollAdmin(wallet) {
        try {
            // Create CA client
            const caInfo = this.getCaInfo();
            const ca = new FabricCAServices(caInfo.url, { 
                trustedRoots: caInfo.tlsCACerts, 
                verify: false 
            }, caInfo.caName);

            // Enroll admin
            const enrollment = await ca.enroll({ 
                enrollmentID: 'admin', 
                enrollmentSecret: 'adminpw' 
            });
            
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };

            await wallet.put('admin', x509Identity);
            console.log('Successfully enrolled admin user');
        } catch (error) {
            console.error('Failed to enroll admin user:', error);
            throw error;
        }
    }

    async registerUser(wallet) {
        try {
            // Create CA client
            const caInfo = this.getCaInfo();
            const ca = new FabricCAServices(caInfo.url, { 
                trustedRoots: caInfo.tlsCACerts, 
                verify: false 
            }, caInfo.caName);

            // Get admin identity
            const adminIdentity = await wallet.get('admin');
            if (!adminIdentity) {
                throw new Error('Admin identity not found in wallet');
            }

            // Build user object for authenticating with the CA
            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, 'admin');

            // Register user
            const secret = await ca.register({
                affiliation: 'org1.department1',
                enrollmentID: 'appUser',
                role: 'client'
            }, adminUser);

            // Enroll user
            const enrollment = await ca.enroll({
                enrollmentID: 'appUser',
                enrollmentSecret: secret
            });

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };

            await wallet.put('appUser', x509Identity);
            console.log('Successfully registered and enrolled app user');
        } catch (error) {
            console.error('Failed to register user:', error);
            throw error;
        }
    }

    getCaInfo() {
        // Mock CA info for demo - in production, read from connection profile
        return {
            url: 'https://localhost:7054',
            caName: 'ca.org1.herbionyx.com',
            tlsCACerts: Buffer.from('mock-ca-cert')
        };
    }

    getConnectionProfile() {
        // Mock connection profile for demo
        return {
            name: 'herbionyx-network',
            version: '1.0.0',
            client: {
                organization: 'Org1',
                connection: {
                    timeout: {
                        peer: { endorser: '300' }
                    }
                }
            },
            organizations: {
                Org1: {
                    mspid: 'Org1MSP',
                    peers: ['peer0.org1.herbionyx.com'],
                    certificateAuthorities: ['ca.org1.herbionyx.com']
                }
            },
            peers: {
                'peer0.org1.herbionyx.com': {
                    url: 'grpcs://localhost:7051',
                    tlsCACerts: { pem: 'mock-peer-cert' },
                    grpcOptions: {
                        'ssl-target-name-override': 'peer0.org1.herbionyx.com',
                        'hostnameOverride': 'peer0.org1.herbionyx.com'
                    }
                }
            },
            certificateAuthorities: {
                'ca.org1.herbionyx.com': {
                    url: 'https://localhost:7054',
                    caName: 'ca.org1.herbionyx.com',
                    tlsCACerts: { pem: 'mock-ca-cert' },
                    httpOptions: { verify: false }
                }
            }
        };
    }

    async createBatch(userAddress, batchData) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.submitTransaction(
                'createCollectionEvent',
                batchData.batchId,
                batchData.herbSpecies,
                batchData.collectorName || 'Unknown',
                batchData.weight?.toString() || '0',
                batchData.harvestDate || new Date().toISOString().split('T')[0],
                JSON.stringify(batchData.location || {}),
                batchData.qualityGrade || '',
                batchData.notes || '',
                batchData.ipfsHash || '',
                batchData.qrCodeHash || ''
            );

            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
        } catch (error) {
            console.error('Error creating batch:', error);
            return { success: false, error: error.message };
        }
    }

    async addQualityTestEvent(userAddress, eventData) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.submitTransaction(
                'createQualityTestEvent',
                eventData.batchId,
                eventData.parentEventId,
                eventData.testerName || 'Unknown',
                eventData.moistureContent?.toString() || '0',
                eventData.purity?.toString() || '0',
                eventData.pesticideLevel?.toString() || '0',
                eventData.testMethod || 'Standard Test',
                eventData.notes || '',
                eventData.ipfsHash || '',
                eventData.qrCodeHash || ''
            );

            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
        } catch (error) {
            console.error('Error adding quality test event:', error);
            return { success: false, error: error.message };
        }
    }

    async addProcessingEvent(userAddress, eventData) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.submitTransaction(
                'createProcessingEvent',
                eventData.batchId,
                eventData.parentEventId,
                eventData.processorName || 'Unknown',
                eventData.method || 'Standard Processing',
                eventData.temperature?.toString() || '',
                eventData.duration || '',
                eventData.yield?.toString() || '0',
                eventData.notes || '',
                eventData.ipfsHash || '',
                eventData.qrCodeHash || ''
            );

            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
        } catch (error) {
            console.error('Error adding processing event:', error);
            return { success: false, error: error.message };
        }
    }

    async addManufacturingEvent(userAddress, eventData) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.submitTransaction(
                'createManufacturingEvent',
                eventData.batchId,
                eventData.parentEventId,
                eventData.manufacturerName || 'Unknown',
                eventData.productName || 'Herbal Product',
                eventData.productType || 'Capsules',
                eventData.quantity?.toString() || '0',
                eventData.unit || 'units',
                eventData.expiryDate || '',
                eventData.notes || '',
                eventData.ipfsHash || '',
                eventData.qrCodeHash || ''
            );

            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
        } catch (error) {
            console.error('Error adding manufacturing event:', error);
            return { success: false, error: error.message };
        }
    }

    async getBatchEvents(batchId) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.evaluateTransaction('getBatchEvents', batchId);
            return {
                success: true,
                data: JSON.parse(result.toString())
            };
        } catch (error) {
            console.error('Error getting batch events:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async getAllBatches() {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.evaluateTransaction('getAllBatches');
            return {
                success: true,
                data: JSON.parse(result.toString())
            };
        } catch (error) {
            console.error('Error getting all batches:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async getUserInfo(userAddress) {
        // Mock user info for demo
        return {
            address: userAddress,
            isActive: true,
            role: 1,
            registrationTime: Date.now()
        };
    }

    async registerUser(address, role, name, organization) {
        // Mock user registration for demo
        return {
            success: true,
            transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
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

    async disconnect() {
        if (this.gateway) {
            this.gateway.disconnect();
            this.gateway = null;
            this.contract = null;
            this.isConnected = false;
        }
    }
}

module.exports = new BlockchainService();