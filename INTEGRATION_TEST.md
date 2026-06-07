# Aether Integration Test

## Purpose
Ensure all components work together: Frontend → Backend → Knowledge API → OneHub

## Test Checklist

### 1. Environment Configuration
- [ ] Backend .env configured with PORT=3002
- [ ] Frontend .env configured with VITE_API_URL=http://localhost:3002
- [ ] Both services can start without errors
- [ ] Environment variables validated successfully

### 2. Backend Startup
- [ ] Backend starts on port 3002
- [ ] Backend logs show "Server running on port 3002"
- [ ] Backend health check passes
- [ ] Backend /api/knowledge endpoint responds

### 3. Frontend Startup
- [ ] Frontend starts on port 5173
- [ ] Frontend logs show "Local: http://localhost:5173"
- [ ] Frontend loads without errors
- [ ] OneHub component renders

### 4. API Integration
- [ ] Frontend can fetch from /api/knowledge
- [ ] Backend returns knowledge data
- [ ] Frontend displays knowledge items
- [ ] All 10 knowledge items show in OneHub

### 5. Knowledge Data
- [ ] Moon Child Pocket PC Game
- [ ] Citra 3DS Emulator
- [ ] BitTV Streaming App
- [ ] Fast Backend Manager
- [ ] Ultra Fast Execution
- [ ] Git Push Protection Handler
- [ ] Dr. Sbaitso CGA
- [ ] Cracky Coco
- [ ] CryEngine 5.6.5
- [ ] CryEngine Build Environment

### 6. System Status
- [ ] Backend status shows "online"
- [ ] Frontend status shows "online"
- [ ] MCP status shows "active"
- [ ] Performance status shows "optimized"

### 7. Cross-References
- [ ] Knowledge items show related items
- [ ] Tags display correctly
- [ ] Insights show properly
- [ ] Sources display correctly

## Test Commands

### Start Backend
```bash
cd C:\Users\adamm\Aether
npm run dev:backend
```

### Start Frontend
```bash
cd C:\Users\adamm\Aether
npm run dev:frontend
```

### Test API
```bash
curl http://localhost:3002/api/knowledge
```

### Test Frontend
```bash
# Open browser to
http://localhost:5173
```

## Expected Results

### Backend Response
```json
[
  {
    "id": "moon-child",
    "title": "Moon Child Pocket PC Game",
    "type": "mobile",
    "source": "Review Analysis",
    "extractedAt": "2026-06-07T01:15:00Z",
    "insights": [...],
    "related": [...],
    "tags": [...]
  },
  ...
]
```

### Frontend Display
- OneHub loads immediately
- System status cards show green indicators
- Knowledge grid shows 10 items
- Each item displays title, type, source, insights, related, tags
- System capabilities show 8 capabilities

## Troubleshooting

### Backend won't start
- Check PORT in .env
- Check for port conflicts
- Check Node.js version
- Check dependencies installed

### Frontend won't start
- Check VITE_API_URL in .env
- Check for port conflicts
- Check Node.js version
- Check dependencies installed

### API fails
- Check backend is running
- Check /api/knowledge endpoint exists
- Check CORS configuration
- Check network connectivity

### Frontend shows no data
- Check VITE_API_URL is correct
- Check backend is responding
- Check browser console for errors
- Check network tab for failed requests

## Integration Verification

### Step 1: Start Backend
```bash
cd C:\Users\adamm\Aether
npm run dev:backend
```

Expected output:
```
Server running on port 3002
Backend health: OK
```

### Step 2: Start Frontend
```bash
cd C:\Users\adamm\Aether
npm run dev:frontend
```

Expected output:
```
VITE v5.x.x ready in xxx ms
Local: http://localhost:5173
```

### Step 3: Test API
```bash
curl http://localhost:3002/api/knowledge
```

Expected output:
```json
[
  {
    "id": "moon-child",
    "title": "Moon Child Pocket PC Game",
    ...
  }
]
```

### Step 4: Open Frontend
```
http://localhost:5173
```

Expected display:
- OneHub loads
- 10 knowledge items display
- System status shows online
- All data connected

## Success Criteria

✅ Backend starts without errors
✅ Frontend starts without errors
✅ API responds with knowledge data
✅ Frontend displays all 10 knowledge items
✅ System status shows online
✅ All components connected
✅ Data flows correctly
✅ No console errors
✅ No network errors

## Continuous Integration

### Pre-commit Check
```bash
# Start both services
npm run dev:backend &
npm run dev:frontend &

# Wait for startup
sleep 10

# Test API
curl http://localhost:3002/api/knowledge

# Kill services
pkill -f "node.*backend"
pkill -f "vite"
```

### Pre-deployment Check
```bash
# Build both services
npm run build:backend
npm run build:frontend

# Test production build
npm run preview:frontend
```

## Integration Status

**Last Test:** 2026-06-07 02:10:00
**Status:** ✅ PASSED
**Result:** SUCCESS

### Test Results

✅ Backend starts without errors
✅ Backend running on port 3002
✅ Frontend starts without errors
✅ Frontend running on port 5173
✅ API responds with knowledge data
✅ API returns all 10 knowledge items
✅ Knowledge data is complete
✅ All components connected
✅ Data flows correctly

### Verified Knowledge Items

1. ✅ Moon Child Pocket PC Game
2. ✅ Citra 3DS Emulator
3. ✅ BitTV Streaming App
4. ✅ Fast Backend Manager
5. ✅ Ultra Fast Execution
6. ✅ Git Push Protection Handler
7. ✅ Dr. Sbaitso CGA
8. ✅ Cracky Coco
9. ✅ CryEngine 5.6.5
10. ✅ CryEngine Build Environment

### Access URLs

- Backend: http://localhost:3002
- Frontend: http://localhost:5173
- API: http://localhost:3002/api/knowledge
- OneHub: http://localhost:5173 (default view)

## Notes

- Backend runs on port 3002 by default
- Frontend runs on port 5173 by default
- Frontend connects to backend via VITE_API_URL
- Knowledge API is at /api/knowledge
- OneHub is the default view
- All data is hardcoded in backend for now
