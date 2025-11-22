import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { fgStoreService } from '../../services/fgStoreService';
import { directShopService } from '../../services/directShopService';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Calendar,
  BarChart3,
  Clock,
  CheckCircle,
  Layers,
  Box,
  MapPin,
  Smartphone,
  DollarSign,
  Send,
  ArrowRight,
  Activity,
  Search
} from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

export default function FinishedGoodsStoreDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalItems: 0,
    totalBulkItems: 0,
    totalPackagedItems: 0,
    totalBulkQuantity: 0,
    totalPackagedUnits: 0,
    expiringItems: 0,
    pendingClaims: 0
  });
  const [pendingDispatches, setPendingDispatches] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [pendingDirectShopRequests, setPendingDirectShopRequests] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [dashboardStats, pending, alerts, movements, directShopRequests] = await Promise.all([
        fgStoreService.getDashboardStats(),
        fgStoreService.getPendingDispatches(),
        fgStoreService.getExpiryAlerts(),
        fgStoreService.getRecentMovements(),
        directShopService.getDirectShopRequests({ status: 'ho_approved_forwarded_to_fg' }).catch(() => [])
      ]);

      setStats(dashboardStats);
      setPendingDispatches(pending.slice(0, 5)); // Show only first 5
      setExpiryAlerts(alerts.slice(0, 5)); // Show only first 5
      setRecentMovements(movements);
      setPendingDirectShopRequests(directShopRequests.length);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickClaim = async (dispatchId, dispatchType) => {
    try {
      const claimData = {
        location: 'FG-A1',
        notes: 'Quick claim from dashboard'
      };

      if (dispatchType === 'bulk') {
        await fgStoreService.claimBulkDispatch(dispatchId, claimData);
      } else {
        await fgStoreService.claimUnitDispatch(dispatchId, claimData);
      }

      await loadDashboardData();
    } catch (error) {
      setError(`Failed to claim dispatch: ${error.message}`);
    }
  };

  const quickActions = [
    {
      title: 'Claim Dispatches',
      description: 'Process incoming stock',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600',
      path: '/finished-goods/claim-dispatches',
      badge: stats.pendingClaims > 0 ? stats.pendingClaims : null
    },
    {
      title: 'Direct Shop Requests',
      description: 'Handle shop orders',
      icon: Smartphone,
      color: 'from-blue-500 to-indigo-600',
      path: '/finished-goods/direct-shop-requests',
      badge: pendingDirectShopRequests > 0 ? pendingDirectShopRequests : null
    },
    {
      title: 'Inventory',
      description: 'View stock levels',
      icon: Package,
      color: 'from-purple-500 to-violet-600',
      path: '/finished-goods/inventory'
    },
    {
      title: 'Locations',
      description: 'Manage storage',
      icon: MapPin,
      color: 'from-orange-500 to-amber-600',
      path: '/finished-goods/location-management'
    },
    {
      title: 'Pricing',
      description: 'Update product prices',
      icon: DollarSign,
      color: 'from-pink-500 to-rose-600',
      path: '/finished-goods/pricing'
    },
    {
      title: 'Reports',
      description: 'View analytics',
      icon: BarChart3,
      color: 'from-cyan-500 to-teal-600',
      path: '/finished-goods/dispatch-reports'
    }
  ];

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Finished Goods Store</h1>
              <p className="mt-2 text-gray-500">Overview of inventory, movements, and pending actions.</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">Current Date</p>
              <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Stock Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Package className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  Live
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500">Total Stock</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalBulkQuantity.toLocaleString()} <span className="text-sm font-normal text-gray-500">bulk</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                + {stats.totalPackagedUnits.toLocaleString()} units
              </p>
            </div>
          </div>

          {/* Pending Claims Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                  <Clock className="w-6 h-6" />
                </div>
                {stats.pendingClaims > 0 && (
                  <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full animate-pulse">
                    Action Needed
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-500">Pending Claims</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingClaims}</h3>
              <p className="text-sm text-gray-500 mt-1">Waiting for pickup</p>
            </div>
          </div>

          {/* Expiry Alerts Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                {stats.expiringItems > 0 && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    Critical
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.expiringItems}</h3>
              <p className="text-sm text-gray-500 mt-1">Within 30 days</p>
            </div>
          </div>

          {/* Total Items Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">Total SKUs</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</h3>
              <p className="text-sm text-gray-500 mt-1">Active products</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="group relative bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all text-left"
              >
                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${action.color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${action.color} text-white mb-3 shadow-sm`}>
                  <action.icon className="w-5 h-5" />
                </div>
                {action.badge && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {action.badge}
                  </span>
                )}
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{action.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Pending & Recent */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending Dispatches */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Pending Dispatches</h2>
                  <p className="text-sm text-gray-500">Items waiting to be claimed</p>
                </div>
                <button
                  onClick={() => navigate('/finished-goods/claim-dispatches')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {pendingDispatches.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex p-4 bg-gray-50 rounded-full mb-3">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">All caught up!</p>
                    <p className="text-sm text-gray-400">No pending dispatches to claim.</p>
                  </div>
                ) : (
                  pendingDispatches.map((dispatch) => (
                    <div key={dispatch.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${dispatch.type === 'bulk' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                            {dispatch.type === 'bulk' ? <Layers className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{dispatch.releaseCode}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dispatch.type === 'bulk' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {dispatch.type === 'bulk' ? 'Bulk' : 'Units'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {dispatch.type === 'bulk' ?
                                `${dispatch.totalItems} items • ${dispatch.totalQuantity} total qty` :
                                `${dispatch.totalVariants} variants • ${dispatch.totalUnits} units`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">{dispatch.dispatchedByName}</p>
                            <p className="text-xs text-gray-500">{formatDate(dispatch.dispatchedAt)}</p>
                          </div>
                          <button
                            onClick={() => handleQuickClaim(dispatch.id, dispatch.type)}
                            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                          >
                            Claim
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Movements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-500">Latest stock movements</p>
                </div>
                <button
                  onClick={() => navigate('/finished-goods/stock-movements')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
                >
                  View History <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {recentMovements.length === 0 ? (
                  <div className="p-8 text-center">
                    <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent activity recorded.</p>
                  </div>
                ) : (
                  recentMovements.map((movement) => (
                    <div key={movement.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${movement.type === 'in' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{movement.displayText}</p>
                            <p className="text-xs text-gray-500">{movement.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">{formatDate(movement.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Alerts & Status */}
          <div className="space-y-8">
            {/* Expiry Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-red-50/50">
                <h2 className="text-lg font-semibold text-red-900 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Expiry Alerts
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {expiryAlerts.length === 0 ? (
                  <div className="p-6 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-900 font-medium">All Good!</p>
                    <p className="text-sm text-gray-500">No expiring items found.</p>
                  </div>
                ) : (
                  expiryAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 hover:bg-red-50/30 transition-colors group">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-red-700 transition-colors">
                          {alert.productName}
                        </h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${alert.daysToExpiry <= 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                          {alert.daysToExpiry <= 0 ? 'Expired' : `${alert.daysToExpiry}d`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        Batch: {alert.batchNumber} • {alert.location}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Qty: {alert.type === 'bulk' ? `${alert.quantity} ${alert.unit}` : `${alert.unitsInStock} units`}
                        </span>
                        <button
                          onClick={() => navigate('/finished-goods/inventory')}
                          className="text-blue-600 hover:text-blue-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Status / Info */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-sm p-6 text-white">
              <h3 className="font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-400" />
                System Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Database Connection</span>
                  <span className="flex items-center text-green-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Last Sync</span>
                  <span className="text-gray-300">Just now</span>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500">
                    Need help? Contact system administrator for support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}