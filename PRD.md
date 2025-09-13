# Product Requirements Document (PRD)
## IDO Indexer Application

### 1. Executive Summary

**Project Name:** IDO (Initial DEX Offering) Indexer  
**Version:** 0.1.0  
**Purpose:** Real-time blockchain event indexing system for MedChain IDO smart contract  
**Target Users:** Developers, DeFi platforms, blockchain analysts  

The IDO Indexer is a Node.js application that monitors and indexes blockchain events from the MedChainIDO smart contract, providing real-time data access through a RESTful API. The system processes token purchase events, stores them in MongoDB, and exposes the data via Swagger-documented endpoints.

### 2. Business Requirements

#### 2.1 Core Business Objectives
- **Real-time Event Monitoring:** Capture all TokensPurchased events from the MedChainIDO contract
- **Data Persistence:** Store event data reliably for historical analysis and reporting
- **API Access:** Provide programmatic access to purchase data for integration with external systems
- **Scalability:** Handle high transaction volumes during IDO periods
- **Reliability:** Ensure zero data loss through robust error handling and recovery

#### 2.2 Success Criteria
- 100% capture rate of contract events
- Sub-second event processing latency
- 99.9% API uptime
- Comprehensive test coverage (>90%)
- Complete API documentation

### 3. Functional Requirements

#### 3.1 Event Indexing System

**3.1.1 Smart Contract Integration**
- Monitor MedChainIDO contract at configurable address
- Listen for `TokensPurchased` events with parameters:
  - `buyer`: Address of token purchaser (indexed)
  - `ngnAmount`: Amount of NGN tokens used (uint256)
  - `tokenAmount`: Amount of MCH tokens received (uint256)

**3.1.2 Event Processing Pipeline**
- WebSocket connection to Ethereum RPC endpoint
- Real-time event capture and parsing
- Queue-based processing using BullMQ and Redis
- Automatic retry mechanism for failed processing
- Block confirmation requirements (configurable, default: 6 blocks)

**3.1.3 Data Storage**
- MongoDB database with unique indexing on `txHash` + `logIndex`
- Event data structure:
  ```json
  {
    "buyer": "0x...",
    "nairaTokenWei": "1000000000000000000",
    "mchTokenWei": "500000000000000000", 
    "txHash": "0x...",
    "blockNumber": 12345,
    "logIndex": 1,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "confirmed": true
  }
  ```

#### 3.2 REST API

**3.2.1 Purchase Data Endpoint**
- **Endpoint:** `GET /purchases`
- **Functionality:** Retrieve token purchase events with filtering and sorting
- **Query Parameters:**
  - `buyer`: Filter by buyer address
  - `minAmount`: Minimum NGN amount filter
  - `maxAmount`: Maximum NGN amount filter
  - `confirmed`: Filter by confirmation status
  - `limit`: Number of results (default: 100, max: 1000)
  - `offset`: Pagination offset (default: 0)
  - `sort`: Sort field (blockNumber, timestamp, nairaTokenWei)
  - `order`: Sort order (asc/desc, default: desc)

**3.2.2 Response Format**
```json
{
  "data": [
    {
      "buyer": "0x742d35Cc6635C0532925a3b8D59d3D44b8b9f1b4",
      "nairaTokenWei": "1000000000000000000",
      "mchTokenWei": "500000000000000000",
      "txHash": "0xabc123...",
      "blockNumber": 12345,
      "logIndex": 1,
      "timestamp": "2024-01-01T00:00:00.000Z",
      "confirmed": true
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 250
  }
}
```

#### 3.3 Backfill System

**3.3.1 Historical Data Processing**
- Configurable start block for historical event capture
- Batch processing with configurable batch size (default: 1000 blocks)
- Progress tracking and resumable operations
- Rate limiting to prevent RPC overload

### 4. Technical Requirements

#### 4.1 Technology Stack

