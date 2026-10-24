"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  GitBranch,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import {
  components,
  kindMeta,
  project,
  rootComponents,
} from "@/data/application";
import { componentIcons, MeridianMark, navigationIcons } from "./icons";
import type { NavigationItem } from "@/lib/types";

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  navigation: NavigationItem;
  selectedId: string | null;
  onToggle: () => void;
  onCloseMobile: () => void;
  onNavigate: (item: NavigationItem) => void;
  onSelect: (id: string) => void;
  onHelp: () => void;
}

export function Sidebar(props: Props) {
  const [filter, setFilter] = useState("");
  const [projectOpen, setProjectOpen] = useState(false);
  const list = filter
    ? components
        .filter((c) =>
          `${c.name} ${c.description}`
            .toLowerCase()
            .includes(filter.toLowerCase()),
        )
        .slice(0, 10)
    : rootComponents;
  return (
    <>
      {props.mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={props.onCloseMobile}
        />
      )}
      <aside
        className={`sidebar ${props.collapsed ? "is-collapsed" : ""} ${props.mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="brand-row">
          <a className="brand" href="/" aria-label="Meridian home">
            <MeridianMark />
            <span>
              meridian<span className="brand-period">.</span>
            </span>
          </a>
          <button
            className="icon-button mobile-close"
            onClick={props.onCloseMobile}
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        </div>
        <div className="project-switcher-wrap">
          <button
            className="project-switcher"
            onClick={() => setProjectOpen(!projectOpen)}
            aria-expanded={projectOpen}
            title={project.name}
          >
            <span className="project-avatar">
              <ShoppingMark />
            </span>
            <span className="project-switcher-text">
              <strong>{project.name}</strong>
              <span>
                <i className="status-dot" />
                Demo
              </span>
            </span>
            <ChevronDown size={14} className="project-chevron" />
          </button>
          {projectOpen && (
            <div className="project-popover">
              <div className="popover-label">Your workspace</div>
              <button onClick={() => setProjectOpen(false)}>
                <span className="project-avatar">
                  <ShoppingMark />
                </span>
                <span>
                  {project.name}
                  <small>Interactive example</small>
                </span>
                <Check size={15} />
              </button>
            </div>
          )}
        </div>
        <nav className="primary-nav" aria-label="Main navigation">
          {(Object.keys(navigationIcons) as NavigationItem[]).map((item) => {
            const Icon = navigationIcons[item];
            return (
              <button
                title={props.collapsed ? item : undefined}
                className={`nav-item ${props.navigation === item ? "active" : ""}`}
                key={item}
                onClick={() => {
                  props.onNavigate(item);
                  props.onCloseMobile();
                }}
              >
                <Icon size={18} strokeWidth={1.7} />
                <span>{item}</span>
                {item === "Explore" && <kbd>G</kbd>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-components">
          <div className="sidebar-section-title">
            <span>Components</span>
            <span>{rootComponents.length}</span>
          </div>
          <label className="component-filter">
            <Search size={14} />
            <input
              aria-label="Filter components"
              placeholder="Filter components"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </label>
          <div className="component-list">
            {list.map((c) => {
              const Icon = componentIcons[c.kind];
              return (
                <button
                  className={`component-list-item ${props.selectedId === c.id ? "selected" : ""}`}
                  key={c.id}
                  onClick={() => {
                    props.onSelect(c.id);
                    props.onCloseMobile();
                  }}
                  title={c.description}
                >
                  <Icon size={15} style={{ color: kindMeta[c.kind].color }} />
                  <span>{c.name}</span>
                  <ChevronRight size={12} />
                </button>
              );
            })}
            {list.length === 0 && (
              <p className="no-components">No components found.</p>
            )}
          </div>
        </div>
        <div className="sidebar-bottom">
          <button className="help-link" onClick={props.onHelp}>
            <CircleHelp size={16} />
            <span>Help</span>
            <ArrowUpRight size={13} />
          </button>
          <div className="sidebar-footer">
            <span>
              <GitBranch size={13} />
              {project.branch}
            </span>
            <button
              className="icon-button"
              onClick={props.onToggle}
              aria-label={
                props.collapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              title={props.collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {props.collapsed ? (
                <PanelLeftOpen size={17} />
              ) : (
                <PanelLeftClose size={17} />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function ShoppingMark() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m4 15 5.8-11L16 15M6 11.5h7.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.6 5.2h3M15.1 3.7v3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
