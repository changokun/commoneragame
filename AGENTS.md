# Project Guidelines for Mistral Vibe

## Context
- **Project**: Common Era Game - A text-based strategy game about building historical timelines
- **Stack**: Vite + React 18 + TypeScript + Tailwind CSS v4 + Radix UI + React Router
- **User**: Learning React, experienced backend developer

## Core Rules

### 1. Code Style for Learning
- **HEAVILY COMMENT ALL CODE** - Explain React patterns, hooks, and logic decisions
- Comment WHY, not just WHAT - explain the React concept being demonstrated
- Use JSDoc for functions and complex components
- Add inline comments for non-obvious logic

### 2. Before Any Action
- **ALWAYS read all changed files first** - `git status --short` then read each modified file
- Never edit a file you haven't read in the current session

### 3. React-Specific Guidelines
- Prefer functional components with hooks
- Use TypeScript interfaces for all props
- Comment hook usage: `// useEffect: fetch data on mount and when X changes`
- Explain state management decisions
- Comment API integration patterns

### 4. File Organization
- Components in `src/app/components/`
- Pages in `src/app/pages/`
- UI primitives in `src/app/components/ui/`
- Keep file sizes manageable

