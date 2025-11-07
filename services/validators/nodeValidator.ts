/**
 * Node Validator
 * Validates individual nodes against the node registry
 */

import { N8nWorkflow, N8nNode } from '../../types';
import { ValidationResult, createValidationResult, addIssue } from '../../types/validation';
import { getNodeByType, NodeDefinition, NodeParameter } from '../registry/nodeRegistry';

export function validateNodes(workflow: N8nWorkflow): ValidationResult {
  const result = createValidationResult();

  workflow.nodes.forEach(node => {
    validateSingleNode(node, result);
  });

  return result;
}

function validateSingleNode(node: N8nNode, result: ValidationResult): void {
  // Check if node type exists in registry
  const nodeDef = getNodeByType(node.type);

  if (!nodeDef) {
    addIssue(
      result,
      'error',
      'UNKNOWN_NODE_TYPE',
      `Unknown node type: ${node.type}`,
      {
        nodeId: node.id,
        nodeName: node.name,
        details: { type: node.type },
        fix: 'Node type may be invalid or not in registry',
      }
    );
    return; // Can't validate parameters if we don't know the node type
  }

  // Validate node parameters
  validateNodeParameters(node, nodeDef, result);

  // Check for missing credentials if typically required
  if (requiresCredentials(nodeDef) && !node.credentials) {
    addIssue(
      result,
      'warning',
      'MISSING_CREDENTIALS',
      `Node "${node.name}" (${nodeDef.displayName}) typically requires credentials`,
      {
        nodeId: node.id,
        nodeName: node.name,
        details: { type: node.type },
      }
    );
  }
}

function validateNodeParameters(node: N8nNode, nodeDef: NodeDefinition, result: ValidationResult): void {
  // Check if parameters object exists
  if (!node.parameters || typeof node.parameters !== 'object') {
    addIssue(
      result,
      'warning',
      'MISSING_PARAMETERS',
      `Node "${node.name}" has no parameters object`,
      {
        nodeId: node.id,
        nodeName: node.name,
        fix: 'Add empty parameters object',
      }
    );
    return;
  }

  // Check if parameters are empty for nodes that require them
  const hasRequiredParams = nodeDef.parameters.some(p => p.required);
  const paramKeys = Object.keys(node.parameters);

  if (hasRequiredParams && paramKeys.length === 0) {
    addIssue(
      result,
      'error',
      'EMPTY_REQUIRED_PARAMETERS',
      `Node "${node.name}" (${nodeDef.displayName}) requires parameters but has none`,
      {
        nodeId: node.id,
        nodeName: node.name,
        fix: 'Add required parameters',
        details: {
          requiredParameters: nodeDef.parameters.filter(p => p.required).map(p => p.name),
        },
      }
    );
  }

  // Validate required parameters
  nodeDef.parameters.forEach(paramDef => {
    if (paramDef.required) {
      const paramValue = node.parameters[paramDef.name];

      if (paramValue === undefined || paramValue === null || paramValue === '') {
        addIssue(
          result,
          'error',
          'MISSING_REQUIRED_PARAMETER',
          `Node "${node.name}" is missing required parameter: ${paramDef.name}`,
          {
            nodeId: node.id,
            nodeName: node.name,
            fix: `Set ${paramDef.name} parameter`,
            details: {
              parameter: paramDef.name,
              description: paramDef.description,
              type: paramDef.type,
            },
          }
        );
      } else {
        // Validate parameter type
        validateParameterType(node, paramDef, paramValue, result);
      }
    }
  });

  // Validate specific node types
  validateSpecificNodeTypes(node, nodeDef, result);
}

function validateParameterType(
  node: N8nNode,
  paramDef: NodeParameter,
  value: any,
  result: ValidationResult
): void {
  let isValid = true;

  switch (paramDef.type) {
    case 'string':
      if (typeof value !== 'string') {
        isValid = false;
      }
      break;
    case 'number':
      if (typeof value !== 'number') {
        isValid = false;
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        isValid = false;
      }
      break;
    case 'options':
      if (paramDef.options && !paramDef.options.some(opt => opt.value === value)) {
        addIssue(
          result,
          'warning',
          'INVALID_OPTION_VALUE',
          `Parameter "${paramDef.name}" in node "${node.name}" has invalid option value`,
          {
            nodeId: node.id,
            nodeName: node.name,
            details: {
              parameter: paramDef.name,
              value,
              validOptions: paramDef.options.map(o => o.value),
            },
          }
        );
      }
      break;
  }

  if (!isValid) {
    addIssue(
      result,
      'error',
      'INVALID_PARAMETER_TYPE',
      `Parameter "${paramDef.name}" in node "${node.name}" has wrong type (expected ${paramDef.type})`,
      {
        nodeId: node.id,
        nodeName: node.name,
        details: {
          parameter: paramDef.name,
          expectedType: paramDef.type,
          actualType: typeof value,
        },
      }
    );
  }
}

