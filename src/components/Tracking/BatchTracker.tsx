import React, { useState } from 'react';
import { Search, Package, MapPin, Calendar, User, ExternalLink, Link, Eye } from 'lucide-react';
import blockchainService from '../../services/blockchainService';
import ipfsService from '../../services/ipfsService';

const BatchTracker: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTransactions, setShowTransactions] = useState<{ [key: string]: boolean }>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setTrackingResult(null);

    try {
      // Demo tracking result
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTrackingResult({
        batchId: searchQuery,
        herbSpecies: 'Ashwagandha',
        currentStatus: 'Manufacturing Complete',
        events: [
          {
            eventId: 'COLLECTION-1234567890-1234',
            type: 'Collection',
            participant: 'John Collector',
            organization: 'Himalayan Herbs Co.',
            timestamp: Date.now() - 86400000,
            location: 'Himalayan Region - Uttarakhand',
            details: { weight: '500g', qualityGrade: 'Premium' }
          },
          {
            eventId: 'QUALITY-1234567890-5678',
            type: 'Quality Test',
            participant: 'Sarah Tester',
            organization: 'Quality Labs Inc.',
            timestamp: Date.now() - 43200000,
            location: 'Quality Labs Inc.',
            details: { purity: '98.7%', moistureContent: '8.2%' }
          }
        ]
      });
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTransactions = (eventId: string) => {
    setShowTransactions(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const getBlockchainExplorerUrl = (txHash: string) => {
    // For local Hardhat network, we'll show a mock explorer URL
    return `http://localhost:8545/tx/${txHash}`;
  };

  const getEventTypeName = (eventType: number) => {
    const types = ['Collection', 'Quality Test', 'Processing', 'Manufacturing'];
    return types[eventType] || 'Unknown';
  };

  const getStatusFromEvents = (events: any[]) => {
    if (events.length === 0) return 'Unknown';
    
    const lastEvent = events[events.length - 1];
    switch (lastEvent.type) {
      case 'Collection': return 'Collected';
      case 'Quality Test': return 'Quality Tested';
      case 'Processing': return 'Processed';
      case 'Manufacturing': return 'Manufacturing Complete';
      default: return 'In Progress';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'Collection': return 'bg-green-100 text-green-800 border-green-200';
      case 'Quality Test': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Manufacturing': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
            <Search className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-indigo-800">Batch Tracking</h2>
            <p className="text-indigo-600">Track herb batches through the supply chain</p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Batch ID or Event ID (e.g., HERB-1234567890-1234)"
                className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Track</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Tracking Results */}
        <>
          {trackingResult && (
          <div className="space-y-8">
            {/* Batch Overview */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-indigo-800">Batch Overview</h3>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {trackingResult.currentStatus}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-indigo-600">Batch ID</span>
                  <p className="text-indigo-900 font-mono">{trackingResult.batchId}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-indigo-600">Herb Species</span>
                  <p className="text-indigo-900">{trackingResult.herbSpecies}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-indigo-600">Total Events</span>
                  <p className="text-indigo-900">{trackingResult.events.length}</p>
                </div>
              </div>
            </div>

            {/* Supply Chain Timeline */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6">Supply Chain Timeline</h3>
              <div className="space-y-6">
                {trackingResult.events.map((event: any, index: number) => (
                  <div key={event.eventId} className="relative">
                    {/* Timeline Line */}
                    {index < trackingResult.events.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-16 bg-gray-200"></div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      {/* Timeline Dot */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getEventColor(event.type)} border-2`}>
                        <Package className="h-5 w-5" />
                      </div>
                      
                      {/* Event Details */}
                      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{event.type}</h4>
                            <p className="text-sm text-gray-600">Event ID: {event.eventId}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-sm text-gray-500 mb-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(event.timestamp).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.location}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-1" />
                            <span className="font-medium">{event.participant}</span>
                          </div>
                          <span className="text-sm text-gray-500">{event.organization}</span>
                        </div>
                        
                        {/* Event-specific Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {Object.entries(event.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <p className="text-gray-900">{value as string}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => toggleTransactions(event.eventId)}
                              className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {showTransactions[event.eventId] ? 'Hide' : 'Show'} Fabric Transaction
                            </button>
                            <button className="flex items-center text-green-600 hover:text-green-700 text-sm font-medium">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Transaction
                            </button>
                          </div>
                          
                          {/* Fabric Transaction Details */}
                          {showTransactions[event.eventId] && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                <Link className="h-4 w-4 mr-2 text-blue-600" />
                                Fabric Transaction Details
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <span className="font-medium text-gray-600">Transaction ID:</span>
                                    <p className="text-gray-900 font-mono text-xs break-all">tx_{Math.random().toString(36).substr(2, 16)}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Block Number:</span>
                                    <p className="text-gray-900">{Math.floor(Math.random() * 1000000) + 100000}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Endorsing Peers:</span>
                                    <p className="text-gray-900">peer0.org1.herbionyx.com</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Channel:</span>
                                    <p className="text-gray-900">herbionyx-channel</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Chaincode:</span>
                                    <p className="text-gray-900">herbionyx-chaincode</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">MSP ID:</span>
                                    <p className="text-gray-900">Org1MSP</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Network:</span>
                                    <p className="text-gray-900">Hyperledger Fabric 2.5</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Status:</span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      ✓ Confirmed
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                  <span className="font-medium text-gray-600">IPFS Hash:</span>
                                  <p className="text-gray-900 font-mono text-xs break-all mt-1">
                                    {event.metadata?.ipfsHash || 'QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx'}
                                  </p>
                                </div>
                                
                                <div className="mt-3 flex space-x-2">
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(`tx_${Math.random().toString(36).substr(2, 16)}`)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                                  >
                                    Copy Tx ID
                                  </button>
                                  <a 
                                    href="#"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                                  >
                                    View in Fabric Explorer
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Demo Instructions */}
          {!trackingResult && !loading && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Track Any Batch</h3>
            <p className="text-gray-600 mb-4">
              Enter a Batch ID or Event ID to view the complete supply chain journey
            </p>
            <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-700 font-medium mb-2">Try these demo IDs:</p>
              <div className="space-y-1 text-sm text-blue-600">
                <p>HERB-1234567890-1234</p>
                <p>COLLECTION-1234567890-1234</p>
                <p>TEST-1234567890-5678</p>
              </div>
            </div>
          </div>
          )}
        </>
      </div>
    </div>
  );
};

export default BatchTracker;