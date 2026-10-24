# Meridian

**Complex code. Made clear.**

A local, frontend-only codebase explorer built with Next.js App Router, TypeScript, Tailwind CSS, React Flow, Lucide, and Framer Motion. No accounts, credentials, external APIs, or backend setup are required. Fonts are bundled locally.

## Run

Requires Node.js 20.9+.

```sh
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

```sh
npm run typecheck
npm test
npm run build
```

## Try it

- Select **API**, then **Explore deeper**. Select **Services** and explore again. The breadcrumbs and Back controls take you to any previous layer.
- Choose **Place an order** below the map. Use Previous, Next, the progress markers, or journey steps to follow checkout. Open each source file and change between Beginner and Developer explanations.
- Press **Ctrl/⌘ K** or **/**. Try “Where is authentication handled?”, “How does checkout work?”, or “What connects to the database?”. Search uses deterministic local matching and reports unsupported queries honestly.
- Switch to **Architecture diagram** or **Domain diagram**. The domain model includes OrderItem to accurately represent products inside orders.
- Drag nodes, pan the canvas, zoom with the controls or the wheel, fit the graph, or reset its layout. On a phone, an accessible component list replaces the graph and opens the same inspector.
- Details appear when you select a component. Implementation snippets and the complete workflow step list expand on demand.

## Structure

- `src/data/application.ts` — typed components, containment, dependencies, domain entities, project metadata.
- `src/data/sources.ts` — simplified fictional source files.
- `src/data/workflows.ts` — source-linked walkthroughs in two explanation levels.
- `src/lib/types.ts` — analyzer-independent component, relationship, file, workflow, and entity contracts.
- `src/lib/layout.ts` — focused graph models and deterministic layouts.
- `src/lib/search.ts` — keyword intents and component/file matching.
- `src/hooks/use-explorer.ts` — navigation, drill-down, selection, workflow, focus, and reset state.
- `src/components/` — graph, custom nodes and routing, inspector, search, source viewer, dialogs, and application shell.
- `tests/model.test.ts` — integrity checks and exploration/search/workflow state scenarios.
- `tests/ui.test.tsx` — inspector, search, source viewer, keyboard focus, and checkout walkthrough interaction tests.

## Example data and limits

Acme Commerce is a fictional Next.js storefront using Auth.js, Prisma/PostgreSQL, Stripe, Inngest, and Resend. All source files are illustrative strings, never executed. The example has seven top-level components and five domain entities. Every drill-down displays at most four components. No analysis of the local workspace occurs.

There is no repository upload, GitHub integration, authentication, AI call, checkout integration, or persistent database. This prototype is a model for exploration; replacing the example analyzer should preserve the typed data contracts while supplying real graph, file, and workflow data.

## Visual design

Warm graphite surfaces, locally bundled Public Sans and JetBrains Mono, an original meridian mark, emerald paths and selection cues, and semantic component colors. The interface direction uses the data-terminal study (seed 478803062), adapted to the requested labeled sidebar and graph nodes. Node colors identify architecture types. Acme Commerce is retained as explicitly requested example data. Reduced-motion preferences disable path animation and viewport transitions.
