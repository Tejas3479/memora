import { GraphNodeType, GraphEdgeType } from '../constants';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  properties: Record<string, unknown>;
  createdAt: Date;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: GraphEdgeType;
  weight?: number;
  properties?: Record<string, unknown>;
  createdAt: Date;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphQueryRequest {
  rootNodeId?: string;
  nodeTypes?: GraphNodeType[];
  depth?: number;
  limit?: number;
}

export interface GraphQueryResponse {
  graph: KnowledgeGraph;
  stats: { nodeCount: number; edgeCount: number };
}
