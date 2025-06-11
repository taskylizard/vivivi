import { useEffect, useMemo, useRef, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import privateersclubData from '../data/privateersclub.json';
import wotakuData from '../data/wotaku.json';
import { ErrorBoundary } from './components/error-boundary';
import GraphView from './components/graph';
import type { Graph } from './components/graph/types';
import { useToggleReactScan } from './components/react-scan';
import { ThemeToggle } from './components/theme-toggle';

const GRAPH_OPTIONS = [
  {
    key: 'privateersclub',
    name: 'privateersclub',
    data: privateersclubData,
  },
  {
    key: 'wotaku',
    name: 'Wotaku',
    data: wotakuData,
  },
];

const useGraphData = (selectedGraph: string | null) => {
  const [data, setData] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedGraph) return;
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        const graph = GRAPH_OPTIONS.find((g) => g.key === selectedGraph);
        if (!graph) throw new Error('Graph not found');
        setData(graph.data as unknown as Graph);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    setError(null);
    setData(null);
    fetchData();
  }, [selectedGraph]);

  return { data, loading, error };
};

const HomePage: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <div className='prose dark:prose-invert bg-neutral-1 text-neutral-11 font-sans fixed inset-0 z-50 flex items-center justify-center'>
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
            <span className='font-bold'>{'⚠️ warning: '}</span>
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

      <footer className='absolute bottom-4 text-xs text-center w-full z-10'>
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

