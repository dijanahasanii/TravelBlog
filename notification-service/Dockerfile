# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your app code
COPY . .

# Expose the port your service listens on (e.g., 5006)
EXPOSE 5006

# Start the service
CMD ["node", "index.js"]
