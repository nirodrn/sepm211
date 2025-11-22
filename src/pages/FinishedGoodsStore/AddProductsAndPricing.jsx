import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus,
  FileSpreadsheet,
  Package,
  DollarSign,
  Eye,
  Save,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { fgStoreService } from '../../services/fgStoreService';
import { fgPricingService } from '../../services/fgPricingService';
import { getData } from '../../firebase/db';
import { auth } from '../../firebase/auth';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const AddProductsAndPricing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedData, setUploadedData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const locationsData = await getData('fgStorageLocations');
      if (locationsData) {
        const locationsList = Object.entries(locationsData)
          .map(([id, location]) => ({ id, ...location }))
          .filter(location => location.status === 'active')
          .map(loc => loc.code);
        setAvailableLocations(locationsList.length > 0 ? locationsList : ['FG-A1', 'FG-A2', 'FG-B1', 'FG-B2']);
      } else {
        setAvailableLocations(['FG-A1', 'FG-A2', 'FG-B1', 'FG-B2']);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      setAvailableLocations(['FG-A1', 'FG-A2', 'FG-B1', 'FG-B2']);
    }
  };

  // Download Excel template
  const downloadTemplate = () => {
    const templateData = [
      ['Product Type', 'Product Name', 'Product ID', 'Batch Number', 'Quantity', 'Unit', 'Variant Name', 'Variant Size', 'Variant Unit', 'Units in Stock', 'Quality Grade', 'Expiry Date (YYYY-MM-DD)', 'Location', 'Price', 'Currency', 'Price Type', 'Notes']
    ];

    // Add sample rows
    templateData.push([
      'bulk', 'Honey Syrup', 'HONEY001', 'BATCH001', '100', 'L', '', '', '', '', 'A', '2025-12-31', 'FG-A1', '500', 'LKR', 'retail', 'Sample bulk product'
    ]);
    templateData.push([
      'units', 'Herbal Tea', 'TEA001', 'BATCH002', '', '', '500g', '500', 'g', '50', 'A', '2025-12-31', 'FG-A2', '250', 'LKR', 'retail', 'Sample packaged product'
    ]);

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products and Pricing');
    
    // Auto-size columns
    const colWidths = [
      { wch: 15 }, // Product Type
      { wch: 20 }, // Product Name
      { wch: 15 }, // Product ID
      { wch: 15 }, // Batch Number
      { wch: 12 }, // Quantity
      { wch: 8 },  // Unit
      { wch: 15 }, // Variant Name
      { wch: 12 }, // Variant Size
      { wch: 10 }, // Variant Unit
      { wch: 15 }, // Units in Stock
      { wch: 12 }, // Quality Grade
      { wch: 20 }, // Expiry Date
      { wch: 12 }, // Location
      { wch: 12 }, // Price
      { wch: 8 },  // Currency
      { wch: 12 }, // Price Type
      { wch: 30 }  // Notes
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, 'finished-goods-products-pricing-template.xlsx');
    setSuccess('Template downloaded successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Validate uploaded data line by line
  const validateData = (data) => {
    const results = [];
    const errors = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel rows start at 1 and we have a header
      const rowErrors = [];
      const rowWarnings = [];
      
      // Required fields validation
      const productType = (row['Product Type'] || row['productType'] || '').toString().toLowerCase().trim();
      const productName = (row['Product Name'] || row['productName'] || '').toString().trim();
      const productId = (row['Product ID'] || row['productId'] || '').toString().trim();
      const batchNumber = (row['Batch Number'] || row['batchNumber'] || '').toString().trim();
      const location = (row['Location'] || row['location'] || 'FG-A1').toString().trim();
      const price = row['Price'] || row['price'] || '';
      
      // Product Type validation
      if (!productType || (productType !== 'bulk' && productType !== 'units')) {
        rowErrors.push('Product Type must be "bulk" or "units"');
      }
      
      // Product Name validation
      if (!productName) {
        rowErrors.push('Product Name is required');
      }
      
      // Product ID validation
      if (!productId) {
        rowErrors.push('Product ID is required');
      }
      
      // Batch Number validation
      if (!batchNumber) {
        rowErrors.push('Batch Number is required');
      }
      
      // Location validation
      if (location && !availableLocations.includes(location)) {
        rowWarnings.push(`Location "${location}" not found. Using default: FG-A1`);
      }
      
      // Quantity/Units validation based on type
      if (productType === 'bulk') {
        const quantity = parseFloat(row['Quantity'] || row['quantity'] || 0);
        const unit = (row['Unit'] || row['unit'] || 'kg').toString().trim();
        
        if (!quantity || quantity <= 0) {
          rowErrors.push('Quantity must be greater than 0 for bulk products');
        }
        if (!unit) {
          rowErrors.push('Unit is required for bulk products');
        }
        
        // Variant fields should be empty for bulk
        if (row['Variant Name'] || row['variantName']) {
          rowWarnings.push('Variant Name should be empty for bulk products');
        }
        if (row['Units in Stock'] || row['unitsInStock']) {
          rowWarnings.push('Units in Stock should be empty for bulk products');
        }
      } else if (productType === 'units') {
        const variantName = (row['Variant Name'] || row['variantName'] || '').toString().trim();
        const variantSize = (row['Variant Size'] || row['variantSize'] || '').toString().trim();
        const variantUnit = (row['Variant Unit'] || row['variantUnit'] || '').toString().trim();
        const unitsInStock = parseFloat(row['Units in Stock'] || row['unitsInStock'] || 0);
        
        if (!variantName) {
          rowErrors.push('Variant Name is required for packaged products');
        }
        if (!variantSize || !variantUnit) {
          rowErrors.push('Variant Size and Unit are required for packaged products');
        }
        if (!unitsInStock || unitsInStock <= 0) {
          rowErrors.push('Units in Stock must be greater than 0 for packaged products');
        }
        
        // Quantity should be empty for units
        if (row['Quantity'] || row['quantity']) {
          rowWarnings.push('Quantity should be empty for packaged products');
        }
      }
      
      // Quality Grade validation
      const qualityGrade = (row['Quality Grade'] || row['qualityGrade'] || 'A').toString().trim().toUpperCase();
      if (qualityGrade && !['A', 'B', 'C', 'D'].includes(qualityGrade)) {
        rowErrors.push('Quality Grade must be A, B, C, or D');
      }
      
      // Expiry Date validation
      const expiryDate = (row['Expiry Date (YYYY-MM-DD)'] || row['expiryDate'] || '').toString().trim();
      if (expiryDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(expiryDate)) {
          rowErrors.push('Expiry Date must be in YYYY-MM-DD format');
        } else {
          const date = new Date(expiryDate);
          if (isNaN(date.getTime())) {
            rowErrors.push('Expiry Date is not a valid date');
          }
        }
      }
      
      // Price validation
      const priceValue = parseFloat(price);
      if (!price || isNaN(priceValue) || priceValue <= 0) {
        rowErrors.push('Price must be a positive number');
      }
      
      // Currency validation
      const currency = (row['Currency'] || row['currency'] || 'LKR').toString().trim().toUpperCase();
      if (!['LKR', 'USD', 'EUR'].includes(currency)) {
        rowWarnings.push(`Currency "${currency}" not standard. Using LKR`);
      }
      
      // Price Type validation
      const priceType = (row['Price Type'] || row['priceType'] || 'retail').toString().trim().toLowerCase();
      if (!['retail', 'wholesale', 'distributor', 'special'].includes(priceType)) {
        rowWarnings.push(`Price Type "${priceType}" not standard. Using retail`);
      }
      
      const isValid = rowErrors.length === 0;
      
      results.push({
        rowNumber,
        data: row,
        isValid,
        errors: rowErrors,
        warnings: rowWarnings
      });
      
      if (!isValid) {
        errors.push(`Row ${rowNumber}: ${rowErrors.join('; ')}`);
      }
    });
    
    setValidationResults(results);
    
    if (errors.length > 0) {
      setError(`Validation failed for ${errors.length} row(s). Please check the preview below.`);
      setShowPreview(true);
    } else {
      setError('');
      setSuccess(`All ${results.length} row(s) validated successfully! You can now save to database.`);
      setShowPreview(true);
    }
    
    return results.filter(r => r.isValid).length === results.length;
  };

  // Handle Excel file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setValidationResults([]);
    setShowPreview(false);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setError('Excel file is empty or has no data rows');
          setLoading(false);
          return;
        }
        
        setUploadedData(jsonData);
        
        // Validate data
        validateData(jsonData);
        
        setLoading(false);
      } catch (error) {
        setError(`Failed to read Excel file: ${error.message}`);
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Save validated data to database
  const saveToDatabase = async () => {
    const validRows = validationResults.filter(r => r.isValid);
    
    if (validRows.length === 0) {
      setError('No valid rows to save. Please fix validation errors first.');
      return;
    }
    
    setProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      const currentUser = auth.currentUser;
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      for (const result of validRows) {
        try {
          const row = result.data;
          const productType = (row['Product Type'] || row['productType'] || '').toString().toLowerCase().trim();
          const productName = (row['Product Name'] || row['productName'] || '').toString().trim();
          const productId = (row['Product ID'] || row['productId'] || '').toString().trim();
          const batchNumber = (row['Batch Number'] || row['batchNumber'] || '').toString().trim();
          const location = (row['Location'] || row['location'] || 'FG-A1').toString().trim() || 'FG-A1';
          const qualityGrade = (row['Quality Grade'] || row['qualityGrade'] || 'A').toString().trim().toUpperCase() || 'A';
          const expiryDate = (row['Expiry Date (YYYY-MM-DD)'] || row['expiryDate'] || '').toString().trim();
          const price = parseFloat(row['Price'] || row['price'] || 0);
          const currency = (row['Currency'] || row['currency'] || 'LKR').toString().trim().toUpperCase() || 'LKR';
          const priceType = (row['Price Type'] || row['priceType'] || 'retail').toString().trim().toLowerCase() || 'retail';
          
          // Generate release code
          const now = new Date();
          const releaseCode = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
          
          if (productType === 'bulk') {
            const quantity = parseFloat(row['Quantity'] || row['quantity'] || 0);
            const unit = (row['Unit'] || row['unit'] || 'kg').toString().trim();
            
            // Add to inventory
            const inventoryKey = `${productId}_${batchNumber}`;
            const existingInventory = await getData(`finishedGoodsInventory/${inventoryKey}`);
            
            const inventoryData = {
              productId,
              productName,
              batchNumber,
              quantity: Number(quantity) || 0,
              unit,
              qualityGrade,
              expiryDate: expiryDate || null,
              releaseCode,
              location: availableLocations.includes(location) ? location : 'FG-A1',
              receivedFrom: 'manual_entry',
              dispatchType: 'manual'
            };
            
            if (existingInventory) {
              // Update existing
              const currentQuantity = Number(existingInventory.quantity) || 0;
              await fgStoreService.addToInventory({
                ...inventoryData,
                quantity: Number(quantity) // Pass the increment amount
              });
            } else {
              // Create new
              await fgStoreService.addToInventory(inventoryData);
            }
          } else if (productType === 'units') {
            const variantName = (row['Variant Name'] || row['variantName'] || '').toString().trim();
            const variantSize = (row['Variant Size'] || row['variantSize'] || '').toString().trim();
            const variantUnit = (row['Variant Unit'] || row['variantUnit'] || '').toString().trim();
            const unitsInStock = parseFloat(row['Units in Stock'] || row['unitsInStock'] || 0);
            
            // Add to packaged inventory
            const inventoryData = {
              productId,
              productName,
              variantName,
              batchNumber,
              unitsReceived: Number(unitsInStock) || 0,
              variantSize,
              variantUnit,
              qualityGrade,
              expiryDate: expiryDate || null,
              releaseCode,
              location: availableLocations.includes(location) ? location : 'FG-A1',
              receivedFrom: 'manual_entry',
              dispatchType: 'manual'
            };
            
            await fgStoreService.addPackagedUnitsToInventory(inventoryData);
          }
          
          // Add/Update pricing
          const productKey = productType === 'units' && row['Variant Name'] ? 
            `${productId}_${(row['Variant Name'] || row['variantName']).toString().trim()}` : 
            productId;
          
          await fgPricingService.updateProductPrice(productKey, {
            price,
            currency,
            priceType,
            changeReason: 'Bulk upload via Excel template',
            effectiveDate: Date.now()
          });
          
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Row ${result.rowNumber}: ${error.message}`);
        }
      }
      
      if (successCount > 0) {
        setSuccess(`Successfully added ${successCount} product(s) to inventory and pricing.${errorCount > 0 ? ` ${errorCount} error(s) occurred.` : ''}`);
        setTimeout(() => {
          setUploadedData([]);
          setValidationResults([]);
          setShowPreview(false);
          setSuccess('');
        }, 5000);
      }
      
      if (errorCount > 0) {
        setError(`Failed to add ${errorCount} product(s): ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? '...' : ''}`);
      }
      
    } catch (error) {
      setError(`Failed to save data: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getValidationIcon = (isValid) => {
    return isValid ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/finished-goods/inventory')}
              className="mb-4 text-blue-600 hover:text-blue-800 flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Inventory</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Plus className="h-8 w-8 mr-3 text-blue-600" />
              Add Products & Pricing
            </h1>
            <p className="text-gray-600 mt-2">Bulk upload finished goods products and their prices using Excel</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-600" />
          Excel Upload
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Download Template */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Download Template</h3>
            <p className="text-sm text-gray-600 mb-4">
              Download the Excel template with sample data and required format
            </p>
            <button
              onClick={downloadTemplate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download Template</span>
            </button>
          </div>
          
          {/* Upload File */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload your filled Excel file for validation and import
            </p>
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto cursor-pointer transition-colors inline-block">
              <Upload className="h-4 w-4" />
              <span>{loading ? 'Processing...' : 'Choose File'}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
            </label>
            {uploadedData.length > 0 && (
              <p className="text-sm text-green-600 mt-2">
                {uploadedData.length} row(s) loaded
              </p>
            )}
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner text="Processing Excel file..." />}

      {/* Preview & Validation Results */}
      {showPreview && validationResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-blue-600" />
              Validation Results
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Valid: <span className="font-medium text-green-600">{validationResults.filter(r => r.isValid).length}</span> / 
                Invalid: <span className="font-medium text-red-600">{validationResults.filter(r => !r.isValid).length}</span>
              </span>
              {validationResults.filter(r => r.isValid).length > 0 && (
                <button
                  onClick={saveToDatabase}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save to Database</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors/Warnings</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validationResults.map((result, index) => {
                  const row = result.data;
                  const productName = (row['Product Name'] || row['productName'] || '').toString();
                  const productType = (row['Product Type'] || row['productType'] || '').toString();
                  const batchNumber = (row['Batch Number'] || row['batchNumber'] || '').toString();
                  const price = row['Price'] || row['price'] || '';
                  
                  return (
                    <tr key={index} className={result.isValid ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {result.rowNumber}
                      </td>
                      <td className="px-4 py-3">
                        {getValidationIcon(result.isValid)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {productName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          productType === 'bulk' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {productType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {batchNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {price ? `${row['Currency'] || 'LKR'} ${parseFloat(price).toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {result.errors.length > 0 && (
                          <div className="space-y-1">
                            {result.errors.map((err, i) => (
                              <div key={i} className="text-red-600 flex items-start">
                                <XCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                <span>{err}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {result.warnings.length > 0 && (
                          <div className="space-y-1 mt-2">
                            {result.warnings.map((warn, i) => (
                              <div key={i} className="text-yellow-600 flex items-start">
                                <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                <span>{warn}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {result.errors.length === 0 && result.warnings.length === 0 && (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Instructions
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 list-disc list-inside">
          <li>Download the Excel template first to see the required format and sample data</li>
          <li>Fill in your product data following the template structure</li>
          <li>For <strong>bulk</strong> products: Fill Quantity and Unit fields, leave Variant fields empty</li>
          <li>For <strong>units</strong> products: Fill Variant Name, Size, Unit, and Units in Stock, leave Quantity empty</li>
          <li>All products must have a Price, Currency (LKR/USD/EUR), and Price Type (retail/wholesale/distributor/special)</li>
          <li>Upload your filled Excel file - the system will validate each row before saving</li>
          <li>Review validation results and fix any errors before saving to database</li>
          <li>Only valid rows will be saved to the database</li>
        </ul>
      </div>
    </div>
  );
};

export default AddProductsAndPricing;

