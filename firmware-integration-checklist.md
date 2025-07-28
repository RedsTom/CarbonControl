# Firmware Integration Checklist: CarbonControl

## ⚠️ CRITICAL CONSIDERATIONS BEFORE DEPLOYMENT

### **Current Dependencies on Old UI**

#### 1. **WebSocket Endpoints** 🔌
CarbonControl tries multiple WebSocket paths that may be specific to the old UI:
```typescript
const wsUrls = [
  `ws://${printerIP}:3030/websocket`,    // Old UI endpoint?
  `ws://${printerIP}:3030/ws`,           // Old UI endpoint?
  `ws://${printerIP}:3030/`,             // Old UI endpoint?
  `ws://${printerIP}:3030/api/websocket`, // Old UI endpoint?
  `ws://${printerIP}:3030/sdcp`,         // SDCP protocol endpoint
]
```

**Action Required**: Verify which endpoints your custom firmware supports and update the list.

#### 2. **HTTP Upload Endpoint** 📁
File upload relies on this specific endpoint:
```typescript
const printerUrl = `http://${printerIP}:3030/uploadFile/upload`;
```

**Action Required**: Ensure your custom firmware provides this exact endpoint.

#### 3. **Camera Stream Endpoint** 📹
Camera stream uses:
```typescript
const debugVideoUrl = `http://${connectedIp}:3031/video`;
```

**Action Required**: Verify your firmware provides MJPEG stream on port 3031.

## 🔧 REQUIRED FIRMWARE CHANGES

### **WebSocket Server (Port 3030)**
Your custom firmware must provide:

1. **SDCP Protocol Support**
   - Command handling (0, 1, 128, 129, 130, 131, 256, 258, 320, 386, 401, 402, 403)
   - Topic-based message routing (`sdcp/status/`, `sdcp/attributes/`, `sdcp/response/`)
   - Request/response pattern with UUID tracking
   - Heartbeat support (ping/pong)

2. **WebSocket Endpoints**
   - At least one of the endpoints in the `wsUrls` array
   - Recommended: `ws://${printerIP}:3030/sdcp` for SDCP protocol

### **HTTP Upload Server (Port 3030)**
Your custom firmware must provide:

1. **File Upload Endpoint**
   - `POST /uploadFile/upload`
   - Accepts multipart form data
   - Handles chunked uploads with MD5 verification
   - Supports fields: `TotalSize`, `Uuid`, `Offset`, `Check`, `S-File-MD5`, `File`

2. **File Management Endpoints**
   - File listing (`/local/` and `/usb/` paths)
   - File deletion
   - Print history retrieval

### **Camera Stream Server (Port 3031)**
Your custom firmware must provide:

1. **MJPEG Stream**
   - `GET /video` endpoint
   - Continuous MJPEG stream
   - Proper CORS headers for browser access

## 📋 PRE-DEPLOYMENT CHECKLIST

### **Phase 1: Firmware Verification** ✅
- [ ] **WebSocket Server**: Custom firmware provides SDCP protocol on port 3030
- [ ] **HTTP Upload**: Custom firmware provides `/uploadFile/upload` endpoint
- [ ] **File Management**: Custom firmware provides file listing/deletion APIs
- [ ] **Camera Stream**: Custom firmware provides MJPEG stream on port 3031
- [ ] **SDCP Commands**: All required commands (0-403) are implemented
- [ ] **Message Format**: Responses match expected SDCP format

### **Phase 2: CarbonControl Modifications** ✅
- [ ] **Update WebSocket URLs**: Remove old UI endpoints, keep only SDCP
- [ ] **Test Connection**: Verify WebSocket connection works with custom firmware
- [ ] **Test File Upload**: Verify chunked upload works with custom firmware
- [ ] **Test Camera Stream**: Verify MJPEG stream displays correctly
- [ ] **Test All Commands**: Verify all printer control functions work
- [ ] **Remove Old UI Dependencies**: Ensure no references to old UI remain

