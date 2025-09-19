const express = require('express');
const { authenticateToken, users } = require('./auth');
const kaleidoService = require('../services/kaleidoService');

const router = express.Router();

// Initialize Kaleido service
router.post('/initialize', async (req, res) => {
  try {
    const result = await kaleidoService.deployContract();
    res.json({
      success: true,
      message: 'Kaleido service initialized successfully',
      result
    });
  } catch (error) {
    console.error('Kaleido initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize Kaleido service',
      details: error.message
    });
  }
});

// Deploy contract and register organizations
router.post('/deploy', async (req, res) => {
  try {
    // Deploy contract
    const deployResult = await kaleidoService.deployContract();
    if (!deployResult.success) {
      throw new Error(deployResult.error);
    }
    
    // Register organizations
    const registerResult = await kaleidoService.registerOrganizations();
    if (!registerResult.success) {
      throw new Error(registerResult.error);
    }
    
    res.json({
      success: true,
      message: 'Contract deployed and organizations registered successfully',
      deployment: deployResult,
      registration: registerResult
    });
  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy contract',
      details: error.message
    });
  }
});

// Create batch
router.post('/create-batch', authenticateToken, async (req, res) => {
  try {
    const { userAddress, batchData } = req.body;
    
    if (!userAddress || !batchData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get user role from our user system
    const user = users.get(req.user.address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Determine organization type based on user role
    const orgTypes = ['', 'COLLECTOR', 'TESTER', 'PROCESSOR', 'MANUFACTURER'];
    const orgType = orgTypes[user.role] || 'COLLECTOR';
    
    const result = await kaleidoService.createCollectionEvent(orgType, {
      batchId: batchData.batchId,
      eventId: batchData.eventId || kaleidoService.generateEventId('COLLECTION'),
      herbSpecies: batchData.herbSpecies,
      collectorName: user.name,
      weight: batchData.weight || 0,
      harvestDate: batchData.harvestDate || new Date().toISOString().split('T')[0],
      location: JSON.stringify(batchData.location || {}),
      qualityGrade: batchData.qualityGrade || '',
      notes: batchData.notes || '',
      ipfsHash: batchData.ipfsHash || '',
      qrCodeHash: batchData.qrCodeHash || ''
    });
    
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Batch created successfully on Kaleido network' : 'Failed to create batch'
    });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create batch',
      details: error.message
    });
  }
});

// Add quality test event
router.post('/add-quality-test', authenticateToken, async (req, res) => {
  try {
    const { userAddress, eventData } = req.body;
    
    if (!userAddress || !eventData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const user = users.get(req.user.address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const orgTypes = ['', 'COLLECTOR', 'TESTER', 'PROCESSOR', 'MANUFACTURER'];
    const orgType = orgTypes[user.role] || 'TESTER';
    
    const result = await kaleidoService.createQualityTestEvent(orgType, {
      eventId: eventData.eventId || kaleidoService.generateEventId('QUALITY_TEST'),
      batchId: eventData.batchId,
      parentEventId: eventData.parentEventId,
      testerName: user.name,
      moistureContent: eventData.moistureContent || 0,
      purity: eventData.purity || 0,
      pesticideLevel: eventData.pesticideLevel || 0,
      testMethod: eventData.testMethod || 'Standard Test',
      notes: eventData.notes || '',
      ipfsHash: eventData.ipfsHash || '',
      qrCodeHash: eventData.qrCodeHash || ''
    });
    
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Quality test event added successfully' : 'Failed to add quality test event'
    });
  } catch (error) {
    console.error('Add quality test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add quality test event',
      details: error.message
    });
  }
});

// Add processing event
router.post('/add-processing', authenticateToken, async (req, res) => {
  try {
    const { userAddress, eventData } = req.body;
    
    if (!userAddress || !eventData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const user = users.get(req.user.address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const orgTypes = ['', 'COLLECTOR', 'TESTER', 'PROCESSOR', 'MANUFACTURER'];
    const orgType = orgTypes[user.role] || 'PROCESSOR';
    
    const result = await kaleidoService.createProcessingEvent(orgType, {
      eventId: eventData.eventId || kaleidoService.generateEventId('PROCESSING'),
      batchId: eventData.batchId,
      parentEventId: eventData.parentEventId,
      processorName: user.name,
      method: eventData.method || 'Standard Processing',
      temperature: eventData.temperature || 0,
      duration: eventData.duration || '',
      yield: eventData.yield || 0,
      notes: eventData.notes || '',
      ipfsHash: eventData.ipfsHash || '',
      qrCodeHash: eventData.qrCodeHash || ''
    });
    
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Processing event added successfully' : 'Failed to add processing event'
    });
  } catch (error) {
    console.error('Add processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add processing event',
      details: error.message
    });
  }
});

// Add manufacturing event
router.post('/add-manufacturing', authenticateToken, async (req, res) => {
  try {
    const { userAddress, eventData } = req.body;
    
    if (!userAddress || !eventData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const user = users.get(req.user.address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const orgTypes = ['', 'COLLECTOR', 'TESTER', 'PROCESSOR', 'MANUFACTURER'];
    const orgType = orgTypes[user.role] || 'MANUFACTURER';
    
    const result = await kaleidoService.createManufacturingEvent(orgType, {
      eventId: eventData.eventId || kaleidoService.generateEventId('MANUFACTURING'),
      batchId: eventData.batchId,
      parentEventId: eventData.parentEventId,
      manufacturerName: user.name,
      productName: eventData.productName || 'Herbal Product',
      productType: eventData.productType || 'Capsules',
      quantity: eventData.quantity || 0,
      unit: eventData.unit || 'units',
      expiryDate: eventData.expiryDate || '',
      notes: eventData.notes || '',
      ipfsHash: eventData.ipfsHash || '',
      qrCodeHash: eventData.qrCodeHash || ''
    });
    
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Manufacturing event added successfully' : 'Failed to add manufacturing event'
    });
  } catch (error) {
    console.error('Add manufacturing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add manufacturing event',
      details: error.message
    });
  }
});

// Generate batch ID
router.get('/generate-batch-id', (req, res) => {
  try {
    const batchId = kaleidoService.generateBatchId();
    
    res.json({
      success: true,
      data: { batchId }
    });
  } catch (error) {
    console.error('Generate batch ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch ID',
      details: error.message
    });
  }
});

// Generate event ID
router.post('/generate-event-id', (req, res) => {
  try {
    const { eventType } = req.body;
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Event type is required'
      });
    }

    const eventId = kaleidoService.generateEventId(eventType);
    
    res.json({
      success: true,
      data: { eventId }
    });
  } catch (error) {
    console.error('Generate event ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate event ID',
      details: error.message
    });
  }
});

// Get all transactions from Kaleido
router.get('/transactions', async (req, res) => {
  try {
    const result = await kaleidoService.getAllTransactions();
    
    res.json({
      success: result.success,
      data: result.data,
      message: result.success ? 'Transactions fetched successfully' : 'Failed to fetch transactions'
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions',
      details: error.message
    });
  }
});

module.exports = router;