const GraphPage: React.FC<{ params: { graphId: string } }> = ({ params }) => {
  const { data, loading, error } = useGraphData(params.graphId);
  const [showInfo, setShowInfo] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'info' | 'developer' | 'graphs'
  >('info');

  const [enabled, setEnabled] = useState(true);
  const { toggle } = useToggleReactScan({
    mode: 'controlled',
    enabled,
    setEnabled,
  });

  const [, setLocation] = useLocation();

  const graphRef = useRef<{ recenter: () => void }>(null);

  const handleRecenter = () => {
    graphRef.current?.recenter();
  };

  const handleCrash = () => {
    throw new Error('oooooooooooooooooooops');
  };

  // avoid unnecessary re-renders
  const memoizedNodes = useMemo(() => data?.nodes || [], [data]);
  const memoizedLinks = useMemo(() => data?.links || [], [data]);

  if (loading) {
    return (
      <div className='prose dark:prose-invert bg-neutral-1 text-neutral-11 font-sans fixed inset-0 z-50 flex items-center justify-center'>
        <div className='relative w-full max-w-md mx-auto p-8 flex flex-col items-center gap-6'>
          <span className='i-svg-spinners:bars-rotate-fade size-12 bg-black dark:bg-white' />
          <p className='text-neutral-10'>
            Loading graph data... {':^)'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 h-screen flex items-center justify-center prose dark:prose-invert bg-neutral-1 text-neutral-11 font-sans'>
        <div className='text-center bg-neutral-3 p-8 rounded-lg border'>
          <h2 className='text-xl font-bold mb-2'>Error loading graph</h2>
          <p className='text-danger-11'>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className='min-h-screen'>
      <ErrorBoundary>
        <GraphView
          ref={graphRef}
          nodes={memoizedNodes}
          links={memoizedLinks}
        />
      </ErrorBoundary>

      <div className='font-sans! fixed bottom-6 right-6 z-50 flex flex-col items-end'>
        {showInfo && (
          <div className='w-72 bg-neutral-3/75 backdrop-blur-md border border-neutral-7 border-2 rounded-xl p-5 flex flex-col gap-4'>
            <div className='flex gap-2 mb-2'>
              <button
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-neutral-3 transition-all border-none outline-none ${
                  activeTab === 'info'
                    ? 'text-neutral-12 bg-neutral-5'
                    : 'text-neutral-10 hover:text-neutral-12 hover:bg-neutral-4'
                }`}
                onClick={() => setActiveTab('info')}
              >
                Info
              </button>
              <button
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-neutral-3 transition-all border-none outline-none ${
                  activeTab === 'graphs'
                    ? 'text-neutral-12 bg-neutral-5'
                    : 'text-neutral-10 hover:text-neutral-12 hover:bg-neutral-4'
                }`}
                onClick={() => setActiveTab('graphs')}
              >
                Graphs
              </button>
              <button
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-neutral-3 transition-all border-none outline-none ${
                  activeTab === 'developer'
                    ? 'text-neutral-12 bg-neutral-5'
                    : 'text-neutral-10 hover:text-neutral-12 hover:bg-neutral-4'
                }`}
                onClick={() => setActiveTab('developer')}
              >
                Developer
              </button>
            </div>

            {activeTab === 'info' && (
              <div className='space-y-2'>
                <div>
                  <h2 className='text-sm font-semibold mb-2 text-neutral-12'>
                    Legend
                  </h2>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <span
                        className='inline-block w-5 h-5 rounded-full border-2'
                        style={{
                          background: 'rgb(var(--primary-9))',
                          borderColor: 'rgb(var(--primary-11))',
                          borderStyle: 'solid',
                          borderWidth: '2px',
                        }}
                      >
                      </span>
                      <span className='text-sm text-neutral-12'>
                        Internal Markdown Node
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span
                        className='inline-block w-5 h-5 rounded-full border-2'
                        style={{
                          background: 'rgb(var(--danger-9))',
                          borderColor: 'rgb(var(--danger-11))',
                          borderStyle: 'solid',
                          borderWidth: '2px',
                        }}
                      >
                      </span>
                      <span className='text-sm text-neutral-12'>
                        External Link Node
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='text-sm font-semibold text-neutral-12 mb-2'>
                    Controls
                  </h4>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>🔍</span>
                      <span className='text-sm text-neutral-12'>
                        Scroll to <b>zoom</b> in/out
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>✋</span>
                      <span className='text-sm text-neutral-12'>
                        Drag background to <b>pan</b>
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>🖱</span>
                      <span className='text-sm text-neutral-12'>
                        Drag node to reposition
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'graphs' && (
              <div className='space-y-2'>
                <div className='text-xs text-neutral-11 mb-3'>
                  Switch between available graphs:
                </div>
                {GRAPH_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setLocation(`/graph/${opt.key}`)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-all border-none outline-none flex items-center justify-between ${
                      params.graphId === opt.key
                        ? 'bg-primary-4 text-primary-11 border border-primary-7'
                        : 'bg-neutral-3 hover:bg-neutral-4 text-neutral-11 hover:text-neutral-12'
                    }`}
                  >
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium'>{opt.name}</span>
                      <span className='text-xs text-neutral-11'>
                        {opt.data.nodesCount} nodes
                      </span>
                    </div>
                    {params.graphId === opt.key && (
                      <span className='text-xs'>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'developer' && (
              <div className='space-y-2 flex flex-col gap-2'>
                <button
                  className='text-sm text-neutral-11 hover:text-neutral-12 bg-neutral-3 px-2 py-1 rounded-md transition-all border-none outline-none flex items-center gap-2'
                  onClick={toggle}
                >
                  <span className='text-lg'>🔍</span>
                  {enabled ? ' Disable React Scan' : ' Enable React Scan'}
                </button>
                <button
                  className='text-sm text-neutral-11 hover:text-neutral-12 bg-neutral-3 px-2 py-1 rounded-md transition-all border-none outline-none flex items-center gap-2'
                  onClick={handleRecenter}
                >
                  <span className='text-lg'>🔄</span> Recenter
                </button>
                <button
                  className='text-sm text-neutral-11 hover:text-neutral-12 bg-neutral-3 px-2 py-1 rounded-md transition-all border-none outline-none flex items-center gap-2'
                  onClick={handleCrash}
                >
                  <span className='text-lg'>🚫</span> Crash the graph
                </button>

                <ThemeToggle />
              </div>
            )}
          </div>
        )}
        <button
          className={`mb-2 px-4 py-2 rounded-full bg-neutral-3 text-neutral-12 transition-all border-none outline-none ${
            showInfo ? 'opacity-70' : 'opacity-100'
          }`}
          onClick={() => setShowInfo((v) => !v)}
          aria-label={showInfo ? 'Hide info panel' : 'Show info panel'}
        >
          {showInfo
            ? <span className='font-semibold text-sm'>Hide</span>
            : <span className='font-semibold text-sm'>Show</span>}
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Switch>
      <Route path='/' component={HomePage} />
      <Route path='/graph/:graphId'>
        {(params) => <GraphPage params={params} />}
      </Route>
      <Route>
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-neutral-1'>
          <div className='text-center'>
            <h2 className='text-xl font-bold mb-2'>Page Not Found</h2>
            <button
              onClick={() => window.location.href = '/'}
              className='text-info-9 hover:text-info-10 underline'
            >
              Go back to home
            </button>
          </div>
        </div>
      </Route>
    </Switch>
  );
};

export default App;
