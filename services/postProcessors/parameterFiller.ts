/**
 * Parameter Filler
 * Automatically fills missing parameters with sensible defaults or placeholders
 */

import { N8nWorkflow, N8nNode } from '../../types';
import { getNodeByType, NodeDefinition, NodeParameter } from '../registry/nodeRegistry';

export interface ParameterFixReport {
  fixed: boolean;
  changes: string[];
  parametersFilled: number;
}

export function fillMissingParameters(workflow: N8nWorkflow): ParameterFixReport {
  const report: ParameterFixReport = {
    fixed: false,
    changes: [],
    parametersFilled: 0,
  };

  workflow.nodes.forEach(node => {
    fillNodeParameters(node, report);
  });

  return report;
}

function fillNodeParameters(node: N8nNode, report: ParameterFixReport): void {
  // Ensure parameters object exists
  if (!node.parameters) {
    node.parameters = {};
    report.changes.push(`Added parameters object to node "${node.name}"`);
    report.fixed = true;
  }

  const nodeDef = getNodeByType(node.type);
  if (!nodeDef) return; // Can't fill parameters for unknown node types

  // Fill required parameters
  nodeDef.parameters.forEach(paramDef => {
    if (paramDef.required) {
      const currentValue = node.parameters[paramDef.name];

      if (currentValue === undefined || currentValue === null || currentValue === '') {
        const defaultValue = getDefaultParameterValue(paramDef, node, nodeDef);
        node.parameters[paramDef.name] = defaultValue;

        report.changes.push(
          `Set "${paramDef.name}" parameter in node "${node.name}" to ${JSON.stringify(defaultValue)}`
        );
        report.parametersFilled++;
        report.fixed = true;
      }
    }
  });

  // Fill node-specific required parameters
  fillSpecificNodeParameters(node, nodeDef, report);

  // Ensure basic properties
  ensureBasicNodeProperties(node, report);
}

function getDefaultParameterValue(paramDef: NodeParameter, node: N8nNode, nodeDef: NodeDefinition): any {
  // Use defined default if available
  if (paramDef.default !== undefined) {
    return paramDef.default;
  }

  // Generate placeholder based on type
  switch (paramDef.type) {
    case 'string':
      return paramDef.placeholder || getStringPlaceholder(paramDef, nodeDef);

    case 'number':
      return 0;

    case 'boolean':
      return false;

    case 'options':
      return paramDef.options?.[0]?.value || '';

    case 'json':
      return {};

    case 'collection':
    case 'fixedCollection':
      return {};

    default:
      return '';
  }
}

function getStringPlaceholder(paramDef: NodeParameter, nodeDef: NodeDefinition): string {
  const paramName = paramDef.name.toLowerCase();

  // URL placeholders
  if (paramName.includes('url') || paramName.includes('endpoint')) {
    return '{{$json["url"] || "https://api.example.com/endpoint"}}';
  }

  // Email placeholders
  if (paramName.includes('email') || paramName === 'to' || paramName === 'from') {
    return '{{$json["email"] || "user@example.com"}}';
  }

  // ID placeholders
  if (paramName.includes('id') || paramName.includes('documentid') || paramName.includes('baseid')) {
    return '{{$json["id"] || "YOUR_ID_HERE"}}';
  }

  // Channel placeholders
  if (paramName.includes('channel')) {
    return '{{$json["channel"] || "#general"}}';
  }

  // Message/Text placeholders
  if (paramName.includes('message') || paramName.includes('text') || paramName.includes('content') || paramName.includes('body')) {
    return '{{$json["message"] || "Your message here"}}';
  }

  // Subject placeholders
  if (paramName.includes('subject')) {
    return '{{$json["subject"] || "Subject line"}}';
  }

  // Path placeholders
  if (paramName.includes('path')) {
    return paramDef.placeholder || 'webhook-path';
  }

  // API Key placeholders
  if (paramName.includes('apikey') || paramName.includes('api_key')) {
    return '{{$credentials.apiKey}}';
  }

  // Token placeholders
  if (paramName.includes('token')) {
    return '{{$credentials.token}}';
  }

  // Sheet name placeholders
  if (paramName.includes('sheet')) {
    return 'Sheet1';
  }

  // Table name placeholders
  if (paramName.includes('table')) {
    return 'Table 1';
  }

  // Generic placeholder
  return paramDef.placeholder || `{{$json["${paramName}"] || "YOUR_${paramName.toUpperCase()}_HERE"}}`;
}

