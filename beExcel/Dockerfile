# Use Node.js LTS version as base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["node", "index.js"] 