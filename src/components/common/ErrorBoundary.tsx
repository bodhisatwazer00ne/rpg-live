import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[220px] bg-[#1a1325] border-4 border-[#3a204d] p-6 text-center text-[#f4eee3] space-y-4 shadow-[4px_4px_0px_#120e1d] flex flex-col items-center justify-center">
          <div className="font-pixel text-sm text-[#e43b44] uppercase tracking-wider">
            ⚠️ {this.props.fallbackTitle || 'COMBAT ANOMALY DETECTED'}
          </div>
          <p className="font-silkscreen text-xs text-[#a594c7] max-w-md">
            The arena encountered an unexpected render glitch. Your account and quest progress remain safe.
          </p>
          {this.state.error?.message && (
            <div className="font-mono text-[10px] text-[#fcd34d] bg-[#120e1d] px-3 py-1.5 border border-[#43315a] max-w-lg break-all">
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-[#2d1b4e] hover:bg-[#3e246c] text-[#fec83e] border-2 border-[#fec83e] font-pixel text-xs uppercase cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
          >
            [ RECONNECT / RETURN TO ROSTER ]
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
