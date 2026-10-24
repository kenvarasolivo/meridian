import assert from "node:assert/strict";
import { test } from "node:test";
import {
  components,
  componentById,
  project,
  rootComponents,
} from "../src/data/application";
import { atlasGroupColors, buildAtlasModel, getAtlasFocus, getModuleId } from "../src/lib/atlas";
import { explorerReducer } from "../src/hooks/use-explorer";
import { globeArc } from "../src/lib/globe";
import { initialNetworkCamera, interpolateNetworkCamera, layoutAtlas, projectNetworkPoint, rotateNetwork, zoomNetwork } from "../src/lib/atlas-layout";
import { getAtlasOverviewLinks, getAtlasNeighborhood, searchAtlasNodes } from "../src/lib/atlas-discovery";

test("camera flights move continuously over the shortest orbit and clamp their endpoints", () => {
  const from = { yaw: Math.PI - 0.1, pitch: -0.4, zoom: 1 };
  const to = { yaw: -Math.PI + 0.1, pitch: 0.5, zoom: 1.8 };
  assert.deepEqual(interpolateNetworkCamera(from, to, -1), from);
  const middle = interpolateNetworkCamera(from, to, 0.5);
  assert.ok(Math.abs(middle.yaw - Math.PI) < 1e-10, "Cross the seam instead of spinning almost a full turn");
  assert.ok(Math.abs(middle.pitch - 0.05) < 1e-10);
  assert.equal(middle.zoom, 1.4);
  let previous = from;
  for (let step = 1; step <= 100; step++) {
    const next = interpolateNetworkCamera(from, to, step / 100);
    assert.ok(next.yaw >= previous.yaw && next.yaw - previous.yaw < 0.01);
    assert.ok(next.pitch >= previous.pitch && next.zoom >= previous.zoom);
    previous = next;
  }
  const end = interpolateNetworkCamera(from, to, 2);
  assert.ok(Math.abs(end.yaw - (Math.PI + 0.1)) < 1e-10);
  assert.equal(end.pitch, to.pitch);
  assert.equal(end.zoom, to.zoom);
});

test("the hollow globe preserves every real node in stable three-dimensional clusters", () => {
  const model = buildAtlasModel();
  const original = structuredClone(model);
  const layout = layoutAtlas(model);
  assert.deepEqual(model, original, "Layout must not mutate shared source data");
  assert.deepEqual(layoutAtlas(model), layout, "Positions must remain stable between views");
  assert.equal(layout.length, model.nodes.length);
  for (const node of layout) {
    assert.ok(Math.hypot(node.x, node.y, node.z) >= 205 - 1e-8);
    assert.ok(Math.hypot(node.x, node.y, node.z) <= 220 + 1e-8);
  }
  assert.ok(layout.some((node) => node.z < -100), "The network must extend around the rear hemisphere");
  assert.ok(layout.some((node) => node.z > 100));
});

test("the clean overview gives every smaller node exactly one real parent or reference", () => {
  const model = buildAtlasModel();
  const links = getAtlasOverviewLinks(model);
  const children = model.nodes.filter((node) => node.kind !== "module");
  assert.equal(links.length, children.length);
  assert.ok(links.every((link) => model.links.some((real) => real.id === link.id)));
  for (const node of children) assert.equal(links.filter((link) => link.target === node.id).length, 1);
  assert.ok(links.length < model.links.length / 2);
});

test("every satellite stays close to its own module and shares its distinct group color", () => {
  const nodes = layoutAtlas(buildAtlasModel());
  const hubs = nodes.filter((node) => node.kind === "module");
  assert.equal(new Set(hubs.map((node) => node.color)).size, hubs.length);
  for (const node of nodes) {
    const hub = hubs.find((candidate) => candidate.id === node.moduleId)!;
    assert.equal(node.color, atlasGroupColors[hub.id]);
    const ownDistance = Math.hypot(node.x - hub.x, node.y - hub.y, node.z - hub.z);
    assert.ok(ownDistance < 70, `${node.id} drifted too far from ${hub.id}`);
    for (const other of hubs) {
      if (other.id === hub.id) continue;
      const otherDistance = Math.hypot(node.x - other.x, node.y - other.y, node.z - other.z);
      assert.ok(ownDistance < otherDistance, `${node.id} sits closer to ${other.id} than its own hub`);
    }
  }
});

