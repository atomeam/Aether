#!/bin/bash
# Health Check and Alerting Script
# Monitors critical endpoints and sends alerts on failure

set -e

echo "=== Health Check and Alerting ==="
echo ""

# Configuration
BRIDGE_URL="${BRIDGE_URL:-https://bridge.a-to-mind.com}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}" # Optional: Slack/Teams webhook for alerts

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Alert function
send_alert() {
    local message=$1
    local severity=$2
    
    echo -e "${RED}ALERT [$severity]: $message${NC}"
    
    # Send to webhook if configured
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -s -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"[$severity] $message\"}" > /dev/null
    fi
}

# Health check function
check_health() {
    local name=$1
    local url=$2
    local critical=$3
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✓ $name is healthy${NC}"
        return 0
    else
        if [ "$critical" = "true" ]; then
            send_alert "$name is down (HTTP $status)" "CRITICAL"
        else
            echo -e "${YELLOW}⚠ $name is degraded (HTTP $status)${NC}"
        fi
        return 1
    fi
}

# Check bridge worker
echo "=== Bridge Worker Health ==="
check_health "Bridge Worker" "$BRIDGE_URL/health" true
check_health "Bridge API" "$BRIDGE_URL/api/stack" true
check_health "Bridge Database" "$BRIDGE_URL/crew/status" true
echo ""

# Check backend (if running)
echo "=== Backend Health ==="
if curl -s "$BACKEND_URL/api/stack" > /dev/null 2>&1; then
    check_health "Backend API" "$BACKEND_URL/api/stack" true
    check_health "Backend Agents" "$BACKEND_URL/api/agents" false
else
    echo -e "${YELLOW}⚠ Backend not running${NC}"
fi
echo ""

# Check critical bindings
echo "=== Bridge Bindings Check ==="
bindings=$(curl -s "$BRIDGE_URL/crew/status")
if echo "$bindings" | grep -q '"DB":true'; then
    echo -e "${GREEN}✓ DB binding healthy${NC}"
else
    send_alert "DB binding missing or unhealthy" "CRITICAL"
fi

if echo "$bindings" | grep -q '"STATE":true'; then
    echo -e "${GREEN}✓ STATE binding healthy${NC}"
else
    send_alert "STATE binding missing or unhealthy" "CRITICAL"
fi

if echo "$bindings" | grep -q '"BRIDGE_DB":true'; then
    echo -e "${GREEN}✓ BRIDGE_DB binding healthy${NC}"
else
    send_alert "BRIDGE_DB binding missing or unhealthy" "CRITICAL"
fi
echo ""

echo "=== Health Check Complete ==="
