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

- On the landing page, drag the hollow node globe to rotate it. Horizontal touch dragging works alongside normal page scrolling; keyboard arrows and visible rotate/zoom/fit buttons provide alternatives. Use **Find a node** to search names, file paths, or descriptions such as “cart quantities”, then select a result to face it and see its direct connections. Filter by modules, components, or files. The landing page and Atlas share one lightweight perspective-projected 3D renderer.
- Under **Meet your codebase**, select a module to inspect its purpose and source, or choose **Checkout workflow** and use the arrows to follow all seven steps. **Explore the demo** opens the full workspace.
- Select **API**, then **Explore deeper**. Select **Services** and explore again. The breadcrumbs and Back controls take you to any previous layer.
- Choose **Place an order** below the map. Use Previous, Next, the progress markers, or journey steps to follow checkout. Open each source file and change between Beginner and Developer explanations.
- Press **Ctrl/⌘ K** or **/**. Try “Where is authentication handled?”, “How does checkout work?”, or “What connects to the database?”. Search uses deterministic local matching and reports unsupported queries honestly.
- Switch to **Architecture diagram** or **Domain diagram**. The domain model includes OrderItem to accurately represent products inside orders.
- Drag nodes, pan the canvas, zoom with the controls or the wheel, fit the graph, or reset its layout. On a phone, an accessible component list replaces the graph and opens the same inspector.
- Details appear when you select a component. Implementation snippets and the complete workflow step list expand on demand.
- Open **Atlas** for a hollow 3D network of seven modules, their components, and source files. Drag to rotate, scroll to zoom, or use the arrow/zoom/reset controls. All relationship lines start visible on the landing page and in Atlas. Disable **All relationships** for a quieter overview with one primary link per smaller node; hover or select a node to highlight its direct relationships. Reset restores all relationships. Search faces the chosen node toward you. The **Files** toggle reduces detail while retaining focused files. Selecting a file explains its purpose and dependency direction, with explicit **Open source** and **Show impact** actions. Phones use a compact module selector. **Explore deeper** opens the focused map. [Open Atlas](http://localhost:3000/explore#atlas).
- Switch Atlas to **Impact**, then select a module or file to trace its direct and indirect dependents. Expand a dependent to see the path and why it may be affected. You can also choose **Show impact** from component details or an open source file. [Try `lib/auth.ts`](http://localhost:3000/#atlas?mode=impact&file=lib/auth.ts).

## Structure

- `src/data/application.ts` — typed components, containment, dependencies, domain entities, project metadata.
- `src/data/sources.ts` — simplified fictional source files.
- `src/data/workflows.ts` — source-linked walkthroughs in two explanation levels.
- `src/lib/types.ts` — analyzer-independent component, relationship, file, workflow, and entity contracts.
- `src/lib/layout.ts` — focused graph models and deterministic layouts.
- `src/lib/search.ts` — keyword intents and component/file matching.
- `src/lib/atlas.ts` — shared file references, module ownership, and example import links. Every model point maps to an existing component or source file.
- `src/lib/atlas-layout.ts` — compact 3D satellite clusters around each module hub, perspective projection, direct rotation, and bounded zoom.
- `src/lib/atlas-discovery.ts` — primary overview links, direct neighbourhoods, node descriptions, and ranked name/path/purpose search.
- `src/lib/globe.ts` — spherical coordinate and curved-route utilities.
- `src/components/atlas-network.tsx` — the shared landing/Atlas renderer, node picking, touch and keyboard controls, visibility handling, and accessible node browser.
- `src/lib/impact.ts` — reverse dependency traversal, cycle handling, shortest explanation paths, and direct/indirect classification. It follows import, source-reference, and declared dependency edges; containment links never propagate impact.
- `src/hooks/use-explorer.ts` — navigation, drill-down, selection, workflow, focus, and reset state.
- `src/components/` — graph, custom nodes and routing, inspector, search, source viewer, dialogs, and application shell.
- `tests/model.test.ts` — integrity checks and exploration/search/workflow state scenarios.
- `tests/ui.test.tsx` — inspector, search, source viewer, keyboard focus, and checkout walkthrough interaction tests.
- `tests/atlas.test.ts` — atlas integrity, cluster and connected-file focus, and the transition from 3D overview to the focused map.
- `tests/impact.test.ts` — dependency direction, file importers, containment exclusion, cycles, diamond dependencies, and honest empty states.

Atlas uses a lazily loaded Canvas renderer to perspective-project real 3D positions. It needs no WebGL context or running physics simulation. There are no decorative points or background mesh: all 53 visible nodes belong to the example model. The default view draws all 105 real relationships plus 53 visual center spokes. Disabling **All relationships** reduces the model links to 46 parent/reference links, one per smaller node; selection and hover highlight direct relationships while unrelated nodes recede. Impact retains its complete dependency traversal. Both globes stay still until interaction and pause rendering offscreen or in hidden tabs. Search supports keyboard selection, type filters, empty results, and small screens. If Canvas is unavailable, the app provides an accessible module picker and a link back to the map.

Impact is a simulation over the example dependency model. It identifies potential dependents, not confirmed runtime breakage, test failures, or behavior changes. Each dependent has a concrete path through the modeled edges; no AI inference or risk score is used.

## Example data and limits

Acme Commerce is a fictional Next.js storefront using Auth.js, Prisma/PostgreSQL, Stripe, Inngest, and Resend. All source files are illustrative strings, never executed. The example has seven top-level components and five domain entities. Every drill-down displays at most four components. No analysis of the local workspace occurs.

There is no repository upload, GitHub integration, authentication, AI call, checkout integration, or persistent database. This prototype is a model for exploration; replacing the example analyzer should preserve the typed data contracts while supplying real graph, file, and workflow data.

## Visual design

The landing page retains ink and blue, oversized Public Sans typography, and pale blue editorial sections. Its hero shows a manually rotatable hollow globe made from codebase nodes and their primary connections, with a subtle radial spoke from every visible node to the globe's true 3D center. These visual guides are separate from dependency data. Each module has a distinct color shared by its hub, nearby components and files, local links, search markers, and module controls. Satellite positions stay close to their own hub, and label placement avoids other nodes. The interactive product preview uses the same component, workflow, and source data as the full app. All visuals are code-native; no stock assets or external font requests are needed.

The workspace shares the navy surfaces, blue selection cues, locally bundled fonts, and original meridian mark. Component colors retain their semantic meanings. Atlas uses a clean node globe, focused direct connections, an inline finder, and a persistent module dock. Small files have forgiving pointer targets and keyboard-accessible alternatives; generic file names such as route.ts include their parent folder. Reduced-motion preferences disable landing-page transitions and path animation. The landing page includes keyboard-operable preview tabs, native FAQ disclosures, and a mobile menu; small screens show a module picker instead of the architecture preview graph. Legacy root `#atlas` links redirect to `/explore` while preserving module and impact parameters.

Workspace cards and buttons use borderless surfaces: solid navy fills and soft elevation distinguish graph nodes, controls, and dialogs, with brighter blue surfaces for selection. Keyboard focus keeps a visible outline. Dialog portals carry the workspace theme so search, workflows, and source inspection share the same treatment.
