# Cloudflare Tunnel Setup Script
# Run this on the Victus (Windows PowerShell)

# ===========================================
# 1. Install cloudflared
# ===========================================
choco install cloudflared -y

# ===========================================
# 2. Create tunnel (one-time)
# ===========================================
cloudflared tunnel create aether-bridge

# ===========================================
# 3. Add DNS record
# ===========================================
cloudflared tunnel route dns aether-bridge bridge.atomeam.com

# ===========================================
# 4. Run tunnel (development)
# ===========================================
# cloudflared tunnel run aether-bridge

# ===========================================
# 5. Run as Windows Service (production)
# ===========================================
# cloudflared service install
# cloudflared service start

# ===========================================
# 6. Verify tunnel
# ===========================================
# curl -sS https://bridge.atomeam.com/health

# ===========================================
# Variables to set in .env
# ===========================================
# NOTION_WEBHOOK_SECRET=your-shared-secret
# CURATOR_QUEUE_URL=http://127.0.0.1:8787/curator/dispatch
# PORT=8787