import { useEffect, useMemo, useRef, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import privateersclubData from '../data/privateersclub.json';
import wotakuData from '../data/wotaku.json';
import { ErrorBoundary } from './components/error-boundary';
import GraphView from './components/graph';
import type { Graph } from './components/graph/types';
import { useToggleReactScan } from './components/react-scan';
import { Spinner } from './components/ui/spinner';

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
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
      <div
        className='absolute inset-0 bg-cover bg-center bg-no-repeat'
        style={{
          backgroundImage: 'url(/background.webp)',
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
        }}
      />

      <div className='absolute inset-0 bg-black/40' />

      <div className='relative w-full max-w-md mx-auto p-8 flex flex-col items-center gap-6 z-10'>
        <h2 className='text-xl text-foreground font-mono'>vivivi</h2>

        <div className='text-center text-white/90 font-sans'>
          <p className='text-sm mb-2'>
            Interactive graph visualization tool for exploring relationships
            between markdown files and external links.
          </p>
          <p className='text-xs text-white/70'>
            Navigate through connected content with dynamic{' '}
            <a
              href='https://en.wikipedia.org/wiki/Force-directed_graph_drawing'
              target='_blank'
              rel='noopener noreferrer'
              className='text-white/70 hover:text-white underline transition-colors cursor-pointer'
            >
              force-directed layouts
            </a>
            .
          </p>
        </div>

        <div className='bg-[#eda33b]/25 text-white p-4 w-full rounded font-sans'>
          <div className='text-xs'>
            <span className='font-bold'>{'⚠️ warning: '}</span>
            Large graphs may crash or severely lag your browser. Proceed with
            caution.
          </div>
        </div>

        <div className='flex flex-col gap-2 w-full text-center'>
          {GRAPH_OPTIONS.map((opt) => (
            <div key={opt.key} className='text-lg'>
              <button
                onClick={() => setLocation(`/graph/${opt.key}`)}
                className='appearance-none bg-transparent border-none p-0 m-0 text-white/70 hover:text-white underline transition-colors cursor-pointer'
              >
                {opt.name}{' '}
                <span className='text-xs text-muted-foreground'>
                  ({opt.data.nodesCount} nodes)
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className='absolute bottom-4 text-xs text-muted-foreground font-sans text-center w-full z-10'>
        <p>
          <a
            href='https://github.com/taskylizard/vivivi'
            target='_blank'
            rel='noopener noreferrer'
            className='appearance-none text-white/70 hover:text-white underline transition-colors cursor-pointer'
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

  // avoid unnecessary re-renders
  const memoizedNodes = useMemo(() => data?.nodes || [], [data]);
  const memoizedLinks = useMemo(() => data?.links || [], [data]);

  if (loading) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
        <div className='relative w-full max-w-md mx-auto p-8 flex flex-col items-center gap-6'>
          <Spinner size='lg' className='bg-black dark:bg-white' />
          <p className='text-muted-foreground font-sans'>
            Loading graph data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 h-screen flex items-center justify-center dark'>
        <div className='text-center bg-card p-8 rounded-lg border'>
          <h2 className='text-xl font-bold mb-2'>Error loading graph</h2>
          <p className='text-destructive'>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className='min-h-screen bg-background font-mono'>
      <ErrorBoundary>
        <GraphView
          ref={graphRef}
          nodes={memoizedNodes}
          links={memoizedLinks}
        />
      </ErrorBoundary>

      <div className='fixed bottom-6 right-6 z-50 flex flex-col items-end'>
        {showInfo && (
          <div className='w-72 bg-card/80 backdrop-blur border border-border rounded-xl shadow-2xl p-5 flex flex-col gap-4'>
            <div className='flex gap-2 mb-2'>
              <button
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-card transition-all border-none outline-none ${
                  activeTab === 'info'
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={() => setActiveTab('info')}
              >
                Info
              </button>
              <button
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-card transition-all border-none outline-none ${
                  activeTab === 'graphs'
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={() => setActiveTab('graphs')}
              >
                Graphs
              </button>
              <button
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-card transition-all border-none outline-none ${
                  activeTab === 'developer'
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={() => setActiveTab('developer')}
              >
                Developer
              </button>
            </div>

            {activeTab === 'info' && (
              <div className='space-y-4'>
                <div>
                  <h4 className='text-sm font-semibold text-foreground mb-2'>
                    Legend
                  </h4>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <span
                        className='inline-block w-5 h-5 rounded-full border-2'
                        style={{
                          background: 'hsl(var(--primary))',
                          borderColor: 'hsl(var(--primary-foreground))',
                          borderStyle: 'solid',
                          borderWidth: '2px',
                        }}
                      >
                      </span>
                      <span className='text-sm text-foreground'>
                        Internal Markdown Node
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span
                        className='inline-block w-5 h-5 rounded-full border-2'
                        style={{
                          background: 'hsl(var(--destructive))',
                          borderColor: 'hsl(var(--destructive-foreground))',
                          borderStyle: 'solid',
                          borderWidth: '2px',
                        }}
                      >
                      </span>
                      <span className='text-sm text-foreground'>
                        External Link Node
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='text-sm font-semibold text-foreground mb-2'>
                    Controls
                  </h4>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>🔍</span>
                      <span className='text-sm text-foreground'>
                        Scroll to <b>zoom</b> in/out
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>✋</span>
                      <span className='text-sm text-foreground'>
                        Drag background to <b>pan</b>
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>🖱</span>
                      <span className='text-sm text-foreground'>
                        Drag node to reposition
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'graphs' && (
              <div className='space-y-2'>
                <div className='text-xs text-muted-foreground mb-3'>
                  Switch between available graphs:
                </div>
                {GRAPH_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setLocation(`/graph/${opt.key}`)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-all border-none outline-none flex items-center justify-between ${
                      params.graphId === opt.key
                        ? 'bg-primary/20 text-primary-foreground border border-primary/30'
                        : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium'>{opt.name}</span>
                      <span className='text-xs text-muted-foreground'>
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
                  className='text-sm text-muted-foreground hover:text-foreground bg-card px-2 py-1 rounded-md transition-all border-none outline-none flex items-center gap-2'
                  onClick={toggle}
                >
                  <span className='text-lg'>🔍</span>
                  {enabled ? ' Disable React Scan' : ' Enable React Scan'}
                </button>
                <button
                  className='text-sm text-muted-foreground hover:text-foreground bg-card px-2 py-1 rounded-md transition-all border-none outline-none flex items-center gap-2'
                  onClick={handleRecenter}
                >
                  <span className='text-lg'>🔄</span> Recenter
                </button>
              </div>
            )}
          </div>
        )}
        <button
          className={`mb-2 px-4 py-2 rounded-full bg-card text-foreground transition-all border-none outline-none ${
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
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
          <div className='text-center'>
            <h2 className='text-xl font-bold mb-2'>Page Not Found</h2>
            <button
              onClick={() => window.location.href = '/'}
              className='text-blue-500 hover:text-blue-400 underline'
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
