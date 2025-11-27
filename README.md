# Agent Kanban

A web-based Kanban board designed specifically for hybrid human-agent workflows. Enables humans to define projects, features, and bugs while AI agents autonomously pick up, process, and hand off work items.

## Features

- **Visual Kanban Board**: Drag-and-drop interface with real-time updates
- **Agent Workflow Pipeline**: Automated handoffs between specialized agents
- **Human Oversight**: Full visibility and control for stakeholders
- **Real-time Collaboration**: Live updates across all connected clients

## Agent Types

| Agent | Responsibility |
|-------|---------------|
| **Project Manager Agent** | Analyzes feature specs and generates PRDs |
| **Scrum Master Agent** | Breaks down PRDs into user stories |
| **Developer Agent** | Implements stories and creates PRs |

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
kanban/
├── docs/
│   └── SPEC.md          # Full project specification
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── data/        # Mock data
│   │   ├── store/       # Zustand store
│   │   └── types/       # TypeScript types
│   └── package.json
└── README.md
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Documentation

See [docs/SPEC.md](./docs/SPEC.md) for the complete project specification including:

- System architecture
- Data model
- Agent workflow details
- API endpoints
- Security considerations

## License

MIT
