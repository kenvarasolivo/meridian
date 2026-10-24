import assert from "node:assert/strict";
import { test } from "node:test";
import {
  components,
  componentById,
  project,
  rootComponents,
} from "../src/data/application";
import { buildAtlasModel, getAtlasFocus, getModuleId } from "../src/lib/atlas";
import { explorerReducer } from "../src/hooks/use-explorer";

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
