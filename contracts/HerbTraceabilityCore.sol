// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./HerbTraceabilityStorage.sol";

contract HerbTraceabilityCore {
    HerbTraceabilityStorage public storageContract;
    
    // Events
    event OrganizationRegistered(address indexed orgAddress, string name, uint8 orgType);
    event BatchCreated(string indexed batchId, string herbSpecies, address indexed creator);
    event EventAdded(string indexed eventId, string indexed batchId, uint8 eventType, address indexed participant);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == storageContract.owner(), "Only owner can call this function");
        _;
    }
    
    modifier onlyActiveOrg() {
        require(storageContract.isActiveOrganization(msg.sender), "Organization not active");
        _;
    }
    
    modifier onlyOrgType(uint8 _orgType) {
        require(storageContract.getOrganizationType(msg.sender) == _orgType, "Invalid organization type");
        _;
    }
    
    constructor(address _storageContract) {
        storageContract = HerbTraceabilityStorage(_storageContract);
    }
    
    // Register organization
    function registerOrganization(
        address _orgAddress,
        string calldata _name,
        uint8 _orgType
    ) external onlyOwner {
        require(!storageContract.isActiveOrganization(_orgAddress), "Organization already registered");
        
        storageContract.setOrganization(_orgAddress, _name, _orgType, true, block.timestamp);
        
        emit OrganizationRegistered(_orgAddress, _name, _orgType);
    }
    
    // Create collection event (only collectors)
    function createCollectionEvent(
        string calldata _batchId,
        string calldata _eventId,
        string calldata _herbSpecies,
        string calldata _collectorName,
        uint256 _weight,
        string calldata _harvestDate,
        string calldata _location,
        string calldata _qualityGrade,
        string calldata _notes,
        string calldata _ipfsHash,
        string calldata _qrCodeHash
    ) external onlyActiveOrg onlyOrgType(0) {
        require(!storageContract.batchExists(_batchId), "Batch already exists");
        require(!storageContract.eventExists(_eventId), "Event already exists");
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(bytes(_eventId).length > 0, "Event ID cannot be empty");
        
        // Create batch
        storageContract.createBatch(
            _batchId,
            _herbSpecies,
            msg.sender,
            block.timestamp,
            "COLLECTED"
        );
        
        // Create event
        storageContract.createEvent(
            _eventId,
            _batchId,
            "",
            0, // COLLECTION
            msg.sender,
            block.timestamp,
            _ipfsHash,
            _qrCodeHash,
            _location,
            _notes
        );
        
        // Store collection specific data
        storageContract.setCollectionData(
            _eventId,
            _herbSpecies,
            _collectorName,
            _weight,
            _harvestDate,
            _qualityGrade
        );
        
        // Update mappings
        storageContract.addBatchEvent(_batchId, _eventId);
        storageContract.addBatchId(_batchId);
        storageContract.addEventId(_eventId);
        
        emit BatchCreated(_batchId, _herbSpecies, msg.sender);
        emit EventAdded(_eventId, _batchId, 0, msg.sender);
    }
    
    // Create quality test event (only testers)
    function createQualityTestEvent(
        string calldata _eventId,
        string calldata _batchId,
        string calldata _parentEventId,
        string calldata _testerName,
        uint16 _moistureContent,
        uint16 _purity,
        uint32 _pesticideLevel,
        string calldata _testMethod,
        string calldata _notes,
        string calldata _ipfsHash,
        string calldata _qrCodeHash
    ) external onlyActiveOrg onlyOrgType(1) {
        require(storageContract.batchExists(_batchId), "Batch does not exist");
        require(storageContract.eventExists(_parentEventId), "Parent event does not exist");
        require(!storageContract.eventExists(_eventId), "Event already exists");
        require(bytes(_eventId).length > 0, "Event ID cannot be empty");
        
        // Create event
        storageContract.createEvent(
            _eventId,
            _batchId,
            _parentEventId,
            1, // QUALITY_TEST
            msg.sender,
            block.timestamp,
            _ipfsHash,
            _qrCodeHash,
            "Laboratory",
            _notes
        );
        
        // Store quality test specific data
        storageContract.setQualityTestData(
            _eventId,
            _testerName,
            _moistureContent,
            _purity,
            _pesticideLevel,
            _testMethod
        );
        
        // Update batch and mappings
        storageContract.addBatchEvent(_batchId, _eventId);
        storageContract.updateBatchStatus(_batchId, "QUALITY_TESTED", block.timestamp);
        storageContract.addEventId(_eventId);
        
        emit EventAdded(_eventId, _batchId, 1, msg.sender);
    }
    
    // Create processing event (only processors)
    function createProcessingEvent(
        string calldata _eventId,
        string calldata _batchId,
        string calldata _parentEventId,
        string calldata _processorName,
        string calldata _method,
        uint16 _temperature,
        string calldata _duration,
        uint256 _yieldAmount,
        string calldata _notes,
        string calldata _ipfsHash,
        string calldata _qrCodeHash
    ) external onlyActiveOrg onlyOrgType(2) {
        require(storageContract.batchExists(_batchId), "Batch does not exist");
        require(storageContract.eventExists(_parentEventId), "Parent event does not exist");
        require(!storageContract.eventExists(_eventId), "Event already exists");
        require(bytes(_eventId).length > 0, "Event ID cannot be empty");
        
        // Create event
        storageContract.createEvent(
            _eventId,
            _batchId,
            _parentEventId,
            2, // PROCESSING
            msg.sender,
            block.timestamp,
            _ipfsHash,
            _qrCodeHash,
            "Processing Facility",
            _notes
        );
        
        // Store processing specific data
        storageContract.setProcessingData(
            _eventId,
            _processorName,
            _method,
            _temperature,
            _duration,
            _yieldAmount
        );
        
        // Update batch and mappings
        storageContract.addBatchEvent(_batchId, _eventId);
        storageContract.updateBatchStatus(_batchId, "PROCESSED", block.timestamp);
        storageContract.addEventId(_eventId);
        
        emit EventAdded(_eventId, _batchId, 2, msg.sender);
    }
    
    // Create manufacturing event (only manufacturers)
    function createManufacturingEvent(
        string calldata _eventId,
        string calldata _batchId,
        string calldata _parentEventId,
        string calldata _manufacturerName,
        string calldata _productName,
        string calldata _productType,
        uint256 _quantity,
        string calldata _unit,
        string calldata _expiryDate,
        string calldata _notes,
        string calldata _ipfsHash,
        string calldata _qrCodeHash
    ) external onlyActiveOrg onlyOrgType(3) {
        require(storageContract.batchExists(_batchId), "Batch does not exist");
        require(storageContract.eventExists(_parentEventId), "Parent event does not exist");
        require(!storageContract.eventExists(_eventId), "Event already exists");
        require(bytes(_eventId).length > 0, "Event ID cannot be empty");
        
        // Create event
        storageContract.createEvent(
            _eventId,
            _batchId,
            _parentEventId,
            3, // MANUFACTURING
            msg.sender,
            block.timestamp,
            _ipfsHash,
            _qrCodeHash,
            "Manufacturing Facility",
            _notes
        );
        
        // Store manufacturing specific data
        storageContract.setManufacturingData(
            _eventId,
            _manufacturerName,
            _productName,
            _productType,
            _quantity,
            _unit,
            _expiryDate
        );
        
        // Update batch and mappings
        storageContract.addBatchEvent(_batchId, _eventId);
        storageContract.updateBatchStatus(_batchId, "MANUFACTURED", block.timestamp);
        storageContract.addEventId(_eventId);
        
        emit EventAdded(_eventId, _batchId, 3, msg.sender);
    }
    
    // View functions
    function getBatchEvents(string calldata _batchId) external view returns (string[] memory) {
        require(storageContract.batchExists(_batchId), "Batch does not exist");
        return storageContract.getBatchEvents(_batchId);
    }
    
    function getAllBatches() external view returns (string[] memory) {
        return storageContract.getAllBatches();
    }
    
    function getAllEvents() external view returns (string[] memory) {
        return storageContract.getAllEvents();
    }
    
    function getBatchCount() external view returns (uint256) {
        return storageContract.getBatchCount();
    }
    
    function getEventCount() external view returns (uint256) {
        return storageContract.getEventCount();
    }
}