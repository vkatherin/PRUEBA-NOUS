import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component tree:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-theme-bg-main">
          <div className="bg-theme-bg-card p-6 rounded-xl shadow-sm text-center max-w-lg border border-red-100">
            <h2 className="text-lg font-bold text-red-600 mb-2">⚠️ Ocurrió un error inesperado</h2>
            <p className="text-sm text-theme-text-muted mb-4">
              El componente no pudo ser cargado debido a un error interno. 
              Si tienes el traductor de Google activado, por favor desactívalo para esta página y recarga.
            </p>
            <div className="text-xs text-left bg-gray-50 p-3 rounded text-red-800 overflow-auto max-h-32 mb-4">
              {this.state.error?.message}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-theme-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#155230]"
            >
              Recargar la página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
