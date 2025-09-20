const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

class FabricService {
    constructor() {
        this.channelName = 'herbionyx-channel';
        this.chaincodeName = 'herbionyx-chaincode';
        this.mspId = 'Org1MSP';
        this.walletPath = path.join(process.cwd(), 'wallet');
        this.gateway = null;
        this.contract = null;
    }

    async initializeWallet() {
        try {
            // Create wallet if it doesn't exist
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // Check if admin identity exists
            const adminIdentity = await wallet.get('admin');
            if (!adminIdentity) {
                console.log('Admin identity not found in wallet, creating...');
                await this.enrollAdmin(wallet);
            }

            // Check if user identity exists
            const userIdentity = await wallet.get('appUser');
            if (!userIdentity) {
                console.log('User identity not found in wallet, creating...');
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
            const caTLSCACerts = caInfo.tlsCACerts;
            const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

            // Enroll admin
            const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };

            await wallet.put('admin', x509Identity);
            console.log('Successfully enrolled admin user and imported it into the wallet');
        } catch (error) {
            console.error('Failed to enroll admin user:', error);
            throw error;
        }
    }

    async registerUser(wallet) {
        try {
            // Create CA client
            const caInfo = this.getCaInfo();
            const caTLSCACerts = caInfo.tlsCACerts;
            const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

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
            console.log('Successfully registered and enrolled app user and imported it into the wallet');
        } catch (error) {
            console.error('Failed to register user:', error);
            throw error;
        }
    }

    getCaInfo() {
        // In a real deployment, this would read from connection profile
        const certPath = path.join(__dirname, '../../fabric-network/organizations/peerOrganizations/org1.herbionyx.com/ca/ca.org1.herbionyx.com-cert.pem');
        
        // Check if certificate file exists
        if (!fs.existsSync(certPath)) {
            throw new Error('Fabric network certificates not found - please start the network first');
        }
        
        return {
            url: 'https://localhost:7054',
            caName: 'ca.org1.herbionyx.com',
            tlsCACerts: fs.readFileSync(certPath)
        };
    }

    getConnectionProfile() {
        const peerCertPath = path.join(__dirname, '../../fabric-network/organizations/peerOrganizations/org1.herbionyx.com/tlsca/tlsca.org1.herbionyx.com-cert.pem');
        const caCertPath = path.join(__dirname, '../../fabric-network/organizations/peerOrganizations/org1.herbionyx.com/ca/ca.org1.herbionyx.com-cert.pem');
        
        // Check if certificate files exist
        if (!fs.existsSync(peerCertPath) || !fs.existsSync(caCertPath)) {
            throw new Error('Fabric network certificates not found - please start the network first');
        }
        
        return {
            name: 'herbionyx-network',
            version: '1.0.0',
            client: {
                organization: 'Org1',
                connection: {
                    timeout: {
                        peer: {
                            endorser: '300'
                        }
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
                    tlsCACerts: {
                        pem: fs.readFileSync(peerCertPath).toString()
                    },
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
                    tlsCACerts: {
                        pem: fs.readFileSync(caCertPath).toString()
                    },
                    httpOptions: {
                        verify: false
                    }
                }
            }
        };
    }

    async connect() {
        try {
            // Check if we're in demo mode (no Fabric network required)
            if (process.env.DEMO_MODE === 'true') {
                console.log('🎭 Running in demo mode - Fabric network not required');
                return true;
            }

            // Initialize wallet
            const wallet = await this.initializeWallet().catch(error => {
                console.log('⚠️  Wallet initialization failed, continuing without Fabric connection');
                throw error;
            });

            // Create gateway
            this.gateway = new Gateway();
            
            // Connect to gateway
            await this.gateway.connect(this.getConnectionProfile().catch(error => {
                console.log('⚠️  Connection profile unavailable');
                throw error;
            }), {
                wallet,
                identity: 'appUser',
                discovery: { enabled: true, asLocalhost: true }
            }).catch(error => {
                console.log('⚠️  Gateway connection failed');
                throw error;
            });

            // Get network and contract
            const network = await this.gateway.getNetwork(this.channelName);
            this.contract = network.getContract(this.chaincodeName);

            console.log('✅ Connected to Fabric network successfully');
            return true;
        } catch (error) {
            console.log('⚠️  Failed to connect to Fabric network - this is expected if the network is not running');
            console.log('💡 The server will continue to run in demo mode');
            return false;
        }
    }

    async disconnect() {
        if (this.gateway) {
            this.gateway.disconnect();
            this.gateway = null;
            this.contract = null;
        }
    }

    async createCollectionEvent(batchId, herbSpecies, collectorName, weight, harvestDate, location, qualityGrade, notes, ipfsHash, qrCodeHash) {
        try {
            if (!this.contract) {
                throw new Error('Not connected to Fabric network');
            }

            const result = await this.contract.submitTransaction(
                'createCollectionEvent',
                batchId,
                herbSpecies,
                collectorName,
                weight.toString(),
                harvestDate,
                JSON.stringify(location),
                qualityGrade,
                notes,
                ipfsHash,
                qrCodeHash
            );

            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: result.transactionId
            };
        } catch (error) {
            console.error('Error creating collection event:', error);
            return { success: false, error: error.message };
        }
    }

