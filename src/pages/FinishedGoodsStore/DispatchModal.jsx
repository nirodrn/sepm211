import React, { useState, useEffect } from 'react';
import { X, MapPin, Package, AlertCircle, Layers, Box, Star, Calendar } from 'lucide-react';
import { fgDispatchService } from '../../services/fgDispatchService.js';
import { fgStoreService } from '../../services/fgStoreService.js';
import { useAuth } from '../../hooks/useAuth';

const DispatchModal = ({ request, onClose, onDispatchComplete }) => {
  const { user } = useAuth();
  const [dispatchItems, setDispatchItems] = useState(() => {
    const initial = {};
    Object.entries(request.items).forEach(([id, item]) => {
      initial[id] = {
        ...item,
        dispatchQty: item.qty,
        selectedBatches: [],
        showBatchSelector: false
      };
    });
    return initial;
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [availableInventory, setAvailableInventory] = useState({});

  useEffect(() => {
    loadAvailableInventory();
  }, []);

  const loadAvailableInventory = async () => {
    try {
      setLoadingInventory(true);
      const [bulkInventory, packagedInventory] = await Promise.all([
        fgStoreService.getInventory(),
        fgStoreService.getPackagedInventory()
      ]);

      const inventoryByProduct = {};

      Object.entries(request.items).forEach(([itemId, item]) => {
        const productName = item.name;

        const matchingBulk = bulkInventory.filter(
          inv => inv.productName === productName && inv.quantity > 0
        );

        const matchingPackaged = packagedInventory.filter(
          inv => inv.productName === productName && inv.unitsInStock > 0
        );

        inventoryByProduct[itemId] = {
          bulk: matchingBulk,
          packaged: matchingPackaged
        };
      });

      setAvailableInventory(inventoryByProduct);
    } catch (error) {
      setError('Failed to load inventory: ' + error.message);
    } finally {
      setLoadingInventory(false);
    }
  };

  const toggleBatchSelector = (itemId) => {
    setDispatchItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        showBatchSelector: !prev[itemId].showBatchSelector
      }
    }));
  };

  const handleBatchQuantityChange = (itemId, batch, quantity) => {
    setDispatchItems(prev => {
      const item = prev[itemId];
      const selectedBatches = [...(item.selectedBatches || [])];
      const existingIndex = selectedBatches.findIndex(
        b => b.id === batch.id && b.type === batch.type
      );

      if (existingIndex >= 0) {
        if (quantity > 0) {
          selectedBatches[existingIndex] = {
            ...batch,
            type: batch.type,
            quantityToDispatch: quantity
          };
        } else {
          selectedBatches.splice(existingIndex, 1);
        }
      } else if (quantity > 0) {
        selectedBatches.push({
          ...batch,
          type: batch.type,
          quantityToDispatch: quantity
        });
      }

      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          selectedBatches
        }
      };
    });
  };

  const getTotalSelectedForItem = (itemId) => {
    const item = dispatchItems[itemId];
    return item.selectedBatches?.reduce((sum, b) => sum + (b.quantityToDispatch || 0), 0) || 0;
  };

  const getSelectedQuantityForBatch = (itemId, batch) => {
    const item = dispatchItems[itemId];
    const selected = item.selectedBatches?.find(
      b => b.id === batch.id && b.type === batch.type
    );
    return selected?.quantityToDispatch || 0;
  };

  const handleQuantityChange = (itemId, value) => {
    const item = dispatchItems[itemId];
    const maxQty = item.qty;
    const newQty = Math.max(0, Math.min(maxQty, parseInt(value) || 0));

    setDispatchItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        dispatchQty: newQty
      }
    }));
  };

  const getAvailableQuantity = (batch, type) => {
    return type === 'bulk' ? batch.quantity : batch.unitsInStock;
  };

  const getQualityGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrors = [];

    Object.entries(dispatchItems).forEach(([id, item]) => {
      if (item.dispatchQty > 0) {
        const totalSelected = getTotalSelectedForItem(id);

        if (totalSelected === 0) {
          validationErrors.push(`${item.name}: No batches selected`);
        } else if (totalSelected < item.dispatchQty) {
          validationErrors.push(`${item.name}: Selected ${totalSelected}, need ${item.dispatchQty}`);
        } else if (totalSelected > item.dispatchQty) {
          validationErrors.push(`${item.name}: Selected ${totalSelected}, only need ${item.dispatchQty}`);
        }
      }
    });

    if (validationErrors.length > 0) {
      setError(`Validation errors:\n${validationErrors.join('\n')}`);
      return;
    }

    setLoading(true);

    try {
      const dispatchData = {};
      Object.entries(dispatchItems).forEach(([id, item]) => {
        if (item.dispatchQty > 0 && item.selectedBatches?.length > 0) {
          dispatchData[id] = {
            name: item.name,
            qty: item.dispatchQty,
            batches: item.selectedBatches.map(b => ({
              batchId: b.id,
              batchNumber: b.batchNumber,
              location: b.location,
              inventoryType: b.type,
              quantity: b.quantityToDispatch
            }))
          };
        }
      });

      const payload = {
        items: dispatchData,
        dispatchedBy: user.uid,
        dispatchedByName: user.displayName,
        dispatchedByRole: user.role,
        notes: notes.trim()
      };

      await fgDispatchService.dispatchSalesRequest(request.id, payload);
      onDispatchComplete();
    } catch (error) {
      setError(error.message || 'Failed to dispatch request');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dispatch to {request.requesterName}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Select inventory batches and quantities to dispatch
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Info */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-900">Requester:</span>
                  <span className="ml-2 text-blue-700">{request.requesterName}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Role:</span>
                  <span className="ml-2 text-blue-700">{request.requesterRole}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Type:</span>
                  <span className="ml-2 text-blue-700">
                    {request.requestType === 'direct_shop' ? 'Direct Shop' :
                     request.requestType === 'direct_representative' ? 'Direct Representative' :
                     'Distributor'}
                  </span>
                </div>
              </div>
            </div>

            {loadingInventory ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
                <p className="mt-4 text-gray-500">Loading available inventory...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(dispatchItems).map(([itemId, item]) => {
                  const inventory = availableInventory[itemId] || { bulk: [], packaged: [] };
                  const allBatches = [
                    ...inventory.bulk.map(b => ({ ...b, type: 'bulk' })),
                    ...inventory.packaged.map(b => ({ ...b, type: 'packaged' }))
                  ];

                  return (
                    <div key={itemId} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600">
                              Approved Quantity: {item.qty} units
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                Dispatch Quantity
                              </label>
                              <input
                                type="number"
                                className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={item.dispatchQty}
                                onChange={(e) => handleQuantityChange(itemId, e.target.value)}
                                max={item.qty}
                                min="0"
                                required
                              />
                            </div>
                            {item.selectedBatch && (
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Available in batch</p>
                                <p className="text-lg font-semibold text-green-600">
                                  {getAvailableQuantity(item.selectedBatch, item.selectedBatch.type)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Required:</span> {item.dispatchQty} units
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Selected:</span>{' '}
                              <span className={getTotalSelectedForItem(itemId) >= item.dispatchQty ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                                {getTotalSelectedForItem(itemId)} units
                              </span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleBatchSelector(itemId)}
                            className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                          >
                            {item.showBatchSelector ? 'Hide Batches' : 'Select Batches'}
                          </button>
                        </div>

                        {item.selectedBatches?.length > 0 && (
                          <div className="mb-3 space-y-1">
                            <p className="text-xs font-medium text-gray-700">Selected Batches:</p>
                            {item.selectedBatches.map((batch, idx) => (
                              <div key={idx} className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
                                <span className="font-medium">{batch.batchNumber}</span> ({batch.location}): {batch.quantityToDispatch} units
                              </div>
                            ))}
                          </div>
                        )}

                        {item.showBatchSelector && (
                          <div className="border border-gray-300 rounded-lg overflow-hidden">
                            {allBatches.length === 0 ? (
                              <div className="p-6 text-center">
                                <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
                                <p className="mt-2 text-sm font-medium text-red-900">No Stock Available</p>
                                <p className="text-xs text-red-600">No inventory for this product in FG Store</p>
                              </div>
                            ) : (
                              <div className="max-h-96 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quality</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dispatch Qty</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {allBatches.map((batch) => {
                                      const batchQty = getAvailableQuantity(batch, batch.type);
                                      const selectedQty = getSelectedQuantityForBatch(itemId, batch);

                                      return (
                                        <tr key={`${batch.id}-${batch.type}`} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                              batch.type === 'bulk' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                              {batch.type === 'bulk' ? (
                                                <><Layers className="h-3 w-3 mr-1" />Bulk</>
                                              ) : (
                                                <><Box className="h-3 w-3 mr-1" />Units</>
                                              )}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="text-xs">
                                              <div className="font-medium text-gray-900">{batch.batchNumber}</div>
                                              {batch.variantName && <div className="text-gray-500">{batch.variantName}</div>}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center text-xs text-gray-900">
                                              <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                                              {batch.location}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-gray-900">
                                            {batchQty}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getQualityGradeColor(batch.qualityGrade)}`}>
                                              Grade {batch.qualityGrade}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            <input
                                              type="number"
                                              min="0"
                                              max={batchQty}
                                              value={selectedQty}
                                              onChange={(e) => handleBatchQuantityChange(itemId, batch, parseInt(e.target.value) || 0)}
                                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                              placeholder="0"
                                            />
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dispatch Notes (optional)
              </label>
              <textarea
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this dispatch..."
              />
            </div>
          </form>
        </div>

        {/* Footer with buttons */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || loadingInventory}
              className={`px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading || loadingInventory ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Dispatching...' : 'Confirm Dispatch'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchModal;
