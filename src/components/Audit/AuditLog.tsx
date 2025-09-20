import React, { useState, useEffect } from 'react';
import { FileText, Clock, User, Package, ExternalLink, Filter } from 'lucide-react';

interface AuditEntry {
  id: string;
  transactionId: string;
  blockNumber: number;
  timestamp: string;
  eventType: string;
  batchId: string;
  participant: string;
  organization: string;
  status: 'confirmed' | 'pending' | 'failed';
  gasUsed?: number;
  fabricDetails: {
    channelId: string;
    chaincodeId: string;
    endorsingPeers: string[];
    mspId: string;
  };
}

const AuditLog: React.FC = () => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAuditLog();
  }, []);

  const fetchAuditLog = async () => {
    try {
      // Demo audit entries - in production, fetch from blockchain
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockEntries: AuditEntry[] = [
        {
          id: '1',
          transactionId: `tx_${Math.random().toString(36).substr(2, 16)}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 100000,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          eventType: 'COLLECTION',
          batchId: 'HERB-1234567890-1234',
          participant: 'John Collector',
          organization: 'Himalayan Herbs Co.',
          status: 'confirmed',
          fabricDetails: {
            channelId: 'herbionyx-channel',
            chaincodeId: 'herbionyx-chaincode',
            endorsingPeers: ['peer0.org1.herbionyx.com'],
            mspId: 'Org1MSP'
          }
        },
        {
          id: '2',
          transactionId: `tx_${Math.random().toString(36).substr(2, 16)}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 100001,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          eventType: 'QUALITY_TEST',
          batchId: 'HERB-1234567890-1234',
          participant: 'Sarah Tester',
          organization: 'Quality Labs Inc.',
          status: 'confirmed',
          fabricDetails: {
            channelId: 'herbionyx-channel',
            chaincodeId: 'herbionyx-chaincode',
            endorsingPeers: ['peer0.org1.herbionyx.com'],
            mspId: 'Org1MSP'
          }
        }
      ];
      
      setAuditEntries(mockEntries);
    } catch (error) {
      console.error('Error fetching audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'COLLECTION': return 'bg-green-100 text-green-800';
      case 'QUALITY_TEST': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-purple-100 text-purple-800';
      case 'MANUFACTURING': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEntries = auditEntries.filter(entry => {
    if (filter === 'all') return true;
    return entry.eventType.toLowerCase() === filter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Audit Log</h2>
            <p className="text-gray-600">Blockchain transaction history and system audit trail</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Event Type:</span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
          >
            <option value="all">All Events</option>
            <option value="collection">Collection</option>
            <option value="quality_test">Quality Test</option>
            <option value="processing">Processing</option>
            <option value="manufacturing">Manufacturing</option>
          </select>
        </div>

        {/* Audit Entries */}
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(entry.eventType)}`}>
                    {entry.eventType.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                    {entry.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Transaction ID</span>
                  <p className="text-sm text-gray-900 font-mono break-all">{entry.transactionId}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Block Number</span>
                  <p className="text-sm text-gray-900">{entry.blockNumber}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Batch ID</span>
                  <p className="text-sm text-gray-900 font-mono">{entry.batchId}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Participant</span>
                  <p className="text-sm text-gray-900">{entry.participant}</p>
                </div>
              </div>

              {/* Fabric Network Details */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Hyperledger Fabric Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Channel:</span>
                    <p className="text-gray-900">{entry.fabricDetails.channelId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Chaincode:</span>
                    <p className="text-gray-900">{entry.fabricDetails.chaincodeId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">MSP ID:</span>
                    <p className="text-gray-900">{entry.fabricDetails.mspId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Endorsing Peers:</span>
                    <p className="text-gray-900">{entry.fabricDetails.endorsingPeers.join(', ')}</p>
                  </div>
                </div>
                
                <div className="mt-3 flex space-x-2">
                  <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors">
                    Copy Tx ID
                  </button>
                  <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors flex items-center space-x-1">
                    <ExternalLink className="h-3 w-3" />
                    <span>View in Fabric Explorer</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Entries</h3>
            <p className="text-gray-600">No blockchain transactions found for the selected filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;