**4.1.1 Core Technologies**
- **Runtime:** Node.js v22 with ES Modules
- **Framework:** Express.js v4.18.2
- **Database:** MongoDB v5.8.0 with unique indexing
- **Cache/Queue:** Redis v7 with BullMQ v5.58.5
- **Blockchain:** ethers.js v6.9.0 for Ethereum interaction

**4.1.2 Development Dependencies**
- **Testing:** Mocha v10.2.0, Chai v4.3.10, Sinon v17.0.1
- **API Testing:** Supertest v6.3.3
- **Test Database:** MongoDB Memory Server v9.1.3
- **Documentation:** Swagger UI Express v5.0.1

#### 4.2 System Architecture

**4.2.1 Component Structure**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Event Queue   │    │   MongoDB       │
│   Provider      │───▶│   (Redis)       │───▶│   Database      │
│   (ethers.js)   │    │   (BullMQ)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         │                                              │
         ▼                                              ▼
┌─────────────────┐                          ┌─────────────────┐
│   Event         │                          │   REST API      │
│   Listener      │                          │   (Express.js)  │
└─────────────────┘                          └─────────────────┘
```

**4.2.2 File Structure**
```
src/
├── index.js          # Main application entry point
├── config.js         # Configuration management
├── logger.js         # Logging utilities (Pino)
├── provider.js       # WebSocket provider setup
├── listener.js       # Event listener implementation
├── processor.js      # Event processing worker
├── backfill.js       # Historical data processing
├── api.js           # REST API endpoints
├── swagger.yaml     # API documentation
├── models/
│   └── purchases.js # Database models and connections
└── abi/
    └── abi-MedChainIDO.json # Smart contract ABI
```

#### 4.3 Configuration Management

**4.3.1 Environment Variables**
- `RPC_WS`: WebSocket RPC endpoint URL (required)
- `IDO_CONTRACT_ADDRESS`: MedChainIDO contract address (required)
- `MONGO_URI`: MongoDB connection string (default: mongodb://localhost:27017/ido)
- `REDIS_HOST`: Redis host (default: 127.0.0.1)
- `REDIS_PORT`: Redis port (default: 6379)
- `START_BLOCK`: Historical processing start block (default: 0)
- `CONFIRMATIONS`: Block confirmations required (default: 6)
- `BATCH_SIZE`: Backfill batch size (default: 1000)
- `LOG_LEVEL`: Logging level (default: info)

### 5. Non-Functional Requirements

#### 5.1 Performance Requirements
- **Event Processing:** < 1 second latency from blockchain to database
- **API Response Time:** < 200ms for typical queries
- **Throughput:** Handle 1000+ events per minute during peak periods
- **Concurrency:** Support 100+ simultaneous API requests

#### 5.2 Reliability Requirements
- **Uptime:** 99.9% availability target
- **Data Integrity:** Zero event loss through unique constraints
- **Error Recovery:** Automatic reconnection and retry mechanisms
- **Monitoring:** Comprehensive logging with structured format

#### 5.3 Scalability Requirements
- **Horizontal Scaling:** Stateless design for multiple instance deployment
- **Database Indexing:** Optimized queries with proper indexing strategy
- **Resource Management:** Configurable batch sizes and rate limiting

#### 5.4 Security Requirements
- **Input Validation:** Sanitize all API inputs and blockchain data
- **Error Handling:** Prevent information leakage through error messages
- **Access Control:** Rate limiting on API endpoints

### 6. Quality Assurance Requirements

#### 6.1 Testing Strategy

**6.1.1 Unit Testing**
- Individual function testing with Mocha/Chai
- Mock external dependencies with Sinon
- Target: 90%+ code coverage

**6.1.2 Integration Testing**
- End-to-end workflow testing
- Database integration testing with MongoDB Memory Server
- API endpoint testing with Supertest

**6.1.3 Test Coverage**
- All core modules: provider, listener, processor, api
- Database operations and error scenarios
- Configuration validation and edge cases

#### 6.2 Documentation Requirements
- Complete Swagger/OpenAPI specification
- Inline code documentation
- README with setup and usage instructions
- Architecture decision records (ADRs)

### 7. Deployment Requirements

#### 7.1 Containerization
- **Docker:** Multi-stage builds with Node.js Alpine base
- **Docker Compose:** Multi-service orchestration
- **Environment:** Production-ready configuration with health checks

#### 7.2 Infrastructure Dependencies
- **Database:** MongoDB with persistent storage
- **Cache:** Redis for job queue management
- **Network:** Reliable Ethereum RPC endpoint access

#### 7.3 Service Configuration
```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    depends_on: [mongo, redis]
  
  mongo:
    image: mongo:latest
    ports: ["27017:27017"]
    volumes: [ido_mongodb_data:/data/db]
  
  redis:
    image: redis:7
    ports: ["6379:6379"]
