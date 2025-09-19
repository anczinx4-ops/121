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
    
    // Batch structure
    struct Batch {
        string batchId;
        string herbSpecies;
        address creator;
        uint256 createdAt;
        uint256 lastUpdated;
        string[] eventIds;
        string currentStatus;
        bool exists;
    }
    
    // Event structure
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
    
    // Collection specific data
    struct CollectionData {
        string herbSpecies;
        string collectorName;
        uint256 weight;
        string harvestDate;
        string qualityGrade;
    }
    
    // Quality test specific data
    struct QualityTestData {
        string testerName;
        uint256 moistureContent; // multiplied by 100 to avoid decimals
        uint256 purity; // multiplied by 100 to avoid decimals
        uint256 pesticideLevel; // multiplied by 1000000 to handle ppm
        string testMethod;
    }
    
    // Processing specific data
    struct ProcessingData {
        string processorName;
        string method;
        uint256 temperature; // multiplied by 100 to avoid decimals
        string duration;
        uint256 yieldAmount; // multiplied by 100 to avoid decimals
    }
    
    // Manufacturing specific data
    struct ManufacturingData {
        string manufacturerName;
        string productName;
        string productType;
        uint256 quantity; // multiplied by 100 to avoid decimals
        string unit;
        string expiryDate;
    }
    
    // Contract owner
    address public owner;
    
    // Mappings
    mapping(address => Organization) public organizations;
    mapping(string => Batch) public batches;
    mapping(string => TraceEvent) public events;
    mapping(string => CollectionData) public collectionData;
    mapping(string => QualityTestData) public qualityTestData;
    mapping(string => ProcessingData) public processingData;
    mapping(string => ManufacturingData) public manufacturingData;
    
    // Arrays for enumeration
    address[] public organizationAddresses;
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
        string memory _name,
        OrgType _orgType
    ) public onlyOwner {
        require(!organizations[_orgAddress].isActive, "Organization already registered");
        
        organizations[_orgAddress] = Organization({
            name: _name,
            orgType: _orgType,
            orgAddress: _orgAddress,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        organizationAddresses.push(_orgAddress);
        emit OrganizationRegistered(_orgAddress, _name, _orgType);
    }
    
    // Create collection event (only collectors)
    function createCollectionEvent(
        string memory _batchId,
        string memory _eventId,
        string memory _herbSpecies,
        string memory _collectorName,
        uint256 _weight,
        string memory _harvestDate,
        string memory _location,
        string memory _qualityGrade,
        string memory _notes,
        string memory _ipfsHash,
        string memory _qrCodeHash
    ) public onlyActiveOrg onlyOrgType(OrgType.COLLECTOR) {
        require(!batches[_batchId].exists, "Batch already exists");
        require(!events[_eventId].exists, "Event already exists");
        
        // Create batch
        batches[_batchId] = Batch({
            batchId: _batchId,
            herbSpecies: _herbSpecies,
            creator: msg.sender,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            eventIds: new string[](0),
            currentStatus: "COLLECTED",
            exists: true
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
        
        // Update arrays
        batches[_batchId].eventIds.push(_eventId);
        batchIds.push(_batchId);
        eventIds.push(_eventId);
        
        emit BatchCreated(_batchId, _herbSpecies, msg.sender);
        emit EventAdded(_eventId, _batchId, EventType.COLLECTION, msg.sender);
    }
    
    // Create quality test event (only testers)
    function createQualityTestEvent(
        string memory _eventId,
        string memory _batchId,
        string memory _parentEventId,
        string memory _testerName,
        uint256 _moistureContent,
        uint256 _purity,
        uint256 _pesticideLevel,
        string memory _testMethod,
        string memory _notes,
        string memory _ipfsHash,
        string memory _qrCodeHash
    ) public onlyActiveOrg onlyOrgType(OrgType.TESTER) {
        require(batches[_batchId].exists, "Batch does not exist");
        require(events[_parentEventId].exists, "Parent event does not exist");
        require(!events[_eventId].exists, "Event already exists");
        
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
        batches[_batchId].eventIds.push(_eventId);
        batches[_batchId].lastUpdated = block.timestamp;
        batches[_batchId].currentStatus = "QUALITY_TESTED";
        
        eventIds.push(_eventId);
        
        emit EventAdded(_eventId, _batchId, EventType.QUALITY_TEST, msg.sender);
    }
    
    // Create processing event (only processors)
    function createProcessingEvent(
        string memory _eventId,
        string memory _batchId,
        string memory _parentEventId,
        string memory _processorName,
        string memory _method,
        uint256 _temperature,
        string memory _duration,
        uint256 _yieldAmount,
        string memory _notes,
        string memory _ipfsHash,
        string memory _qrCodeHash
    ) public onlyActiveOrg onlyOrgType(OrgType.PROCESSOR) {
        require(batches[_batchId].exists, "Batch does not exist");
        require(events[_parentEventId].exists, "Parent event does not exist");
        require(!events[_eventId].exists, "Event already exists");
        
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
        batches[_batchId].eventIds.push(_eventId);
        batches[_batchId].lastUpdated = block.timestamp;
        batches[_batchId].currentStatus = "PROCESSED";
        
        eventIds.push(_eventId);
        
        emit EventAdded(_eventId, _batchId, EventType.PROCESSING, msg.sender);
    }
    
    // Create manufacturing event (only manufacturers)
    function createManufacturingEvent(
        string memory _eventId,
        string memory _batchId,
        string memory _parentEventId,
        string memory _manufacturerName,
        string memory _productName,
        string memory _productType,
        uint256 _quantity,
        string memory _unit,
        string memory _expiryDate,
        string memory _notes,
        string memory _ipfsHash,
        string memory _qrCodeHash
    ) public onlyActiveOrg onlyOrgType(OrgType.MANUFACTURER) {
        require(batches[_batchId].exists, "Batch does not exist");
        require(events[_parentEventId].exists, "Parent event does not exist");
        require(!events[_eventId].exists, "Event already exists");
        
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
        batches[_batchId].eventIds.push(_eventId);
        batches[_batchId].lastUpdated = block.timestamp;
        batches[_batchId].currentStatus = "MANUFACTURED";
        
        eventIds.push(_eventId);
        
        emit EventAdded(_eventId, _batchId, EventType.MANUFACTURING, msg.sender);
    }
    
    // Get batch events
    function getBatchEvents(string memory _batchId) public view returns (string[] memory) {
        require(batches[_batchId].exists, "Batch does not exist");
        return batches[_batchId].eventIds;
    }
    
    // Get all batches
    function getAllBatches() public view returns (string[] memory) {
        return batchIds;
    }
    
    // Get all events
    function getAllEvents() public view returns (string[] memory) {
        return eventIds;
    }
    
    // Get organization count
    function getOrganizationCount() public view returns (uint256) {
        return organizationAddresses.length;
    }
    
    // Get batch count
    function getBatchCount() public view returns (uint256) {
        return batchIds.length;
    }
    
    // Get event count
    function getEventCount() public view returns (uint256) {
        return eventIds.length;
    }
    
    // Get collection data
    function getCollectionData(string memory _eventId) public view returns (CollectionData memory) {
        return collectionData[_eventId];
    }
    
    // Get quality test data
    function getQualityTestData(string memory _eventId) public view returns (QualityTestData memory) {
        return qualityTestData[_eventId];
    }
    
    // Get processing data
    function getProcessingData(string memory _eventId) public view returns (ProcessingData memory) {
        return processingData[_eventId];
    }
    
    // Get manufacturing data
    function getManufacturingData(string memory _eventId) public view returns (ManufacturingData memory) {
        return manufacturingData[_eventId];
    }
}