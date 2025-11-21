import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Store, Save, ArrowLeft } from 'lucide-react';
import { directShowroomService } from '../../../services/directShowroomService';
import { userService } from '../../../services/userService';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import ErrorMessage from '../../../components/Common/ErrorMessage';

const AddEditShowroom = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    city: '',
    contact_number: '',
    email: '',
    manager_id: '',
    status: 'active',
    target_sales: 0,
    opening_hours: {
      monday: '9:00-18:00',
      tuesday: '9:00-18:00',
      wednesday: '9:00-18:00',
      thursday: '9:00-18:00',
      friday: '9:00-18:00',
      saturday: '9:00-18:00',
      sunday: 'closed'
    }
  });

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadManagers();
    if (isEdit) {
      loadShowroomData();
    }
  }, [id, isEdit]);

  const loadManagers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      const availableManagers = allUsers.filter(user =>
        (user.role === 'DirectShowroomManager' || user.role === 'DSStaff') &&
        user.status === 'active'
      );
      setManagers(availableManagers);
    } catch (err) {
      console.error('Failed to load managers:', err);
    }
  };

  const loadShowroomData = async () => {
    try {
      setLoading(true);
      const data = await directShowroomService.getShowroomById(id);
      setFormData({
        name: data.name || '',
        code: data.code || '',
        location: data.location || '',
        city: data.city || '',
        contact_number: data.contact_number || '',
        email: data.email || '',
        manager_id: data.manager_id || '',
        status: data.status || 'active',
        target_sales: data.target_sales || 0,
        opening_hours: data.opening_hours || {
          monday: '9:00-18:00',
          tuesday: '9:00-18:00',
          wednesday: '9:00-18:00',
          thursday: '9:00-18:00',
          friday: '9:00-18:00',
          saturday: '9:00-18:00',
          sunday: 'closed'
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHoursChange = (day, value) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isEdit) {
        await directShowroomService.updateShowroom(id, formData);
        setSuccess('Showroom updated successfully!');
      } else {
        await directShowroomService.createShowroom(formData);
        setSuccess('Showroom created successfully!');
      }

      setTimeout(() => {
        navigate('/admin/direct-showrooms');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <LoadingSpinner text="Loading showroom data..." />;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/direct-showrooms')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Store className="h-8 w-8 mr-3 text-blue-600" />
              {isEdit ? 'Edit Showroom' : 'Add New Showroom'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEdit ? 'Update showroom information' : 'Create a new direct showroom location'}
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}

      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Showroom Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter showroom name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Showroom Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="e.g., DS001"
              />
              <p className="text-sm text-gray-500 mt-1">Unique identifier for this showroom</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter city"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location/Address *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter full address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter contact number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Showroom Manager
              </label>
              <select
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a manager</option>
                {managers.map(manager => (
                  <option key={manager.uid || manager.id} value={manager.uid || manager.id}>
                    {manager.name} ({manager.role})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Assign a DirectShowroomManager or DSStaff to this showroom
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Target Sales
              </label>
              <input
                type="number"
                name="target_sales"
                value={formData.target_sales}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Opening Hours</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData.opening_hours).map(([day, hours]) => (
              <div key={day} className="flex items-center space-x-3">
                <label className="w-24 text-sm font-medium text-gray-700 capitalize">
                  {day}
                </label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => handleHoursChange(day, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 9:00-18:00 or closed"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/direct-showrooms')}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Showroom' : 'Create Showroom')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditShowroom;
