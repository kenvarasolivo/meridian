import {
  ArrowRight,
  Layers3,
  MousePointer2,
  Route,
  Search,
} from "lucide-react";
import { MeridianMark } from "./icons";
import { Modal } from "./modal";

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Welcome to Meridian" onClose={onClose} className="help-modal">
      <span className="help-logo">
        <MeridianMark size={45} />
      </span>
      <div className="section-label">Welcome to Meridian</div>
      <h2>
        Complex code.
        <br />
        <span>Made clear.</span>
      </h2>
      <p>
        A quieter way to understand a codebase. This interactive example maps a
        Next.js store, from the interface to the database.
      </p>
      <div className="help-features">
        <div>
          <MousePointer2 size={20} />
          <span>
            <strong>Start with the big picture</strong>
            <small>
              Click a component to see its job, connections, and source.
            </small>
          </span>
        </div>
        <div>
          <Layers3 size={20} />
          <span>
            <strong>Go one layer deeper</strong>
            <small>
              Double-click a component or choose Explore deeper. Breadcrumbs
              lead you home.
            </small>
          </span>
        </div>
        <div>
          <Route size={20} />
          <span>
            <strong>Follow a real-world journey</strong>
            <small>
              Walk through login, checkout, or notifications, one step at a
              time.
            </small>
          </span>
        </div>
        <div>
          <Search size={20} />
          <span>
            <strong>Ask a familiar question</strong>
            <small>Search with Ctrl/⌘ K. Try “How does checkout work?”</small>
          </span>
        </div>
      </div>
      <button className="primary-button" onClick={onClose}>
        Find my bearings
        <ArrowRight size={16} />
      </button>
      <div className="dialog-footnote">
        Drag to pan · Scroll to zoom · Use + / − for precise zoom
      </div>
    </Modal>
  );
}