function validateSpecificNodeTypes(node: N8nNode, nodeDef: NodeDefinition, result: ValidationResult): void {
  // HTTP Request specific validation
  if (node.type === 'n8n-nodes-base.httpRequest') {
    const url = node.parameters.url;
    if (!url || typeof url !== 'string' || url.trim() === '') {
      addIssue(
        result,
        'error',
        'HTTP_MISSING_URL',
        `HTTP Request node "${node.name}" is missing URL parameter`,
        {
          nodeId: node.id,
          nodeName: node.name,
          fix: 'Add URL parameter with placeholder',
        }
      );
    } else if (!url.startsWith('http://') && !url.startsWith('https://') && !url.includes('{{')) {
      addIssue(
        result,
        'warning',
        'HTTP_INVALID_URL',
        `HTTP Request node "${node.name}" has URL that doesn't start with http:// or https://`,
        {
          nodeId: node.id,
          nodeName: node.name,
          details: { url },
        }
      );
    }
  }

  // Webhook specific validation
  if (node.type === 'n8n-nodes-base.webhook') {
    const path = node.parameters.path;
    if (!path || typeof path !== 'string' || path.trim() === '') {
      addIssue(
        result,
        'error',
        'WEBHOOK_MISSING_PATH',
        `Webhook node "${node.name}" is missing path parameter`,
        {
          nodeId: node.id,
          nodeName: node.name,
          fix: 'Add path parameter',
        }
      );
    }
  }

  // Email specific validation
  if (node.type === 'n8n-nodes-base.gmail' || node.type === 'n8n-nodes-base.sendGrid') {
    const operation = node.parameters.operation;
    if (operation === 'send') {
      const to = node.parameters.to;
      const subject = node.parameters.subject;

      if (!to || to === '') {
        addIssue(
          result,
          'error',
          'EMAIL_MISSING_RECIPIENT',
          `Email node "${node.name}" is missing recipient (to) parameter`,
          {
            nodeId: node.id,
            nodeName: node.name,
            fix: 'Add recipient email address',
          }
        );
      }

      if (!subject || subject === '') {
        addIssue(
          result,
          'warning',
          'EMAIL_MISSING_SUBJECT',
          `Email node "${node.name}" is missing subject parameter`,
          {
            nodeId: node.id,
            nodeName: node.name,
            fix: 'Add email subject',
          }
        );
      }
    }
  }

  // Google Sheets specific validation
  if (node.type === 'n8n-nodes-base.googleSheets') {
    const documentId = node.parameters.documentId;
    if (!documentId || documentId === '') {
      addIssue(
        result,
        'error',
        'SHEETS_MISSING_DOCUMENT_ID',
        `Google Sheets node "${node.name}" is missing document ID`,
        {
          nodeId: node.id,
          nodeName: node.name,
          fix: 'Add Google Sheets document ID',
        }
      );
    }
  }

  // Slack specific validation
  if (node.type === 'n8n-nodes-base.slack') {
    const resource = node.parameters.resource;
    const operation = node.parameters.operation;

    if (resource === 'message' && operation === 'post') {
      const channel = node.parameters.channel;
      const text = node.parameters.text;

      if (!channel || channel === '') {
        addIssue(
          result,
          'error',
          'SLACK_MISSING_CHANNEL',
          `Slack node "${node.name}" is missing channel parameter`,
          {
            nodeId: node.id,
            nodeName: node.name,
            fix: 'Add Slack channel',
          }
        );
      }

      if (!text || text === '') {
        addIssue(
          result,
          'warning',
          'SLACK_MISSING_TEXT',
          `Slack node "${node.name}" is missing message text`,
          {
            nodeId: node.id,
            nodeName: node.name,
            fix: 'Add message text',
          }
        );
      }
    }
  }

  // IF node specific validation
  if (node.type === 'n8n-nodes-base.if') {
    const conditions = node.parameters.conditions;
    if (!conditions || (typeof conditions === 'object' && Object.keys(conditions).length === 0)) {
      addIssue(
        result,
        'error',
        'IF_MISSING_CONDITIONS',
        `IF node "${node.name}" has no conditions configured`,
        {
          nodeId: node.id,
          nodeName: node.name,
          fix: 'Add at least one condition',
        }
      );
    }
  }

  // Code node specific validation
  if (node.type === 'n8n-nodes-base.code') {
    const jsCode = node.parameters.jsCode;
    if (!jsCode || jsCode === '' || jsCode === '// Add your code here\nreturn items;') {
      addIssue(
        result,
        'warning',
        'CODE_NODE_EMPTY',
        `Code node "${node.name}" has no custom code or only default template`,
        {
          nodeId: node.id,
          nodeName: node.name,
        }
      );
    }
  }
}

function requiresCredentials(nodeDef: NodeDefinition): boolean {
  // Nodes that typically require credentials
  const credentialNodeTypes = [
    'integration', // Most integration nodes need credentials
  ];

  // Exceptions - nodes that don't need credentials
  const exceptions = [
    'n8n-nodes-base.httpRequest', // Can work without credentials
    'n8n-nodes-base.webhook',
    'n8n-nodes-base.start',
    'n8n-nodes-base.cron',
  ];

  if (exceptions.includes(nodeDef.type)) {
    return false;
  }

  return credentialNodeTypes.includes(nodeDef.category);
}
