import { useState, useRef, useEffect, useMemo } from "react";
import privateersclubData from "../data/privateersclub.json";
import wotakuData from "../data/wotaku.json";
import GraphViewCanvas from "./components/GraphViewCanvas";
import { useToggleReactScan } from "./components/react-scan";
import { Spinner } from "./components/ui/spinner";

interface Node {
	id: string;
	isExternal: boolean;
	x?: number;
	y?: number;
	fx?: number;
	fy?: number;
}

interface Link {
	source: string | Node;
	target: string | Node;
}

interface GraphData {
	nodes: Node[];
	links: Link[];
}

const GRAPH_OPTIONS = [
	{
		key: "privateersclub",
		name: "privateersclub",
		data: privateersclubData,
	},
	{
		key: "wotaku",
		name: "Wotaku",
		data: wotakuData,
	},
];

const useGraphData = (selectedGraph: string | null) => {
	const [data, setData] = useState<GraphData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!selectedGraph) return;
		const fetchData = async () => {
			try {
				await new Promise((resolve) => setTimeout(resolve, 5000));
				const graph = GRAPH_OPTIONS.find((g) => g.key === selectedGraph);
				if (!graph) throw new Error("Graph not found");
				setData(graph.data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
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

const App: React.FC = () => {
	const [selectedGraph, setSelectedGraph] = useState<string | null>(null);
	const { data, loading, error } = useGraphData(selectedGraph);
	const [showInfo, setShowInfo] = useState(true);
	const graphViewRef = useRef<{ recenter: () => void }>(null);

	const [enabled, setEnabled] = useState(false);
	const { toggle } = useToggleReactScan({
		mode: "controlled",
		enabled,
		setEnabled,
	});

	// avoid unnecessary re-renders
	const memoizedNodes = useMemo(() => data?.nodes || [], [data]);
	const memoizedLinks = useMemo(() => data?.links || [], [data]);

	if (!selectedGraph) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
				<div className="relative w-full max-w-md mx-auto p-8 flex flex-col items-center gap-6">
					<h2 className="text-xl text-foreground font-mono">vivivi</h2>

					<div className="bg-[#eda33b]/25 text-white p-4 w-full rounded font-sans">
						<div className="text-xs">
							<span className="font-bold">{"⚠️"} warning: </span>
							Large graphs may crash or severely lag your browser. Proceed with
							caution.
						</div>
					</div>

					<div className="flex flex-col gap-2 w-full text-center">
						{GRAPH_OPTIONS.map((opt, i) => (
							<div key={opt.key} className="text-lg">
								<button
									onClick={() => setSelectedGraph(opt.key)}
									className="appearance-none bg-transparent border-none p-0 m-0 text-white/70 hover:text-white underline transition-colors cursor-pointer"
								>
									{opt.name}
								</button>
							</div>
						))}
					</div>
				</div>
				<footer className="absolute bottom-4 text-xs text-muted-foreground font-sans text-center w-full">
  <p>
    <a
      href="https://github.com/taskylizard/vivivi"
      target="_blank"
      rel="noopener noreferrer"
      className="appearance-none text-white/70 hover:text-white underline transition-colors cursor-pointer"
    >
      source code
    </a>{' '}
    • built by <span className="font-semibold">taskylizard</span>
  </p>
</footer>
			</div>

		);
	}
	if (loading) {
		return (
			<div className="h-screen flex items-center justify-center dark">
				<div className="text-center">
					<Spinner size="sm" className="bg-black dark:bg-white" />
					<p className="mt-4 text-muted-foreground">Loading graph data...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 h-screen flex items-center justify-center dark">
				<div className="text-center bg-card p-8 rounded-lg border">
					<h2 className="text-xl font-bold mb-2">Error loading graph</h2>
					<p className="text-destructive">{error}</p>
				</div>
			</div>
		);
	}

	if (!data) return null;

	return (
		<div className="min-h-screen bg-dotted-[neutral-200/60] font-mono">
			<GraphViewCanvas
				ref={graphViewRef}
				nodes={memoizedNodes}
				links={memoizedLinks}
			/>

			<div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
				{showInfo && (
					<div className="w-72 bg-card/80 backdrop-blur border border-border rounded-xl shadow-2xl p-5 flex flex-col gap-4">
						<div className="font-extrabold text-xl text-foreground mb-1">
							Controls • Legend
						</div>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<span
									className="inline-block w-5 h-5 rounded-full border-2"
									style={{
										background: "hsl(var(--primary))",
										borderColor: "hsl(var(--primary-foreground))",
										borderStyle: "solid",
										borderWidth: "2px",
									}}
								></span>
								<span className="text-base text-foreground">
									Internal Markdown Node
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span
									className="inline-block w-5 h-5 rounded-full border-2"
									style={{
										background: "hsl(var(--destructive))",
										borderColor: "hsl(var(--destructive-foreground))",
										borderStyle: "solid",
										borderWidth: "2px",
									}}
								></span>
								<span className="text-base text-foreground">
									External Link Node
								</span>
							</div>
						</div>
						<hr className="my-2 border-border" />
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<span className="text-lg">🔍</span>
								<span className="text-base text-foreground">
									Scroll to <b>zoom</b> in/out
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-lg">✋</span>
								<span className="text-base text-foreground">
									Drag background to <b>pan</b>
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-lg">🖱</span>
								<span className="text-base text-foreground">
									Drag node to reposition
								</span>
							</div>
						</div>
						<hr className="my-2 border-border" />
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<span className="text-lg">📋</span>
								<button onClick={toggle}>
									{enabled ? "Disable" : "Enable"} React Scan
								</button>
								<span className="text-base text-foreground">
									Toggle <b>React Scan</b>
								</span>
							</div>
						</div>
					</div>
				)}
				<button
					className={`mb-2 px-4 py-2 rounded-full bg-card text-foreground transition-all border-none outline-none ${showInfo ? "opacity-70" : "opacity-100"}`}
					onClick={() => setShowInfo((v) => !v)}
					aria-label={showInfo ? "Hide info panel" : "Show info panel"}
				>
					{showInfo ? (
						<span className="font-semibold text-sm">Hide</span>
					) : (
						<span className="font-semibold text-sm">Show</span>
					)}
				</button>
			</div>
		</div>
	);
};

export default App;
