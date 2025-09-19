// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HerbTraceabilityStorage {
    // Organization structure
    struct Organization {
        string name;
        uint8 orgType; // 0=COLLECTOR, 1=TESTER, 2=PROCESSOR, 3=MANUFACTURER
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
    }
    
    // Event structure - optimized for gas
    struct TraceEvent {
        string eventId;
        string batchId;
        string parentEventId;
        uint8 eventType; // 0=COLLECTION, 1=QUALITY_TEST, 2=PROCESSING, 3=MANUFACTURING
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
        uint16 moistureContent;
        uint16 purity;
        uint32 pesticideLevel;
        string testMethod;
    }
    
    // Processing specific data
    struct ProcessingData {
        string processorName;
        string method;
        uint16 temperature;
        string duration;
        uint256 yieldAmount;
    }
    
    // Manufacturing specific data
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
    
    // Core contract address
    address public coreContract;
    
    // Mappings
    mapping(address => Organization) public organizations;
    mapping(string => Batch) public batches;
    mapping(string => TraceEvent) public events;
    mapping(string => CollectionData) public collectionData;
    mapping(string => QualityTestData) public qualityTestData;
    mapping(string => ProcessingData) public processingData;
    mapping(string => ManufacturingData) public manufacturingData;
    
    // Batch events mapping for efficient lookup
    mapping(string => string[]) public batchEvents;
    
    // Arrays for enumeration
    string[] public batchIds;
    string[] public eventIds;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyCore() {
        require(msg.sender == coreContract, "Only core contract can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function setCoreContract(address _coreContract) external onlyOwner {
        coreContract = _coreContract;
    }
    
    // Organization functions
    function setOrganization(
        address _orgAddress,
        string calldata _name,
        uint8 _orgType,
        bool _isActive,
        uint256 _registeredAt
    ) external onlyCore {
        organizations[_orgAddress] = Organization({
            name: _name,
            orgType: _orgType,
            orgAddress: _orgAddress,
            isActive: _isActive,
            registeredAt: _registeredAt
        });
    }
    
    function isActiveOrganization(address _orgAddress) external view returns (bool) {
        return organizations[_orgAddress].isActive;
    }
    
    function getOrganizationType(address _orgAddress) external view returns (uint8) {
        return organizations[_orgAddress].orgType;
    }
    
    // Batch functions
    function createBatch(
        string calldata _batchId,
        string calldata _herbSpecies,
        address _creator,
        uint256 _timestamp,
        string calldata _status
    ) external onlyCore {
        batches[_batchId] = Batch({
            batchId: _batchId,
            herbSpecies: _herbSpecies,
            creator: _creator,
            createdAt: _timestamp,
            lastUpdated: _timestamp,
            currentStatus: _status,
            exists: true
        });
    }
    
    function updateBatchStatus(
        string calldata _batchId,
        string calldata _status,
        uint256 _timestamp
    ) external onlyCore {
        batches[_batchId].currentStatus = _status;
        batches[_batchId].lastUpdated = _timestamp;
    }
    
    function batchExists(string calldata _batchId) external view returns (bool) {
        return batches[_batchId].exists;
    }
    
    function addBatchId(string calldata _batchId) external onlyCore {
        batchIds.push(_batchId);
    }
    
    function getAllBatches() external view returns (string[] memory) {
        return batchIds;
    }
    
    function getBatchCount() external view returns (uint256) {
        return batchIds.length;
    }
    
    // Event functions
    function createEvent(
        string calldata _eventId,
        string calldata _batchId,
        string calldata _parentEventId,
        uint8 _eventType,
        address _participant,
        uint256 _timestamp,
        string calldata _ipfsHash,
        string calldata _qrCodeHash,
        string calldata _location,
        string calldata _notes
    ) external onlyCore {
        events[_eventId] = TraceEvent({
            eventId: _eventId,
            batchId: _batchId,
            parentEventId: _parentEventId,
            eventType: _eventType,
            participant: _participant,
            timestamp: _timestamp,
            ipfsHash: _ipfsHash,
            qrCodeHash: _qrCodeHash,
            location: _location,
            notes: _notes,
            exists: true
        });
    }
    
    function eventExists(string calldata _eventId) external view returns (bool) {
        return events[_eventId].exists;
    }
    
    function addEventId(string calldata _eventId) external onlyCore {
        eventIds.push(_eventId);
    }
    
    function getAllEvents() external view returns (string[] memory) {
        return eventIds;
    }
    
    function getEventCount() external view returns (uint256) {
        return eventIds.length;
    }
    
    // Batch events mapping
    function addBatchEvent(string calldata _batchId, string calldata _eventId) external onlyCore {
        batchEvents[_batchId].push(_eventId);
    }
    
    function getBatchEvents(string calldata _batchId) external view returns (string[] memory) {
        return batchEvents[_batchId];
    }
    
    // Specific data functions
    function setCollectionData(
        string calldata _eventId,
        string calldata _herbSpecies,
        string calldata _collectorName,
        uint256 _weight,
        string calldata _harvestDate,
        string calldata _qualityGrade
    ) external onlyCore {
        collectionData[_eventId] = CollectionData({
            herbSpecies: _herbSpecies,
            collectorName: _collectorName,
            weight: _weight,
            harvestDate: _harvestDate,
            qualityGrade: _qualityGrade
        });
    }
    
    function setQualityTestData(
        string calldata _eventId,
        string calldata _testerName,
        uint16 _moistureContent,
        uint16 _purity,
        uint32 _pesticideLevel,
        string calldata _testMethod
    ) external onlyCore {
        qualityTestData[_eventId] = QualityTestData({
            testerName: _testerName,
            moistureContent: _moistureContent,
            purity: _purity,
            pesticideLevel: _pesticideLevel,
            testMethod: _testMethod
        });
    }
    
    function setProcessingData(
        string calldata _eventId,
        string calldata _processorName,
        string calldata _method,
        uint16 _temperature,
        string calldata _duration,
        uint256 _yieldAmount
    ) external onlyCore {
        processingData[_eventId] = ProcessingData({
            processorName: _processorName,
            method: _method,
            temperature: _temperature,
            duration: _duration,
            yieldAmount: _yieldAmount
        });
    }
    
    function setManufacturingData(
        string calldata _eventId,
        string calldata _manufacturerName,
        string calldata _productName,
        string calldata _productType,
        uint256 _quantity,
        string calldata _unit,
        string calldata _expiryDate
    ) external onlyCore {
        manufacturingData[_eventId] = ManufacturingData({
            manufacturerName: _manufacturerName,
            productName: _productName,
            productType: _productType,
            quantity: _quantity,
            unit: _unit,
            expiryDate: _expiryDate
        });
    }
    
    // Getter functions for specific data
    function getCollectionData(string calldata _eventId) external view returns (CollectionData memory) {
        require(events[_eventId].exists, "Event does not exist");
        return collectionData[_eventId];
    }
    
    function getQualityTestData(string calldata _eventId) external view returns (QualityTestData memory) {
        require(events[_eventId].exists, "Event does not exist");
        return qualityTestData[_eventId];
    }
    
    function getProcessingData(string calldata _eventId) external view returns (ProcessingData memory) {
        require(events[_eventId].exists, "Event does not exist");
        return processingData[_eventId];
    }
    
    function getManufacturingData(string calldata _eventId) external view returns (ManufacturingData memory) {
        require(events[_eventId].exists, "Event does not exist");
        return manufacturingData[_eventId];
    }
}