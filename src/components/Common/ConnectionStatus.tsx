import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Server, AlertTriangle } from 'lucide-react';
import blockchainService from '../../services/blockchainService';

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      await blockchainService.initialize();
      const connectionStatus = blockchainService.getConnectionStatus();
      setStatus(connectionStatus);
    } catch (error) {
      setStatus({
        initialized: false,
        backendAvailable: false,
        mode: 'offline',
        error: (error as Error).message
      });
    }
  };

  if (!status) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`p-3 rounded-lg shadow-lg border cursor-pointer transition-all duration-200 ${
          status.backendAvailable 
            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
            : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-2">
          {status.backendAvailable ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-yellow-600" />
          )}
          <span className={`text-sm font-medium ${
            status.backendAvailable ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {status.mode === 'production' ? 'Fabric Connected' : 'Demo Mode'}
          </span>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Backend:</span>
              <span className={status.backendAvailable ? 'text-green-600' : 'text-red-600'}>
                {status.backendAvailable ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Fabric Network:</span>
              <span className={status.backendAvailable ? 'text-green-600' : 'text-yellow-600'}>
                {status.backendAvailable ? 'Active' : 'Demo'}
              </span>
            </div>
            {!status.backendAvailable && (
              <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-800">
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Start backend for full functionality</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;