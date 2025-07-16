
import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL } from '../constants';
import type { TopologyData } from '../types';

const schema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      description: "A list of all network devices.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "A unique, lower-case, no-space identifier for the node (e.g., 'router1')."
          },
          name: {
            type: Type.STRING,
            description: "The original name of the device (e.g., 'Router 1')."
          },
          type: {
            type: Type.STRING,
            enum: ["router", "switch", "server", "pc", "cloud", "firewall", "unknown"],
            description: "The type of the device."
          }
        },
        required: ["id", "name", "type"]
      }
    },
    links: {
      type: Type.ARRAY,
      description: "A list of connections between devices.",
      items: {
        type: Type.OBJECT,
        properties: {
          source: {
            type: Type.STRING,
            description: "The 'id' of the source node for the connection."
          },
          target: {
            type: Type.STRING,
            description: "The 'id' of the target node for the connection."
          }
        },
        required: ["source", "target"]
      }
    }
  },
  required: ["nodes", "links"]
};

const systemInstruction = `You are an expert network engineer. Your task is to analyze a user's description of a network and convert it into a structured JSON object representing the network topology. The JSON object must contain two arrays: 'nodes' and 'links'.

- 'nodes': Each node must have a unique 'id' (a short, lower-case, no-space version of its name), a 'name' (the original name from the description), and a 'type'.
- Node 'type' must be one of the following: "router", "switch", "server", "pc", "cloud", "firewall", "unknown". Infer the type from the device name or context. Use 'unknown' if the type cannot be determined.
- 'links': Each link represents a connection between two nodes. It must have a 'source' and a 'target', which correspond to the 'id' of the connected nodes.

Carefully parse the user's input to identify all devices and their connections. Generate a complete and valid JSON output that strictly adheres to the provided schema. Respond ONLY with the valid JSON object.`;


async function generateWithGemini(apiKey: string, description: string): Promise<TopologyData> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: description,
      config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          systemInstruction: systemInstruction,
      },
  });

  const jsonText = response.text.trim();
  if (!jsonText) {
      throw new Error("AI returned an empty response.");
  }
  return JSON.parse(jsonText) as TopologyData;
}

async function generateWithOpenRouter(apiKey: string, model: string, description: string): Promise<TopologyData> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Please generate the JSON for this description: ${description}` }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const jsonText = data.choices[0]?.message?.content?.trim();
  if (!jsonText) {
    throw new Error("AI returned an empty response from OpenRouter.");
  }
  return JSON.parse(jsonText) as TopologyData;
}


export interface GenerateConfig {
    provider: 'gemini' | 'openrouter';
    apiKey: string;
    model?: string;
    description: string;
}

export async function generateTopologyData(config: GenerateConfig): Promise<TopologyData> {
  try {
    let data: TopologyData;

    if (config.provider === 'gemini') {
        data = await generateWithGemini(config.apiKey, config.description);
    } else if (config.provider === 'openrouter' && config.model) {
        data = await generateWithOpenRouter(config.apiKey, config.model, config.description);
    } else {
        throw new Error("Invalid provider or missing model for OpenRouter.");
    }
    
    if (!data.nodes || !data.links) {
        throw new Error("Invalid data structure received from AI.");
    }

    return data;
  } catch (error) {
    console.error("Error generating topology data:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate topology from ${config.provider}: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI.");
  }
}
