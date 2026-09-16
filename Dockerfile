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

# Clean up default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html/app

# Copy nginx configuration: listens on port 3000, redirects / to /app/, and
# sets the CSP and other security headers (see nginx-security-headers.conf).
COPY nginx-security-headers.conf /etc/nginx/security-headers.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fail the build rather than the deploy if the config is malformed.
RUN nginx -t

# Expose port 3000
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

