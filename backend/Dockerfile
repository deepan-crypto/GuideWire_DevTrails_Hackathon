# Node.js Express Backend Dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source code
COPY . .

# Default port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
