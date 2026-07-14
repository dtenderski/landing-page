import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", background: "#1a1a2e", color: "#e2e8f0", minHeight: "100vh" }}>
          <h2 style={{ color: "#f87171", marginBottom: 16 }}>⚠ React Error (Production)</h2>
          <p style={{ color: "#fbbf24", marginBottom: 8 }}>{this.state.error.message}</p>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#94a3b8", background: "#0f172a", padding: 16, borderRadius: 8 }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

window.__pwaInstalled = false;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
});

window.addEventListener("appinstalled", () => {
  window.__pwaInstalled = true;
  window.__pwaInstallPrompt = undefined;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
