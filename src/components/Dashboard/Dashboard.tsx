import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Package, TrendingUp, Activity, CheckCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-800">Dashboard</h2>
          <p className="text-green-600">System overview and analytics</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Batches</p>
              <p className="text-3xl font-bold text-green-800">{stats?.overview?.totalBatches || 0}</p>
            </div>
            <Package className="h-12 w-12 text-green-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
            <span className="text-emerald-600">{stats?.overview?.activeBatches || 0} active</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Events</p>
              <p className="text-3xl font-bold text-blue-800">{stats?.overview?.totalEvents || 0}</p>
            </div>
            <Activity className="h-12 w-12 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-blue-600">Recorded on blockchain</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Participants</p>
              <p className="text-3xl font-bold text-purple-800">{stats?.overview?.totalParticipants || 0}</p>
            </div>
            <Users className="h-12 w-12 text-purple-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-purple-600">Across supply chain</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Success Rate</p>
              <p className="text-3xl font-bold text-orange-800">98.5%</p>
            </div>
            <TrendingUp className="h-12 w-12 text-orange-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-orange-600">Traceability complete</span>
          </div>
        </div>
      </div>

      {/* Event Types Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Events by Type</h3>
          <div className="space-y-4">
            {stats?.events && Object.entries(stats.events).map(([type, count]: [string, any]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    type === 'collection' ? 'bg-green-500' :
                    type === 'quality_test' ? 'bg-blue-500' :
                    type === 'processing' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Users by Role</h3>
          <div className="space-y-4">
            {stats?.users && Object.entries(stats.users).map(([role, count]: [string, any]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    role === 'collectors' ? 'bg-green-500' :
                    role === 'testers' ? 'bg-blue-500' :
                    role === 'processors' ? 'bg-purple-500' :
                    role === 'manufacturers' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {role}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {stats?.recentActivity?.map((batch: any, index: number) => (
            <div key={batch.batchId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{batch.batchId}</p>
                <p className="text-sm text-gray-600">{batch.herbSpecies}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{batch.eventCount} events</p>
                <p className="text-xs text-gray-500">
                  {new Date(batch.creationTime * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;