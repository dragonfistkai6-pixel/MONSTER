import React, { useState } from 'react';
import { useEffect } from 'react';
import { TestTube, Upload, AlertCircle, CheckCircle, Loader2, QrCode, MapPin, Plus, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import blockchainService from '../../services/blockchainService';
import ipfsService from '../../services/ipfsService';
import qrService from '../../services/qrService';
import QRCodeDisplay from '../Common/QRCodeDisplay';

const QualityTestForm: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [qrResult, setQrResult] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [customParameters, setCustomParameters] = useState<Array<{name: string, value: string}>>([]);

  const [formData, setFormData] = useState({
    batchId: '',
    parentEventId: '',
    qrCode: '',
    labName: '',
    moistureContent: '',
    purity: '',
    pesticideLevel: '',
    testDate: new Date().toISOString().split('T')[0],
    testMethod: 'Standard Laboratory Test',
    notes: '',
    testerName: user?.name || '',
    image: null as File | null
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const addCustomParameter = () => {
    setCustomParameters([...customParameters, { name: '', value: '' }]);
  };

  const removeCustomParameter = (index: number) => {
    setCustomParameters(customParameters.filter((_, i) => i !== index));
  };

  const updateCustomParameter = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...customParameters];
    updated[index][field] = value;
    setCustomParameters(updated);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Parse QR code if provided
      let batchId = formData.batchId;
      let parentEventId = formData.parentEventId;

      if (formData.qrCode) {
        const qrData = qrService.parseQRData(formData.qrCode);
        if (qrData.success) {
          batchId = qrData.data.batchId;
          parentEventId = qrData.data.eventId;
        }
      }

      const testEventId = blockchainService.generateEventId('QUALITY_TEST');

      let imageHash = null;
      if (formData.image) {
        const imageUpload = await ipfsService.uploadFile(formData.image);
        if (imageUpload.success) {
          imageHash = imageUpload.ipfsHash;
        }
      }

      // Create test metadata
      const testData = {
        batchId,
        eventId: testEventId,
        parentEventId,
        tester: formData.testerName,
        labName: formData.labName,
        moistureContent: parseFloat(formData.moistureContent),
        purity: parseFloat(formData.purity),
        pesticideLevel: parseFloat(formData.pesticideLevel),
        testMethod: formData.testMethod,
        testDate: formData.testDate,
        location: location,
        customParameters: customParameters.filter(p => p.name && p.value),
        notes: formData.notes,
        images: imageHash ? [imageHash] : []
      };

      const metadataUpload = await ipfsService.createQualityTestMetadata(testData);
      if (!metadataUpload.success) {
        throw new Error('Failed to upload test metadata to IPFS');
      }

      // Generate QR code
      const qrResult = await qrService.generateQualityTestQR(
        batchId,
        testEventId,
        parentEventId,
        formData.testerName
      );

      if (!qrResult.success) {
        throw new Error('Failed to generate QR code');
      }

      // Add event to blockchain
      const eventData = {
        batchId,
        eventId: testEventId,
        parentEventId,
        ipfsHash: metadataUpload.ipfsHash,
        location: {
          latitude: '0',
          longitude: '0',
          zone: 'Laboratory'
        },
        qrCodeHash: qrResult.qrHash
      };

      const blockchainResult = await blockchainService.addQualityTestEvent(
        user?.address || '',
        eventData
      );

      if (!blockchainResult || !blockchainResult.success) {
        throw new Error('Failed to add quality test to blockchain');
      }

      setSuccess(true);
      setQrResult({
        batchId,
        eventId: testEventId,
        parentEventId,
        testResults: {
          moistureContent: parseFloat(formData.moistureContent),
          purity: parseFloat(formData.purity),
          pesticideLevel: parseFloat(formData.pesticideLevel)
        },
        qr: qrResult,
        blockchain: blockchainResult
      });
      
      // Reset form
      setFormData({
        batchId: '',
        parentEventId: '',
        qrCode: '',
        labName: '',
        moistureContent: '',
        purity: '',
        pesticideLevel: '',
        testDate: new Date().toISOString().split('T')[0],
        testMethod: 'Standard Laboratory Test',
        notes: '',
        testerName: user?.name || '',
        image: null
      });
      setCustomParameters([]);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setQrResult(null);
    setError('');
  };

  if (success && qrResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Quality Test Completed!</h2>
            <p className="text-green-600">Test results have been recorded on the blockchain</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Batch ID:</span>
                <p className="text-blue-900 font-mono">{qrResult.batchId}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Test Event ID:</span>
                <p className="text-blue-900 font-mono">{qrResult.eventId}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Moisture Content:</span>
                <p className="text-blue-900">{qrResult.testResults.moistureContent}%</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Purity:</span>
                <p className="text-blue-900">{qrResult.testResults.purity}%</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Pesticide Level:</span>
                <p className="text-blue-900">{qrResult.testResults.pesticideLevel} ppm</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Status:</span>
                <p className={`font-bold ${
                  qrResult.testResults.purity >= 95 && qrResult.testResults.pesticideLevel <= 0.01 
                    ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {qrResult.testResults.purity >= 95 && qrResult.testResults.pesticideLevel <= 0.01 
                    ? 'PASSED' : 'REQUIRES ATTENTION'}
                </p>
              </div>
            </div>
          </div>

          <QRCodeDisplay
            qrData={{
              dataURL: qrResult.qr.dataURL,
              trackingUrl: qrResult.qr.trackingUrl,
              eventId: qrResult.eventId
            }}
            title="Quality Test QR Code"
            subtitle="Scan to view test results"
          />

          <button
            onClick={handleReset}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
          >
            Perform New Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
            <TestTube className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-blue-800">Testing Labs</h2>
            <p className="text-blue-600">Record quality test results with location and timestamp</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Scan QR Code (optional - auto-fills batch and parent event)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="qrCode"
                  value={formData.qrCode}
                  onChange={handleInputChange}
                  placeholder="Scan or paste QR code data"
                  className="flex-1 px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <QrCode className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Batch ID *
              </label>
              <input
                type="text"
                name="batchId"
                value={formData.batchId}
                onChange={handleInputChange}
                required
                placeholder="HERB-1234567890-1234"
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Parent Event ID *
              </label>
              <input
                type="text"
                name="parentEventId"
                value={formData.parentEventId}
                onChange={handleInputChange}
                required
                placeholder="COLLECTION-1234567890-1234"
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Moisture Content (%) *
              </label>
              <input
                type="number"
                step="0.1"
                name="moistureContent"
                value={formData.moistureContent}
                onChange={handleInputChange}
                required
                placeholder="10.5"
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Purity (%) *
              </label>
              <input
                type="number"
                step="0.1"
                name="purity"
                value={formData.purity}
                onChange={handleInputChange}
                required
                placeholder="98.7"
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Pesticide Level (ppm) *
              </label>
              <input
                type="number"
                step="0.001"
                name="pesticideLevel"
                value={formData.pesticideLevel}
                onChange={handleInputChange}
                required
                placeholder="0.005"
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Test Method
              </label>
              <select
                name="testMethod"
                value={formData.testMethod}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Standard Laboratory Test">Standard Laboratory Test</option>
                <option value="HPLC Analysis">HPLC Analysis</option>
                <option value="GC-MS Analysis">GC-MS Analysis</option>
                <option value="UV Spectroscopy">UV Spectroscopy</option>
                <option value="Microbiological Test">Microbiological Test</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Lab/Institution Name *
              </label>
              <input
                type="text"
                name="labName"
                value={formData.labName}
                onChange={handleInputChange}
                required
                placeholder="Enter lab or institution name"
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Test Date *
              </label>
              <input
                type="date"
                name="testDate"
                value={formData.testDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Tester Name *
              </label>
              <input
                type="text"
                name="testerName"
                value={formData.testerName}
                onChange={handleInputChange}
                required
                placeholder="Enter tester name"
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Info */}
          {location && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Test Location & Timestamp
              </h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-medium text-blue-600">Latitude:</span>
                  <p className="text-blue-900">{parseFloat(location.latitude).toFixed(6)}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-600">Longitude:</span>
                  <p className="text-blue-900">{parseFloat(location.longitude).toFixed(6)}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-600">Timestamp:</span>
                  <p className="text-blue-900">{new Date(location.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Custom Parameters */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-blue-700">
                Additional Test Parameters
              </label>
              <button
                type="button"
                onClick={addCustomParameter}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Parameter</span>
              </button>
            </div>
            
            {customParameters.map((param, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Parameter name"
                  value={param.name}
                  onChange={(e) => updateCustomParameter(index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={param.value}
                  onChange={(e) => updateCustomParameter(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeCustomParameter(index)}
                  className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Upload Test Results Image (optional)
            </label>
            <div className="border-2 border-dashed border-blue-200 rounded-lg p-6">
              <div className="text-center">
                <TestTube className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <div className="flex text-sm text-blue-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      name="image"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-blue-500">PNG, JPG, JPEG up to 10MB</p>
                {formData.image && (
                  <p className="mt-2 text-sm font-medium text-blue-700">
                    Selected: {formData.image.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Test Notes (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Add any additional notes about this quality test..."
              className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Recording Test Results...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Record Test Results</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QualityTestForm;