test("focus reveals direct neighbours without introducing unrelated modules", () => {
  const model = buildAtlasModel();
  const focus = getAtlasNeighborhood(model, "file:lib/auth.ts");
  assert.ok(focus.ids.has("file:middleware.ts"));
  assert.ok(!focus.ids.has("payments"));
  assert.ok(!focus.ids.has("frontend"), "Indirect dependents belong in Impact");
  for (const id of focus.links) {
    const link = model.links.find((edge) => edge.id === id)!;
    assert.ok(link.source === "file:lib/auth.ts" || link.target === "file:lib/auth.ts");
  }
  assert.equal(getAtlasNeighborhood(model, null).ids.size, 0);
});

test("node search finds exact files, purpose, and every node category", () => {
  const model = buildAtlasModel();
  assert.equal(searchAtlasNodes(model, "lib/auth.ts")[0].id, "file:lib/auth.ts");
  assert.ok(searchAtlasNodes(model, "sign-in").some((node) => node.id === "auth"));
  assert.equal(searchAtlasNodes(model, "cart quantities")[0].id, "file:lib/validation.ts");
  assert.ok(searchAtlasNodes(model, "", "file").every((node) => node.kind === "file"));
  assert.equal(searchAtlasNodes(model, "nonexistent-xyz").length, 0);
  assert.ok(searchAtlasNodes(model, "").every((node) => node.kind === "module"));
});

test("globe rotation follows the pointer in both axes without flipping the controls", () => {
  const camera = { ...initialNetworkCamera };
  const front: [number, number, number] = [0, 0, 210];
  const origin = projectNetworkPoint(front, camera);
  const right = projectNetworkPoint(front, rotateNetwork(camera, 20, 0, 600));
  const down = projectNetworkPoint(front, rotateNetwork(camera, 0, 20, 600));
  assert.ok(right.x > origin.x, "Dragging right moves the front nodes right");
  assert.ok(down.y > origin.y, "Dragging down moves the front nodes down");
  assert.equal(rotateNetwork(camera, 0, 10000, 600).pitch, 1.35);
  assert.equal(rotateNetwork(camera, 0, -10000, 600).pitch, -1.35);
  const back = projectNetworkPoint([0, 0, -210], camera);
  assert.ok(origin.perspective > back.perspective, "Real perspective preserves near/far depth");
});

test("globe zoom keeps navigation within usable bounds", () => {
  const camera = { ...initialNetworkCamera };
  const next = zoomNetwork(camera, 1.2);
  assert.equal(next.zoom, 1.2);
  assert.equal(zoomNetwork(camera, 100).zoom, 2.6);
  assert.equal(zoomNetwork(camera, 0.001).zoom, 0.6);
});

test("globe layout stays anchored while camera orbit is independent of the data", () => {
  for (const node of buildAtlasModel().nodes) {
    assert.deepEqual([node.fx, node.fy, node.fz], [node.x, node.y, node.z]);
    const radius = Math.hypot(node.x, node.y, node.z);
    if (node.kind === "module") assert.ok(Math.abs(radius - 192) < 1e-9);
    else assert.ok(radius >= 196 && radius <= 213);
  }
});

