import React, { useState, useEffect } from 'react';
import { Sprout, MapPin, Upload, AlertCircle, CheckCircle, Loader2, QrCode } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AYURVEDIC_HERBS, APPROVED_ZONES } from '../../config/herbs';
import blockchainService from '../../services/blockchainService';
import ipfsService from '../../services/ipfsService';
import qrService from '../../services/qrService';
import QRCodeDisplay from '../Common/QRCodeDisplay';

const CollectionForm: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<any>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [qrResult, setQrResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    herbSpecies: '',
    weight: '',
    harvestDate: new Date().toISOString().split('T')[0],
    zone: '',
    qualityGrade: '',
    notes: '',
    collectorName: user?.name || '',
    image: null as File | null
  });

  useEffect(() => {
    getCurrentLocation();
    initializeBlockchain();
  }, []);

  const initializeBlockchain = async () => {
    try {
      await blockchainService.initialize();
    } catch (error) {
      console.error('Error initializing blockchain:', error);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            accuracy: position.coords.accuracy
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
          setError('Unable to get location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setLocationLoading(false);
      setError('Geolocation is not supported by this browser');
    }
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

    if (!location) {
      setError('Location is required for collection');
      setLoading(false);
      return;
    }

    try {
      // Generate batch and event IDs
      const batchId = blockchainService.generateBatchId();
      const collectionEventId = blockchainService.generateEventId('COLLECTION');

      let imageHash = null;
      if (formData.image) {
        const imageUpload = await ipfsService.uploadFile(formData.image);
        if (imageUpload.success) {
          imageHash = imageUpload.ipfsHash;
        }
      }

      // Create collection metadata
      const collectionData = {
        batchId,
        herbSpecies: formData.herbSpecies,
        collector: formData.collectorName,
        weight: parseFloat(formData.weight),
        harvestDate: formData.harvestDate,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          zone: formData.zone
        },
        qualityGrade: formData.qualityGrade,
        notes: formData.notes,
        images: imageHash ? [imageHash] : []
      };

      // Upload metadata to IPFS
      const metadataUpload = await ipfsService.createCollectionMetadata(collectionData);
      if (!metadataUpload.success) {
        throw new Error('Failed to upload metadata to IPFS');
      }

      // Generate QR code
      const qrResult = await qrService.generateCollectionQR(
        batchId,
        collectionEventId,
        formData.herbSpecies,
        formData.collectorName
      );

      if (!qrResult.success) {
        throw new Error('Failed to generate QR code');
      }

      // Create batch on blockchain
      const blockchainData = {
        batchId,
        herbSpecies: formData.herbSpecies,
        collectionEventId,
        ipfsHash: metadataUpload.ipfsHash,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          zone: formData.zone
        },
        qrCodeHash: qrResult.qrHash
      };

      const blockchainResult = await blockchainService.createBatch(
        user?.address || '',
        blockchainData
      );

      if (!blockchainResult.success) {
        throw new Error('Failed to create batch on blockchain');
      }

      setSuccess(true);
      setQrResult({
        batchId,
        eventId: collectionEventId,
        herbSpecies: formData.herbSpecies,
        weight: parseFloat(formData.weight),
        location: { zone: formData.zone },
        qr: qrResult,
        fabric: fabricResult
      });

      // Reset form
      setFormData({
        herbSpecies: '',
        weight: '',
        harvestDate: new Date().toISOString().split('T')[0],
        zone: '',
        qualityGrade: '',
        notes: '',
        collectorName: user?.name || '',
        image: null
      });
    } catch (error) {
      console.error('Collection creation error:', error);
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
            <h2 className="text-2xl font-bold text-green-800 mb-2">Collection Successful!</h2>
            <p className="text-green-600">Your herb collection has been recorded on the blockchain</p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">Batch ID:</span>
                <p className="text-green-900 font-mono">{qrResult.batchId}</p>
              </div>
              <div>
                <span className="font-medium text-green-700">Herb Species:</span>
                <p className="text-green-900">{qrResult.herbSpecies}</p>
              </div>
              <div>
                <span className="font-medium text-green-700">Weight:</span>
                <p className="text-green-900">{qrResult.weight}g</p>
              </div>
              <div>
                <span className="font-medium text-green-700">Location:</span>
                <p className="text-green-900">{qrResult.location?.zone}</p>
              </div>
            </div>
          </div>

          <QRCodeDisplay
            qrData={{
              dataURL: qrResult.qr.dataURL,
              trackingUrl: qrResult.qr.trackingUrl,
              eventId: qrResult.eventId
            }}
            title="Collection QR Code"
            subtitle="Scan to track this batch"
          />

          <button
            onClick={handleReset}
            className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium"
          >
            Create New Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-800">Data Collection</h2>
            <p className="text-green-600">Record herb collection details</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Status */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Current Location</span>
            </div>
            {locationLoading ? (
              <p className="text-blue-600 flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Fetching location...</span>
              </p>
            ) : location ? (
              <div className="text-sm text-blue-700">
                <p>Lat: {parseFloat(location.latitude).toFixed(6)}</p>
                <p>Lng: {parseFloat(location.longitude).toFixed(6)}</p>
                <p className="text-xs text-blue-600">Accuracy: ±{location.accuracy?.toFixed(0)}m</p>
              </div>
            ) : (
              <p className="text-red-600">Location not available</p>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Herb Species *
              </label>
              <select
                name="herbSpecies"
                value={formData.herbSpecies}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Herb Species</option>
                {AYURVEDIC_HERBS.map((herb) => (
                  <option key={herb.id} value={herb.common}>
                    {herb.common} ({herb.botanical})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Weight (grams) *
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                required
                placeholder="Enter weight in grams"
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Harvest Date *
              </label>
              <input
                type="date"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Harvesting Zone *
              </label>
              <select
                name="zone"
                value={formData.zone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Zone</option>
                {APPROVED_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Quality Grade
              </label>
              <select
                name="qualityGrade"
                value={formData.qualityGrade}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Quality Grade</option>
                <option value="A+">A+ (Premium)</option>
                <option value="A">A (High)</option>
                <option value="B">B (Good)</option>
                <option value="C">C (Standard)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Collector Name *
              </label>
              <input
                type="text"
                name="collectorName"
                value={formData.collectorName}
                onChange={handleInputChange}
                required
                placeholder="Enter collector name"
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              Upload Herb Image (optional)
            </label>
            <div className="border-2 border-dashed border-green-200 rounded-lg p-6">
              <div className="text-center">
                <Sprout className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <div className="flex text-sm text-green-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
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
                <p className="text-xs text-green-500">PNG, JPG, JPEG up to 10MB</p>
                {formData.image && (
                  <p className="mt-2 text-sm font-medium text-green-700">
                    Selected: {formData.image.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Add any additional notes about this collection..."
              className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !location}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Recording Collection...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Record Collection</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollectionForm;