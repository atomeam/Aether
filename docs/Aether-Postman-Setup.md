# Aether Postman Collection Setup

Complete Postman collection for Aether backend API with Victus integration and AI Self-Funding System.

## What's Included

### API Endpoints (32+ endpoints organized into folders)

**1. System Health & Monitoring (6 endpoints)**
- GET `/api/stack` - Stack health status
- GET `/api/agents` - Agent system status
- GET `/api/metrics` - System metrics snapshot
- GET `/api/health` - Unified health dashboard
- GET `/api/vitals` - Vital signs and throttle recommendations
- GET `/api/telemetry` - Telemetry data (json/prometheus/csv)

**2. Alert & Notification System (4 endpoints)**
- GET `/api/alerts` - Get active alerts
- POST `/api/alerts` - Create new alert
- GET `/api/notifier` - Get notifier channel status
- POST `/api/notifier` - Send notification

**3. Workflow & Task Management (3 endpoints)**
- GET `/api/workflows` - List available workflows
- POST `/api/workflows/trigger` - Trigger workflow execution
- GET `/api/scheduler` - Get scheduler status

**4. Human Intervention & Triage (4 endpoints)**
- GET `/api/human-queue` - Get human intervention queue
- POST `/api/human-queue` - Add to human queue
- GET `/api/triage` - Get triage queue
- POST `/api/triage` - Add to triage

**5. Agent Reflection & Learning (3 endpoints)**
- POST `/api/agents/reflect` - Write lesson to reflection system
- GET `/api/agents/reflect` - Get learned patterns
- POST `/api/compactor` - Compact and optimize lessons

**6. Council & Evaluation (2 endpoints)**
- POST `/api/council/evaluate` - Evaluate with Council of Evaluators
- POST `/api/adversarial` - Evaluate for adversarial patterns

**7. Dream & Journal System (3 endpoints)**
- GET `/api/dream` - Get dream state status
- GET `/api/journal` - Get journal entries
- POST `/api/journal` - Generate auto journal entry

**8. Chaos Engineering (2 endpoints)**
- POST `/api/agents/chaos` - Execute chaos scenario
- GET `/api/agents/chaos` - Get available scenarios

**9. System Configuration (3 endpoints)**
- GET `/api/rate-limits` - Get rate limit status
- GET `/api/secrets` - Get secrets list (names only)
- GET `/api/profile` - Get system profile

**10. Advanced Operations (2 endpoints)**
- GET `/api/foresight` - Get foresight predictions
- POST `/api/replay` - Replay historical events

**11. Victus Bridge (4 endpoints)**
- GET `http://localhost:8080/health` - Victus health check
- POST `http://localhost:8080/execute` - Execute command
- POST `http://localhost:8080/execute` - Read file
- POST `http://localhost:8080/execute` - Write file

**12. AI Self-Funding System (5 endpoints)**
- GET `http://localhost:3002/api/services` - Get available services
- POST `http://localhost:3002/api/payment/create` - Create payment intent
- POST `http://localhost:3002/api/service/submit` - Submit service request
- GET `http://localhost:3002/api/service/status/:requestId` - Get service status
- GET `http://localhost:3002/api/service/results/:requestId` - Get service results

## Installation

### Step 1: Import Collection

1. Open Postman
2. Click **Import** in the top left
3. Select **File** tab
4. Choose `Aether-Postman-Collection.json`
5. Click **Import**

### Step 2: Import Environment

1. Click the **Environment** dropdown (top right)
2. Click **Import**
3. Select `Aether-Postman-Environment.json`
4. Click **Import**
5. Select the **Aether Development** environment from the dropdown

### Step 3: Configure Environment Variables

The environment comes pre-configured with default values:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:3000` | Aether backend URL |
| `victusUrl` | `http://localhost:8080` | Victus runtime URL |
| `selfFundingUrl` | `http://localhost:3002` | AI Self-Funding API URL |
| `apiKey` | (empty) | API key for authentication (if required) |
| `stripeApiKey` | (empty) | Stripe API key for payments |
| `requestId` | (empty) | Dynamic variable for request IDs |
| `workflowId` | (empty) | Dynamic variable for workflow IDs |
| `alertId` | (empty) | Dynamic variable for alert IDs |

**To modify:**
1. Select **Aether Development** environment
2. Click **Edit**
3. Modify values as needed
4. Click **Save**

## Usage

### Quick Start

1. **Start Aether Backend:**
   ```bash
   cd C:\Users\adamm\Aether
   npm run dev:backend
   ```

2. **Start Victus Runtime (if using Victus endpoints):**
   ```bash
   # Victus should be running on port 8080
   ```

3. **Start AI Self-Funding API (if using payment endpoints):**
   ```bash
   cd C:\Users\adamm\.victus\self-funding
   npm install
   npm run start:api
   ```

4. **Test in Postman:**
   - Select **Aether Development** environment
   - Open any request in the collection
   - Click **Send**

### Testing Workflow

**Basic Health Check:**
1. Open `System Health & Monitoring` folder
2. Click `Get Stack Health`
3. Click **Send**
4. Verify response shows healthy status

**Victus Bridge Test:**
1. Open `Victus Bridge` folder
2. Click `Victus Health Check`
3. Click **Send**
4. Verify Victus is operational

**AI Self-Funding Test:**
1. Open `AI Self-Funding System` folder
2. Click `Get Services`
3. Click **Send**
4. Verify services list with pricing

### Advanced Usage

**Chaining Requests:**
1. Create a workflow by chaining multiple requests
2. Use environment variables to pass data between requests
3. Example: Create alert → Get alerts → Verify alert exists

**Pre-request Scripts:**
```javascript
// Set dynamic request ID
pm.environment.set("requestId", "REQ-" + Date.now());
```

**Tests:**
```javascript
// Test response status
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test response structure
pm.test("Response has data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
});
```

## Victus Integration

The collection includes Victus Bridge endpoints that connect to the local Victus runtime at `http://localhost:8080`.

**Victus Bridge Features:**
- Health checks
- Command execution
- File operations (read/write)
- Orchestration of local operations

**Victus Configuration:**
Based on VictusBridge from Aether:
- Runtime URL: `http://localhost:8080`
- Health endpoint: `/health`
- Command endpoint: `/execute`
- Timeout: 30 seconds
- Retries: 3

## AI Self-Funding Integration

The collection includes endpoints for the AI Self-Funding System that monetizes AI services.

**Self-Funding Features:**
- Service catalog with pricing
- Stripe payment integration
- Service request submission
- Status tracking
- Results delivery

**Self-Funding Configuration:**
- API URL: `http://localhost:3002`
- Stripe API key: Configure in environment
- Services: CodeReview, BugFix, Documentation, Refactoring, Testing, Tutorial, BlogPost, CICDSetup, MonitoringSetup

## Troubleshooting

### Connection Refused

**Issue:** `ECONNREFUSED` when sending requests

**Solution:**
1. Verify backend is running: `npm run dev:backend`
2. Check port: Ensure backend is on port 3000
3. Verify environment variable: `baseUrl` should be `http://localhost:3000`

### Victus Not Responding

**Issue:** Victus endpoints return errors

**Solution:**
1. Verify Victus is running on port 8080
2. Check Victus health: `GET http://localhost:8080/health`
3. Verify VictusBridge configuration in Aether

### Stripe Payment Errors

**Issue:** Payment intent creation fails

**Solution:**
1. Verify Stripe API key is configured in environment
2. Check Stripe account status
3. Verify service pricing matches Stripe configuration

### 404 Not Found

**Issue:** Endpoint returns 404

**Solution:**
1. Verify backend is running
2. Check endpoint path matches collection
3. Verify backend has the endpoint implemented

## Folder Structure

The collection is organized into logical folders:

```
Aether Backend API
├── System Health & Monitoring
├── Alert & Notification System
├── Workflow & Task Management
├── Human Intervention & Triage
├── Agent Reflection & Learning
├── Council & Evaluation
├── Dream & Journal System
├── Chaos Engineering
├── System Configuration
├── Advanced Operations
├── Victus Bridge
└── AI Self-Funding System
```

## Best Practices

1. **Always select the environment** before sending requests
2. **Use pre-request scripts** for dynamic data
3. **Add tests** to verify responses
4. **Chain requests** for complex workflows
5. **Use collections** to organize related endpoints
6. **Document custom requests** with descriptions
7. **Version control** your collection changes

## Exporting

**To export collection:**
1. Click **...** on collection
2. Select **Export**
3. Choose format (Collection v2.1)
4. Save as JSON

**To export environment:**
1. Click **Environment** dropdown
2. Click **...** on environment
3. Select **Export**
4. Save as JSON

## Sharing

**To share with team:**
1. Export collection and environment
2. Share JSON files
3. Team members import both
4. Configure their local environment variables

## Additional Resources

- **Aether Documentation:** `C:\Users\adamm\Aether\AGENTS.md`
- **Victus Bridge:** `C:\Users\adamm\Aether\apps\backend\src\victus_bridge.ts`
- **Self-Funding System:** `C:\Users\adamm\.victus\self-funding\README.md`
- **MCP Server:** `C:\Users\adamm\Aether\packages\mcp-server\`

## Support

For issues or questions:
1. Check backend logs: `npm run dev:backend`
2. Verify Victus runtime status
3. Check environment variables
4. Review API documentation in AGENTS.md