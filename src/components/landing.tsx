"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  GitBranch,
  Layers3,
  Compass,
  ShieldCheck,
  Menu,
  Network,
  Play,
  Route,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  componentById,
  project,
  relationships,
  rootComponents,
} from "@/data/application";
import { workflows } from "@/data/workflows";
import { MeridianMark, componentIcons } from "./icons";
import { CodeAtlas } from "./code-atlas";

const checkout = workflows.find((w) => w.id === "checkout")!;
const positions: Record<string, [number, number]> = {
  frontend: [42, 165],
  api: [260, 165],
  auth: [478, 57],
  database: [696, 57],
  payments: [478, 273],
  jobs: [696, 273],
  notifications: [914, 273],
};
const faqs = [
  {
    question: "What can I explore in the demo?",
    answer:
      "Acme Commerce is a fictional Next.js storefront with seven top-level modules. Explore its architecture, inspect illustrative source files, follow login and checkout, or trace what relies on each module in the Dependencies view.",
  },
  {
    question: "Can I connect my own repository?",
    answer:
      "This version is a local, frontend-only prototype using an example codebase. Repository import and automated analysis are not available yet. You can explore every demo view without an account or API key.",
  },
  {
    question: "Does the Dependencies view predict what will break?",
    answer:
      "It shows potential dependents using the example model’s imports, source references, and declared dependencies. Every result has a traceable path. It does not predict runtime failures or replace tests.",
  },
  {
    question: "Do I need to be a developer?",
    answer:
      "No. Switch between Beginner and Developer explanations in the demo. Beginner mode explains each component and workflow in plain language; Developer mode adds implementation details and source references.",
  },
];

