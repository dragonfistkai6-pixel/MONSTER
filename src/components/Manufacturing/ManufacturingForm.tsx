import React, { useState } from 'react';
import { Package, Upload, AlertCircle, CheckCircle, Loader2, QrCode, Award } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import blockchainService from '../../services/blockchainService';
import ipfsService from '../../services/ipfsService';
import qrService from '../../services/qrService';
import QRCodeDisplay from '../Common/QRCodeDisplay';

const ManufacturingForm: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [qrResult, setQrResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    batchId: '',
    parentEventId: '',
    qrCode: '',
    lotNumber: '',
    productName: '',
    productType: 'Herbal Product',
    quantity: '',
    unit: 'units',
    manufactureDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    certificationId: '',
    notes: '',
    manufacturerName: user?.name || '',
    image: null as File | null
  });

  const productTypes = [
    'Herbal Product',
    'Capsules',
    'Tablets',
    'Powder',
    'Extract',
    'Oil',
    'Tincture',
    'Tea',
    'Syrup',
    'Cream/Ointment'
  ];

  const units = [
    'units',
    'bottles',
    'packets',
    'grams',
    'kilograms',
    'milliliters',
    'liters'
  ];

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

      const mfgEventId = blockchainService.generateEventId('MANUFACTURING');

      let imageHash = null;
      if (formData.image) {
        const imageUpload = await ipfsService.uploadFile(formData.image);
        if (imageUpload.success) {
          imageHash = imageUpload.ipfsHash;
        }
      }

      // Create manufacturing metadata
      const mfgData = {
        batchId,
        eventId: mfgEventId,
        parentEventId,
        manufacturer: formData.manufacturerName,
        lotNumber: formData.lotNumber,
        productName: formData.productName,
        productType: formData.productType,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        manufactureDate: formData.manufactureDate,
        expiryDate: formData.expiryDate,
        certificationId: formData.certificationId,
        manufacturingDate: new Date().toISOString().split('T')[0],
        notes: formData.notes,
        images: imageHash ? [imageHash] : []
      };

      const metadataUpload = await ipfsService.createManufacturingMetadata(mfgData);
      if (!metadataUpload.success) {
        throw new Error('Failed to upload manufacturing metadata to IPFS');
      }

      // Generate QR code
      const qrResult = await qrService.generateManufacturingQR(
        batchId,
        mfgEventId,
        parentEventId,
        formData.manufacturerName,
        formData.productName
      );

      if (!qrResult.success) {
        throw new Error('Failed to generate QR code');
      }

      // Add event to blockchain
      const eventData = {
        batchId,
        eventId: mfgEventId,
        parentEventId,
        ipfsHash: metadataUpload.ipfsHash,
        location: {
          latitude: '0',
          longitude: '0',
          zone: 'Manufacturing Facility'
        },
        qrCodeHash: qrResult.qrHash
      };

      const blockchainResult = await blockchainService.addManufacturingEvent(
        user?.address || '',
        eventData
      );

      if (!blockchainResult.success) {
        throw new Error('Failed to add manufacturing event to blockchain');
      }

      setSuccess(true);
      setQrResult({
        batchId,
        eventId: mfgEventId,
        parentEventId,
        product: {
          lotNumber: formData.lotNumber,
          name: formData.productName,
          type: formData.productType,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          manufactureDate: formData.manufactureDate,
          expiryDate: formData.expiryDate
        },
        qr: qrResult,
        fabric: blockchainResult
      });
      
      // Reset form
      setFormData({
        batchId: '',
        parentEventId: '',
        qrCode: '',
        lotNumber: '',
        productName: '',
        productType: 'Herbal Product',
        quantity: '',
        unit: 'units',
        manufactureDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        certificationId: '',
        notes: '',
        manufacturerName: user?.name || '',
        image: null
      });
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
            <h2 className="text-2xl font-bold text-green-800 mb-2">Manufacturing Completed!</h2>
            <p className="text-green-600">Product manufacturing has been recorded on the blockchain</p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-orange-700">Original Batch ID:</span>
                <p className="text-orange-900 font-mono">{qrResult.batchId}</p>
              </div>
              <div>
                <span className="font-medium text-orange-700">Manufacturing Event ID:</span>
                <p className="text-orange-900 font-mono">{qrResult.eventId}</p>
              </div>
              <div>
                <span className="font-medium text-orange-700">Product Name:</span>
                <p className="text-orange-900">{qrResult.product.name}</p>
              </div>
              <div>
                <span className="font-medium text-orange-700">Product Type:</span>
                <p className="text-orange-900">{qrResult.product.type}</p>
              </div>
              <div>
                <span className="font-medium text-orange-700">Quantity:</span>
                <p className="text-orange-900">{qrResult.product.quantity} {qrResult.product.unit}</p>
              </div>
              {qrResult.product.expiryDate && (
                <div>
                  <span className="font-medium text-orange-700">Expiry Date:</span>
                  <p className="text-orange-900">{qrResult.product.expiryDate}</p>
                </div>
              )}
            </div>
          </div>

          <QRCodeDisplay
            qrData={{
              dataURL: qrResult.qr.dataURL,
              trackingUrl: qrResult.qr.trackingUrl,
              eventId: qrResult.eventId
            }}
            title="Final Product QR Code"
            subtitle="Consumer can scan to view complete traceability"
          />

          <button
            onClick={handleReset}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-medium"
          >
            Manufacture New Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-orange-800">Manufacturing Plant</h2>
            <p className="text-orange-600">Record final product manufacturing with certifications</p>
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
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Scan QR Code (optional - auto-fills batch and parent event)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="qrCode"
                  value={formData.qrCode}
                  onChange={handleInputChange}
                  placeholder="Scan or paste QR code data"
                  className="flex-1 px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="button"
                  className="px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  <QrCode className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Batch ID *
              </label>
              <input
                type="text"
                name="batchId"
                value={formData.batchId}
                onChange={handleInputChange}
                required
                placeholder="HERB-1234567890-1234"
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Parent Event ID *
              </label>
              <input
                type="text"
                name="parentEventId"
                value={formData.parentEventId}
                onChange={handleInputChange}
                required
                placeholder="PROCESS-1234567890-1234"
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Batch/LOT Number *
              </label>
              <input
                type="text"
                name="lotNumber"
                value={formData.lotNumber}
                onChange={handleInputChange}
                required
                placeholder="LOT-2024-001"
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                required
                placeholder="Ashwagandha Capsules"
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Product Type
              </label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {productTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                step="0.1"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                placeholder="1000"
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Manufacture Date *
              </label>
              <input
                type="date"
                name="manufactureDate"
                value={formData.manufactureDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Regulatory/Certification ID
              </label>
              <input
                type="text"
                name="certificationId"
                value={formData.certificationId}
                onChange={handleInputChange}
                placeholder="GMP/AYUSH/FDA certification number"
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-orange-600 mt-1">
                Enter GMP, AYUSH, FDA or other regulatory certification numbers
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Manufacturer Name *
              </label>
              <input
                type="text"
                name="manufacturerName"
                value={formData.manufacturerName}
                onChange={handleInputChange}
                required
                placeholder="Enter manufacturer name"
                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-orange-700 mb-2">
              Upload Product Image (optional)
            </label>
            <div className="border-2 border-dashed border-orange-200 rounded-lg p-6">
              <div className="text-center">
                <Package className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                <div className="flex text-sm text-orange-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500">
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
                <p className="text-xs text-orange-500">PNG, JPG, JPEG up to 10MB</p>
                {formData.image && (
                  <p className="mt-2 text-sm font-medium text-orange-700">
                    Selected: {formData.image.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-orange-700 mb-2">
              Manufacturing Notes (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Add any additional notes about this manufacturing process..."
              className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 px-6 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Recording Manufacturing...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Record Manufacturing</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManufacturingForm;