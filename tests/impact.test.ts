import assert from "node:assert/strict";
import { test } from "node:test";
import { buildAtlasModel, type AtlasModel } from "../src/lib/atlas";
import { getChangeImpact } from "../src/lib/impact";

test("module changes affect callers, not the services they call", () => {
  const impact = getChangeImpact(buildAtlasModel(), "auth");
  assert.deepEqual(
    impact.direct.map((node) => node.id),
    ["api"],
  );
  assert.deepEqual(
    impact.indirect.map((node) => node.id),
    ["frontend"],
  );
  assert.ok(!impact.affectedIds.has("database"));
  assert.ok(
    !impact.affectedIds.has("credentials"),
    "Containment does not imply a dependency",
  );
  assert.deepEqual(
    impact.indirect[0].path.map((hop) => [hop.from, hop.to]),
    [
      ["auth", "api"],
      ["api", "frontend"],
    ],
  );
});

test("an auth source change reaches its importers and their dependent modules", () => {
  const model = buildAtlasModel();
  const impact = getChangeImpact(model, "file:lib/auth.ts");
  const direct = new Set(impact.direct.map((node) => node.id));
  assert.ok(direct.has("file:middleware.ts"));
  assert.ok(direct.has("file:app/api/auth/[...nextauth]/route.ts"));
  assert.ok(direct.has("file:app/api/checkout/route.ts"));
  assert.ok(impact.affectedIds.has("frontend"));
  assert.ok(
    !impact.affectedIds.has("file:lib/db.ts"),
    "Dependencies of the changed file are not dependents",
  );
  assert.ok(!impact.affectedIds.has("file:lib/auth.ts"));
  for (const dependent of [...impact.direct, ...impact.indirect]) {
    assert.equal(dependent.path.length, dependent.depth);
    assert.equal(dependent.path[0].from, impact.targetId);
    assert.equal(dependent.path.at(-1)!.to, dependent.id);
    for (const hop of dependent.path) {
      const edge = model.links.find((edge) => edge.id === hop.linkId)!;
      assert.equal(edge.source, hop.to);
      assert.equal(edge.target, hop.from);
      assert.notEqual(edge.kind, "contains");
    }
  }
});

test("cycles and diamond dependencies produce one shortest path per dependent", () => {
  const base = buildAtlasModel().nodes[0];
  const model: AtlasModel = {
    nodes: ["a", "b", "c", "d"].map((id) => ({ ...base, id, name: id })),
    links: [
      {
        id: "ba",
        source: "b",
        target: "a",
        kind: "dependency",
        label: "calls",
      },
      {
        id: "ca",
        source: "c",
        target: "a",
        kind: "dependency",
        label: "calls",
      },
      {
        id: "db",
        source: "d",
        target: "b",
        kind: "dependency",
        label: "calls",
      },
      {
        id: "dc",
        source: "d",
        target: "c",
        kind: "dependency",
        label: "calls",
      },
      {
        id: "ad",
        source: "a",
        target: "d",
        kind: "dependency",
        label: "calls",
      },
    ],
  };
  const result = getChangeImpact(model, "a");
  assert.equal(result.direct.length, 2);
  assert.equal(result.indirect.length, 1);
  assert.equal(result.indirect[0].id, "d");
  assert.equal(result.indirect[0].depth, 2);
  assert.equal(result.affectedIds.size, 3);
});

test("leaf and unknown selections return an honest empty result", () => {
  const model = buildAtlasModel();
  assert.equal(getChangeImpact(model, "frontend").affectedIds.size, 0);
  assert.equal(getChangeImpact(model, "missing").affectedIds.size, 0);
});
