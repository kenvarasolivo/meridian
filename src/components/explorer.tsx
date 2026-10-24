"use client";

import { useCallback, useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  ArrowLeft,
  Box,
  ChevronRight,
  Menu,
  Network,
  PanelRightOpen,
  Search,
  Workflow,
  X,
} from "lucide-react";
import { componentById, project } from "@/data/application";
import { workflowById } from "@/data/workflows";
import { useExplorer } from "@/hooks/use-explorer";
import type {
  NavigationItem,
  SearchResult,
  SourceFile,
  ViewMode,
} from "@/lib/types";
import { Sidebar } from "./sidebar";
import { GraphCanvas } from "./graph-canvas";
import { Inspector } from "./inspector";
import { SearchDialog } from "./search-dialog";
import { SourceDialog } from "./source-dialog";
import { HelpDialog } from "./help-dialog";
import { WorkflowPicker, WorkflowShelf } from "./workflows";

const modes: {
  id: ViewMode;
  label: string;
  short: string;
  icon: typeof Network;
}[] = [
  { id: "map", label: "Interactive map", short: "Map", icon: Network },
  {
    id: "architecture",
    label: "Architecture diagram",
    short: "Architecture",
    icon: Workflow,
  },
  { id: "domain", label: "Domain diagram", short: "Domain", icon: Box },
];

