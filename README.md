# Growin Indexer Management

Modern React UI for managing ELK indexer processes.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API URL (optional):
Create a `.env` file:
```
VITE_API_URL=http://localhost:8000
```

3. Start development server:
```bash
npm run dev
```

The app will run on http://localhost:3000

## Build

```bash
npm run build
```

## Features

- Login with JWT authentication
- View and filter indexer processes
- Start new indexer processes with configurable parameters
- Monitor running processes with real-time logs
- Stop running processes
- Manage key-value parameters

