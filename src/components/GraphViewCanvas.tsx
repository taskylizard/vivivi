import React, {
	useRef,
	useEffect,
	useImperativeHandle,
	forwardRef,
	useCallback,
} from "react";
import * as d3 from "d3";

export interface Node {
	id: string;
	isExternal: boolean;
	x?: number;
	y?: number;
	fx?: number;
	fy?: number;
}

export interface Link {
	source: string | Node;
	target: string | Node;
}

interface GraphViewCanvasProps {
	nodes: Node[];
	links: Link[];
}

const GraphViewCanvas = forwardRef<
	{ recenter: () => void },
	GraphViewCanvasProps
>(({ nodes, links }, ref) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const workerRef = useRef<Worker | null>(null);
	const zoomRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>(
		null,
	);
	const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
	const nodePositions = useRef<Node[]>([]);
	const [tooltip, setTooltip] = React.useState<{
		x: number;
		y: number;
		content: string;
		visible: boolean;
	}>({ x: 0, y: 0, content: "", visible: false });
	const draggingNodeId = useRef<string | null>(null);

	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.save();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.translate(transformRef.current.x, transformRef.current.y);
		ctx.scale(transformRef.current.k, transformRef.current.k);
		const getVar = (v: string) =>
			getComputedStyle(document.documentElement).getPropertyValue(v).trim();
		const primary = getVar("--primary") || "#2563eb";
		const primaryFg = getVar("--primary-foreground") || "#fff";
		const destructive = getVar("--destructive") || "#e11d48";
		const destructiveFg = getVar("--destructive-foreground") || "#fff";
		ctx.strokeStyle = "#aaa";
		ctx.globalAlpha = 0.7;
		for (const link of links) {
			const source =
				typeof link.source === "object"
					? link.source
					: nodePositions.current.find((n) => n.id === link.source);
			const target =
				typeof link.target === "object"
					? link.target
					: nodePositions.current.find((n) => n.id === link.target);
			if (!source || !target) continue;
			ctx.beginPath();
			ctx.moveTo(source.x ?? 0, source.y ?? 0);
			ctx.lineTo(target.x ?? 0, target.y ?? 0);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
		for (const node of nodePositions.current) {
			ctx.beginPath();
			ctx.arc(node.x ?? 0, node.y ?? 0, 10, 0, 2 * Math.PI);
			ctx.fillStyle = node.isExternal
				? `hsl(${destructive})`
				: `hsl(${primary})`;
			ctx.strokeStyle = node.isExternal
				? `hsl(${destructiveFg})`
				: `hsl(${primaryFg})`;
			ctx.lineWidth = 2;
			ctx.fill();
			ctx.stroke();
		}
		ctx.restore();
	}, [links, nodePositions]);

	useEffect(() => {
		let worker: Worker | null = null;
		let cancelled = false;
		(async () => {
			const GraphWorker = (await import("./graphWorker?worker")).default;
			if (cancelled) return;
			worker = new GraphWorker();
			workerRef.current = worker;
			worker.postMessage({ type: "init", nodes, links });
			worker.onmessage = (e: MessageEvent) => {
				if (e.data.type === "tick") {
					nodePositions.current = e.data.nodes;
					draw();
				}
			};
		})();
		return () => {
			cancelled = true;
			workerRef.current?.terminate();
		};
	}, [nodes, links, draw]);

	useEffect(() => {
		if (!canvasRef.current) return;
		const zoom = d3
			.zoom<HTMLCanvasElement, unknown>()
			.scaleExtent([0.1, 4])
			.on("zoom", (event) => {
				transformRef.current = event.transform;
				draw();
			});
		d3.select<HTMLCanvasElement, unknown>(canvasRef.current).call(zoom);
		zoomRef.current = zoom;
	}, [draw]);

	useImperativeHandle(ref, () => ({
		recenter: () => {
			if (!canvasRef.current || !zoomRef.current) return;
			d3.select<HTMLCanvasElement, unknown>(canvasRef.current)
				.transition()
				.duration(500)
				.call(zoomRef.current.transform, d3.zoomIdentity);
		},
	}));

	useEffect(() => {
		const handleResize = () => {
			if (!canvasRef.current) return;
			canvasRef.current.width = window.innerWidth;
			canvasRef.current.height = window.innerHeight;
			draw();
		};
		window.addEventListener("resize", handleResize);
		handleResize();
		return () => window.removeEventListener("resize", handleResize);
	}, [draw]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		let dragging = false;
		let dragOffset = { x: 0, y: 0 };
		const handleMouseDown = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x =
				(e.clientX - rect.left - transformRef.current.x) /
				transformRef.current.k;
			const y =
				(e.clientY - rect.top - transformRef.current.y) /
				transformRef.current.k;
			const found = nodePositions.current.find(
				(n) => Math.hypot((n.x ?? 0) - x, (n.y ?? 0) - y) < 12,
			);
			if (found) {
				dragging = true;
				draggingNodeId.current = found.id;
				dragOffset = { x: (found.x ?? 0) - x, y: (found.y ?? 0) - y };
				canvas.style.cursor = "grabbing";
			}
		};
		const handleMouseMove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x =
				(e.clientX - rect.left - transformRef.current.x) /
				transformRef.current.k;
			const y =
				(e.clientY - rect.top - transformRef.current.y) /
				transformRef.current.k;
			if (dragging && draggingNodeId.current && workerRef.current) {
				workerRef.current.postMessage({
					type: "drag",
					nodeId: draggingNodeId.current,
					x: x + dragOffset.x,
					y: y + dragOffset.y,
				});
			} else {
				const found = nodePositions.current.find(
					(n) => Math.hypot((n.x ?? 0) - x, (n.y ?? 0) - y) < 12,
				);
				if (found) {
					setTooltip({
						x: e.clientX - rect.left,
						y: e.clientY - rect.top,
						content: found.id,
						visible: true,
					});
				} else {
					setTooltip((t) => (t.visible ? { ...t, visible: false } : t));
				}
			}
		};
		const handleMouseUp = () => {
			if (dragging && draggingNodeId.current && workerRef.current) {
				workerRef.current.postMessage({
					type: "dragEnd",
					nodeId: draggingNodeId.current,
				});
			}
			dragging = false;
			draggingNodeId.current = null;
			if (canvas) canvas.style.cursor = "";
		};
		canvas.addEventListener("mousedown", handleMouseDown);
		canvas.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			canvas.removeEventListener("mousedown", handleMouseDown);
			canvas.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, []);

	useEffect(() => {
		draw();
	}, [draw]);

	return (
		<div ref={containerRef} style={{ position: "fixed", inset: 0 }}>
			<canvas
				ref={canvasRef}
				style={{ width: "100vw", height: "100vh", display: "block" }}
			/>
			{tooltip.visible && (
				<div
					style={{
						position: "absolute",
						left: tooltip.x + 10,
						top: tooltip.y - 10,
						pointerEvents: "none",
						background: "#222",
						color: "#fff",
						padding: 6,
						borderRadius: 6,
						fontSize: 13,
						zIndex: 10,
					}}
				>
					{tooltip.content}
				</div>
			)}
		</div>
	);
});
GraphViewCanvas.displayName = "GraphViewCanvas";

export default GraphViewCanvas;
