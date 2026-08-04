FROM node:20-alpine AS build

WORKDIR /app

# Copy root and workspace package files
COPY package.json ./
COPY dashboard/package.json ./dashboard/
COPY shared/package.json ./shared/

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build dashboard
WORKDIR /app/dashboard
RUN npm run build

# Serve with NGINX
FROM nginx:alpine
COPY --from=build /app/dashboard/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
