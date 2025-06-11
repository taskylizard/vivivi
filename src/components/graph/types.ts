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

export interface Graph {
	nodes: Node[];
	links: Link[];
}