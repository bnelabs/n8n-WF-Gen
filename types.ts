
export interface N8nNodeParameter {
  [key: string]: any;
}

export interface N8nNode {
  parameters: N8nNodeParameter;
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  credentials?: object; // Optional credentials
}

export interface N8nConnectionDetail {
  node: string;
  type: string;
}

export interface N8nOutputConnections {
  [outputName: string]: N8nConnectionDetail[][];
}

export interface N8nConnections {
  [sourceNodeId: string]: N8nOutputConnections;
}

export interface N8nWorkflow {
  name: string;
  nodes: N8nNode[];
  connections: N8nConnections;
  active: boolean;
  settings: object;
  id: string;
  meta?: object;
  tags?: string[];
}

// For Gemini API response parsing (might be used internally if structure is complex)
export interface GroundingChunkWeb {
  uri: string;
  title: string;
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
  retrievedContext?: {
    uri: string;
    title: string;
  };
}
export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  searchQueries?: string[];
}
export interface Candidate {
  groundingMetadata?: GroundingMetadata;
  // other candidate properties
}
export interface GenerateContentResponse {
  text: string; // Simplified for this app, actual response is more complex
  candidates?: Candidate[]; 
}
