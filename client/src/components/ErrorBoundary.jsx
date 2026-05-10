import { Component } from "react";
import { Link } from "react-router-dom";
import { BtnLink } from "./ui.jsx";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center px-4">
          <div className="max-w-lg text-center border border-border rounded bg-white shadow-card p-8">
            <h1 className="text-2xl font-bold text-ink mb-2">Something went wrong</h1>
            <p className="text-body mb-6">
              Please refresh the page or return home. If the problem continues, contact RefurbKE support.
            </p>
            <div className="flex gap-3 justify-center">
              <BtnLink to="/">Back home</BtnLink>
              <button
                type="button"
                className="px-4 py-2 border border-border rounded-[6px] text-body"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function TinyLink404() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">🔍</p>
      <h1 className="text-3xl font-bold text-ink mb-2">Page not found</h1>
      <p className="text-body mb-6">That address does not exist on RefurbKE.</p>
      <BtnLink to="/">Browse the store</BtnLink>
    </div>
  );
}
