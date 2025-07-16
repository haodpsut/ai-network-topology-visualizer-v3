
export type NodeType = "router" | "switch" | "server" | "pc" | "cloud" | "firewall" | "unknown";

export interface Node {
  id: string;
  name: string;
  type: NodeType;
}

export interface Link {
  source: string;
  target: string;
}

export interface TopologyData {
  nodes: Node[];
  links: Link[];
}
