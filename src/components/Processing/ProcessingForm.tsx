import React, { useState } from 'react';
import { Cpu, Upload, AlertCircle, CheckCircle, Loader2, QrCode } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PROCESSING_METHODS } from '../../config/herbs';
import blockchainService from '../../services/blockchainService';
import ipfsService from '../../services/ipfsService';
import qrService from '../../services/qrService';
import QRCodeDisplay from '../Common/QRCodeDisplay';

const ProcessingForm: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [qrResult, setQrResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    batchId: '',
    parentEventId: '',
    qrCode: '',
    method: '',
    temperature: '',
    yield: '',
    duration: '',
    notes: '',
    processorName: user?.name || '',
    image: null as File | null
  });

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

      const processEventId = blockchainService.generateEventId('PROCESSING');

      let imageHash = null;
      if (formData.image) {
        const imageUpload = await ipfsService.uploadFile(formData.image);
        if (imageUpload.success) {
          imageHash = imageUpload.ipfsHash;
        }
      }

      // Create processing metadata
      const processData = {
        batchId,
        eventId: processEventId,
        parentEventId,
        processor: formData.processorName,
        method: formData.method,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        duration: formData.duration,
        yield: parseFloat(formData.yield),
        processDate: new Date().toISOString().split('T')[0],
        notes: formData.notes,
        images: imageHash ? [imageHash] : []
      };

      const metadataUpload = await ipfsService.createProcessingMetadata(processData);
      if (!metadataUpload.success) {
        throw new Error('Failed to upload processing metadata to IPFS');
      }

      // Generate QR code
      const qrResult = await qrService.generateProcessingQR(
        batchId,
        processEventId,
        parentEventId,
        formData.processorName,
        formData.method
      );

      if (!qrResult.success) {
        throw new Error('Failed to generate QR code');
      }

      // Add event to blockchain
      const eventData = {
        batchId,
        eventId: processEventId,
        parentEventId,
        ipfsHash: metadataUpload.ipfsHash,
        location: {
          latitude: '0',
          longitude: '0',
          zone: 'Processing Facility'
        },
        qrCodeHash: qrResult.qrHash
      };

      const blockchainResult = await blockchainService.addProcessingEvent(
        user?.address || '',
        eventData
      );

      if (!blockchainResult.success) {
        throw new Error('Failed to add processing event to blockchain');
      }

      setSuccess(true);
      setQrResult({
        batchId,
        eventId: processEventId,
        parentEventId,
        processing: {
          method: formData.method,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
          yield: parseFloat(formData.yield),
          duration: formData.duration
        },
        qr: qrResult,
        fabric: fabricResult
      });
      
      // Reset form
      setFormData({
        batchId: '',
        parentEventId: '',
        qrCode: '',
        method: '',
        temperature: '',
        yield: '',
        duration: '',
        notes: '',
        processorName: user?.name || '',
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
            <h2 className="text-2xl font-bold text-green-800 mb-2">Processing Completed!</h2>
            <p className="text-green-600">Processing details have been recorded on the blockchain</p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-purple-700">Batch ID:</span>
                <p className="text-purple-900 font-mono">{qrResult.batchId}</p>
              </div>
              <div>
                <span className="font-medium text-purple-700">Process Event ID:</span>
                <p className="text-purple-900 font-mono">{qrResult.eventId}</p>
              </div>
              <div>
                <span className="font-medium text-purple-700">Method:</span>
                <p className="text-purple-900">{qrResult.processing.method}</p>
              </div>
              <div>
                <span className="font-medium text-purple-700">Yield:</span>
                <p className="text-purple-900">{qrResult.processing.yield}g</p>
              </div>
              {qrResult.processing.temperature && (
                <div>
                  <span className="font-medium text-purple-700">Temperature:</span>
                  <p className="text-purple-900">{qrResult.processing.temperature}°C</p>
                </div>
              )}
              <div>
                <span className="font-medium text-purple-700">Duration:</span>
                <p className="text-purple-900">{qrResult.processing.duration}</p>
              </div>
            </div>
          </div>

          <QRCodeDisplay
            qrData={{
              dataURL: qrResult.qr.dataURL,
              trackingUrl: qrResult.qr.trackingUrl,
              eventId: qrResult.eventId
            }}
            title="Processing QR Code"
            subtitle="Scan to view processing details"
          />

          <button
            onClick={handleReset}
            className="w-full mt-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 font-medium"
          >
            Process New Batch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-purple-800">Processing</h2>
            <p className="text-purple-600">Record processing operations</p>
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
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Scan QR Code (optional - auto-fills batch and parent event)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="qrCode"
                  value={formData.qrCode}
                  onChange={handleInputChange}
                  placeholder="Scan or paste QR code data"
                  className="flex-1 px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  className="px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <QrCode className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Batch ID *
              </label>
              <input
                type="text"
                name="batchId"
                value={formData.batchId}
                onChange={handleInputChange}
                required
                placeholder="HERB-1234567890-1234"
                className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Parent Event ID *
              </label>
              <input
                type="text"
                name="parentEventId"
                value={formData.parentEventId}
                onChange={handleInputChange}
                required
                placeholder="TEST-1234567890-1234"
                className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Processing Method *
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Processing Method</option>
                {PROCESSING_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Yield (grams) *
              </label>
              <input
                type="number"
                step="0.1"
                name="yield"
                value={formData.yield}
                onChange={handleInputChange}
                required
                placeholder="250.5"
                className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                placeholder="60.0"
                className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="2 hours"
                className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Processor Name *
              </label>
              <input
                type="text"
                name="processorName"
                value={formData.processorName}
                onChange={handleInputChange}
                required
                placeholder="Enter processor name"
                className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Upload Processing Image (optional)
            </label>
            <div className="border-2 border-dashed border-purple-200 rounded-lg p-6">
              <div className="text-center">
                <Cpu className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <div className="flex text-sm text-purple-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
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
                <p className="text-xs text-purple-500">PNG, JPG, JPEG up to 10MB</p>
                {formData.image && (
                  <p className="mt-2 text-sm font-medium text-purple-700">
                    Selected: {formData.image.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Processing Notes (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Add any additional notes about this processing operation..."
              className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 px-6 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Recording Processing...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Record Processing</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProcessingForm;