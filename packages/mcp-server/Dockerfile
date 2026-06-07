FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files
COPY build ./build

# Set environment variable for backend URL
ENV AETHER_BACKEND_URL=http://host.docker.internal:3000

# Run the MCP server
CMD ["node", "build/index.js"]