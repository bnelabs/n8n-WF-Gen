/**
 * Enhanced Workflow Generator
 * Main orchestrator that combines intent detection, node selection, AI generation, validation, and post-processing
 */

import { GoogleGenAI, GenerateContentResponse as GeminiGenerateContentResponse } from "@google/genai";
import { N8nWorkflow } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';
import { detectIntent, getIntentSummary } from './intentDetection';
import { selectNodesForIntent, getRecommendationSummary } from './nodeSelector';
import { processWorkflow, ProcessingReport, getDetailedReport } from './postProcessors/workflowProcessor';
import { NODE_REGISTRY } from './registry/nodeRegistry';

const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

export interface GenerationResult {
  workflow: N8nWorkflow;
  processingReport: ProcessingReport;
  intentAnalysis: string;
  nodeRecommendations: string;
  success: boolean;
  error?: string;
}

// Enhanced system instruction with comprehensive node registry
const ENHANCED_SYSTEM_INSTRUCTION = `You are an expert n8n workflow designer with deep knowledge of all n8n nodes and best practices.

## YOUR TASK
Generate a valid, functional n8n workflow JSON from the user's description. The workflow MUST have:
1. Properly connected nodes (NO orphaned nodes)
2. Correct node types from the registry below
3. Complete, functional parameters for each node
4. Logical flow from trigger to actions

## JSON STRUCTURE REQUIREMENTS

Output MUST be a single, valid JSON object (no markdown, no explanations):

{
  "name": "Descriptive Workflow Name",
  "nodes": [ /* array of node objects */ ],
  "connections": { /* connection mappings */ },
  "active": false,
  "settings": {},
  "id": "workflow_unique_id",
  "meta": { "instanceId": "generated" },
  "tags": []
}

## NODE OBJECT STRUCTURE

Each node MUST have:
{
  "parameters": { /* REQUIRED: node-specific config, NEVER empty {} */ },
  "id": "unique_node_id",
  "name": "Descriptive Node Name",
  "type": "n8n-nodes-base.nodeType",
  "typeVersion": 1,
  "position": [x, y]  // Sequential: [250, 300], [450, 300], [650, 300]
}

## CONNECTION RULES - CRITICAL!

Connections map source node ID → outputs → target nodes.

**Sequential Flow (MOST IMPORTANT):**
"connections": {
  "node_1": {
    "main": [[{ "node": "node_2", "type": "main" }]]
  },
  "node_2": {
    "main": [[{ "node": "node_3", "type": "main" }]]
  }
}

**IF Node (Conditional):**
"IfNodeId": {
  "main": [
    [{ "node": "TrueNodeId", "type": "main" }],   // output 0 (true)
    [{ "node": "FalseNodeId", "type": "main" }]   // output 1 (false)
  ]
}

**RULES:**
- EVERY node (except last) MUST have outgoing connection
- EVERY node (except trigger) MUST have incoming connection
- All node IDs in connections MUST exist in nodes array
- NO orphaned nodes allowed

## N8N NODE REGISTRY

### TRIGGER NODES (Start workflows)

**n8n-nodes-base.start** - Manual start (default)
  parameters: {}

**n8n-nodes-base.webhook** - HTTP endpoint
  parameters: {
    "httpMethod": "POST" | "GET",
    "path": "webhook-path",
    "responseMode": "onReceived"
  }

**n8n-nodes-base.scheduleTrigger** - Schedule/cron
  parameters: {
    "rule": { "interval": [{ "field": "hours", "hoursInterval": 1 }] }
  }

**n8n-nodes-base.shopifyTrigger** - Shopify events
  parameters: {
    "topic": "orders/create" | "products/create" | "customers/create"
  }

### INTEGRATION NODES (Services)

**n8n-nodes-base.shopify** - Shopify store operations
  parameters: {
    "resource": "order" | "product" | "customer",
    "operation": "get" | "getAll" | "create" | "update"
  }

**n8n-nodes-base.hubspot** - HubSpot CRM
  parameters: {
    "resource": "contact" | "company" | "deal",
    "operation": "get" | "getAll" | "create" | "update"
  }

**n8n-nodes-base.salesforce** - Salesforce CRM
  parameters: {
    "resource": "lead" | "contact" | "account" | "opportunity",
    "operation": "get" | "getAll" | "create" | "update"
  }

**n8n-nodes-base.slack** - Slack messaging
  parameters: {
    "resource": "message",
    "operation": "post",
    "channel": "{{$json[\\"channel\\"] || \\"#general\\"}}",
    "text": "{{$json[\\"message\\"] || \\"Notification from n8n\\"}}"
  }

**n8n-nodes-base.gmail** - Gmail email
  parameters: {
    "resource": "message",
    "operation": "send",
    "to": "{{$json[\\"email\\"] || \\"user@example.com\\"}}",
    "subject": "{{$json[\\"subject\\"] || \\"Email Subject\\"}}",
    "message": "{{$json[\\"body\\"] || \\"Email content\\"}}"
  }

**n8n-nodes-base.sendGrid** - SendGrid email
  parameters: {
    "resource": "mail",
    "operation": "send",
    "to": "{{$json[\\"email\\"] || \\"recipient@example.com\\"}}",
    "subject": "{{$json[\\"subject\\"] || \\"Subject\\"}}",
    "content": "{{$json[\\"message\\"] || \\"Content\\"}}"
  }

**n8n-nodes-base.googleSheets** - Google Sheets
  parameters: {
    "resource": "spreadsheet",
    "operation": "append" | "read" | "update",
    "documentId": "{{$json[\\"sheetId\\"] || \\"YOUR_SHEET_ID\\"}}",
    "sheetName": "Sheet1"
  }

**n8n-nodes-base.airtable** - Airtable database
  parameters: {
    "operation": "list" | "create" | "update",
    "baseId": "{{$json[\\"baseId\\"] || \\"appXXXXXXXXXXXXXX\\"}}",
    "table": "Table 1"
  }

**n8n-nodes-base.notion** - Notion workspace
  parameters: {
    "resource": "page" | "database",
    "operation": "get" | "create" | "update"
  }

**n8n-nodes-base.httpRequest** - Generic HTTP API (use only if no specific node exists)
  parameters: {
    "url": "{{$json[\\"url\\"] || \\"https://api.example.com/endpoint\\"}}",
    "method": "GET" | "POST" | "PUT" | "DELETE",
    "authentication": "none",
    "sendHeaders": false,
    "sendBody": false
  }

### LOGIC & CONTROL NODES

**n8n-nodes-base.if** - Conditional routing
  parameters: {
    "conditions": {
      "boolean": [],
      "number": [
        {
          "value1": "={{$json[\\"status\\"]}}",
          "operation": "equal",
          "value2": "completed"
        }
      ],
      "string": []
    },
    "combineOperation": "all"
  }

**n8n-nodes-base.switch** - Multiple branches
  parameters: {
    "mode": "rules",
    "rules": {
      "rules": [
        {
          "output": 0,
          "conditions": { /* similar to IF */ }
        }
      ]
    }
  }

**n8n-nodes-base.merge** - Merge data streams
  parameters: {
    "mode": "append" | "keepKeyMatches" | "mergeByIndex"
  }

### DATA MANIPULATION NODES

**n8n-nodes-base.set** - Set/modify fields
  parameters: {
    "mode": "manual",
    "values": {
      "string": [
        {
          "name": "newField",
          "value": "={{$json[\\"sourceField\\"]}}"
        }
      ]
    }
  }

**n8n-nodes-base.code** - Custom JavaScript
  parameters: {
    "mode": "runOnceForAllItems",
    "jsCode": "// Process items\\nfor (const item of items) {\\n  // Your code\\n}\\nreturn items;"
  }

**n8n-nodes-base.filter** - Filter items
  parameters: {
    "conditions": { /* similar to IF */ }
  }

**n8n-nodes-base.itemLists** - List operations
  parameters: {
    "operation": "splitOutItems" | "aggregateItems" | "sortItems"
  }

## PARAMETER BEST PRACTICES

1. **NEVER use empty parameters {}** - Always include required fields
2. **Use expressions for dynamic data**: \`"={{$json[\\"fieldName\\"]}}" \`
3. **Provide fallback values**: \`"={{$json[\\"email\\"] || \\"default@example.com\\"}}"\`
4. **Use realistic placeholders**: "YOUR_API_KEY", "YOUR_SHEET_ID", etc.

## NODE SELECTION RULES

1. **Prefer specific integration nodes** over httpRequest (e.g., use \`shopify\` not \`httpRequest\`)
2. **Match trigger to description**:
   - "When X happens" → Use specific trigger (webhook, shopifyTrigger)
   - "Every day/hour" → Use scheduleTrigger
   - "Manually" or unspecified → Use start
3. **Use appropriate logic nodes**:
   - Single condition → IF
   - Multiple conditions → Switch
   - Filter items → Filter node

## EXAMPLES

**Example 1: Simple Sequential Flow**
User: "When Shopify order arrives, send Slack notification"
\`\`\`json
{
  "name": "Shopify Order to Slack",
  "nodes": [
    {
      "parameters": { "topic": "orders/create" },
      "id": "trigger",
      "name": "Shopify Order Trigger",
      "type": "n8n-nodes-base.shopifyTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "post",
        "channel": "#orders",
        "text": "New order: {{$json[\\"order_number\\"]}}"
      },
      "id": "slack",
      "name": "Send to Slack",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ],
  "connections": {
    "trigger": {
      "main": [[{ "node": "slack", "type": "main" }]]
    }
  },
  "active": false,
  "settings": {},
  "id": "workflow_001",
  "meta": { "instanceId": "generated" },
  "tags": []
}
\`\`\`

**Example 2: Conditional Flow**
User: "Get customer data, if status is active send email, otherwise send Slack message"
\`\`\`json
{
  "name": "Customer Status Routing",
  "nodes": [
    {
      "parameters": {},
      "id": "start",
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "resource": "contact",
        "operation": "get"
      },
      "id": "getData",
      "name": "Get Customer",
      "type": "n8n-nodes-base.hubspot",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [],
          "number": [],
          "string": [
            {
              "value1": "={{$json[\\"status\\"]}}",
              "operation": "equal",
              "value2": "active"
            }
          ]
        }
      },
      "id": "checkStatus",
      "name": "Check Status",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "send",
        "to": "={{$json[\\"email\\"]}}",
        "subject": "Welcome Active Customer",
        "message": "Thank you for being active!"
      },
      "id": "sendEmail",
      "name": "Send Email",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 1,
      "position": [850, 200]
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "post",
        "channel": "#inactive",
        "text": "Inactive customer: {{$json[\\"name\\"]}}"
      },
      "id": "sendSlack",
      "name": "Send Slack",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [850, 400]
    }
  ],
  "connections": {
    "start": {
      "main": [[{ "node": "getData", "type": "main" }]]
    },
    "getData": {
      "main": [[{ "node": "checkStatus", "type": "main" }]]
    },
    "checkStatus": {
      "main": [
        [{ "node": "sendEmail", "type": "main" }],
        [{ "node": "sendSlack", "type": "main" }]
      ]
    }
  },
  "active": false,
  "settings": {},
  "id": "workflow_002",
  "meta": { "instanceId": "generated" },
  "tags": []
}
\`\`\`

## FINAL CHECKLIST

Before returning JSON, verify:
✓ All nodes have complete parameters (not {})
✓ All nodes are connected (no orphans)
✓ All connection targets exist in nodes array
✓ Trigger node is first and connected
✓ JSON is valid (no trailing commas, proper quotes)
✓ Using specific nodes (not generic httpRequest when specific node exists)

Return ONLY the JSON object, no markdown, no explanations.`;

