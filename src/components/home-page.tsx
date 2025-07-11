import { TriangleAlert } from 'lucide-react';
import { useLocation } from 'wouter';
import { GRAPH_OPTIONS } from '../data';
import { ThemeToggle } from './theme-toggle';

const HomePage: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div className='prose dark:prose-invert bg-neutral-1 text-neutral-11 font-sans'>
        <div className='absolute top-4 right-4 z-50'>
          <ThemeToggle />
        </div>
        <div className='relative w-full max-w-md mx-auto p-8 flex flex-col items-center gap-6 z-10'>
          <h2 className='text-xl font-mono'>vivivi</h2>

          <div className='text-center'>
            <p className='text-sm mb-2'>
              Interactive graph visualization tool for exploring relationships
              between markdown files and external links.
            </p>
            <p className='text-xs'>
              Navigate through connected content with dynamic{' '}
              <a
                href='https://en.wikipedia.org/wiki/Force-directed_graph_drawing'
                target='_blank'
                rel='noopener noreferrer'
              >
                force-directed layouts
              </a>
              .
            </p>
          </div>

          <div className='bg-warning-3 text-warning-12 p-4 w-full rounded font-sans'>
            <div className='text-xs'>
              <TriangleAlert className='inline-block size-5 mr-1 mb-1' />
              Large graphs may crash or severely lag your browser. Proceed with
              caution.
            </div>
          </div>

          <div className='flex flex-col gap-2 w-full text-center'>
            {GRAPH_OPTIONS.map((opt) => (
              <div key={opt.key} className='text-sm'>
                <button
                  onClick={() => setLocation(`/graph/${opt.key}`)}
                  className='appearance-none bg-transparent border-none p-0 m-0 text-neutral-12 underline underline-dotted transition-colors cursor-pointer'
                >
                  {opt.name}{' '}
                  <span className='text-xs text-neutral-10'>
                    ({opt.data.nodesCount} nodes)
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <footer className='prose dark:prose-invert bg-neutral-1 text-neutral-11 font-sans absolute bottom-4 text-xs text-center w-full z-10'>
        <p>
          <a
            href='https://github.com/taskylizard/vivivi'
            target='_blank'
            rel='noopener noreferrer'
          >
            source code
          </a>{' '}
          • built by <span className='font-semibold'>taskylizard</span>
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
