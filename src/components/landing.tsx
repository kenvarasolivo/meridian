"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  GitBranch,
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
                ? "/explore#workflow?id=checkout"
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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("has-entered");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll(".landing .reveal")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  return (
    <main className="landing" id="main">
      <a className="landing-skip" href="#main">
        Skip to content
      </a>
      <div className="landing-dark">
        <header className="landing-header">
          <Link className="landing-brand" href="/" aria-label="Meridian home">
            <MeridianMark size={33} />
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
              The idea
            </a>
            <a href="#inside" onClick={() => setMenuOpen(false)}>
              Inside Meridian
            </a>
            <a href="#questions" onClick={() => setMenuOpen(false)}>
              Questions
            </a>
          </nav>
          <Link className="landing-header-cta" href="/explore">
            <span className="header-cta-full">Open the demo</span>
            <span className="header-cta-short">Demo</span>{" "}
            <ArrowUpRight size={16} />
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

        <div>
          <section className="landing-hero" aria-labelledby="hero-title">
            <div className="hero-topline">
              <span>
                <i /> A new perspective on your codebase
              </span>
              <span>
                Built for the bigger picture <ArrowUpRight size={13} />
              </span>
            </div>
            <div className="hero-content">
              <div className="hero-copy">
                <h1 id="hero-title">
                  <span>Complex code.</span>
                  <span>Made clear.</span>
                </h1>
                <p>
                  Find your way through a codebase. See how it connects, follow
                  the flow, and get to the source.
                </p>
                <div className="hero-actions">
                  <Link className="landing-button button-light" href="/explore">
                    Explore the demo <ArrowUpRight size={18} />
                  </Link>
                  <a className="hero-text-link" href="#inside">
                    <span className="play-icon">
                      <Play size={10} fill="currentColor" />
                    </span>{" "}
                    Take a closer look
                  </a>
                </div>
                <div className="hero-reassurance">
                  <span>
                    <Check size={12} /> No setup
                  </span>
                  <span>
                    <Check size={12} /> No account
                  </span>
                  <span>
                    <Check size={12} /> Just explore
                  </span>
                </div>
              </div>
              <div className="hero-visual hero-network">
                <CodeAtlas selected={selected} onSelect={setSelected} />
              </div>
            </div>
            <div className="hero-footer">
              <a className="hero-scroll" href="#perspective">
                <span>
                  <ArrowDown size={17} />
                </span>{" "}
                A little context changes everything.
              </a>
            </div>
          </section>
          <div className="hero-proofline">
            <span>FROM BIG PICTURE TO LINE OF CODE</span>
            <div>
              <span>Architecture</span>
              <i />
              <span>Workflows</span>
              <i />
              <span>Dependencies</span>
              <i />
              <span>Source</span>
            </div>
            <span className="proofline-note">One connected workspace</span>
          </div>
        </div>
      </div>

      <section
        id="perspective"
        className="perspective-section"
        aria-labelledby="perspective-title"
      >
        <div className="section-topline">
          <span>Less searching. More understanding.</span>
          <span>THE MERIDIAN PERSPECTIVE</span>
        </div>
        <div className="perspective-grid">
          <h2 className="reveal" id="perspective-title">
            The files are only
            <br />
            half the story.
          </h2>
          <div className="perspective-copy reveal">
            <p>
              A codebase is a connected system. But a file tree only shows you
              where things live.
            </p>
            <p>
              Meridian shows you how they work together. Start with the whole
              architecture, follow a real user journey, then open the code
              behind it.
            </p>
            <a className="inline-link" href="#inside">
              See the connections <ArrowDown size={16} />
            </a>
          </div>
        </div>
        <div className="perspective-bottom reveal">
          <span>
            Built for the moment you ask, “How does this actually work?”
          </span>
          <div className="perspective-legend">
            <span>
              <i /> The whole system
            </span>
            <span>
              <i /> The detail that matters
            </span>
          </div>
        </div>
      </section>

      <section
        id="inside"
        className="inside-section"
        aria-labelledby="inside-title"
      >
        <div className="inside-heading reveal">
          <div>
            <span className="section-kicker">A LITTLE LESS ABSTRACT</span>
            <h2 id="inside-title">Meet your codebase.</h2>
          </div>
          <p>
            A storefront. Seven connected modules. <br />
            One place to start making sense of it.
          </p>
        </div>
        <div className="reveal">
          <ProductPreview />
        </div>
        <div className="preview-caption">
          <span>
            <span className="caption-dot" /> Real interactions. Illustrative
            codebase.
          </span>
          <Link href="/explore#map">
            Open the full workspace <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>

      <section className="context-section" aria-labelledby="context-title">
        <div className="context-title reveal">
          <span className="section-kicker">FOLLOW YOUR CURIOSITY</span>
          <h2 id="context-title">
            Every layer. <br />
            More context.
          </h2>
          <p>
            Zoom out to get oriented. <br />
            Go deeper when you’re ready.
          </p>
          <Link className="inline-link" href="/explore">
            Find your starting point <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="context-stories">
          <article className="context-story reveal">
            <div className="story-label">
              <Network size={18} />
              <span>The big picture</span>
            </div>
            <h3>See the system.</h3>
            <p>
              Explore modules, services, and the dependencies between them. Turn
              an unfamiliar architecture into a place you can navigate.
            </p>
            <Link href="/explore#map" aria-label="Explore the architecture">
              <ArrowUpRight size={22} />
            </Link>
            <div className="story-mini-map" aria-hidden="true">
              <span>Frontend</span>
              <i />
              <span>API</span>
              <i />
              <span>Database</span>
            </div>
          </article>
          <article className="context-story reveal">
            <div className="story-label">
              <Route size={18} />
              <span>The journey through it</span>
            </div>
            <h3>Follow what happens.</h3>
            <p>
              What happens after someone clicks Checkout? Walk through the
              request, payment, background job, and receipt, one step at a time.
            </p>
            <Link
              href="/explore#workflow?id=checkout"
              aria-label="Follow the checkout workflow"
            >
              <ArrowUpRight size={22} />
            </Link>
            <div className="story-flow" aria-hidden="true">
              <span>Request</span>
              <ArrowRight size={15} />
              <span>Payment</span>
              <ArrowRight size={15} />
              <span>Receipt</span>
            </div>
          </article>
          <article className="context-story reveal">
            <div className="story-label">
              <Code2 size={18} />
              <span>The details behind it</span>
            </div>
            <h3>Go straight to the source.</h3>
            <p>
              Open the files behind each component. Trace potential dependents
              before a change, with an explicit path back to the code.
            </p>
            <Link
              href="/explore#atlas?mode=dependencies&file=lib/auth.ts"
              aria-label="Inspect authentication dependencies"
            >
              <ArrowUpRight size={22} />
            </Link>
            <div className="story-source" aria-hidden="true">
              <span>lib/auth.ts</span>
              <span>→ connected files</span>
              <span className="source-cursor" />
            </div>
          </article>
        </div>
      </section>

      <section
        id="questions"
        className="questions-section"
        aria-labelledby="questions-title"
      >
        <div className="questions-heading reveal">
          <span className="section-kicker">BEFORE YOU EXPLORE</span>
          <h2 id="questions-title">
            A few things <br />
            to know.
          </h2>
          <p>A working demo, with clear boundaries.</p>
        </div>
        <div className="questions-list reveal">
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
        <div className="footer-cta reveal">
          <div>
            <span>YOUR NEXT “AHA” STARTS HERE</span>
            <h2>Get your bearings.</h2>
          </div>
          <Link className="landing-button button-light" href="/explore">
            Explore the demo <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="footer-wordmark" aria-hidden="true">
          meridian<span>.</span>
        </div>
        <div className="footer-bottom">
          <span>Complex code. Made clear.</span>
          <span>A local demo. No account required.</span>
          <a href="#main">
            Back to the top <ArrowUpRight size={14} />
          </a>
        </div>
      </footer>
    </main>
  );
}
