"use client";

import { useReducer } from "react";
import { componentById, relationships } from "@/data/application";
import { workflowById } from "@/data/workflows";
import { getComponentScope } from "@/lib/layout";
import type {
  ExplanationLevel,
  NavigationItem,
  SearchResult,
  ViewMode,
} from "@/lib/types";

interface ExplorerState {
  scope: string[];
  mode: ViewMode;
  navigation: NavigationItem;
  selectedId: string | null;
  level: ExplanationLevel;
  workflowId: string | null;
  step: number;
  focusedIds: string[];
  focusLabel: string | null;
  resetKey: number;
}
type Action =
  | { type: "select"; id: string | null }
  | { type: "explore"; id: string }
  | { type: "breadcrumb"; depth: number }
  | { type: "mode"; mode: ViewMode }
  | { type: "navigate"; navigation: NavigationItem }
  | { type: "workflow"; id: string }
  | { type: "step"; step: number }
  | { type: "end-workflow" }
  | { type: "level"; level: ExplanationLevel }
  | { type: "search"; result: SearchResult }
  | { type: "reset" };

const initialState: ExplorerState = {
  scope: [],
  mode: "atlas",
  navigation: "Overview",
  selectedId: null,
  level: "beginner",
  workflowId: null,
  step: 0,
  focusedIds: [],
  focusLabel: null,
  resetKey: 0,
};

export function explorerReducer(
  state: ExplorerState,
  action: Action,
): ExplorerState {
  switch (action.type) {
    case "select":
      return { ...state, selectedId: action.id };
    case "level":
      return { ...state, level: action.level };
    case "reset":
      return {
        ...initialState,
        level: state.level,
        resetKey: state.resetKey + 1,
      };
    case "explore": {
      if (!componentById[action.id]?.children?.length) return state;
      return {
        ...state,
        scope: [...getComponentScope(action.id), action.id],
        selectedId: null,
        navigation: "Explore",
        workflowId: null,
        focusedIds: [],
        focusLabel: null,
        mode: "map",
      };
    }
    case "breadcrumb":
      return {
        ...state,
        scope: state.scope.slice(0, action.depth),
        selectedId: null,
        focusedIds: [],
        workflowId: null,
        focusLabel: null,
      };
    case "mode":
      return {
        ...state,
        mode: action.mode,
        navigation:
          action.mode === "map" || action.mode === "atlas"
            ? "Explore"
            : "Diagrams",
        scope: [],
        selectedId: null,
        workflowId: null,
        focusedIds: [],
        focusLabel: null,
      };
    case "navigate": {
      if (action.navigation === "Overview")
        return {
          ...initialState,
          level: state.level,
          resetKey: state.resetKey + 1,
        };
      if (action.navigation === "Diagrams")
        return {
          ...state,
          navigation: "Diagrams",
          mode: "domain",
          selectedId: null,
          scope: [],
          workflowId: null,
          focusedIds: [],
          focusLabel: null,
        };
      return {
        ...state,
        navigation: action.navigation,
        mode: "map",
        workflowId: null,
        focusedIds: [],
        focusLabel: null,
        selectedId: state.mode === "map" ? state.selectedId : null,
        ...(action.navigation === "Workflows"
          ? {
              scope: [],
              selectedId: null,
              workflowId: null,
              focusedIds: [],
              focusLabel: null,
            }
          : {}),
      };
    }
    case "workflow": {
      const workflow = workflowById[action.id];
      return {
        ...state,
        navigation: "Workflows",
        mode: "map",
        scope: [],
        workflowId: action.id,
        step: 0,
        selectedId: workflow.steps[0].componentId,
        focusedIds: [...new Set(workflow.steps.map((s) => s.componentId))],
        focusLabel: null,
      };
    }
    case "step": {
      if (!state.workflowId) return state;
      const workflow = workflowById[state.workflowId];
      const step = Math.max(
        0,
        Math.min(action.step, workflow.steps.length - 1),
      );
      return { ...state, step, selectedId: workflow.steps[step].componentId };
    }
    case "end-workflow":
      return {
        ...state,
        workflowId: null,
        focusedIds: [],
        selectedId: null,
        navigation: "Explore",
      };
    case "search": {
      if (action.result.type === "workflow")
        return explorerReducer(state, {
          type: "workflow",
          id: action.result.id,
        });
      const id = action.result.id;
      const focusedIds =
        action.result.type === "connections"
          ? [
              ...new Set([
                id,
                ...relationships
                  .filter((r) => r.source === id || r.target === id)
                  .flatMap((r) => [r.source, r.target]),
              ]),
            ]
          : [
              id,
              ...relationships
                .filter((r) => r.source === id || r.target === id)
                .flatMap((r) => [r.source, r.target]),
            ];
      return {
        ...state,
        scope: state.mode === "atlas" ? [] : getComponentScope(id),
        mode: state.mode === "atlas" ? "atlas" : "map",
        navigation: "Explore",
        workflowId: null,
        selectedId: id,
        focusedIds,
        focusLabel:
          action.result.type === "connections"
            ? "Database connections"
            : `Focused on ${componentById[id].name}`,
      };
    }
  }
}

export function useExplorer() {
  const [state, dispatch] = useReducer(explorerReducer, initialState);
  return { state, dispatch };
}