function ProductPreview() {
  const [tab, setTab] = useState<"map" | "workflow">("map");
  const [selected, setSelected] = useState("api");
  const [step, setStep] = useState(0);
  const current =
    componentById[
      tab === "workflow" ? checkout.steps[step].componentId : selected
    ];
  const file =
    tab === "workflow" ? checkout.steps[step].file : current.files[0];
  const rootEdges = relationships.filter(
    (r) => positions[r.source] && positions[r.target],
  );
  return (
    <div className="product-preview" data-ui>
      <div className="preview-bar">
        <span className="preview-project">
          <span className="project-monogram">a</span> {project.name}
          <span className="preview-demo">Example project</span>
        </span>
        <span className="preview-branch">
          <GitBranch size={13} /> {project.branch}
        </span>
      </div>
      <div className="preview-toolbar">
        <div
          className="preview-tabs"
          role="tablist"
          aria-label="Product preview"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const next =
              event.key === "Home"
                ? "map"
                : event.key === "End"
                  ? "workflow"
                  : tab === "map"
                    ? "workflow"
                    : "map";
            setTab(next);
            document
              .getElementById(
                next === "map" ? "preview-map-tab" : "preview-workflow-tab",
              )
              ?.focus();
          }}
        >
          <button
            role="tab"
            id="preview-map-tab"
            aria-controls="preview-content"
            tabIndex={tab === "map" ? 0 : -1}
            aria-selected={tab === "map"}
            onClick={() => setTab("map")}
          >
            <Network size={15} /> Architecture
          </button>
          <button
            role="tab"
            id="preview-workflow-tab"
            aria-controls="preview-content"
            tabIndex={tab === "workflow" ? 0 : -1}
            aria-selected={tab === "workflow"}
            onClick={() => setTab("workflow")}
          >
            <Route size={15} /> Checkout workflow
          </button>
        </div>
        <span className="preview-live">
          <i /> Interactive preview
        </span>
      </div>
      <div
        className="preview-body"
        id="preview-content"
        role="tabpanel"
        aria-labelledby={
          tab === "map" ? "preview-map-tab" : "preview-workflow-tab"
        }
      >
        <div className="preview-map">
          <div className="preview-map-title">
            <span>
              {tab === "map"
                ? "The whole system, connected."
                : checkout.steps[step].title}
            </span>
            <span>
              {tab === "map"
                ? `${rootComponents.length} modules`
                : `${step + 1} / ${checkout.steps.length}`}
            </span>
          </div>
          <div
            className="preview-graph"
            aria-label="Select a module to read its purpose and source file"
          >
            <svg
              viewBox="0 0 1110 400"
              className="preview-edges"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="preview-arrow"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0 0 6 3 0 6" fill="none" stroke="currentColor" />
                </marker>
              </defs>
              {rootEdges.map((edge) => {
                const from = positions[edge.source],
                  to = positions[edge.target];
                const active =
                  tab === "workflow"
                    ? checkout.relationshipIds.includes(edge.id)
                    : edge.source === selected || edge.target === selected;
                return (
                  <path
                    key={edge.id}
                    className={active ? "edge-active" : ""}
                    d={`M${from[0] + 152} ${from[1] + 33} C${from[0] + 188} ${from[1] + 33},${to[0] - 35} ${to[1] + 33},${to[0]} ${to[1] + 33}`}
                    markerEnd="url(#preview-arrow)"
                  />
                );
              })}
            </svg>
            {rootComponents.map((c) => {
              const Icon = componentIcons[c.kind];
              return (
                <button
                  key={c.id}
                  className={`preview-node ${current.id === c.id ? "is-selected" : ""}`}
                  style={{
                    left: `${(positions[c.id][0] / 1110) * 100}%`,
                    top: `${(positions[c.id][1] / 400) * 100}%`,
                  }}
                  aria-pressed={current.id === c.id}
                  onClick={() => {
                    if (tab === "workflow") {
                      const index = checkout.steps.findIndex(
                        (s) => s.componentId === c.id,
                      );
                      if (index >= 0) setStep(index);
                      else {
                        setTab("map");
                        setSelected(c.id);
                      }
                    } else setSelected(c.id);
                  }}
                >
                  <Icon size={17} />
                  <span>
                    {c.name}
                    <small>{c.technology}</small>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="preview-mobile-modules" aria-label="Modules">
            {rootComponents.map((c) => (
              <button
                key={c.id}
                aria-pressed={current.id === c.id}
                onClick={() => {
                  setTab("map");
                  setSelected(c.id);
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="preview-map-foot">
            {tab === "workflow" ? (
              <>
                <span>
                  Place an order{" "}
                  <span>
                    · Step {step + 1} of {checkout.steps.length}
                  </span>
                </span>
                <div className="preview-step-controls">
                  <button
                    aria-label="Previous checkout step"
                    disabled={step === 0}
                    onClick={() => setStep((s) => s - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    aria-label="Next checkout step"
                    disabled={step === checkout.steps.length - 1}
                    onClick={() => setStep((s) => s + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>
                  <span className="preview-selection-dot" /> Select a module to
                  look inside
                </span>
                <span>Overview</span>
              </>
            )}
          </div>
        </div>
        <aside className="preview-detail" aria-live="polite">
          <span className="preview-detail-label">
            {tab === "workflow" ? "Follow the request" : "Inside the module"}
          </span>
          <h3>{current.name}</h3>
          <p>
            {tab === "workflow"
              ? checkout.steps[step].explanation.beginner
              : current.purpose.beginner}
          </p>
          <div className="preview-source">
            <span>
              <Code2 size={14} /> {file.path}
            </span>
            <pre>
              <code>{file.code.split("\n").slice(0, 9).join("\n")}</code>
            </pre>
          </div>
          <Link
            className="preview-detail-link"
            href={
              tab === "workflow"
                ? `/explore#workflow?id=checkout&step=${step}`
                : `/explore#atlas?module=${current.id}`
            }
          >
            Explore in the demo <ArrowUpRight size={15} />
          </Link>
        </aside>
      </div>
    </div>
  );
}

export function Landing() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState("all");

  useEffect(() => {
    const preserveLink = () => {
      if (
        /^#(atlas|map|architecture|domain|workflow)(\?|$)/.test(
          window.location.hash,
        )
      )
        router.replace(`/explore${window.location.hash}`);
    };
    preserveLink();
    window.addEventListener("hashchange", preserveLink);
    return () => window.removeEventListener("hashchange", preserveLink);
  }, [router]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  return (
    <main className="landing premium-landing" id="main">
      <a className="landing-skip" href="#hero-title">
        Skip to content
      </a>
      <div className="landing-dark">
        <header className="landing-header">
          <Link className="landing-brand" href="/" aria-label="Meridian home">
            <MeridianMark size={29} />
            <span>
              meridian<span className="wordmark-period">.</span>
            </span>
          </Link>
          <nav
            className={`landing-nav ${menuOpen ? "is-open" : ""}`}
            id="landing-navigation"
            aria-label="Main navigation"
          >
            <a href="#perspective" onClick={() => setMenuOpen(false)}>
              Why Meridian
            </a>
            <a href="#inside" onClick={() => setMenuOpen(false)}>
              The workspace
            </a>
            <a href="#questions" onClick={() => setMenuOpen(false)}>
              FAQs
            </a>
          </nav>
          <Link className="landing-header-cta" href="/explore">
            Open workspace <ArrowUpRight size={15} />
          </Link>
          <button
            className="landing-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="landing-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </header>

        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="hero-intro">
            <div className="hero-copy-stack">
              <div className="hero-announcement">
                <span className="status-orb" /> A new perspective on your
                codebase <ArrowRight size={13} />
              </div>
              <h1 id="hero-title">
                Complex code.
                <br />
                Made clear.
              </h1>
              <p>
                Your codebase has a bigger picture. See the architecture, follow
                the flow,
                <br className="desktop-break" /> and understand how it all fits
                together.
              </p>
              <div className="hero-actions">
                <Link className="landing-button button-primary" href="/explore">
                  Explore the demo <ArrowRight size={17} />
                </Link>
                <a className="landing-button button-glass" href="#inside">
                  <Play size={13} /> See how it works
                </a>
              </div>
              <div className="hero-reassurance">
                <span>
                  <Check size={13} /> No setup
                </span>
                <span>
                  <Check size={13} /> No account needed
                </span>
                <span>Just a little curiosity.</span>
              </div>
            </div>
            <div className="hero-artwork" aria-hidden="true">
              <Image
                src="/images/meridian-glass-orbit-lossless.webp"
                alt=""
                fill
                preload
                unoptimized
              />
            </div>
          </div>

          <div className="atlas-window">
            <div className="atlas-window-bar">
              <div className="window-project">
                <MeridianMark size={19} />
                <span>Acme Commerce</span>
                <ChevronRight size={13} />
                <span className="window-project-muted">Workspace</span>
              </div>
              <nav aria-label="Workspace previews" className="window-views">
                <a href="#live-atlas" className="is-active">
                  <Network size={14} /> Atlas
                </a>
                <Link href="/explore#map">
                  <Layers3 size={14} /> Map
                </Link>
                <Link href="/flows">
                  <Route size={14} /> User flows
                </Link>
              </nav>
              <span className="window-live">
                <i /> Interactive demo
              </span>
            </div>
            <div className="atlas-window-body" id="live-atlas">
              <aside className="atlas-sidebar">
                <span className="sidebar-label">Your codebase, in context</span>
                <h2>Every connection.</h2>
                <p>
                  Explore the relationships between modules, components, and
                  source files.
                </p>
                <div className="atlas-sidebar-facts">
                  <span>
                    <Network size={15} /> 7 connected modules
                  </span>
                  <span>
                    <Code2 size={15} /> Traceable source files
                  </span>
                  <span>
                    <Compass size={15} /> One bigger picture
                  </span>
                </div>
                <div className="atlas-sidebar-bottom">
                  <span className="sidebar-gesture">
                    <span className="gesture-orbit" /> Made to be explored.
                  </span>
                  <p>
                    Drag to orbit. Select a node.
                    <br />
                    See where it takes you.
                  </p>
                  <Link href="/explore#atlas">
                    Enter the Atlas <ArrowUpRight size={15} />
                  </Link>
                </div>
              </aside>
              <div className="hero-atlas">
                <CodeAtlas selected={selected} onSelect={setSelected} />
              </div>
            </div>
          </div>
          <div className="atlas-under-caption">
            <span>
              <span className="status-orb" /> A living map. An illustrative
              codebase.
            </span>
            <a href="#perspective">
              Discover the bigger picture <ArrowDown size={14} />
            </a>
          </div>
        </section>
        <div className="hero-proofline">
          <p>One codebase. Every perspective.</p>
          <div>
            <span>
              <Network size={17} /> Architecture
            </span>
            <span>
              <Route size={17} /> Workflows
            </span>
            <span>
              <GitBranch size={17} /> Dependencies
            </span>
            <span>
              <Code2 size={17} /> Source code
            </span>
          </div>
        </div>
      </div>

      <section
        id="perspective"
        className="perspective-section"
        aria-labelledby="perspective-title"
      >
        <div className="perspective-grid">
          <div>
            <span className="section-label-text">
              Less searching. More understanding.
            </span>
            <h2 id="perspective-title">Beyond the file tree.</h2>
          </div>
          <div className="perspective-copy">
            <p>
              A file tree tells you where things live.
              <br />
              Meridian shows you how they work together.
            </p>
            <p>
              Turn an unfamiliar codebase into a system you can navigate. Start
              with the architecture, follow a user journey, then open the code
              behind it.
            </p>
            <a className="inline-link" href="#inside">
              Get the whole picture <ArrowDown size={16} />
            </a>
          </div>
        </div>
        <div
          className="perspective-path"
          aria-label="Explore from system to source"
        >
          <span>
            <Network size={22} /> The system
          </span>
          <i />
          <span>
            <Route size={22} /> The journey
          </span>
          <i />
          <span>
            <Code2 size={22} /> The source
          </span>
        </div>
      </section>

      <section
        id="inside"
        className="inside-section"
        aria-labelledby="inside-title"
      >
        <div className="inside-heading">
          <div>
            <span className="section-label-text">Clarity, at every level.</span>
            <h2 id="inside-title">Meet your codebase.</h2>
          </div>
          <p>
            A storefront. Seven connected modules.
            <br />A hands-on way to see how it works.
          </p>
        </div>
        <ProductPreview />
        <div className="preview-caption">
          <span>
            <span className="status-orb" /> Real interactions. Illustrative
            codebase.
          </span>
          <Link href="/explore#map">
            Open the full workspace <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>

      <section className="context-section" aria-labelledby="context-title">
        <div className="context-title">
          <span className="section-label-text">Follow your curiosity.</span>
          <h2 id="context-title">
            Every layer.
            <br />
            More context.
          </h2>
          <p>
            Zoom out to get oriented.
            <br />
            Go deeper when you are ready.
          </p>
          <Link className="inline-link" href="/explore">
            Find your starting point <ArrowUpRight size={16} />
          </Link>
          <div className="context-orbit" aria-hidden="true">
            <div />
            <div />
            <MeridianMark size={45} />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="context-stories">
          <article className="context-story">
            <div className="story-label">
              <Network size={18} />
              <span>Architecture</span>
            </div>
            <h3>See the system.</h3>
            <p>
              Explore modules, services, and their dependencies. Turn an
              unfamiliar architecture into a place you can navigate.
            </p>
            <Link href="/explore#map" aria-label="Explore the architecture">
              <ArrowUpRight size={21} />
            </Link>
            <div className="story-mini-map" aria-hidden="true">
              <span>Frontend</span>
              <ArrowRight size={14} />
              <span>API</span>
              <ArrowRight size={14} />
              <span>Database</span>
            </div>
          </article>
          <article className="context-story">
            <div className="story-label">
              <Route size={18} />
              <span>Workflows</span>
            </div>
            <h3>Follow what happens.</h3>
            <p>
              What happens after someone clicks Checkout? Follow the request,
              payment, background job, and receipt, step by step.
            </p>
            <Link
              href="/explore#workflow?id=checkout"
              aria-label="Follow the checkout workflow"
            >
              <ArrowUpRight size={21} />
            </Link>
            <div className="story-flow" aria-hidden="true">
              <span>
                <i /> Request
              </span>
              <ArrowRight size={14} />
              <span>
                <i /> Payment
              </span>
              <ArrowRight size={14} />
              <span>
                <i /> Receipt
              </span>
            </div>
          </article>
          <article className="context-story">
            <div className="story-label">
              <Code2 size={18} />
              <span>Source & dependencies</span>
            </div>
            <h3>Get to the source.</h3>
            <p>
              Open the files behind each component. Trace potential dependents
              before a change, with a clear path back to the code.
            </p>
            <Link
              href="/explore#atlas?mode=dependencies&file=lib/auth.ts"
              aria-label="Inspect authentication dependencies"
            >
              <ArrowUpRight size={21} />
            </Link>
            <div className="story-source">
              <Code2 size={14} />
              <span>lib/auth.ts</span>
              <ArrowRight size={14} />
              <span>Connected files</span>
            </div>
          </article>
        </div>
      </section>

      <section
        id="questions"
        className="questions-section"
        aria-labelledby="questions-title"
      >
        <div className="questions-heading">
          <span className="section-label-text">Before you dive in.</span>
          <h2 id="questions-title">A little clarity.</h2>
          <p>A working demo, with clear boundaries.</p>
          <ShieldCheck size={26} />
        </div>
        <div className="questions-list">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>
                {faq.question}
                <span className="faq-plus" aria-hidden="true" />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-artwork" aria-hidden="true">
          <Image
            src="/images/meridian-obsidian-horizon-lossless.webp"
            alt=""
            fill
            unoptimized
          />
        </div>
        <div className="footer-cta">
          <div className="footer-symbol">
            <MeridianMark size={33} />
          </div>
          <h2>
            Your next aha
            <br />
            starts here.
          </h2>
          <p>
            Find your bearings. Follow a connection.
            <br />
            Make the unfamiliar feel familiar.
          </p>
          <Link className="landing-button button-primary" href="/explore">
            Explore the demo <ArrowRight size={17} />
          </Link>
          <span className="footer-note">
            No setup. No account. Just explore.
          </span>
        </div>
        <div className="footer-bottom">
          <Link className="landing-brand" href="/" aria-label="Meridian home">
            <MeridianMark size={23} />
            <span>
              meridian<span className="wordmark-period">.</span>
            </span>
          </Link>
          <span>Complex code. Made clear.</span>
          <a href="#main">
            Back to the top <ArrowUpRight size={14} />
          </a>
        </div>
      </footer>
    </main>
  );
}