```

### 8. Data Requirements

#### 8.1 Data Models

**8.1.1 Purchase Event Schema**
```javascript
{
  buyer: String,           // Ethereum address (0x...)
  nairaTokenWei: String,   // NGN amount in wei (BigInt as string)
  mchTokenWei: String,     // MCH amount in wei (BigInt as string)
  txHash: String,          // Transaction hash
  blockNumber: Number,     // Block number
  logIndex: Number,        // Log index within block
  timestamp: Date,         // Block timestamp
  confirmed: Boolean       // Confirmation status
}
```

**8.1.2 Database Constraints**
- Unique index on `{txHash, logIndex}` for idempotency
- Indexes on `buyer`, `blockNumber`, `timestamp` for query optimization
- TTL index consideration for data retention policies

#### 8.2 Data Lifecycle
- **Ingestion:** Real-time event capture and processing
- **Storage:** Persistent MongoDB storage with redundancy
- **Access:** REST API with pagination and filtering
- **Archival:** Configurable data retention and archival strategies

### 9. Monitoring and Observability

#### 9.1 Logging Strategy
- **Structured Logging:** JSON format with Pino logger
- **Log Levels:** Debug, Info, Warn, Error with configurable levels
- **Context:** Request IDs, transaction hashes, and user context

#### 9.2 Metrics and Alerts
- **Performance Metrics:** Event processing latency, API response times
- **Business Metrics:** Event count, unique buyers, transaction volumes
- **Error Metrics:** Failed processing, API errors, connection failures

### 10. Risk Assessment

#### 10.1 Technical Risks
- **RPC Endpoint Failure:** Implement multiple endpoint fallbacks
- **Database Outage:** Ensure proper backup and recovery procedures
- **High Event Volume:** Implement backpressure and rate limiting

#### 10.2 Mitigation Strategies
- **Redundancy:** Multiple RPC endpoints and database replicas
- **Monitoring:** Real-time alerts for system health
- **Recovery:** Automated restart and backfill capabilities

### 11. Future Enhancements

#### 11.1 Planned Features
- **GraphQL API:** Advanced querying capabilities
- **Real-time Subscriptions:** WebSocket-based live updates
- **Analytics Dashboard:** Built-in data visualization
- **Multi-chain Support:** Extension to other blockchain networks

#### 11.2 Scalability Improvements
- **Microservices:** Split into dedicated services
- **Message Streaming:** Apache Kafka for high-throughput events
- **Caching Layer:** Redis-based response caching

### 12. Acceptance Criteria

#### 12.1 Minimum Viable Product (MVP)
- ✅ Real-time event indexing from MedChainIDO contract
- ✅ MongoDB storage with unique constraints
- ✅ REST API with filtering and pagination
- ✅ Comprehensive test suite (22+ passing tests)
- ✅ Docker deployment configuration
- ✅ Complete Swagger documentation

#### 12.2 Definition of Done
- All functional requirements implemented
- Test coverage above 90%
- API documentation complete and accurate
- Docker deployment successful
- Performance benchmarks met
- Security review completed

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-01  
**Document Owner:** Development Team  
**Stakeholders:** DevOps, QA, Product Management
