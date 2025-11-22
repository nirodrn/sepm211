import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Search,
    Filter,
    AlertTriangle,
    CheckCircle,
    Clock,
    Package,
    Layers,
    Box,
    ArrowRight
} from 'lucide-react';
import { fgStoreService } from '../../services/fgStoreService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { formatDate } from '../../utils/formatDate';

const ExpiryManagement = () => {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, expired, critical, warning, good

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const [bulkData, packagedData] = await Promise.all([
                fgStoreService.getInventory(),
                fgStoreService.getPackagedInventory()
            ]);

            // Combine and normalize data
            const combined = [
                ...bulkData.map(item => ({ ...item, type: 'bulk' })),
                ...packagedData.map(item => ({ ...item, type: 'units' }))
            ].filter(item => item.expiryDate); // Only items with expiry dates

            // Sort by expiry date (ascending)
            combined.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

            setInventory(combined);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry - today;
        const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysToExpiry < 0) return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
        if (daysToExpiry <= 7) return { status: 'critical', label: 'Critical (< 7 days)', color: 'bg-red-50 text-red-600', icon: AlertTriangle };
        if (daysToExpiry <= 30) return { status: 'warning', label: 'Warning (< 30 days)', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
        return { status: 'good', label: 'Good', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    };

    const filteredInventory = inventory.filter(item => {
        const status = getExpiryStatus(item.expiryDate);
        const matchesSearch = item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' || status.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const getSummary = () => {
        const total = inventory.length;
        const expired = inventory.filter(i => getExpiryStatus(i.expiryDate).status === 'expired').length;
        const critical = inventory.filter(i => getExpiryStatus(i.expiryDate).status === 'critical').length;
        const warning = inventory.filter(i => getExpiryStatus(i.expiryDate).status === 'warning').length;

        return { total, expired, critical, warning };
    };

    const summary = getSummary();

    if (loading) return <LoadingSpinner text="Loading expiry data..." />;

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <Calendar className="h-8 w-8 mr-3 text-blue-600" />
                    Expiry Management
                </h1>
                <p className="text-gray-600 mt-2">Monitor and manage product expiration dates</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Tracked Items</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600">Expired</p>
                            <p className="text-2xl font-bold text-red-900">{summary.expired}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-600">Critical (7 Days)</p>
                            <p className="text-2xl font-bold text-orange-900">{summary.critical}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-orange-500" />
                    </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-yellow-600">Warning (30 Days)</p>
                            <p className="text-2xl font-bold text-yellow-900">{summary.warning}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search products or batches..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full md:w-auto border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="expired">Expired</option>
                            <option value="critical">Critical</option>
                            <option value="warning">Warning</option>
                            <option value="good">Good</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        No items found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map((item, index) => {
                                    const status = getExpiryStatus(item.expiryDate);
                                    const StatusIcon = status.icon;

                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                                {item.variantName && (
                                                    <div className="text-xs text-gray-500">{item.variantName}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.batchNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'bulk' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {item.type === 'bulk' ? <Layers className="w-3 h-3 mr-1" /> : <Box className="w-3 h-3 mr-1" />}
                                                    {item.type === 'bulk' ? 'Bulk' : 'Unit'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.type === 'bulk' ? `${item.quantity} ${item.unit}` : `${item.unitsInStock} units`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.location}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatDate(item.expiryDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExpiryManagement;