test("globe routes preserve endpoints and stay outside the sphere, including opposite points", () => {
  for (const end of [
    [0, 192, 0],
    [-192, 0, 0],
    [-192 * Math.cos(0.01), 0, 192 * Math.sin(0.01)],
  ] as [number, number, number][]) {
    const start: [number, number, number] = [192, 0, 0];
    const route = globeArc(start, end);
    for (let axis = 0; axis < 3; axis++) {
      assert.ok(Math.abs(route[0][axis] - start[axis]) < 1e-8);
      assert.ok(Math.abs(route.at(-1)![axis] - end[axis]) < 1e-8);
    }
    assert.ok(route.every((point) => Math.hypot(...point) >= 192 - 1e-8));
    assert.ok(Math.hypot(...route[Math.floor(route.length / 2)]) > 210);
  }
});

test("the atlas contains only real example components and unique source files", () => {
  const model = buildAtlasModel();
  assert.equal(model.nodes.length, components.length + project.files.length);
  assert.ok(model.nodes.length < 100);
  assert.equal(
    model.nodes.filter((n) => n.kind === "module").length,
    rootComponents.length,
  );
  assert.equal(new Set(model.nodes.map((n) => n.id)).size, model.nodes.length);
  const ids = new Set(model.nodes.map((n) => n.id));
  for (const node of model.nodes) {
    assert.ok(rootComponents.some((c) => c.id === node.moduleId));
    assert.ok(
      Number.isFinite(node.x) &&
        Number.isFinite(node.y) &&
        Number.isFinite(node.z),
    );
    assert.ok(node.connections > 0);
    if (node.componentId) assert.ok(componentById[node.componentId]);
    if (node.file)
      assert.ok(project.files.some((file) => file.path === node.file!.path));
  }
  for (const edge of model.links) {
    assert.ok(ids.has(edge.source));
    assert.ok(ids.has(edge.target));
  }
  assert.equal(new Set(model.links.map((e) => e.id)).size, model.links.length);
  assert.ok(
    model.links.some(
      (edge) =>
        edge.kind === "import" &&
        edge.source === "file:app/api/checkout/route.ts" &&
        edge.target === "file:lib/auth.ts",
    ),
  );
  assert.deepEqual(buildAtlasModel(), model);
});

test("a module focus includes its components and files, and no unrelated cluster", () => {
  const model = buildAtlasModel();
  const focus = getAtlasFocus(model, "api");
  assert.ok(focus.has("api"));
  assert.ok(focus.has("services"));
  assert.ok(focus.has("checkout-service"));
  assert.ok(focus.has("file:app/api/checkout/route.ts"));
  assert.ok(
    focus.has("file:services/checkout.ts"),
    "Files referenced across module boundaries stay highlighted",
  );
  assert.ok(
    !focus.has("payments"),
    "Highlighting a shared file does not highlight its entire owning module",
  );
  assert.ok(!focus.has("frontend"));
  assert.equal(getModuleId("checkout-service"), "api");
  assert.equal(getAtlasFocus(model, null).size, 0);
});

test("atlas search stays in 3D; deeper exploration and workflows open the focused map", () => {
  const initial = {
    scope: [],
    mode: "map" as const,
    navigation: "Overview" as const,
    selectedId: null,
    level: "beginner" as const,
    workflowId: null,
    step: 0,
    focusedIds: [],
    focusLabel: null,
    resetKey: 0,
  };
  const atlas = explorerReducer(initial, { type: "mode", mode: "atlas" });
  const found = explorerReducer(atlas, {
    type: "search",
    result: {
      type: "component",
      id: "auth",
      title: "Authentication",
      description: "",
    },
  });
  assert.equal(found.mode, "atlas");
  assert.equal(found.selectedId, "auth");
  const deeper = explorerReducer(found, { type: "explore", id: "auth" });
  assert.equal(deeper.mode, "map");
  assert.deepEqual(deeper.scope, ["auth"]);
  assert.equal(
    explorerReducer(atlas, { type: "workflow", id: "checkout" }).mode,
    "map",
  );
  const cleared = explorerReducer(found, { type: "mode", mode: "atlas" });
  assert.equal(cleared.selectedId, null);
  assert.equal(cleared.focusedIds.length, 0);
});
