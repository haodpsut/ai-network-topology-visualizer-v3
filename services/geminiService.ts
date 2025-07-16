
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, CytoscapeData, CytoscapeEdgeData, CytoscapeNodeData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "A detailed, bullet-point description of the proposed topology, including device counts, connection types, and IP addressing strategy."
    },
    cytoscapeData: {
      type: Type.OBJECT,
      properties: {
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique node identifier. For devices, same as label (e.g., 'R1'). For subnets, the network CIDR (e.g., '192.168.10.0/24')." },
              label: { type: Type.STRING, description: "Device name or network address. E.g., R1, PC1, '192.168.10.0/24'." },
              type: { type: Type.STRING, description: "Type of the node. Can be 'router', 'switch', 'pc', 'server', 'firewall', 'cloud', or 'subnet'." },
              ip: { type: Type.STRING, description: "Assigned IP address with CIDR. ONLY for end devices like 'pc' or 'server'. E.g., '192.168.1.10/24'. Optional." },
              parent: { type: Type.STRING, description: "For device nodes, the 'id' of the 'subnet' parent node they belong to. Optional." }
            },
            required: ["id", "label", "type"]
          }
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique edge identifier. E.g., 'R1-S1'." },
              source: { type: Type.STRING, description: "The id of the source node." },
              target: { type: Type.STRING, description: "The id of the target node." },
              sourceLabel: { type: Type.STRING, description: "Interface name on the source device. E.g., 'G0/1'." },
              targetLabel: { type: Type.STRING, description: "Interface name on the target device. E.g., 'F0/2'." },
              sourceIp: { type: Type.STRING, description: "IP address with CIDR for the source interface, if applicable (e.g., on a router or firewall). Optional." },
              targetIp: { type: Type.STRING, description: "IP address with CIDR for the target interface, if applicable. Optional." },
              label: { type: Type.STRING, description: "For point-to-point links (e.g. router-to-router), the network address. E.g., '10.0.0.0/30'. Optional." }
            },
            required: ["id", "source", "target", "sourceLabel", "targetLabel"]
          }
        }
      },
      required: ["nodes", "edges"]
    }
  },
  required: ["description", "cytoscapeData"]
};

export const generateTopology = async (userInput: string): Promise<AIResponse> => {
  const prompt = `
    Act as a senior network engineer. Your task is to design a network topology based on the user's request and visualize it using Cytoscape.js data format.

    USER REQUEST: "${userInput}"

    Follow these strict rules:
    1.  **Analyze and Design**: Understand the user's requirements for devices, connectivity, and structure. Devise a logical IP addressing scheme if one isn't provided.
    2.  **Device Naming**: Use standard abbreviations: 'R' for routers (R1, R2), 'S' for switches (S1, S2), 'PC' for PCs (PC1, PC2), 'SRV' for servers, 'FW' for firewalls, 'CLOUD' for the internet.
    3.  **Interface Naming**: Use standard names: GigabitEthernet (G0/0, G0/1), FastEthernet (F0/1, F0/2), Serial (S0/0/0).
    4.  **IP Addressing & Data Structure**:
        *   **LAN Subnets**: For each LAN subnet (e.g., a network with switches and PCs), create a special 'parent' node. This node's 'type' must be 'subnet'. Its 'id' and 'label' must be the network address with CIDR notation (e.g., "192.168.10.0/24").
        *   **Point-to-Point Links**: For links between infrastructure devices like two routers, DO NOT create a 'subnet' parent node for the connecting network. Instead, add a 'label' property directly to the EDGE data object. This label should contain the network's CIDR address (e.g., 'label': "10.1.1.0/30").
        *   **Device Nodes**:
            *   Create nodes for all physical devices.
            *   For devices in a LAN, set their 'parent' property to the 'id' of the corresponding 'subnet' parent node.
            *   Assign full IP addresses ('ip' property) ONLY to end devices ('pc', 'server').
        *   **Edge and Interface IPs**:
            *   On routed interfaces (router, firewall), put the IP address in the 'sourceIp' or 'targetIp' field of the edge data.
            *   Do not add IPs for switch interfaces.
    5.  **Description**: Provide a clear, bulleted summary of your design, detailing the topology, device roles, and the IP scheme.
    6.  **JSON Output**: Generate a single, valid JSON object that strictly conforms to the provided schema.

    Example Node for a PC in a LAN: { "id": "PC1", "label": "PC1", "type": "pc", "ip": "192.168.10.10/24", "parent": "192.168.10.0/24" }
    Example Node for a LAN Subnet: { "id": "192.168.10.0/24", "label": "192.168.10.0/24", "type": "subnet" }
    Example Edge for a Point-to-Point Link: { "id": "R1-R2", "source": "R1", "target": "R2", "label": "10.1.1.0/30", "sourceLabel": "S0/0/0", "targetLabel": "S0/0/0", "sourceIp": "10.1.1.1/30", "targetIp": "10.1.1.2/30" }

    Produce ONLY the JSON object. Do not add any text or formatting around it.
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);
    
    interface RawCytoscapeData {
        nodes: CytoscapeNodeData[];
        edges: CytoscapeEdgeData[];
    }
    
    if (!parsedResponse.description || !parsedResponse.cytoscapeData || !parsedResponse.cytoscapeData.nodes || !parsedResponse.cytoscapeData.edges) {
        throw new Error("AI response is missing required fields.");
    }

    const rawData: RawCytoscapeData = parsedResponse.cytoscapeData;

    const cytoscapeData: CytoscapeData = {
        nodes: rawData.nodes.map(node => ({ data: node })),
        edges: rawData.edges.map(edge => ({ data: edge })),
    };

    return {
        description: parsedResponse.description,
        cytoscapeData: cytoscapeData,
    };

  } catch (error) {
    console.error("Error generating topology:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred with the AI service.";
    throw new Error(`Failed to generate topology. ${errorMessage}`);
  }
};