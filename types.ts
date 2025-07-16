
export type DeviceType = 'router' | 'switch' | 'pc' | 'server' | 'firewall' | 'cloud' | 'subnet';

export interface CytoscapeNodeData {
  id: string;
  label: string;
  type: DeviceType;
  ip?: string;
  parent?: string;
}

export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
  sourceIp?: string;
  targetIp?: string;
  label?: string;
}

export interface CytoscapeData {
  nodes: { data: CytoscapeNodeData }[];
  edges: { data: CytoscapeEdgeData }[];
}

export interface AIResponse {
  description: string;
  cytoscapeData: CytoscapeData;
}