import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Plus, Edit2, Trash2, MapPin, Users, Phone, Mail, TrendingUp } from 'lucide-react';
import { directShowroomService } from '../../../services/directShowroomService';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import ErrorMessage from '../../../components/Common/ErrorMessage';

const DirectShowroomsList = () => {
  const navigate = useNavigate();
  const [showrooms, setShowrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadShowrooms();
  }, []);

  const loadShowrooms = async () => {
    try {
      setLoading(true);
      const data = await directShowroomService.getAllShowrooms();
      setShowrooms(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this showroom?')) return;

    try {
      await directShowroomService.deleteShowroom(id);
      await loadShowrooms();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredShowrooms = showrooms.filter(showroom => {
    const matchesStatus = filterStatus === 'all' || showroom.status === filterStatus;
    const matchesSearch =
      showroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      showroom.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      showroom.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return styles[status] || styles.inactive;
  };

  if (loading) {
    return <LoadingSpinner text="Loading showrooms..." />;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Store className="h-8 w-8 mr-3 text-blue-600" />
              Direct Showrooms
            </h1>
            <p className="text-gray-600 mt-2">
              Manage direct showroom locations and assignments
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/direct-showrooms/add')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Showroom</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <input
                  type="text"
                  placeholder="Search by name, code, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Showroom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShowrooms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchQuery || filterStatus !== 'all'
                      ? 'No showrooms found matching your filters'
                      : 'No showrooms created yet. Click "Add Showroom" to create one.'}
                  </td>
                </tr>
              ) : (
                filteredShowrooms.map((showroom) => (
                  <tr key={showroom.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{showroom.name}</div>
                        <div className="text-sm text-gray-500 font-mono">{showroom.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-gray-900">{showroom.city}</div>
                          <div className="text-xs text-gray-500">{showroom.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {showroom.contact_number && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            <span>{showroom.contact_number}</span>
                          </div>
                        )}
                        {showroom.email && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span>{showroom.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-gray-900">
                          {showroom.target_sales ? `$${showroom.target_sales.toLocaleString()}` : 'Not set'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(showroom.status)}`}>
                        {showroom.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/admin/direct-showrooms/edit/${showroom.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit showroom"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/direct-showrooms/detail/${showroom.id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        {showroom.status !== 'inactive' && (
                          <button
                            onClick={() => handleDelete(showroom.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deactivate showroom"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredShowrooms.length} of {showrooms.length} showrooms
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">
                  Active: {showrooms.filter(s => s.status === 'active').length}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-gray-600">
                  Inactive: {showrooms.filter(s => s.status === 'inactive').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectShowroomsList;
