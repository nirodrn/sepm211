import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Map,
    LayoutGrid,
    List,
    AlertTriangle,
    CheckCircle,
    Thermometer,
    Droplets,
    Box,
    Layers,
    Search,
    Filter
} from 'lucide-react';
import { getData } from '../../firebase/db';
import { fgStoreService } from '../../services/fgStoreService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const LocationManagement = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const [locations, setLocations] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalLocations: 0,
        totalCapacity: 0,
        usedCapacity: 0,
        utilization: 0,
        fullLocations: 0,
        emptyLocations: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [locationsData, bulkInventory, packagedInventory] = await Promise.all([
                getData('fgStorageLocations'),
                fgStoreService.getInventory(),
                fgStoreService.getPackagedInventory()
            ]);

            // Process Locations
            let locationsList = [];
            if (locationsData) {
                locationsList = Object.entries(locationsData).map(([id, location]) => ({
                    id,
                    ...location,
                    items: [],
                    itemCount: 0,
                    utilization: 0
                }));
            }

            // Process Inventory
            const combinedInventory = [
                ...bulkInventory.map(item => ({ ...item, type: 'bulk' })),
                ...packagedInventory.map(item => ({ ...item, type: 'units' }))
            ];
            setInventory(combinedInventory);

            // Map inventory to locations
            combinedInventory.forEach(item => {
                const location = locationsList.find(l => l.code === item.location);
                if (location) {
                    location.items.push(item);
                    location.itemCount += 1;
                }
            });

            // Calculate utilization
            locationsList.forEach(location => {
                if (location.capacity) {
                    location.utilization = Math.round((location.itemCount / location.capacity) * 100);
                } else {
                    location.utilization = location.itemCount > 0 ? 100 : 0; // Assume full if no capacity set but has items? Or just 0?
                    // Let's treat no capacity as "unlimited" or just show count
                }
            });

            setLocations(locationsList);

            // Calculate Stats
            const totalLocs = locationsList.length;
            const totalCap = locationsList.reduce((sum, loc) => sum + (parseInt(loc.capacity) || 0), 0);
            const usedCap = locationsList.reduce((sum, loc) => sum + loc.itemCount, 0);
            const fullLocs = locationsList.filter(loc => loc.utilization >= 100).length;
            const emptyLocs = locationsList.filter(loc => loc.itemCount === 0).length;

            setStats({
                totalLocations: totalLocs,
                totalCapacity: totalCap,
                usedCapacity: usedCap,
                utilization: totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0,
                fullLocations: fullLocs,
                emptyLocations: emptyLocs
            });

        } catch (error) {
            console.error('Error loading location data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUtilizationColor = (percentage) => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 75) return 'bg-orange-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const filteredLocations = locations.filter(loc => {
        const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loc.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || loc.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return <LoadingSpinner text="Loading location data..." />;
    }

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
                        <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
                        <p className="text-gray-500">Advanced view and capacity planning</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Locations</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalLocations}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                            <Map className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Overall Utilization</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.utilization}%</p>
                        </div>
                        <div className={`p-3 rounded-full ${stats.utilization > 80 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Full Locations</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.fullLocations}</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-full text-orange-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Empty Locations</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.emptyLocations}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-full text-gray-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center space-x-4">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="full">Full</option>
                    </select>
                </div>
            </div>

            {/* Locations View */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredLocations.map(location => (
                        <div key={location.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{location.code}</h3>
                                    <p className="text-sm text-gray-500">{location.name}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${location.status === 'active' ? 'bg-green-100 text-green-800' :
                                        location.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {location.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* Capacity Bar */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500">Utilization</span>
                                        <span className="font-medium text-gray-900">{location.utilization}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${getUtilizationColor(location.utilization)}`}
                                            style={{ width: `${Math.min(location.utilization, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {location.itemCount} items / {location.capacity || '∞'} capacity
                                    </p>
                                </div>

                                {/* Conditions */}
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <div className="flex items-center space-x-1">
                                        <Thermometer className="w-4 h-4" />
                                        <span className="capitalize">{location.temperature || 'Ambient'}</span>
                                    </div>
                                    {location.humidity && (
                                        <div className="flex items-center space-x-1">
                                            <Droplets className="w-4 h-4" />
                                            <span>{location.humidity}%</span>
                                        </div>
                                    )}
                                </div>

                                {/* Items Preview */}
                                <div className="pt-2 border-t border-gray-100">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Top Items:</p>
                                    <div className="space-y-1">
                                        {location.items.slice(0, 3).map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs">
                                                <span className="truncate max-w-[150px]">{item.productName}</span>
                                                <span className="text-gray-500">
                                                    {item.type === 'bulk' ? item.quantity : item.unitsInStock}
                                                </span>
                                            </div>
                                        ))}
                                        {location.items.length > 3 && (
                                            <p className="text-xs text-blue-600 text-center pt-1">
                                                + {location.items.length - 3} more items
                                            </p>
                                        )}
                                        {location.items.length === 0 && (
                                            <p className="text-xs text-gray-400 italic">No items in storage</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conditions</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLocations.map(location => (
                                    <tr key={location.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{location.code}</div>
                                            <div className="text-sm text-gray-500">{location.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${location.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    location.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {location.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {location.capacity || 'Unlimited'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col">
                                                <span className="capitalize">{location.temperature || 'Ambient'}</span>
                                                {location.humidity && <span>{location.humidity}% Humidity</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {location.itemCount} items
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="w-full max-w-[100px]">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span>{location.utilization}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${getUtilizationColor(location.utilization)}`}
                                                        style={{ width: `${Math.min(location.utilization, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationManagement;
