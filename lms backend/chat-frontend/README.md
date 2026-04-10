# LMS Chat Frontend (React)

A React + Vite chat client for your existing LMS backend chat APIs and Socket.IO events.

## Features

- JWT login using `/api/v1/user/login`
- Conversation list with unread counts and online status
- Start conversation by recipient user ID
- Realtime messaging via Socket.IO (`message:new`)
- Typing indicator (`typing:start`, `typing:stop`, `typing:update`)
- Read-receipt emit (`message:read`)
- Runtime event logs for quick debugging

## Project Structure

- `src/hooks/useChatClient.js`: chat state and realtime logic
- `src/services/chatApi.js`: API request layer
- `src/services/chatSocket.js`: Socket.IO client setup
- `src/App.jsx`: UI composition

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Ensure backend CORS allows your frontend origin.

If you run this app with Vite default port (`5173`), set in backend `.env`:

```env
FRONTEND_URL=http://localhost:5173
```

4. Run development server:

```bash
npm run dev
```

5. Open the app URL from Vite output (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Expected Backend Endpoints

- `POST /api/v1/user/login`
- `GET /api/v1/chat/conversations`
- `GET /api/v1/chat/conversations/user/:recipientId`
- `GET /api/v1/chat/conversations/:conversationId/messages`
- `POST /api/v1/chat/conversations/:conversationId/messages`

## Socket Events

- Client emits: `conversation:join`, `conversation:leave`, `typing:start`, `typing:stop`, `message:read`
- Client listens: `connect`, `disconnect`, `connect_error`, `message:new`, `typing:update`, `user:online`, `user:offline`
