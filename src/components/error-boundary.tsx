import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });
    // You can also log the error to an error reporting service here
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className='fixed inset-0 flex items-center justify-center p-4 bg-neutral-1/80 backdrop-blur-sm'>
          <div className='w-full max-w-2xl p-6 bg-neutral-1 border border-neutral-6 rounded-lg shadow-lg'>
            <div className='space-y-4'>
              <h2 className='text-2xl font-bold text-danger-11'>
                Something went wrong!
              </h2>

              <div className='p-4 bg-neutral-3 rounded-md'>
                <p className='font-mono text-sm text-neutral-11 break-words'>
                  {this.state.error.toString()}
                </p>
              </div>

              <div className='space-y-2'>
                <p className='text-sm text-neutral-11'>
                  This error occurred in the application and couldn't be handled
                  gracefully.
                </p>
                {this.state.errorInfo && (
                  <details className='mt-4'>
                    <summary className='text-sm text-neutral-11 cursor-pointer hover:text-neutral-12'>
                      Stack trace
                    </summary>
                    <pre className='mt-2 p-4 bg-neutral-3 rounded-md overflow-auto text-xs font-mono text-neutral-11'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div className='flex gap-4 mt-6'>
                <button
                  onClick={() => window.location.reload()}
                  className='px-4 py-2 text-sm font-medium text-primary-1 bg-primary-9 rounded-md hover:bg-primary-10 transition-colors'
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.history.back()}
                  className='px-4 py-2 text-sm font-medium text-neutral-11 bg-neutral-3 rounded-md hover:bg-neutral-4 transition-colors'
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