    async createQualityTestEvent(batchId, parentEventId, testerName, moistureContent, purity, pesticideLevel, testMethod, notes, ipfsHash, qrCodeHash) {
        try {
            if (!this.contract) {
                throw new Error('Not connected to Fabric network');
            }

            const result = await this.contract.submitTransaction(
                'createQualityTestEvent',
                batchId,
                parentEventId,
                testerName,
                moistureContent.toString(),
                purity.toString(),
                pesticideLevel.toString(),
                testMethod,
                notes,
                ipfsHash,
                qrCodeHash
            );

            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: result.transactionId
            };
        } catch (error) {
            console.error('Error creating quality test event:', error);
            return { success: false, error: error.message };
        }
    }

    async createProcessingEvent(batchId, parentEventId, processorName, method, temperature, duration, yieldAmount, notes, ipfsHash, qrCodeHash) {
        try {
            if (!this.contract) {
                throw new Error('Not connected to Fabric network');
            }

            const result = await this.contract.submitTransaction(
                'createProcessingEvent',
                batchId,
                parentEventId,
                processorName,
                method,
                temperature ? temperature.toString() : '',
                duration,
                yieldAmount.toString(),
                notes,
                ipfsHash,
                qrCodeHash
            );

            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: result.transactionId
            };
        } catch (error) {
            console.error('Error creating processing event:', error);
            return { success: false, error: error.message };
        }
    }

    async createManufacturingEvent(batchId, parentEventId, manufacturerName, productName, productType, quantity, unit, expiryDate, notes, ipfsHash, qrCodeHash) {
        try {
            if (!this.contract) {
                throw new Error('Not connected to Fabric network');
            }

            const result = await this.contract.submitTransaction(
                'createManufacturingEvent',
                batchId,
                parentEventId,
                manufacturerName,
                productName,
                productType,
                quantity.toString(),
                unit,
                expiryDate,
                notes,
                ipfsHash,
                qrCodeHash
            );

            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: result.transactionId
            };
        } catch (error) {
            console.error('Error creating manufacturing event:', error);
            return { success: false, error: error.message };
        }
    }

    async queryBatch(batchId) {
        try {
            if (!this.contract) {
                throw new Error('Not connected to Fabric network');
            }

            const result = await this.contract.evaluateTransaction('queryBatch', batchId);
            return {
                success: true,
                data: JSON.parse(result.toString())
            };
        } catch (error) {
            console.error('Error querying batch:', error);
            return { success: false, error: error.message };
        }
    }

    async getBatchEvents(batchId) {
        try {
            if (!this.contract) {
                throw new Error('Not connected to Fabric network');
            }

            const result = await this.contract.evaluateTransaction('getBatchEvents', batchId);
            return {
                success: true,
                data: JSON.parse(result.toString())
            };
        } catch (error) {
            console.error('Error getting batch events:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllBatches() {
        try {
            if (!this.contract) {
                throw new Error('Not connected to Fabric network');
            }

            const result = await this.contract.evaluateTransaction('getAllBatches');
            return {
                success: true,
                data: JSON.parse(result.toString())
            };
        } catch (error) {
            console.error('Error getting all batches:', error);
            return { success: false, error: error.message };
        }
    }

    async queryEvent(eventId) {
        try {
            if (!this.contract) {
                throw new Error('Not connected to Fabric network');
            }

            const result = await this.contract.evaluateTransaction('queryEvent', eventId);
            return {
                success: true,
                data: JSON.parse(result.toString())
            };
        } catch (error) {
            console.error('Error querying event:', error);
            return { success: false, error: error.message };
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

module.exports = new FabricService();