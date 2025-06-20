import { useEffect, useMemo, useRef, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import privateersclubData from '../data/privateersclub.json';
import wotakuData from '../data/wotaku.json';
import { ErrorBoundary } from './components/error-boundary';
import GraphView from './components/graph';
import type { Graph } from './components/graph/types';
import { Button } from './components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
          <Card className='w-72 shadow-lg font-sans'>
            <CardContent className='pt-2 px-4 pb-4'> {/* Adjusted padding */}
              <Tabs
                defaultValue='info'
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as 'info' | 'developer' | 'graphs')}
              >
                <TabsList className='grid w-full grid-cols-3 mb-4 border-b border-border bg-transparent p-0 gap-x-2'>
                  <TabsTrigger
                    value='info'
                    className='bg-transparent text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2 focus-visible:ring-0 focus-visible:ring-offset-0'
                  >
                    Info
                  </TabsTrigger>
                  <TabsTrigger
                    value='graphs'
                    className='bg-transparent text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2 focus-visible:ring-0 focus-visible:ring-offset-0'
                  >
                    Graphs
                  </TabsTrigger>
                  <TabsTrigger
                    value='developer'
                    className='bg-transparent text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2 focus-visible:ring-0 focus-visible:ring-offset-0'
                  >
                    Developer
                  </TabsTrigger>
                </TabsList>
                <TabsContent value='info'>
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
                              borderColor:
                                'hsl(var(--destructive-foreground))',
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
                </TabsContent>
                <TabsContent value='graphs'>
                  <div className='space-y-2'>
                    <div className='text-xs text-muted-foreground mb-3'>
                      Switch between available graphs:
                    </div>
                    {GRAPH_OPTIONS.map((opt) => (
                      <Button
                        key={opt.key}
                        variant={params.graphId === opt.key ? undefined : 'ghost'}
                        onClick={() => setLocation(`/graph/${opt.key}`)}
                        className={`w-full justify-between py-2.5 h-auto ${
                          params.graphId === opt.key
                            ? 'bg-green-600 text-primary-foreground hover:bg-green-700'
                            : ''
                        }`}
                      >
                        <div className='flex flex-col text-left'> {/* Ensure text aligns left */}
                          <span className='text-sm font-medium'>
                            {opt.name}
                          </span>
                          <span className='text-xs text-muted-foreground'>
                            {opt.data.nodesCount} nodes
                          </span>
                        </div>
                        {params.graphId === opt.key && (
                          <span className='text-xs'>✓</span>
                        )}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value='developer'>
                  <div className='space-y-2 flex flex-col gap-2'>
                    <Button
                      variant='outline'
                      onClick={handleRecenter}
                      className='w-full flex items-center gap-2'
                    >
                      <span className='text-lg'>🔄</span> Recenter
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowInfo((v) => !v)}
          aria-label={showInfo ? 'Hide info panel' : 'Show info panel'}
          className={showInfo ? "mt-2" : ""} // Add margin top if panel is shown
        >
          {showInfo ? 'Hide' : 'Show'}
        </Button>
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
