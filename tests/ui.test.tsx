import { JSDOM } from "jsdom";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000",
  pretendToBeVisual: true,
});
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  Element: { value: dom.window.Element, configurable: true },
  getComputedStyle: { value: dom.window.getComputedStyle, configurable: true },
  requestAnimationFrame: {
    value: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
    configurable: true,
  },
  cancelAnimationFrame: { value: clearTimeout, configurable: true },
  React: { value: React, configurable: true },
  ResizeObserver: {
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    configurable: true,
  },
});
// Layout is checked separately in the real-browser visual inspection.
Object.defineProperty(dom.window.HTMLElement.prototype, "offsetParent", {
  get() {
    return this.parentElement;
  },
});
Object.defineProperty(dom.window, "matchMedia", {
  value: () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }),
});

const { render, fireEvent, cleanup, within } = await import(
  "@testing-library/react"
);
const { SearchDialog } = await import("../src/components/search-dialog");
const { Inspector } = await import("../src/components/inspector");
const { WorkflowPanel } = await import("../src/components/workflows");
const { SourceDialog } = await import("../src/components/source-dialog");
const { HelpDialog } = await import("../src/components/help-dialog");
const { workflows } = await import("../src/data/workflows");
const { sources } = await import("../src/data/sources");
const { Explorer } = await import("../src/components/explorer");

afterEach(() => {
  cleanup();
});

test("the workspace reveals details on selection and hides them when exploring deeper", () => {
  render(<Explorer />);
  const body = within(document.body);
  assert.equal(
    body.queryByRole("complementary", { name: "Component inspector" }),
    null,
  );
  fireEvent.click(body.getByRole("button", { name: "API" }));
  const inspector = body.getByRole("complementary", {
    name: "Component inspector",
  });
  assert.ok(within(inspector).getByRole("heading", { name: "API" }));
  const implementation = within(inspector)
    .getByText("Implementation")
    .closest("details")!;
  assert.equal(implementation.open, false);
  fireEvent.click(
    within(inspector).getByRole("button", { name: /Explore deeper/ }),
  );
  assert.equal(
    body.queryByRole("complementary", { name: "Component inspector" }),
    null,
  );
  assert.ok(body.getByRole("button", { name: "Back one level" }));
  fireEvent.click(body.getByRole("button", { name: "Back one level" }));
  assert.ok(body.getByRole("heading", { name: "Overview" }));
});

test("search suggestions, matching, keyboard opening, unsupported queries, and Escape work", () => {
  let resultId = "";
  let closed = false;
  render(
    <SearchDialog
      onClose={() => {
        closed = true;
      }}
      onResult={(result) => {
        resultId = result.id;
      }}
    />,
  );
  const dialog = within(document.body).getByRole("dialog");
  const input = within(dialog).getByRole("textbox");
  assert.ok(
    document.activeElement === input,
    "Search receives keyboard focus on open",
  );
  fireEvent.click(
    within(dialog).getByRole("button", {
      name: /Where is authentication handled/,
    }),
  );
  assert.equal(
    (input as HTMLInputElement).value,
    "Where is authentication handled?",
  );
  assert.ok(within(dialog).getByRole("option", { name: /Authentication/ }));
  fireEvent.keyDown(input, { key: "Enter" });
  assert.equal(resultId, "auth");
  fireEvent.change(input, {
    target: { value: "a quantum spaghetti question" },
  });
  assert.ok(within(dialog).getByText("No match"));
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(closed, true);
});

test("the API inspector exposes source, relationships, explanation level, and deeper exploration", () => {
  let explored = "";
  let selected = "";
  let file = "";
  let level = "";
  render(
    <Inspector
      selectedId="api"
      scope={[]}
      mode="map"
      level="beginner"
      workflow={null}
      step={0}
      mobileOpen={false}
      onLevel={(l) => {
        level = l;
      }}
      onSelect={(id) => {
        selected = id ?? "";
      }}
      onExplore={(id) => {
        explored = id;
      }}
      onSource={(source) => {
        file = source.path;
      }}
      onStep={() => {}}
      onEndWorkflow={() => {}}
      onCloseMobile={() => {}}
    />,
  );
  const panel = within(document.body).getByRole("complementary");
  assert.ok(within(panel).getByRole("heading", { name: "API" }));
  fireEvent.click(within(panel).getByRole("button", { name: /Developer/ }));
  assert.equal(level, "developer");
  fireEvent.click(
    within(panel).getByRole("button", { name: /Explore deeper/ }),
  );
  assert.equal(explored, "api");
  fireEvent.click(
    within(panel).getByRole("button", { name: /app\/api\/checkout\/route.ts/ }),
  );
  assert.equal(file, "app/api/checkout/route.ts");
  fireEvent.click(
    within(panel).getByRole("button", { name: /Authentication.*Outgoing/ }),
  );
  assert.equal(selected, "auth");
});

test("checkout renders all steps, opens each source, and supports previous, next, and finish", () => {
  const workflow = workflows.find((w) => w.id === "checkout")!;
  let changed = -1;
  let opened = "";
  let finished = false;
  const props = {
    workflow,
    level: "beginner" as const,
    onStep: (step: number) => {
      changed = step;
    },
    onEnd: () => {
      finished = true;
    },
    onSource: (file: { path: string }) => {
      opened = file.path;
    },
  };
  const view = render(<WorkflowPanel {...props} step={0} />);
  const body = within(document.body);
  assert.equal(
    (body.getByRole("button", { name: /Previous/ }) as HTMLButtonElement)
      .disabled,
    true,
  );
  for (let index = 0; index < workflow.steps.length; index++) {
    view.rerender(<WorkflowPanel {...props} step={index} />);
    assert.ok(body.getByText(`Step ${index + 1} of ${workflow.steps.length}`));
    assert.ok(body.getByRole("heading", { name: workflow.steps[index].title }));
    fireEvent.click(
      body.getByRole("button", { name: workflow.steps[index].file.path }),
    );
    assert.equal(opened, workflow.steps[index].file.path);
    if (index < workflow.steps.length - 1) {
      fireEvent.click(body.getByRole("button", { name: /Next step/ }));
      assert.equal(changed, index + 1);
    }
  }
  fireEvent.click(body.getByRole("button", { name: /Previous/ }));
  assert.equal(changed, workflow.steps.length - 2);
  fireEvent.click(body.getByRole("button", { name: /Finish tour/ }));
  assert.equal(finished, true);
});

test("the source viewer displays the requested file and the guide can be dismissed", () => {
  const view = render(<SourceDialog file={sources.api} onClose={() => {}} />);
  assert.ok(
    within(document.body).getByRole("heading", { name: sources.api.path }),
  );
  assert.ok(
    within(document.body).getByText("Simplified example · for exploration"),
  );
  view.unmount();
  let closed = false;
  render(
    <HelpDialog
      onClose={() => {
        closed = true;
      }}
    />,
  );
  fireEvent.click(
    within(document.body).getByRole("button", { name: /Find my bearings/ }),
  );
  assert.equal(closed, true);
});
