import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    Filter,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Package,
    FileText
} from 'lucide-react';
import { fgStoreService } from '../../services/fgStoreService';

const StockMovements = () => {
    const navigate = useNavigate();
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, in, out
    const [categoryFilter, setCategoryFilter] = useState('all'); // all, bulk, units

    useEffect(() => {
        fetchMovements();
    }, []);

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const data = await fgStoreService.getAllStockMovements();
            setMovements(data);
        } catch (error) {
            console.error('Error fetching stock movements:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMovements = movements.filter(movement => {
        const matchesSearch =
            movement.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            movement.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            movement.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            movement.variantName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'all' || movement.type === filterType;
        const matchesCategory = categoryFilter === 'all' || movement.category === categoryFilter;

        return matchesSearch && matchesType && matchesCategory;
    });

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
                        <p className="text-gray-500">Track all inventory history and adjustments</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search movements..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center space-x-4">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Types</option>
                        <option value="in">Stock In</option>
                        <option value="out">Stock Out</option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Categories</option>
                        <option value="bulk">Bulk Items</option>
                        <option value="units">Packaged Units</option>
                    </select>
                </div>
            </div>

            {/* Movements Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        Loading movements...
                                    </td>
                                </tr>
                            ) : filteredMovements.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        No movements found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                filteredMovements.map((movement) => (
                                    <tr key={movement.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(movement.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${movement.type === 'in'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {movement.type === 'in' ? (
                                                    <ArrowDownLeft className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                                )}
                                                {movement.type === 'in' ? 'Stock In' : 'Stock Out'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{movement.productName}</div>
                                            <div className="text-sm text-gray-500">
                                                {movement.category === 'units' ? (
                                                    <span className="flex items-center space-x-1">
                                                        <Package className="w-3 h-3" />
                                                        <span>{movement.variantName}</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center space-x-1">
                                                        <FileText className="w-3 h-3" />
                                                        <span>Bulk</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400">Batch: {movement.batchNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {movement.category === 'units'
                                                ? `${movement.units} units`
                                                : `${movement.quantity} ${movement.unit || 'units'}`
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {movement.location || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={movement.reason}>
                                            {movement.reason}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {movement.createdByName || 'Unknown'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockMovements;
