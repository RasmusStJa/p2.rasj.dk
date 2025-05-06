# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# Also copy tsconfig.json needed for build
COPY package*.json tsconfig.json ./

# Install ALL dependencies (including typescript from dependencies)
RUN npm install

# Copy the rest of the backend source code (.ts files, etc.)
COPY . .

# Compile TypeScript to JavaScript
# This runs 'tsc' which reads tsconfig.json and outputs to ./dist
RUN npm run build

# Make port 3001 available (adjust if your backend uses a different port)
EXPOSE 3001

# Define the command to run the compiled JavaScript application
# Use the compiled output from the 'dist' folder
CMD ["node", "dist/server.js"]
