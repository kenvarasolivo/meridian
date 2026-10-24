# Meridian

**Complex code. Made clear.**

A local, frontend-only codebase explorer built with Next.js App Router, TypeScript, Tailwind CSS, React Flow, Lucide, and Framer Motion. No accounts, credentials, external APIs, or backend setup are required. Fonts are bundled locally.

## Run

Requires Node.js 20.9+.

```sh
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000) for the landing page, or [localhost:3000/explore](http://localhost:3000/explore) for the interactive workspace.

```sh
npm run typecheck
npm test
npm run build
```

## Try it

- On the landing page, drag the globe horizontally or vertically to rotate it. Touch dragging works on phones, and keyboard arrows and visible rotate/reset buttons provide alternatives. Select Frontend, API, or Database to bring the module forward and highlight its connections. The globe shares module coordinates with Atlas while using a lightweight canvas renderer.
- Under **Meet your codebase**, select a module to inspect its purpose and source, or choose **Checkout workflow** and use the arrows to follow all seven steps. **Explore the demo** opens the full workspace.
- Select **API**, then **Explore deeper**. Select **Services** and explore again. The breadcrumbs and Back controls take you to any previous layer.
- Choose **Place an order** below the map. Use Previous, Next, the progress markers, or journey steps to follow checkout. Open each source file and change between Beginner and Developer explanations.
- Press **Ctrl/⌘ K** or **/**. Try “Where is authentication handled?”, “How does checkout work?”, or “What connects to the database?”. Search uses deterministic local matching and reports unsupported queries honestly.
- Switch to **Architecture diagram** or **Domain diagram**. The domain model includes OrderItem to accurately represent products inside orders.
- Drag nodes, pan the canvas, zoom with the controls or the wheel, fit the graph, or reset its layout. On a phone, an accessible component list replaces the graph and opens the same inspector.
- Details appear when you select a component. Implementation snippets and the complete workflow step list expand on demand.
- Open **Atlas** for a globe overview of the seven modules. Drag to orbit, scroll to zoom, or use the arrow/zoom/reset controls. Choose a module on the globe or in the persistent module dock to face it and reveal its components and connected files. **Show all files** reveals the whole model; select a file point to read its source. **Explore deeper** opens the focused map. [Open Atlas](http://localhost:3000/explore#atlas).
- Switch Atlas to **Impact**, then select a module or file to trace its direct and indirect dependents. Expand a dependent to see the path and why it may be affected. You can also choose **Show impact** from component details or an open source file. [Try `lib/auth.ts`](http://localhost:3000/#atlas?mode=impact&file=lib/auth.ts).

## Structure

- `src/data/application.ts` — typed components, containment, dependencies, domain entities, project metadata.
- `src/data/sources.ts` — simplified fictional source files.
- `src/data/workflows.ts` — source-linked walkthroughs in two explanation levels.
- `src/lib/types.ts` — analyzer-independent component, relationship, file, workflow, and entity contracts.
- `src/lib/layout.ts` — focused graph models and deterministic layouts.
- `src/lib/search.ts` — keyword intents and component/file matching.
- `src/lib/atlas.ts` — deterministic spherical module regions, shared file references, and example import links. Every model point maps to an existing component or source file.
- `src/lib/globe.ts` — shared module coordinates, sphere projection, and dependency routes that arc outside the globe.
- `src/lib/impact.ts` — reverse dependency traversal, cycle handling, shortest explanation paths, and direct/indirect classification. It follows import, source-reference, and declared dependency edges; containment links never propagate impact.
- `src/hooks/use-explorer.ts` — navigation, drill-down, selection, workflow, focus, and reset state.
- `src/components/` — graph, custom nodes and routing, inspector, search, source viewer, dialogs, and application shell.
- `tests/model.test.ts` — integrity checks and exploration/search/workflow state scenarios.
- `tests/ui.test.tsx` — inspector, search, source viewer, keyboard focus, and checkout walkthrough interaction tests.
- `tests/atlas.test.ts` — atlas integrity, cluster and connected-file focus, and the transition from 3D overview to the focused map.
- `tests/impact.test.ts` — dependency direction, file importers, containment exclusion, cycles, diamond dependencies, and honest empty states.

The optional Atlas uses a lazily loaded Three.js/WebGL renderer through React Force Graph. Browsers without WebGL get an accessible module picker and a link back to the map. All data locations remain fixed on spherical module regions: the camera orbits without force-layout drift. The coordinate grid and surface dots are decorative scene geometry, separate from the real model points. The initial view reveals modules only; selection reveals relevant details and **Show all files** reveals the complete model. Automatic rotation is disabled in the app, and reduced-motion preferences disable camera transitions. Both globes remain manually rotatable in reduced motion.

Impact is a simulation over the example dependency model. It identifies potential dependents, not confirmed runtime breakage, test failures, or behavior changes. Each dependent has a concrete path through the modeled edges; no AI inference or risk score is used.

## Example data and limits

Acme Commerce is a fictional Next.js storefront using Auth.js, Prisma/PostgreSQL, Stripe, Inngest, and Resend. All source files are illustrative strings, never executed. The example has seven top-level components and five domain entities. Every drill-down displays at most four components. No analysis of the local workspace occurs.

There is no repository upload, GitHub integration, authentication, AI call, checkout integration, or persistent database. This prototype is a model for exploration; replacing the example analyzer should preserve the typed data contracts while supplying real graph, file, and workflow data.

## Visual design

The landing page uses ink and blue, oversized Public Sans typography, fine grid rules, pale blue editorial sections, and an animated canvas globe drawn from the example workspace's modules and relationships. Its interactive product preview uses the same component, workflow, and source data as the full app. The design follows the supplied globe and technical editorial references, with the product-performs direction (seed 1394760372) used for the working preview. All visuals are code-native; no stock assets or external font requests are needed.

The workspace shares the navy surfaces, blue selection cues, locally bundled fonts, and original meridian mark. Component colors retain their semantic meanings. Atlas uses a shaded globe, curved dependency routes, a persistent module dock, and progressive disclosure of file details. Reduced-motion preferences disable automatic landing-globe rotation, landing-page transitions, path animation, and camera transitions. Landing-globe automatic rotation stops after the first interaction. The landing page includes keyboard-operable preview tabs, native FAQ disclosures, and a mobile menu; small screens show a module picker instead of the preview graph. Legacy root `#atlas` links redirect to `/explore` while preserving module and impact parameters.

Workspace cards and buttons use borderless surfaces: solid navy fills and soft elevation distinguish graph nodes, controls, and dialogs, with brighter blue surfaces for selection. Keyboard focus keeps a visible outline. Dialog portals carry the workspace theme so search, workflows, and source inspection share the same treatment.
