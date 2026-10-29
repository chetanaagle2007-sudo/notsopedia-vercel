import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export function reportClientTelemetry(payload: {
  message: string;
  stack?: string;
  component?: string;
  url?: string;
}) {
  try {
    fetch("/api/admin/autonomous/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: payload.message,
        stack: payload.stack,
        component: payload.component || "FrontendBoundary",
        url: payload.url || (typeof window !== "undefined" ? window.location.pathname : "")
      })
    }).catch(() => {
      // Ignore background reporting errors silently
    });
  } catch {}
}

export class ErrorBoundary extends (Component as any) {
  public state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    reportClientTelemetry({
      message: error.message || "Unknown client render error",
      stack: `${error.stack || ""}\nComponent Stack: ${errorInfo?.componentStack || ""}`,
      component: "ReactErrorBoundary",
      url: typeof window !== "undefined" ? window.location.href : ""
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected interface error occurred. Telemetry has been recorded in the Autonomous Operations Engine for automated recovery.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-black/50 border border-slate-800 rounded-xl text-left overflow-x-auto text-[11px] font-mono text-rose-300/80 max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl flex items-center space-x-2 transition cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center space-x-2 transition cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
