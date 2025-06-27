
import { GoogleGenAI, GenerateContentResponse as GeminiGenerateContentResponse } from "@google/genai";
import { N8nWorkflow } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';

const getApiKey = (): string | undefined => {
  // In a real build process, process.env.API_KEY would be substituted.
  // For local dev, you might set it in a .env file or similar.
  // Here, we directly reference it as per instructions.
  return process.env.API_KEY;
};


const SYSTEM_INSTRUCTION = `You are an expert n8n workflow designer. Your task is to translate a user's natural language description of a business process or automation task into a valid n8n workflow JSON structure.

The output MUST be a single, valid JSON object representing the n8n workflow. Do not include any other text, explanations, or markdown formatting like \`\`\`json.

The JSON structure must include:
- A top-level 'name' string for the workflow (derived from the user's description, e.g., "Customer Onboarding Automation").
- A 'nodes' array. Each node object must have:
    - 'parameters': An object for node-specific settings (can be empty {} if no specific parameters are needed).
    - 'id': A unique string identifier for the node (e.g., "node_1", "node_2", or a UUID-like string). Ensure these IDs are unique within the workflow.
    - 'name': A descriptive name for the node (e.g., "Get Customer Data", "Send Welcome Email").
    - 'type': The n8n node type (e.g., "n8n-nodes-base.httpRequest", "n8n-nodes-base.if", "n8n-nodes-base.start"). Choose appropriate types based on the description.
    - 'typeVersion': Set to 1.
    - 'position': An array [x, y] with integer coordinates for visual layout (e.g., [250, 300], [450, 300]). Arrange nodes sequentially from left to right, incrementing X by ~200 for each new node.
- A 'connections' object. This object maps a source node's 'id' to its outputs. For simple sequential flows, connect the 'main' output of one node to the 'main' input of the next.
  Example for connecting 'node_1' to 'node_2':
  "connections": {
    "node_1": { "main": [ [ { "node": "node_2", "type": "main" } ] ] }
  }
  For IF nodes (type "n8n-nodes-base.if"), structure connections like:
  "IfNodeId": { "output_0": [ [ { "node": "TrueBranchNodeId", "type": "main" } ] ], "output_1": [ [ { "node": "FalseBranchNodeId", "type": "main" } ] ] }
- 'active': false (boolean)
- 'settings': {} (empty object)
- 'id': A unique workflow ID string (e.g., "workflow_generated_1").
- 'meta': { "instanceId": "aiGeneratedWorkflow" } (object)
- 'tags': [] (empty array or tags derived from description)

Prioritize common n8n nodes:
- Triggers: n8n-nodes-base.start (default starting point for most workflows), n8n-nodes-base.webhook, n8n-nodes-base.cron
- Actions: n8n-nodes-base.httpRequest, n8n-nodes-base.function, n8n-nodes-base.if, n8n-nodes-base.switch, n8n-nodes-base.setItem, n8n-nodes-base.merge, n8n-nodes-base.noOp (No Operation, useful placeholder)
- Integrations (if mentioned by user): n8n-nodes-base.googleSheets, n8n-nodes-base.sendEmail (generic), n8n-nodes-base.slackMsg, etc. Use specific node types if the user mentions a service and a common n8n node exists for it.

Start the workflow with an "n8n-nodes-base.start" node unless a different trigger (like Webhook or Cron) is explicitly requested.
Generate plausible unique IDs for nodes and the workflow itself.
Ensure all node IDs referenced in 'connections' exist in the 'nodes' array.
`;

export const generateWorkflow = async (description: string): Promise<N8nWorkflow> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("API_KEY is not set. Cannot call Gemini API.");
    throw new Error("API_KEY is not configured. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const fullPrompt = `User's workflow description:\n${description}\n\nn8n Workflow JSON:`;

  try {
    const response: GeminiGenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.3, // Lower temperature for more predictable JSON structure
        topP: 0.9,
        topK: 32,
      }
    });

    let jsonStr = response.text.trim();
    
    // Remove Markdown fences if present (safety net, as responseMimeType: "application/json" should prevent this)
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    // Basic validation that it's an object (more thorough validation would use a JSON schema)
    const parsedData = JSON.parse(jsonStr);
    if (typeof parsedData !== 'object' || parsedData === null) {
      throw new Error("Generated content is not a valid JSON object.");
    }
    if (!parsedData.nodes || !parsedData.connections) {
        throw new Error("Generated JSON is missing essential 'nodes' or 'connections' properties.");
    }

    return parsedData as N8nWorkflow;

  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    if (error instanceof Error) {
        // Check for specific Gemini API errors if possible, e.g. based on error codes or messages
        if (error.message.includes("400") || error.message.includes("API key not valid")) {
             throw new Error("Invalid API request or API key issue. Please check your API key and prompt.");
        }
        throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI service.");
  }
};
