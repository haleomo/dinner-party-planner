# Dinner Party Planner

Dinner Party Planner is a two-part app:

- A React client that collects the dinner theme, guest count, and ingredient avoidances.
- An Express server that calls Anthropic to generate a full menu and recipe plan.

## Requirements

- Node.js 18 or newer
- npm
- An Anthropic API key

## Setup

Install dependencies for both parts of the application.

```bash
cd client
npm install

cd ../server
npm install
```

If npm fails with a cache-permissions error on this machine, install with a project-local cache instead:

```bash
cd client
npm install --cache .npm-cache

cd ../server
npm install --cache .npm-cache
```

## Environment Variables

Create or update `server/.env` with your Anthropic API key:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

Optional:

```env
PORT=3001
```

If `PORT` is omitted, the server runs on `3001` by default.

## Start The Application

Run the server and client in separate terminals.

### 1. Start the API server

```bash
cd server
npm run dev
```

The API server listens on:

```text
http://localhost:3001
```

### 2. Start the client

```bash
cd client
npm run dev
```

The Vite development app is available at:

```text
http://localhost:5173
```

The client proxies `/api` requests to `http://localhost:3001`.

## How To Access The App

After both processes are running:

1. Open `http://localhost:5173` in your browser.
2. Enter the number of guests.
3. Enter a dinner-party theme.
4. Optionally add ingredient avoidances.
5. Submit the form to generate a full menu.

## Build The Client

To create a production build of the frontend:

```bash
cd client
npm run build
```

## Troubleshooting

- If the client cannot fetch recipes, confirm the server is running on `http://localhost:3001`.
- If recipe generation fails, confirm `server/.env` contains a valid `ANTHROPIC_API_KEY`.
- If `npm run dev` fails from the project root, run it inside `client` or `server`; there is no root `package.json` script.