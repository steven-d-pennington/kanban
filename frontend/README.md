# Agent Kanban - Frontend

The web-based user interface for the Agent Kanban system, built with React, TypeScript, and Vite.

## Features

- **Interactive Kanban Board**: Drag-and-drop interface for managing work items.
- **Real-time Updates**: Live synchronization across clients using Supabase Realtime.
- **Agent Monitoring**: dedicated views to track AI agent activities and logs.
- **Responsive Design**: Modern UI with Tailwind CSS.

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the frontend directory (`frontend/.env`):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Note**: The frontend uses the **Anonymous Key** (public). Do not use the Service Role key here.

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Building for Production

Build the application for deployment:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

- `src/components`: React components
- `src/store`: Zustand state management stores
- `src/types`: TypeScript definitions
- `src/lib`: Utility functions and Supabase client
