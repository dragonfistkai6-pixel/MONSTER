import React, { useState } from 'react';
import { QrCode, Shield, Leaf, Award, MapPin, Calendar } from 'lucide-react';
import blockchainService from '../../services/blockchainService';
import ipfsService from '../../services/ipfsService';
import qrService from '../../services/qrService';

const ConsumerView: React.FC = () => {
  const [qrInput, setQrInput] = useState('');
  const [productInfo, setProductInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleQRScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    setLoading(true);
    setProductInfo(null);
    
    try {
      // Parse QR code or event ID
      let eventId = qrInput.trim();
      let batchId = '';

      // Try to parse as QR code JSON
      try {
        const qrData = qrService.parseQRData(qrInput);
        if (qrData.success) {
          eventId = qrData.data.eventId;
          batchId = qrData.data.batchId;
        }
      } catch {
        // If not JSON, treat as direct event ID
        eventId = qrInput;
      }

      // Find batch containing this event
      // Demo product info for testing
      setProductInfo(mockProductInfo);
    } catch (error) {
      setError('Product not found. Please check the QR code or product ID.');
    } finally {
      setLoading(false);
    }
  };

  // Mock product info for demo
  const mockProductInfo = {
    productName: 'Ashwagandha Premium Capsules',
    batchId: 'HERB-1234567890-1234',
    manufacturer: 'Ayurvedic Products Inc.',
    manufacturingDate: '2024-01-15',
    expiryDate: '2026-01-15',
    authenticity: 'VERIFIED',
    certifications: ['Blockchain Verified', 'GMP Certified', 'AYUSH Approved', 'Organic Certified'],
    qualityMetrics: {
      purity: '98.7%',
      moistureContent: '8.2%',
      pesticideLevel: '0.003 ppm',
      heavyMetals: 'Within limits'
    },
    journey: [
      {
        stage: 'Collection',
        location: 'Himalayan Region - Uttarakhand',
        date: '2024-01-10',
        participant: 'John Collector',
        details: 'Premium quality herbs collected from approved organic zone'
      },
      {
        stage: 'Quality Testing',
        location: 'Quality Labs Inc.',
        date: '2024-01-12',
        participant: 'Sarah Tester',
        details: 'Comprehensive laboratory testing completed - All parameters within standards'
      },
      {
        stage: 'Processing',
        location: 'Herbal Processing Ltd.',
        date: '2024-01-13',
        participant: 'Mike Processor',
        details: 'Steam distillation processing with 85% yield efficiency'
      },
      {
        stage: 'Manufacturing',
        location: 'Ayurvedic Products Inc.',
        date: '2024-01-15',
        participant: 'Lisa Manufacturer',
        details: 'Final product manufactured under GMP conditions with AYUSH certification'
      }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-emerald-800">Product Verification</h2>
            <p className="text-emerald-600">Verify authenticity and view complete product journey</p>
          </div>
        </div>

        {/* QR Scanner Form */}
        <form onSubmit={handleQRScan} className="mb-8">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Scan QR code or enter product code"
                className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <QrCode className="h-5 w-5" />
                  <span>Verify</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Product Information */}
        {productInfo && (
          <div className="space-y-8">
            {/* Product Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-emerald-800">{productInfo.productName}</h3>
                <div className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-green-600" />
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                    {productInfo.authenticity}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-emerald-600">Batch ID</span>
                  <p className="text-emerald-900 font-mono">{productInfo.batchId}</p>
                </div>
                <div>
                  <span className="font-medium text-emerald-600">Manufacturer</span>
                  <p className="text-emerald-900">{productInfo.manufacturer}</p>
                </div>
                <div>
                  <span className="font-medium text-emerald-600">Expiry Date</span>
                  <p className="text-emerald-900">{productInfo.expiryDate}</p>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-yellow-600" />
                Certifications & Standards
              </h4>
              <div className="flex flex-wrap gap-2">
                {productInfo.certifications.map((cert: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* Quality Metrics */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Leaf className="h-5 w-5 mr-2 text-green-600" />
                Quality Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(productInfo.qualityMetrics).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <p className="text-lg font-bold text-gray-900">{value as string}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Supply Chain Journey */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-6">Complete Supply Chain Journey</h4>
              <div className="space-y-4">
                {productInfo.journey.map((step: any, index: number) => (
                  <div key={index} className="relative">
                    {index < productInfo.journey.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-16 bg-emerald-200"></div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-emerald-200">
                        <span className="text-emerald-700 font-bold text-sm">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-900">{step.stage}</h5>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {step.date}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{step.location}</span>
                          <span className="mx-2">•</span>
                          <span className="font-medium">{step.participant}</span>
                        </div>
                        
                        <p className="text-sm text-gray-700">{step.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Demo Instructions */}
        {!productInfo && !loading && (
          <div className="text-center py-12">
            <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Verify Product Authenticity</h3>
            <p className="text-gray-600 mb-4">
              Scan the QR code on your product or enter the product code to view complete traceability
            </p>
            <div className="bg-emerald-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-emerald-700 font-medium mb-2">Try this demo code:</p>
              <p className="text-sm text-emerald-600 font-mono">MFG-1234567890-3456</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerView;