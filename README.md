# Visual AI Agent

Visual AI Agent is a full-stack application containing a Manifest V3 Chrome Extension, a Node.js/Express backend, a PostgreSQL database, and a React Dashboard. It tracks browser activity and periodically captures screenshots, processing them via Tesseract OCR and OpenAI Vision API.

## Architecture

1. **Chrome Extension (`/extension`)**: Manifest V3 extension built with React, Vite, and CRXJS. Captures background events (clicks, scrolls, typing speed, navigation) and screenshots.
2. **Backend Server (`/server`)**: Node.js/Express server using Prisma ORM to interact with PostgreSQL. Validates data with Zod and processes images with AI.
3. **Dashboard (`/dashboard`)**: React dashboard styled with modern glassmorphism UI to display activities and AI analyses.
4. **Shared Types (`/shared`)**: Shared Zod schemas and TypeScript interfaces for full-stack type safety.

## Tech Stack

- **Frontend**: React, Vite, Manifest V3
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **Security**: JWT Authentication, Helmet, CORS, express-rate-limit
- **AI Processing**: Tesseract.js (OCR), OpenAI GPT-4o Vision API

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- Docker & Docker Compose
- OpenAI API Key

### 2. Environment Variables
Create a `.env` file inside `server/.env` based on this sample:
```env
DATABASE_URL="postgresql://visual_user:visual_password@localhost:5432/visual_db?schema=public"
JWT_SECRET="your-super-secret-jwt-token"
OPENAI_API_KEY="your-openai-api-key"
PORT=3000
```

### 3. Installation & Running Locally (Docker)

To run the entire stack with Docker:
```bash
docker compose up -d
```
This will start:
- PostgreSQL Database (Port 5432)
- Backend Server (Port 3000)
- Dashboard (Port 80 via NGINX)

If you prefer running it locally without the app containers (only DB):
```bash
npm install
docker compose up db -d
cd server && npx prisma migrate dev && npm run dev
cd dashboard && npm run dev
```

### 4. Chrome Extension Setup
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right.
3. Run `npm run build` inside the `/extension` folder.
4. Click "Load unpacked" and select the `extension/dist` folder.
5. Click on the extension popup and input your JWT token to connect to the backend.

## API Documentation

- `POST /activity` - Accepts an array of activity objects (clicks, scrolls, etc.)
- `POST /screenshot` - Accepts base64 images and processes them via Vision AI and OCR.
- `GET /dashboard` - Retrieves recent activities and screenshot analyses.
- `GET /health` - Database connection status check.

## Future Improvements
- **Screenshot Deduplication**: Hash images on the client to avoid sending identical screenshots.
- **Background Sync**: Enhance the offline retry queue using Service Workers Background Sync API.
- **Dark Mode Toggle**: Dashboard currently has a default dark glassmorphism theme, adding a toggle for light mode.
- **WebSocket Streaming**: Push real-time activity events to the dashboard.
