import { type FallbackProps, useErrorBoundary } from 'react-error-boundary';
import { Link } from 'wouter';

type Props = {
  error?: string;
  onReturn?: () => void;
};

function UnhandledError({ error, onReturn }: Props) {
  const { resetBoundary } = useErrorBoundary();

  return (
    <div className='fixed inset-0 flex items-center justify-center p-4 bg-neutral-1/80 backdrop-blur-sm'>
      <div className='w-full max-w-2xl p-6 bg-neutral-1 border border-neutral-6 rounded-lg shadow-lg'>
        <div className='space-y-4'>
          <h2 className='text-2xl font-bold text-danger-11'>
            Something went wrong!
          </h2>

          <div className='space-y-2'>
            <p className='text-sm text-neutral-11'>
              It looks like there was an unhandled issue. Please{' '}
              <a
                target='_blank'
                href='https://github.com/taskylizard/vivivi/issues/new'
                className='underline'
              >
                file an issue
              </a>{' '}
              and include this message in your report:
            </p>
            <details className='mt-4'>
              <summary className='text-sm text-neutral-11 cursor-pointer hover:text-neutral-12'>
                Stack trace
              </summary>
              <pre className='mt-2 p-4 bg-neutral-3 rounded-md overflow-auto text-xs font-mono text-neutral-11'>
								{error ||
									"An unknown error occurred. Please check the console for more details."}
              </pre>
            </details>
          </div>

          <div className='flex gap-4 mt-6'>
            <button
              onClick={resetBoundary}
              className='px-4 py-2 text-sm font-medium text-primary-1 bg-primary-9 rounded-md hover:bg-primary-10 transition-colors'
            >
              Try Again
            </button>

            <Link
              to='/'
              className='px-4 py-2 text-sm font-medium text-neutral-11 bg-neutral-3 rounded-md hover:bg-neutral-4 transition-colors'
              onClick={onReturn}
            >
              Take me back home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FallbackRender({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className='h-screen'>
      <UnhandledError error={error.toString()} onReturn={resetErrorBoundary} />
    </div>
  );
}
