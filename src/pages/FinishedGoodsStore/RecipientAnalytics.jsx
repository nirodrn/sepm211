import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Search,
    Filter,
    Store,
    Truck,
    User,
    TrendingUp,
    DollarSign,
    Package,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { fgDispatchToExternalService } from '../../services/fgDispatchToExternalService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { formatDate } from '../../utils/formatDate';

const RecipientAnalytics = () => {
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, direct_shop, distributor, direct_representative
    const [sortBy, setSortBy] = useState('value'); // value, quantity, dispatches

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [directShops, distributors, reps] = await Promise.all([
                fgDispatchToExternalService.getRecipientSummary('direct_shop'),
                fgDispatchToExternalService.getRecipientSummary('distributor'),
                fgDispatchToExternalService.getRecipientSummary('direct_representative')
            ]);

            const allRecipients = [
                ...directShops.map(r => ({ ...r, type: 'direct_shop' })),
                ...distributors.map(r => ({ ...r, type: 'distributor' })),
                ...reps.map(r => ({ ...r, type: 'direct_representative' }))
            ];

            setRecipients(allRecipients);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getRecipientTypeLabel = (type) => {
        switch (type) {
            case 'direct_shop': return 'Direct Shop';
            case 'distributor': return 'Distributor';
            case 'direct_representative': return 'Direct Rep';
            default: return type;
        }
    };

    const getRecipientTypeIcon = (type) => {
        switch (type) {
            case 'direct_shop': return Store;
            case 'distributor': return Truck;
            case 'direct_representative': return User;
            default: return Package;
        }
    };

    const getRecipientTypeColor = (type) => {
        switch (type) {
            case 'direct_shop': return 'bg-blue-100 text-blue-800';
            case 'distributor': return 'bg-green-100 text-green-800';
            case 'direct_representative': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredRecipients = recipients
        .filter(r => {
            const matchesSearch = r.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.shopName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || r.type === filterType;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortBy === 'value') return (b.totalValueReceived || 0) - (a.totalValueReceived || 0);
            if (sortBy === 'quantity') return (b.totalQuantityReceived || 0) - (a.totalQuantityReceived || 0);
            if (sortBy === 'dispatches') return (b.totalDispatches || 0) - (a.totalDispatches || 0);
            return 0;
        });

    const getSummaryStats = () => {
        const totalValue = recipients.reduce((sum, r) => sum + (r.totalValueReceived || 0), 0);
        const totalDispatches = recipients.reduce((sum, r) => sum + (r.totalDispatches || 0), 0);
        const totalRecipients = recipients.length;

        // Calculate top performer
        const topPerformer = [...recipients].sort((a, b) => (b.totalValueReceived || 0) - (a.totalValueReceived || 0))[0];

        return { totalValue, totalDispatches, totalRecipients, topPerformer };
    };

    const stats = getSummaryStats();

    if (loading) return <LoadingSpinner text="Loading analytics..." />;

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
                    Recipient Analytics
                </h1>
                <p className="text-gray-600 mt-2">Analyze performance and dispatch history across all recipients</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Dispatch Value</p>
                            <p className="text-2xl font-bold text-gray-900">LKR {stats.totalValue.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Dispatches</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalDispatches}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Recipients</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalRecipients}</p>
                        </div>
                        <User className="h-8 w-8 text-purple-500" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Top Performer</p>
                            <p className="text-lg font-bold text-gray-900 truncate max-w-[150px]">
                                {stats.topPerformer?.recipientName || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                                LKR {(stats.topPerformer?.totalValueReceived || 0).toLocaleString()}
                            </p>
                        </div>
                        <Store className="h-8 w-8 text-orange-500" />
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
                            placeholder="Search recipients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-4 w-full md:w-auto">
                        <div className="flex items-center space-x-2 flex-1">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="direct_shop">Direct Shops</option>
                                <option value="distributor">Distributors</option>
                                <option value="direct_representative">Direct Reps</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2 flex-1">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="value">Sort by Value</option>
                                <option value="quantity">Sort by Quantity</option>
                                <option value="dispatches">Sort by Dispatches</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recipients List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Dispatches</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRecipients.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        No recipients found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                filteredRecipients.map((recipient, index) => {
                                    const TypeIcon = getRecipientTypeIcon(recipient.type);

                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <TypeIcon className="h-5 w-5 text-gray-500" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{recipient.recipientName}</div>
                                                        {recipient.shopName && recipient.shopName !== recipient.recipientName && (
                                                            <div className="text-xs text-gray-500">{recipient.shopName}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecipientTypeColor(recipient.type)}`}>
                                                    {getRecipientTypeLabel(recipient.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {recipient.totalDispatches}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {recipient.totalQuantityReceived?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                LKR {(recipient.totalValueReceived || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(recipient.lastDispatchDate)}
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

export default RecipientAnalytics;
