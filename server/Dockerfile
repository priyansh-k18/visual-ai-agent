FROM node:20-alpine

# Tesseract dependencies for alpine
RUN apk add --no-cache tesseract-ocr 

WORKDIR /app

# Copy root and workspace package files
COPY package.json ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Install dependencies (will install for all workspaces)
RUN npm install

# Copy all source files
COPY . .

# Build shared first
WORKDIR /app/shared
RUN npm run build || true # Just in case shared has a build step

# Setup server
WORKDIR /app/server
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