function fillSpecificNodeParameters(node: N8nNode, nodeDef: NodeDefinition, report: ParameterFixReport): void {
  // HTTP Request
  if (node.type === 'n8n-nodes-base.httpRequest') {
    if (!node.parameters.url || node.parameters.url === '') {
      node.parameters.url = '{{$json["url"] || "https://api.example.com/endpoint"}}';
      report.changes.push(`Set URL placeholder in HTTP Request node "${node.name}"`);
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.method) {
      node.parameters.method = 'GET';
      report.changes.push(`Set HTTP method to GET in node "${node.name}"`);
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.authentication) {
      node.parameters.authentication = 'none';
      report.parametersFilled++;
      report.fixed = true;
    }
  }

  // Webhook
  if (node.type === 'n8n-nodes-base.webhook') {
    if (!node.parameters.path || node.parameters.path === '') {
      node.parameters.path = 'webhook-' + Math.random().toString(36).substring(7);
      report.changes.push(`Set webhook path in node "${node.name}"`);
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.httpMethod) {
      node.parameters.httpMethod = 'POST';
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.responseMode) {
      node.parameters.responseMode = 'onReceived';
      report.parametersFilled++;
      report.fixed = true;
    }
  }

  // Gmail / SendGrid
  if (node.type === 'n8n-nodes-base.gmail' || node.type === 'n8n-nodes-base.sendGrid') {
    if (node.parameters.operation === 'send' || node.parameters.operation === undefined) {
      if (!node.parameters.to || node.parameters.to === '') {
        node.parameters.to = '{{$json["email"] || "recipient@example.com"}}';
        report.changes.push(`Set recipient placeholder in email node "${node.name}"`);
        report.parametersFilled++;
        report.fixed = true;
      }

      if (!node.parameters.subject || node.parameters.subject === '') {
        node.parameters.subject = '{{$json["subject"] || "Email Subject"}}';
        report.changes.push(`Set subject placeholder in email node "${node.name}"`);
        report.parametersFilled++;
        report.fixed = true;
      }

      if (!node.parameters.message && !node.parameters.content) {
        const messageField = node.type === 'n8n-nodes-base.sendGrid' ? 'content' : 'message';
        node.parameters[messageField] = '{{$json["message"] || "Email body content"}}';
        report.changes.push(`Set message placeholder in email node "${node.name}"`);
        report.parametersFilled++;
        report.fixed = true;
      }
    }
  }

  // Slack
  if (node.type === 'n8n-nodes-base.slack') {
    if (!node.parameters.resource) {
      node.parameters.resource = 'message';
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.operation) {
      node.parameters.operation = 'post';
      report.parametersFilled++;
      report.fixed = true;
    }

    if (node.parameters.resource === 'message' && node.parameters.operation === 'post') {
      if (!node.parameters.channel || node.parameters.channel === '') {
        node.parameters.channel = '{{$json["channel"] || "#general"}}';
        report.changes.push(`Set channel placeholder in Slack node "${node.name}"`);
        report.parametersFilled++;
        report.fixed = true;
      }

      if (!node.parameters.text || node.parameters.text === '') {
        node.parameters.text = '{{$json["message"] || "Slack message"}}';
        report.changes.push(`Set message placeholder in Slack node "${node.name}"`);
        report.parametersFilled++;
        report.fixed = true;
      }
    }
  }

  // Google Sheets
  if (node.type === 'n8n-nodes-base.googleSheets') {
    if (!node.parameters.resource) {
      node.parameters.resource = 'spreadsheet';
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.operation) {
      node.parameters.operation = 'append';
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.documentId || node.parameters.documentId === '') {
      node.parameters.documentId = '{{$json["sheetId"] || "YOUR_GOOGLE_SHEET_ID"}}';
      report.changes.push(`Set document ID placeholder in Google Sheets node "${node.name}"`);
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.sheetName || node.parameters.sheetName === '') {
      node.parameters.sheetName = 'Sheet1';
      report.changes.push(`Set sheet name to "Sheet1" in node "${node.name}"`);
      report.parametersFilled++;
      report.fixed = true;
    }
  }

  // Airtable
  if (node.type === 'n8n-nodes-base.airtable') {
    if (!node.parameters.operation) {
      node.parameters.operation = 'list';
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.baseId || node.parameters.baseId === '') {
      node.parameters.baseId = '{{$json["baseId"] || "appXXXXXXXXXXXXXX"}}';
      report.changes.push(`Set base ID placeholder in Airtable node "${node.name}"`);
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.table || node.parameters.table === '') {
      node.parameters.table = 'Table 1';
      report.changes.push(`Set table name in Airtable node "${node.name}"`);
      report.parametersFilled++;
      report.fixed = true;
    }
  }

  // HubSpot
  if (node.type === 'n8n-nodes-base.hubspot') {
    if (!node.parameters.resource) {
      node.parameters.resource = 'contact';
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.operation) {
      node.parameters.operation = 'get';
      report.parametersFilled++;
      report.fixed = true;
    }
  }

  // Salesforce
  if (node.type === 'n8n-nodes-base.salesforce') {
    if (!node.parameters.resource) {
      node.parameters.resource = 'lead';
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.operation) {
      node.parameters.operation = 'get';
      report.parametersFilled++;
      report.fixed = true;
    }
  }

  // Shopify / Shopify Trigger
  if (node.type === 'n8n-nodes-base.shopify') {
    if (!node.parameters.resource) {
      node.parameters.resource = 'order';
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.operation) {
      node.parameters.operation = 'get';
      report.parametersFilled++;
      report.fixed = true;
    }
  }

  if (node.type === 'n8n-nodes-base.shopifyTrigger') {
    if (!node.parameters.topic) {
      node.parameters.topic = 'orders/create';
      report.changes.push(`Set Shopify trigger topic to "orders/create" in node "${node.name}"`);
      report.parametersFilled++;
      report.fixed = true;
    }
  }

  // IF node
  if (node.type === 'n8n-nodes-base.if') {
    if (!node.parameters.conditions || Object.keys(node.parameters.conditions).length === 0) {
      node.parameters.conditions = {
        boolean: [],
        number: [
          {
            value1: '={{$json["value"]}}',
            operation: 'equal',
            value2: 'expected_value',
          },
        ],
        string: [],
      };
      report.changes.push(`Added default condition to IF node "${node.name}"`);
      report.parametersFilled++;
      report.fixed = true;
    }
  }

  // Set node
  if (node.type === 'n8n-nodes-base.set') {
    if (!node.parameters.mode) {
      node.parameters.mode = 'manual';
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.values || Object.keys(node.parameters.values).length === 0) {
      node.parameters.values = {
        string: [
          {
            name: 'newField',
            value: '={{$json["originalField"]}}',
          },
        ],
      };
      report.changes.push(`Added default value mapping to Set node "${node.name}"`);
      report.parametersFilled++;
      report.fixed = true;
    }
  }

  // Code node
  if (node.type === 'n8n-nodes-base.code') {
    if (!node.parameters.mode) {
      node.parameters.mode = 'runOnceForAllItems';
      report.parametersFilled++;
      report.fixed = true;
    }

    if (!node.parameters.jsCode || node.parameters.jsCode === '') {
      node.parameters.jsCode = `// Process items
// Access input data via 'items' array
// Return modified items

for (const item of items) {
  // Your code here
  // Example: item.json.newField = item.json.existingField;
}

return items;`;
      report.changes.push(`Added code template to Code node "${node.name}"`);
      report.parametersFilled++;
      report.fixed = true;
    }
  }
}

function ensureBasicNodeProperties(node: N8nNode, report: ParameterFixReport): void {
  // Ensure typeVersion
  if (node.typeVersion === undefined) {
    node.typeVersion = 1;
    report.parametersFilled++;
    report.fixed = true;
  }

  // Ensure name
  if (!node.name || node.name === '') {
    const nodeDef = getNodeByType(node.type);
    node.name = nodeDef ? nodeDef.displayName : 'Node';
    report.changes.push(`Generated name "${node.name}" for unnamed node`);
    report.fixed = true;
  }

  // Ensure position
  if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
    node.position = [250, 300];
    report.fixed = true;
  }

  // Ensure id
  if (!node.id || node.id === '') {
    node.id = 'node_' + Math.random().toString(36).substring(2, 11);
    report.changes.push(`Generated ID "${node.id}" for node "${node.name}"`);
    report.fixed = true;
  }
}