### **Phase 3: Integration Testing** ✅
- [ ] **Full Feature Test**: Test all CarbonControl features with custom firmware
- [ ] **Error Handling**: Verify error handling works with custom firmware responses
- [ ] **Performance Test**: Verify upload speeds and real-time updates
- [ ] **Stability Test**: Long-running connection stability
- [ ] **Fallback Testing**: Test reconnection and error recovery

## 🚨 CRITICAL RISKS

### **High Risk Scenarios**
1. **WebSocket Protocol Mismatch**: If custom firmware doesn't implement SDCP correctly
2. **Upload Endpoint Missing**: If `/uploadFile/upload` endpoint is not available
3. **Command Response Format**: If responses don't match expected SDCP format
4. **Port Conflicts**: If custom firmware uses different ports

### **Medium Risk Scenarios**
1. **Camera Stream Format**: If MJPEG stream format differs
2. **File Path Differences**: If file system paths differ from expected
3. **Authentication**: If custom firmware requires authentication

## 🔄 RECOMMENDED APPROACH

### **Step 1: Firmware Analysis**
```bash
# Test WebSocket endpoints
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
  http://PRINTER_IP:3030/sdcp

# Test upload endpoint
curl -X POST http://PRINTER_IP:3030/uploadFile/upload \
  -F "TotalSize=1000" -F "Uuid=test" -F "Offset=0" \
  -F "Check=1" -F "S-File-MD5=test" -F "File=@test.gcode"

# Test camera stream
curl http://PRINTER_IP:3031/video
```

### **Step 2: CarbonControl Modifications**
```typescript
// Update WebSocket URLs to only include SDCP endpoint
const wsUrls = [
  `ws://${printerIP}:3030/sdcp`,  // Only SDCP endpoint
];

// Remove old UI specific endpoints
// const wsUrls = [
//   `ws://${printerIP}:3030/websocket`,    // REMOVE
//   `ws://${printerIP}:3030/ws`,           // REMOVE
//   `ws://${printerIP}:3030/`,             // REMOVE
//   `ws://${printerIP}:3030/api/websocket`, // REMOVE
//   `ws://${printerIP}:3030/sdcp`,         // KEEP
// ];
```

### **Step 3: Gradual Migration**
1. **Keep Old UI**: Initially deploy both UIs side by side
2. **Test CarbonControl**: Verify all features work with custom firmware
3. **Remove Old UI**: Only remove old UI after full verification
4. **Monitor**: Watch for any issues after old UI removal

## 📊 SUCCESS CRITERIA

### **Before Removing Old UI**
- [ ] CarbonControl connects successfully to custom firmware
- [ ] All printer commands work (start, pause, stop, temperature, fans, etc.)
- [ ] File upload works with progress tracking
- [ ] File listing and management works
- [ ] Camera stream displays correctly
- [ ] Real-time status updates work
- [ ] Error handling works properly
- [ ] Connection stability is verified

### **After Removing Old UI**
- [ ] No broken functionality
- [ ] No performance degradation
- [ ] No connection issues
- [ ] All features continue to work

## 🆘 ROLLBACK PLAN

If issues arise after removing the old UI:

1. **Immediate**: Re-enable old UI temporarily
2. **Investigation**: Debug CarbonControl issues
3. **Fix**: Update CarbonControl or firmware as needed
4. **Re-test**: Verify fixes work
5. **Re-deploy**: Remove old UI again

## 💡 RECOMMENDATIONS

1. **Test Thoroughly**: Don't rush the removal of old UI
2. **Document Everything**: Keep detailed logs of what works/doesn't work
3. **Have Backup**: Keep old UI code available for quick rollback
4. **Monitor Closely**: Watch for issues in the first few days after removal
5. **User Communication**: Inform users about the UI change

**Remember**: Once deployed, it's much harder to fix issues. Take the time to test thoroughly before removing the old UI! 