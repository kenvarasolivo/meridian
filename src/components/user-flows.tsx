"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ChevronRight, Menu, Network, RotateCcw } from "lucide-react";
import { userFlows } from "@/data/user-flows";
import { componentById, project } from "@/data/application";
import { workflowById } from "@/data/workflows";
import { Sidebar } from "./sidebar";
import { HelpDialog } from "./help-dialog";

export function UserFlows() {
  const [flowId, setFlowId] = useState("checkout");
  const [selectedStep, setSelectedStep] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const flow = userFlows.find((flow) => flow.id === flowId)!;
  const step = flow.steps[selectedStep];
  const workflow = workflowById[flow.id];
  const component = componentById[workflow.steps[step.mapStep].componentId];
  const mapUrl = `/explore#workflow?id=${flow.id}&step=${step.mapStep}`;

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} navigation="Workflows" selectedId={null}
        onToggle={() => setCollapsed(!collapsed)} onCloseMobile={() => setMobileOpen(false)}
        onNavigate={(item) => { window.location.assign(item === "Diagrams" ? "/explore#domain" : item === "Explore" ? "/explore#map" : "/explore"); }}
        onSelect={(id) => { window.location.assign(`/explore#atlas?module=${id}`); }} onHelp={() => setHelpOpen(true)} />
      <div className="app-workspace">
        <header className="topbar">
          <div className="topbar-location">
            <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></button>
            <nav className="breadcrumbs" aria-label="Page location"><Link href="/explore">{project.name}</Link><ChevronRight size={13} /><span>User flows</span></nav>
          </div>
          <Link className="flow-map-link" href="/explore#map"><Network size={15} />Open Map</Link>
        </header>
        <main className="flows-page">
          <header className="flows-heading"><div><h1>User flows</h1><p>Follow the customer journey, then see how the code makes it happen.</p></div><span className="flows-demo">Acme Commerce · Demo</span></header>
          <div className="flows-layout">
            <nav className="flow-picker" aria-label="User journeys">
              {userFlows.map((item, index) => <button key={item.id} aria-current={flow.id === item.id ? "page" : undefined} onClick={() => { setFlowId(item.id); setSelectedStep(0); }}><span className="flow-index">0{index + 1}</span><span><strong>{item.name}</strong><small>{item.steps.length} journey steps</small></span><ChevronRight size={14} /></button>)}
              <p>These journeys describe the fictional demo. Select a step to connect it to the code.</p>
            </nav>
            <section className="flow-document" aria-labelledby="flow-title">
              <header className="flow-document-header"><div><h2 id="flow-title">{flow.name}</h2><p>{flow.description}</p></div><Link className="flow-map-link" href={mapUrl}>See on the map<ArrowRight size={16} /></Link></header>
              <div className="flow-diagram" aria-label={`${flow.name} user flow diagram`}>
                <div className="flow-terminal">Start</div><ArrowDown className="flow-arrow" size={18} aria-hidden="true" />
                <ol className="flow-steps">
                  {flow.steps.map((item, index) => <li key={`${flow.id}-${index}`}>
                    <button className={`flow-step ${selectedStep === index ? "selected" : ""}`} aria-pressed={selectedStep === index} onClick={() => setSelectedStep(index)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong></button>
                    <ArrowDown className="flow-arrow" size={18} aria-hidden="true" />
                    {item.decision && <div className="flow-decision-group"><div className="flow-decision">{item.decision.question}</div><div className="flow-branch"><span>No <ArrowRight size={13} /></span><div>{item.decision.retry}<small><RotateCcw size={12} />{item.decision.returnTo}</small></div></div><span className="flow-yes">Yes</span><ArrowDown className="flow-arrow" size={18} aria-hidden="true" /></div>}
                  </li>)}
                </ol>
                <div className="flow-terminal">Journey complete</div>
              </div>
              <aside className="flow-detail" aria-label="Selected journey step"><div><span>Step {selectedStep + 1} of {flow.steps.length}</span><h3>{step.title}</h3><p>{step.description}</p></div><div className="flow-implementation"><span>Map walkthrough · {component.name}</span><strong>{workflow.steps[step.mapStep].title}</strong><Link className="flow-map-link" href={mapUrl}>See on the map<ArrowRight size={16} /></Link></div></aside>
            </section>
          </div>
        </main>
      </div>
      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
