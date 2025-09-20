import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './components/Landing/LandingPage';
import LoginForm from './components/Auth/LoginForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import CollectionForm from './components/Collection/CollectionForm';
import QualityTestForm from './components/Quality/QualityTestForm';
import ProcessingForm from './components/Processing/ProcessingForm';
import ManufacturingForm from './components/Manufacturing/ManufacturingForm';
import BatchTracker from './components/Tracking/BatchTracker';
import ConsumerView from './components/Consumer/ConsumerView';
import AuditLog from './components/Audit/AuditLog';
import PlatformRating from './components/Consumer/PlatformRating';
import ConnectionStatus from './components/Common/ConnectionStatus';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Set default tab based on user role
  useEffect(() => {
    if (user) {
      // Always set the tab based on user role, even if activeTab exists
      switch (user.role) {
        case 1: setActiveTab('collection'); break;
        case 2: setActiveTab('quality'); break;
        case 3: setActiveTab('processing'); break;
        case 4: setActiveTab('manufacturing'); break;
        case 6: setActiveTab('consumer'); break;
        default: setActiveTab('consumer');
      }
    }
  }, [user]); // Remove activeTab dependency to always update when user changes

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'collection':
        return <CollectionForm />;
      case 'quality':
        return <QualityTestForm />;
      case 'processing':
        return <ProcessingForm />;
      case 'manufacturing':
        return <ManufacturingForm />;
      case 'tracking':
        return <BatchTracker />;
      case 'consumer':
        return <ConsumerView />;
      case 'audit':
        return <AuditLog />;
      case 'rating':
        return <PlatformRating />;
      default:
        return user?.role === 6 ? <ConsumerView /> : <CollectionForm />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
      
      <div className="flex">
        <Sidebar 
          isOpen={isSidebarOpen} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-0 p-6 overflow-auto">
          {/* Backdrop for mobile sidebar */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {renderContent()}
        </main>
      </div>
      
      {/* Connection Status Indicator */}
      <ConnectionStatus />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;