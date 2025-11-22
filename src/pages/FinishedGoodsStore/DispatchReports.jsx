import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    Filter,
    Calendar,
    Download,
    FileText,
    Truck,
    Store,
    Users,
    User
} from 'lucide-react';
import { fgDispatchToExternalService } from '../../services/fgDispatchToExternalService';
import * as XLSX from 'xlsx';

const DispatchReports = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [dispatches, setDispatches] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        recipientType: 'all',
        status: 'all'
    });

    useEffect(() => {
        fetchDispatches();
    }, []);

    const fetchDispatches = async () => {
        try {
            setLoading(true);
            const queryFilters = {};

            if (filters.startDate) {
                queryFilters.dateFrom = new Date(filters.startDate).getTime();
            }

            if (filters.endDate) {
                // Set to end of day
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                queryFilters.dateTo = endDate.getTime();
            }

            if (filters.recipientType !== 'all') {
                queryFilters.recipientType = filters.recipientType;
            }

            if (filters.status !== 'all') {
                queryFilters.status = filters.status;
            }

            const data = await fgDispatchToExternalService.getExternalDispatches(queryFilters);
            setDispatches(data);
        } catch (error) {
            console.error('Error fetching dispatches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApplyFilters = () => {
        fetchDispatches();
    };

    const handleExport = () => {
        const exportData = dispatches.map(d => ({
            'Date': new Date(d.dispatchedAt).toLocaleDateString(),
            'Time': new Date(d.dispatchedAt).toLocaleTimeString(),
            'Release Code': d.releaseCode,
            'Recipient Type': d.recipientType,
            'Recipient Name': d.recipientName,
            'Shop Name': d.shopName || 'N/A',
            'Items Count': d.totalItems,
            'Total Quantity': d.totalQuantity,
            'Total Value': d.totalValue,
            'Status': d.status,
            'Dispatched By': d.dispatchedByName
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dispatch Report");

        // Generate filename with date range if applicable
        let filename = "Dispatch_Report";
        if (filters.startDate) filename += `_from_${filters.startDate}`;
        if (filters.endDate) filename += `_to_${filters.endDate}`;
        filename += ".xlsx";

        XLSX.writeFile(wb, filename);
    };

    const getRecipientIcon = (type) => {
        switch (type) {
            case 'direct_shop': return <Store className="w-4 h-4" />;
            case 'distributor': return <Truck className="w-4 h-4" />;
            case 'direct_representative': return <User className="w-4 h-4" />;
            default: return <Users className="w-4 h-4" />;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
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
                        <h1 className="text-2xl font-bold text-gray-900">Dispatch Reports</h1>
                        <p className="text-gray-500">Generate and export detailed dispatch reports</p>
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    disabled={dispatches.length === 0}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white transition-colors ${dispatches.length === 0
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                >
                    <Download className="w-4 h-4" />
                    <span>Export to Excel</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
                        <select
                            name="recipientType"
                            value={filters.recipientType}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Types</option>
                            <option value="direct_shop">Direct Shop</option>
                            <option value="distributor">Distributor</option>
                            <option value="direct_representative">Direct Representative</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <button
                        onClick={handleApplyFilters}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Apply Filters</span>
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Release Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        Loading report data...
                                    </td>
                                </tr>
                            ) : dispatches.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No dispatches found matching the selected filters
                                    </td>
                                </tr>
                            ) : (
                                dispatches.map((dispatch) => (
                                    <tr key={dispatch.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(dispatch.dispatchedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 ml-6">
                                                {new Date(dispatch.dispatchedAt).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                {dispatch.releaseCode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="p-1 bg-blue-50 rounded text-blue-600">
                                                    {getRecipientIcon(dispatch.recipientType)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {dispatch.recipientName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 capitalize">
                                                        {dispatch.recipientType.replace('_', ' ')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{dispatch.totalItems} items</div>
                                            <div className="text-xs">{dispatch.totalQuantity} units total</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(dispatch.totalValue)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dispatch.status === 'dispatched' ? 'bg-green-100 text-green-800' :
                                                    dispatch.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {dispatch.status.charAt(0).toUpperCase() + dispatch.status.slice(1)}
                                            </span>
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

export default DispatchReports;
