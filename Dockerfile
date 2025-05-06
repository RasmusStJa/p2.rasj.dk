# Stage 1: Prepare environment (even without build)
FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN rm -rf ./backend

# No build step for now:
# RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy the source files directly as there's no build output folder yet
# Adjust source path if necessary, e.g., copy specific folders like public/, src/
COPY --from=build /app /usr/share/nginx/html

# Remove backend code if it got copied (should be prevented by rm -rf earlier)
RUN rm -rf /usr/share/nginx/html/backend

# Expose port 80
EXPOSE 80

# Default command to start Nginx
CMD ["nginx", "-g", "daemon off;"]
