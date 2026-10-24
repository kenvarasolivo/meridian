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
- Open **Atlas** for a 3D overview. Drag to orbit, scroll to zoom, and select a module to highlight its components and connected files. Select a file point to read its source; **Explore deeper** opens the focused map. [Open Atlas](http://localhost:3000/#atlas).
- Switch Atlas to **Impact**, then select a module or file to trace its direct and indirect dependents. Expand a dependent to see the path and why it may be affected. You can also choose **Show impact** from component details or an open source file. [Try `lib/auth.ts`](http://localhost:3000/#atlas?mode=impact&file=lib/auth.ts).

## Structure

- `src/data/application.ts` — typed components, containment, dependencies, domain entities, project metadata.
- `src/data/sources.ts` — simplified fictional source files.
- `src/data/workflows.ts` — source-linked walkthroughs in two explanation levels.
- `src/lib/types.ts` — analyzer-independent component, relationship, file, workflow, and entity contracts.
- `src/lib/layout.ts` — focused graph models and deterministic layouts.
- `src/lib/search.ts` — keyword intents and component/file matching.
- `src/lib/atlas.ts` — deterministic 3D clusters, shared file references, and example import links. Every point maps to an existing component or source file.
- `src/lib/impact.ts` — reverse dependency traversal, cycle handling, shortest explanation paths, and direct/indirect classification. It follows import, source-reference, and declared dependency edges; containment links never propagate impact.
- `src/hooks/use-explorer.ts` — navigation, drill-down, selection, workflow, focus, and reset state.
- `src/components/` — graph, custom nodes and routing, inspector, search, source viewer, dialogs, and application shell.
- `tests/model.test.ts` — integrity checks and exploration/search/workflow state scenarios.
- `tests/ui.test.tsx` — inspector, search, source viewer, keyboard focus, and checkout walkthrough interaction tests.
- `tests/atlas.test.ts` — atlas integrity, cluster and connected-file focus, and the transition from 3D overview to the focused map.
- `tests/impact.test.ts` — dependency direction, file importers, containment exclusion, cycles, diamond dependencies, and honest empty states.

The optional Atlas uses a lazily loaded Three.js/WebGL renderer through React Force Graph. Browsers without WebGL get an accessible module picker and a link back to the map. Physics settles after the initial layout, automatic rotation is disabled, and reduced-motion preferences disable camera transitions.

Impact is a simulation over the example dependency model. It identifies potential dependents, not confirmed runtime breakage, test failures, or behavior changes. Each dependent has a concrete path through the modeled edges; no AI inference or risk score is used.

## Example data and limits

Acme Commerce is a fictional Next.js storefront using Auth.js, Prisma/PostgreSQL, Stripe, Inngest, and Resend. All source files are illustrative strings, never executed. The example has seven top-level components and five domain entities. Every drill-down displays at most four components. No analysis of the local workspace occurs.

There is no repository upload, GitHub integration, authentication, AI call, checkout integration, or persistent database. This prototype is a model for exploration; replacing the example analyzer should preserve the typed data contracts while supplying real graph, file, and workflow data.

## Visual design

Warm graphite surfaces, locally bundled Public Sans and JetBrains Mono, an original meridian mark, emerald paths and selection cues, and semantic component colors. The interface direction uses the data-terminal study (seed 478803062), adapted to the requested labeled sidebar and graph nodes. Node colors identify architecture types. Acme Commerce is retained as explicitly requested example data. Reduced-motion preferences disable path animation and viewport transitions.
