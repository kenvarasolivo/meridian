import assert from "node:assert/strict";
import { test } from "node:test";
import {
  componentById,
  components,
  domainEntities,
  domainRelationships,
  project,
  relationships,
  rootComponents,
} from "../src/data/application";
import { workflows } from "../src/data/workflows";
import { getComponentScope, getGraphModel } from "../src/lib/layout";
import { searchCodebase, suggestedQuestions } from "../src/lib/search";
import { explorerReducer } from "../src/hooks/use-explorer";

const state = {
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

test("all graph references, parent scopes, and source counts are consistent", () => {
  assert.equal(new Set(components.map((c) => c.id)).size, components.length);
  assert.equal(rootComponents.length, 7);
  assert.equal(
    project.files.length,
    new Set(components.flatMap((c) => c.files).map((f) => f.path)).size,
  );
  for (const component of components) {
    for (const child of component.children ?? []) {
      assert.ok(componentById[child], `Missing child ${child}`);
      assert.equal(componentById[child].parentId, component.id);
    }
    if (component.children?.length) {
      const graph = getGraphModel("map", [
        ...getComponentScope(component.id),
        component.id,
      ]);
      const ids = new Set(graph.components.map((c) => c.id));
      assert.ok(graph.components.length <= 7);
      for (const edge of graph.relationships) {
        assert.ok(ids.has(edge.source));
        assert.ok(ids.has(edge.target));
      }
    }
  }
  for (const edge of relationships) {
    assert.ok(componentById[edge.source]);
    assert.ok(componentById[edge.target]);
  }
  for (const edge of domainRelationships) {
    assert.ok(domainEntities.some((e) => e.id === edge.source));
    assert.ok(domainEntities.some((e) => e.id === edge.target));
  }
});

test("API → Services exploration and breadcrumbs return to the correct layer", () => {
  const api = explorerReducer(state, { type: "explore", id: "api" });
  assert.deepEqual(api.scope, ["api"]);
  assert.deepEqual(
    getGraphModel("map", api.scope).components.map((c) => c.name),
    ["Routes", "Services", "Validation", "Middleware"],
  );
  const services = explorerReducer(api, { type: "explore", id: "services" });
  assert.deepEqual(services.scope, ["api", "services"]);
  assert.equal(getGraphModel("map", services.scope).components.length, 3);
  assert.deepEqual(
    explorerReducer(services, { type: "breadcrumb", depth: 1 }).scope,
    ["api"],
  );
  assert.deepEqual(
    explorerReducer(services, { type: "breadcrumb", depth: 0 }).scope,
    [],
  );
  assert.equal(
    explorerReducer(services, { type: "explore", id: "checkout-service" }),
    services,
  );
});

test("all suggested searches return an honest, actionable result", () => {
  for (const question of suggestedQuestions)
    assert.ok(searchCodebase(question).length > 0);
  assert.equal(
    searchCodebase("Where is authentication handled?")[0].id,
    "auth",
  );
  assert.equal(searchCodebase("How does checkout work?")[0].type, "workflow");
  assert.equal(
    searchCodebase("What connects to the database?")[0].type,
    "connections",
  );
  assert.deepEqual(searchCodebase("Explain quantum spaghetti"), []);
  assert.deepEqual(searchCodebase("   "), []);
  const focused = explorerReducer(state, {
    type: "search",
    result: searchCodebase(suggestedQuestions[2])[0],
  });
  assert.deepEqual(
    new Set(focused.focusedIds),
    new Set(["database", "auth", "api", "jobs"]),
  );
  assert.equal(focused.selectedId, "database");
});

test("search can locate a nested component and set its correct breadcrumb scope", () => {
  const result = searchCodebase("Order Service").find(
    (r) => r.id === "order-service",
  )!;
  assert.ok(result);
  const located = explorerReducer(state, { type: "search", result });
  assert.deepEqual(located.scope, ["api", "services"]);
  assert.equal(located.selectedId, "order-service");
});

test("each walkthrough follows existing components, relationships, source files, and bounded steps", () => {
  for (const workflow of workflows) {
    let touring = explorerReducer(state, { type: "workflow", id: workflow.id });
    for (const id of workflow.relationshipIds)
      assert.ok(relationships.some((r) => r.id === id));
    for (const [index, step] of workflow.steps.entries()) {
      assert.ok(componentById[step.componentId]);
      assert.ok(step.file.code.length > 0);
      assert.ok(step.explanation.beginner && step.explanation.developer);
      touring = explorerReducer(touring, { type: "step", step: index });
      assert.equal(touring.selectedId, step.componentId);
      assert.equal(touring.step, index);
      assert.ok(touring.focusedIds.includes(step.componentId));
    }
    assert.equal(
      explorerReducer(touring, { type: "step", step: 999 }).step,
      workflow.steps.length - 1,
    );
    assert.equal(explorerReducer(touring, { type: "step", step: -1 }).step, 0);
    const ended = explorerReducer(touring, { type: "end-workflow" });
    assert.equal(ended.workflowId, null);
    assert.equal(ended.focusedIds.length, 0);
  }
});

test("switching diagram modes clears tour state, and reset preserves explanation preference", () => {
  const touring = explorerReducer(state, { type: "workflow", id: "checkout" });
  const exploring = explorerReducer(touring, {
    type: "navigate",
    navigation: "Explore",
  });
  assert.equal(exploring.workflowId, null);
  assert.equal(exploring.focusedIds.length, 0);
  const developer = explorerReducer(touring, {
    type: "level",
    level: "developer",
  });
  const domain = explorerReducer(developer, { type: "mode", mode: "domain" });
  assert.equal(domain.workflowId, null);
  assert.equal(getGraphModel("domain", []).components.length, 5);
  assert.equal(domain.navigation, "Diagrams");
  const reset = explorerReducer(domain, { type: "reset" });
  assert.equal(reset.level, "developer");
  assert.equal(reset.mode, "atlas");
  assert.equal(reset.resetKey, 1);
});