export async function generateEnhancedWorkflow(description: string): Promise<GenerationResult> {
  try {
    // Step 1: Detect intent
    console.log('Step 1: Analyzing user intent...');
    const intent = detectIntent(description);
    const intentAnalysis = getIntentSummary(intent);
    console.log('Intent Analysis:\n', intentAnalysis);

    // Step 2: Select recommended nodes
    console.log('\nStep 2: Selecting appropriate nodes...');
    const recommendations = selectNodesForIntent(intent);
    const nodeRecommendations = getRecommendationSummary(recommendations);
    console.log('Node Recommendations:\n', nodeRecommendations);

    // Step 3: Build enhanced prompt with recommendations
    const enhancedPrompt = buildEnhancedPrompt(description, intent, recommendations);

    // Step 4: Generate workflow with AI
    console.log('\nStep 3: Generating workflow with AI...');
    const workflow = await callGeminiAPI(enhancedPrompt);

    // Step 5: Validate and auto-fix
    console.log('\nStep 4: Validating and auto-fixing workflow...');
    const processingReport = processWorkflow(workflow, true);

    console.log('\nProcessing Report:\n', processingReport.summary);

    return {
      workflow,
      processingReport,
      intentAnalysis,
      nodeRecommendations,
      success: true,
    };
  } catch (error) {
    console.error('Error in enhanced workflow generation:', error);
    return {
      workflow: {} as N8nWorkflow,
      processingReport: {} as ProcessingReport,
      intentAnalysis: '',
      nodeRecommendations: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function buildEnhancedPrompt(description: string, intent: any, recommendations: any[]): string {
  let prompt = `User's workflow description:\n${description}\n\n`;

  if (recommendations.length > 0) {
    prompt += `RECOMMENDED NODES (prioritize these):\n`;
    recommendations.forEach(rec => {
      prompt += `- ${rec.nodeDef.displayName} (${rec.nodeType}): ${rec.reason}\n`;
    });
    prompt += '\n';
  }

  if (intent.trigger.type !== 'manual') {
    prompt += `TRIGGER TYPE: ${intent.trigger.type}\n`;
  }

  if (intent.services.length > 0) {
    prompt += `SERVICES DETECTED: ${intent.services.map((s: any) => s.name).join(', ')}\n`;
  }

  prompt += '\nn8n Workflow JSON:';

  return prompt;
}

async function callGeminiAPI(prompt: string): Promise<N8nWorkflow> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY is not configured. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response: GeminiGenerateContentResponse = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: ENHANCED_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      temperature: 0.2, // Lower temperature for more consistent output
      topP: 0.9,
      topK: 32,
    }
  });

  let jsonStr = response.text.trim();

  // Remove Markdown fences if present
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  // Parse JSON
  const parsedData = JSON.parse(jsonStr);

  // Basic validation
  if (!parsedData.nodes || !parsedData.connections) {
    throw new Error("Generated JSON is missing essential 'nodes' or 'connections' properties.");
  }

  return parsedData as N8nWorkflow;
}
