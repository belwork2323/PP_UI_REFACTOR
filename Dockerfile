# ============================
# Stage 1: Build React app
# ============================
FROM node:24-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install exact locked dependencies
RUN npm ci

# Copy application source
COPY . .

# Build production React application
RUN npm run build


# ============================
# Stage 2: NGINX
# ============================
FROM nginx:alpine

# Remove default NGINX configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy React NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
