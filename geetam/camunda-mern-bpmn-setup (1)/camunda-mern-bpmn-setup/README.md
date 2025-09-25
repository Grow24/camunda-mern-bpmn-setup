# MERN + bpmn.io + Camunda 7 Starter

This repo contains:
- `docker-compose.yml` to run **Camunda 7** (port 8080) and **MongoDB** (port 27017)
- `backend/` (Express + Mongo) to store/validate/deploy BPMN
- `workers/` (Node external-task workers) to execute safe tasks
- `frontend-template/` (React + bpmn.io editor) - copy into a CRA app

## Prerequisites
- Docker & Docker Compose
- Node.js 18+ and npm
- (Optional) MongoDB local OR use the docker Mongo

## 1) Start Camunda 7 + MongoDB
```bash
docker compose up -d
# Camunda Web Apps: http://localhost:8080/camunda  (user: demo/demo if present)
# Camunda REST:     http://localhost:8080/engine-rest
# MongoDB:          mongodb://127.0.0.1:27017
```

## 2) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run start
# Backend on http://localhost:4000
```

## 3) Workers (External Task Worker)
```bash
cd workers
cp .env.example .env
npm install
npm start
```

## 4) Frontend (React + bpmn.io)
Create a React app and copy the template:
```bash
npx create-react-app frontend
cd frontend
npm i bpmn-js camunda-bpmn-moddle
# in another terminal:
cp -r ../frontend-template/src/* ./src/
npm start
```

## 5) Use It
1. Open the frontend (http://localhost:3000).
2. Select the **Service Task** → choose topic (e.g., `checkInventory`).
3. Click **Save Draft** (key = `order_flow`, name any).
4. Click **Publish Latest Draft** (deploys to Camunda).
5. Start an instance:
   ```bash
   curl -X POST http://localhost:4000/api/workflows/order_flow/start      -H "Content-Type: application/json"      -d '{"variables":{"sku":{"value":"ABC-123","type":"String"}}}'
   ```
6. Watch the worker terminal (`checkInventory` completes).

## Safety Notes
- Backend validates BPMN: only allows **external** service tasks with whitelisted topics.
- Blocks `scriptTask` and `callActivity` by default.
- Extend whitelist in `backend/.env` `ALLOWED_TOPICS=...` and implement workers accordingly.

## Customization
- Add RBAC/JWT to `requireAdmin` in backend.
- Implement real logic in workers (email, DB, HTTP) and restrict domains.
- Add bpmn-js properties panel for advanced editing.

Enjoy!
