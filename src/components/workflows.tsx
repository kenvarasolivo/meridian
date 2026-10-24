"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  FileCode2,
} from "lucide-react";
import { workflows } from "@/data/workflows";
import { componentById, kindMeta } from "@/data/application";
import type { ExplanationLevel, SourceFile, Workflow } from "@/lib/types";
import { workflowIcons } from "./icons";
import { Modal } from "./modal";

export function WorkflowPicker({
  onStart,
  onClose,
}: {
  onStart: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title="Choose a workflow"
      onClose={onClose}
      className="workflow-picker"
    >
      <h2>Workflows</h2>
      <div className="workflow-picker-list">
        {workflows.map((workflow) => {
          const Icon = workflowIcons[workflow.id];
          return (
            <button key={workflow.id} onClick={() => onStart(workflow.id)}>
              <Icon size={23} />
              <span>
                <strong>{workflow.question}</strong>
                <small>{workflow.description}</small>
                <span className="workflow-time">
                  <Clock3 size={11} />
                  {workflow.duration}
                </span>
              </span>
              <ArrowRight size={18} />
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

export function WorkflowPanel({
  workflow,
  step,
  level,
  onStep,
  onEnd,
  onSource,
}: {
  workflow: Workflow;
  step: number;
  level: ExplanationLevel;
  onStep: (step: number) => void;
  onEnd: () => void;
  onSource: (file: SourceFile) => void;
}) {
  const current = workflow.steps[step];
  const component = componentById[current.componentId];
  return (
    <div className="workflow-panel">
      <div className="workflow-progress">
        {workflow.steps.map((s, i) => (
          <button
            key={i}
            aria-label={`Go to step ${i + 1}: ${s.title}`}
            aria-current={step === i ? "step" : undefined}
            className={i <= step ? "complete" : ""}
            onClick={() => onStep(i)}
          />
        ))}
      </div>
      <h2>{workflow.name}</h2>
      <div className="workflow-step-meta">
        <span>
          Step {step + 1} of {workflow.steps.length}
        </span>
        <span style={{ color: kindMeta[component.kind].color }}>
          {component.name}
        </span>
      </div>
      <div className="workflow-current" key={step}>
        <h3>{current.title}</h3>
        <p>{current.explanation[level]}</p>
        <button
          className="workflow-source"
          onClick={() => onSource(current.file)}
        >
          <FileCode2 size={17} />
          <span>{current.file.path}</span>
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="workflow-navigation">
        <button
          disabled={step === 0}
          className="secondary-button"
          onClick={() => onStep(step - 1)}
        >
          <ArrowLeft size={15} />
          Previous
        </button>
        {step === workflow.steps.length - 1 ? (
          <button className="primary-button" onClick={onEnd}>
            Finish tour
            <Check size={15} />
          </button>
        ) : (
          <button className="primary-button" onClick={() => onStep(step + 1)}>
            Next step
            <ArrowRight size={15} />
          </button>
        )}
      </div>
      <details className="workflow-all-steps">
        <summary>
          All steps
          <ChevronRight size={13} />
        </summary>
        {workflow.steps.map((s, i) => (
          <button
            key={i}
            className={`${i === step ? "active" : ""} ${i < step ? "visited" : ""}`}
            onClick={() => onStep(i)}
          >
            <span>{i < step ? <Check size={11} /> : i + 1}</span>
            <span>{s.title}</span>
            {i === step && <span className="current-step-dot" />}
          </button>
        ))}
      </details>
    </div>
  );
}