export function Explorer() {
  const { state, dispatch } = useExplorer();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [mobileInspector, setMobileInspector] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [workflowPicker, setWorkflowPicker] = useState(false);
  const [source, setSource] = useState<SourceFile | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourFinished, setTourFinished] = useState(false);
  const workflow = state.workflowId ? workflowById[state.workflowId] : null;
  const currentScope = state.scope.length
    ? componentById[state.scope.at(-1)!]
    : null;
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeSource = useCallback(() => setSource(null), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const closePicker = useCallback(() => setWorkflowPicker(false), []);
  const explore = useCallback(
    (id: string) => {
      dispatch({ type: "explore", id });
      setMobileInspector(false);
    },
    [dispatch],
  );
  const reset = useCallback(() => {
    dispatch({ type: "reset" });
    setMobileInspector(false);
    setTourFinished(false);
  }, [dispatch]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const input =
        event.target instanceof HTMLElement &&
        (event.target.matches("input, textarea, select") ||
          event.target.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      } else if (
        !input &&
        !searchOpen &&
        !source &&
        !helpOpen &&
        !workflowPicker
      ) {
        if (event.key === "/") {
          event.preventDefault();
          setSearchOpen(true);
        }
        if (event.key.toLowerCase() === "g") {
          dispatch({ type: "navigate", navigation: "Explore" });
        }
        if (event.key === "Escape") {
          setMobileInspector(false);
          setMobileNav(false);
          dispatch({ type: "select", id: null });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, helpOpen, searchOpen, source, workflowPicker]);

  useEffect(() => {
    if (!tourFinished) return;
    const timer = window.setTimeout(() => setTourFinished(false), 5000);
    return () => window.clearTimeout(timer);
  }, [tourFinished]);

  function select(id: string | null) {
    if (workflow && id) {
      const index = workflow.steps.findIndex((s) => s.componentId === id);
      if (index >= 0) {
        dispatch({
          type: "step",
          step:
            workflow.steps[state.step].componentId === id ? state.step : index,
        });
        setMobileInspector(true);
      }
      return;
    }
    dispatch({ type: "select", id });
    if (id) setMobileInspector(true);
  }
  function sidebarSelect(id: string) {
    const component = componentById[id];
    dispatch({
      type: "search",
      result: {
        type: "component",
        id,
        title: component.name,
        description: component.description,
      },
    });
    setMobileInspector(true);
  }
  function navigate(navigation: NavigationItem) {
    dispatch({ type: "navigate", navigation });
    if (navigation === "Workflows") setWorkflowPicker(true);
  }
  function startWorkflow(id: string) {
    dispatch({ type: "workflow", id });
    setWorkflowPicker(false);
    setMobileInspector(true);
    setTourFinished(false);
  }
  function onSearchResult(result: SearchResult) {
    dispatch({ type: "search", result });
    setSearchOpen(false);
    setMobileInspector(true);
  }
  function endWorkflow() {
    if (workflow && state.step === workflow.steps.length - 1)
      setTourFinished(true);
    dispatch({ type: "end-workflow" });
    setMobileInspector(false);
  }

  const title =
    currentScope?.name ??
    (state.mode === "domain"
      ? "Domain"
      : state.mode === "architecture"
        ? "Architecture"
        : (workflow?.name ?? "Overview"));
  const inspectorOpen = Boolean(state.selectedId || workflow);

  return (
    <MotionConfig reducedMotion="user">
      <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileNav}
          navigation={state.navigation}
          selectedId={state.selectedId}
          onToggle={() => setCollapsed(!collapsed)}
          onCloseMobile={() => setMobileNav(false)}
          onNavigate={navigate}
          onSelect={sidebarSelect}
          onHelp={() => setHelpOpen(true)}
        />
        <div className="app-workspace">
          <header className="topbar">
            <div className="topbar-location">
              <button
                className="icon-button mobile-menu"
                aria-label="Open navigation"
                onClick={() => setMobileNav(true)}
              >
                <Menu size={19} />
              </button>
              {state.scope.length > 0 && (
                <button
                  className="icon-button"
                  aria-label="Back one level"
                  title="Back"
                  onClick={() =>
                    dispatch({
                      type: "breadcrumb",
                      depth: state.scope.length - 1,
                    })
                  }
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <nav className="breadcrumbs" aria-label="Graph location">
                <button onClick={reset} title="Return to overview">
                  {project.name}
                </button>
                {state.scope.map((id, index) => (
                  <span key={id}>
                    <ChevronRight size={13} />
                    <button
                      aria-current={
                        index === state.scope.length - 1 ? "page" : undefined
                      }
                      onClick={() =>
                        dispatch({ type: "breadcrumb", depth: index + 1 })
                      }
                    >
                      {index === state.scope.length - 1 ? (
                        <h1>{componentById[id].name}</h1>
                      ) : (
                        componentById[id].name
                      )}
                    </button>
                  </span>
                ))}
                {!state.scope.length && (
                  <span>
                    <ChevronRight size={13} />
                    <h1>{title}</h1>
                  </span>
                )}
              </nav>
            </div>
            <button
              className="search-trigger"
              aria-label="Search codebase (Control or Command K)"
              title="Search codebase"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={16} />
              <span>Search codebase</span>
              <kbd>Ctrl K</kbd>
            </button>
          </header>
          <div
            className={`workspace-body ${inspectorOpen ? "has-inspector" : "map-only"}`}
          >
            <main className="main-content">
              <div className="map-toolbar">
                <div
                  className="view-tabs"
                  role="tablist"
                  aria-label="Graph view"
                >
                  {modes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        role="tab"
                        aria-selected={state.mode === mode.id}
                        className={state.mode === mode.id ? "active" : ""}
                        onClick={() => {
                          dispatch({ type: "mode", mode: mode.id });
                          setMobileInspector(false);
                        }}
                        title={mode.label}
                      >
                        <Icon size={15} />
                        <span>{mode.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <AnimatePresence>
                {state.focusLabel && (
                  <motion.div
                    className="focus-banner"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <span>
                      <Search size={13} />
                      {state.focusLabel}
                    </span>
                    <button onClick={reset}>
                      Clear focus
                      <X size={13} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="graph-region">
                <ReactFlowProvider>
                  <GraphCanvas
                    mode={state.mode}
                    scope={state.scope}
                    selectedId={state.selectedId}
                    focusedIds={state.focusedIds}
                    workflowId={state.workflowId}
                    step={state.step}
                    resetKey={state.resetKey}
                    onSelect={select}
                    onExplore={explore}
                    onReset={reset}
                  />
                </ReactFlowProvider>
              </div>
              <WorkflowShelf onStart={startWorkflow} />
            </main>
            {inspectorOpen && (
              <Inspector
                selectedId={state.selectedId}
                scope={state.scope}
                mode={state.mode}
                level={state.level}
                workflow={workflow}
                step={state.step}
                mobileOpen={mobileInspector}
                onLevel={(level) => dispatch({ type: "level", level })}
                onSelect={select}
                onExplore={explore}
                onSource={setSource}
                onStep={(step) => dispatch({ type: "step", step })}
                onEndWorkflow={endWorkflow}
                onCloseMobile={() => setMobileInspector(false)}
              />
            )}
          </div>
        </div>
        {inspectorOpen && (
          <button
            className="mobile-inspect-button"
            onClick={() => setMobileInspector(!mobileInspector)}
            aria-label="Toggle component inspector"
          >
            <PanelRightOpen size={17} />
            <span>
              {workflow
                ? `Step ${state.step + 1} of ${workflow.steps.length}`
                : state.selectedId
                  ? "Component details"
                  : "Details"}
            </span>
          </button>
        )}
      </div>
      <AnimatePresence>
        {tourFinished && (
          <motion.div
            role="status"
            className="completion-toast"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
          >
            <span className="toast-check">✓</span>
            <span>
              <strong>Walkthrough complete</strong>
            </span>
            <button
              className="icon-button"
              aria-label="Dismiss completion message"
              onClick={() => setTourFinished(false)}
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {searchOpen && (
        <SearchDialog onClose={closeSearch} onResult={onSearchResult} />
      )}
      {source && <SourceDialog file={source} onClose={closeSource} />}
      {helpOpen && <HelpDialog onClose={closeHelp} />}
      {workflowPicker && (
        <WorkflowPicker onClose={closePicker} onStart={startWorkflow} />
      )}
    </MotionConfig>
  );
}
