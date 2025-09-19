// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HerbTraceability {
    // Organization types
    enum OrgType { COLLECTOR, TESTER, PROCESSOR, MANUFACTURER }
    
    // Event types
    enum EventType { COLLECTION, QUALITY_TEST, PROCESSING, MANUFACTURING }
    
    // Organization structure
    struct Organization {
        string name;
        OrgType orgType;
        address orgAddress;
        bool isActive;
        uint256 registeredAt;
    }
    
    // Batch structure - optimized for gas
    struct Batch {
        string batchId;
        string herbSpecies;
        address creator;
        uint256 createdAt;
        uint256 lastUpdated;
        string currentStatus;
        bool exists;
        uint8 eventCount; // Track event count efficiently
    }
    
    // Event structure - optimized for gas
    struct TraceEvent {
        string eventId;
        string batchId;
        string parentEventId;
        EventType eventType;
        address participant;
        uint256 timestamp;
        string ipfsHash;
        string qrCodeHash;
        string location;
        string notes;
        bool exists;
    }
    
    // Collection specific data - packed for gas efficiency
    struct CollectionData {
        string herbSpecies;
        string collectorName;
        uint256 weight; // in grams, no decimals needed
        string harvestDate;
        string qualityGrade;
    }
    
    // Quality test specific data - packed for gas efficiency
    struct QualityTestData {
        string testerName;
        uint16 moistureContent; // multiplied by 100, max 655.35%
        uint16 purity; // multiplied by 100, max 655.35%
        uint32 pesticideLevel; // multiplied by 1000000, max 4294 ppm
        string testMethod;
    }
    
    // Processing specific data - packed for gas efficiency
    struct ProcessingData {
        string processorName;
        string method;
        uint16 temperature; // multiplied by 100, max 655.35°C
        string duration;
        uint256 yieldAmount; // in grams
    }
    
    // Manufacturing specific data - packed for gas efficiency
    struct ManufacturingData {
        string manufacturerName;
        string productName;
        string productType;
        uint256 quantity;
        string unit;
        string expiryDate;
    }
    
    // Contract owner
    address public owner;
    
    // Mappings - optimized for gas
    mapping(address => Organization) public organizations;
    mapping(string => Batch) public batches;
    mapping(string => TraceEvent) public events;
    mapping(string => CollectionData) public collectionData;
    mapping(string => QualityTestData) public qualityTestData;
    mapping(string => ProcessingData) public processingData;
    mapping(string => ManufacturingData) public manufacturingData;
    
    // Batch events mapping for efficient lookup
    mapping(string => string[]) public batchEvents;
    
    // Arrays for enumeration - consider removing if not needed to save gas
    string[] public batchIds;
    string[] public eventIds;
    
    // Events
    event OrganizationRegistered(address indexed orgAddress, string name, OrgType orgType);
    event BatchCreated(string indexed batchId, string herbSpecies, address indexed creator);
    event EventAdded(string indexed eventId, string indexed batchId, EventType eventType, address indexed participant);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyActiveOrg() {
        require(organizations[msg.sender].isActive, "Organization not active");
        _;
    }
    
    modifier onlyOrgType(OrgType _orgType) {
        require(organizations[msg.sender].orgType == _orgType, "Invalid organization type");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    // Register organization
    function registerOrganization(
        address _orgAddress,
        string calldata _name,
        OrgType _orgType
    ) external onlyOwner {
        require(!organizations[_orgAddress].isActive, "Organization already registered");
        
        organizations[_orgAddress] = Organization({
            name: _name,
            orgType: _orgType,
            orgAddress: _orgAddress,
            isActive: true,
            registeredAt: block.timestamp
        });
        
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
    ) external onlyActiveOrg onlyOrgType(OrgType.COLLECTOR) {
        require(!batches[_batchId].exists, "Batch already exists");
        require(!events[_eventId].exists, "Event already exists");
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(bytes(_eventId).length > 0, "Event ID cannot be empty");
        
        // Create batch
        batches[_batchId] = Batch({
            batchId: _batchId,
            herbSpecies: _herbSpecies,
            creator: msg.sender,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            currentStatus: "COLLECTED",
            exists: true,
            eventCount: 1
        });
        
        // Create event
        events[_eventId] = TraceEvent({
            eventId: _eventId,
            batchId: _batchId,
            parentEventId: "",
            eventType: EventType.COLLECTION,
            participant: msg.sender,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash,
            qrCodeHash: _qrCodeHash,
            location: _location,
            notes: _notes,
            exists: true
        });
        
        // Store collection specific data
        collectionData[_eventId] = CollectionData({
            herbSpecies: _herbSpecies,
            collectorName: _collectorName,
            weight: _weight,
            harvestDate: _harvestDate,
            qualityGrade: _qualityGrade
        });
        
        // Update mappings
        batchEvents[_batchId].push(_eventId);
        batchIds.push(_batchId);
        eventIds.push(_eventId);
        
        emit BatchCreated(_batchId, _herbSpecies, msg.sender);
        emit EventAdded(_eventId, _batchId, EventType.COLLECTION, msg.sender);
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
    ) external onlyActiveOrg onlyOrgType(OrgType.TESTER) {
        require(batches[_batchId].exists, "Batch does not exist");
        require(events[_parentEventId].exists, "Parent event does not exist");
        require(!events[_eventId].exists, "Event already exists");
        require(bytes(_eventId).length > 0, "Event ID cannot be empty");
        
        // Create event
        events[_eventId] = TraceEvent({
            eventId: _eventId,
            batchId: _batchId,
            parentEventId: _parentEventId,
            eventType: EventType.QUALITY_TEST,
            participant: msg.sender,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash,
            qrCodeHash: _qrCodeHash,
            location: "Laboratory",
            notes: _notes,
            exists: true
        });
        
        // Store quality test specific data
        qualityTestData[_eventId] = QualityTestData({
            testerName: _testerName,
            moistureContent: _moistureContent,
            purity: _purity,
            pesticideLevel: _pesticideLevel,
            testMethod: _testMethod
        });
        
        // Update batch
        batchEvents[_batchId].push(_eventId);
        batches[_batchId].lastUpdated = block.timestamp;
        batches[_batchId].currentStatus = "QUALITY_TESTED";
        batches[_batchId].eventCount++;
        
        eventIds.push(_eventId);
        
        emit EventAdded(_eventId, _batchId, EventType.QUALITY_TEST, msg.sender);
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
    ) external onlyActiveOrg onlyOrgType(OrgType.PROCESSOR) {
        require(batches[_batchId].exists, "Batch does not exist");
        require(events[_parentEventId].exists, "Parent event does not exist");
        require(!events[_eventId].exists, "Event already exists");
        require(bytes(_eventId).length > 0, "Event ID cannot be empty");
        
        // Create event
        events[_eventId] = TraceEvent({
            eventId: _eventId,
            batchId: _batchId,
            parentEventId: _parentEventId,
            eventType: EventType.PROCESSING,
            participant: msg.sender,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash,
            qrCodeHash: _qrCodeHash,
            location: "Processing Facility",
            notes: _notes,
            exists: true
        });
        
        // Store processing specific data
        processingData[_eventId] = ProcessingData({
            processorName: _processorName,
            method: _method,
            temperature: _temperature,
            duration: _duration,
            yieldAmount: _yieldAmount
        });
        
        // Update batch
        batchEvents[_batchId].push(_eventId);
        batches[_batchId].lastUpdated = block.timestamp;
        batches[_batchId].currentStatus = "PROCESSED";
        batches[_batchId].eventCount++;
        
        eventIds.push(_eventId);
        
        emit EventAdded(_eventId, _batchId, EventType.PROCESSING, msg.sender);
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
    ) external onlyActiveOrg onlyOrgType(OrgType.MANUFACTURER) {
        require(batches[_batchId].exists, "Batch does not exist");
        require(events[_parentEventId].exists, "Parent event does not exist");
        require(!events[_eventId].exists, "Event already exists");
        require(bytes(_eventId).length > 0, "Event ID cannot be empty");
        
        // Create event
        events[_eventId] = TraceEvent({
            eventId: _eventId,
            batchId: _batchId,
            parentEventId: _parentEventId,
            eventType: EventType.MANUFACTURING,
            participant: msg.sender,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash,
            qrCodeHash: _qrCodeHash,
            location: "Manufacturing Facility",
            notes: _notes,
            exists: true
        });
        
        // Store manufacturing specific data
        manufacturingData[_eventId] = ManufacturingData({
            manufacturerName: _manufacturerName,
            productName: _productName,
            productType: _productType,
            quantity: _quantity,
            unit: _unit,
            expiryDate: _expiryDate
        });
        
        // Update batch
        batchEvents[_batchId].push(_eventId);
        batches[_batchId].lastUpdated = block.timestamp;
        batches[_batchId].currentStatus = "MANUFACTURED";
        batches[_batchId].eventCount++;
        
        eventIds.push(_eventId);
        
        emit EventAdded(_eventId, _batchId, EventType.MANUFACTURING, msg.sender);
    }
    
    // Get batch events - gas optimized
    function getBatchEvents(string calldata _batchId) external view returns (string[] memory) {
        require(batches[_batchId].exists, "Batch does not exist");
        return batchEvents[_batchId];
    }
    
    // Get all batches - consider pagination for large datasets
    function getAllBatches() external view returns (string[] memory) {
        return batchIds;
    }
    
    // Get all events - consider pagination for large datasets
    function getAllEvents() external view returns (string[] memory) {
        return eventIds;
    }
    
    // Get batch count
    function getBatchCount() external view returns (uint256) {
        return batchIds.length;
    }
    
    // Get event count
    function getEventCount() external view returns (uint256) {
        return eventIds.length;
    }
    
    // Get collection data
    function getCollectionData(string calldata _eventId) external view returns (CollectionData memory) {
        require(events[_eventId].exists, "Event does not exist");
        return collectionData[_eventId];
    }
    
    // Get quality test data
    function getQualityTestData(string calldata _eventId) external view returns (QualityTestData memory) {
        require(events[_eventId].exists, "Event does not exist");
        return qualityTestData[_eventId];
    }
    
    // Get processing data
    function getProcessingData(string calldata _eventId) external view returns (ProcessingData memory) {
        require(events[_eventId].exists, "Event does not exist");
        return processingData[_eventId];
    }
    
    // Get manufacturing data
    function getManufacturingData(string calldata _eventId) external view returns (ManufacturingData memory) {
        require(events[_eventId].exists, "Event does not exist");
        return manufacturingData[_eventId];
    }
    
    // Emergency functions
    function pause() external onlyOwner {
        // Implementation for emergency pause
    }
    
    function unpause() external onlyOwner {
        // Implementation for unpause
    }
}