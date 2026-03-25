# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# This tell Vite to build using the /app/ path
ENV VITE_WEB=true

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html/app

# Copy nginx configuration to listen on port 3000
RUN echo 'server { listen 3000; location / { root /usr/share/nginx/html; try_files $uri $uri/ /app/index.html; } }' > /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
