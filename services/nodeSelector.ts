/**
 * Node Selector
 * Selects appropriate n8n nodes based on detected intent
 */

import { DetectedIntent, DetectedService, DetectedTrigger } from './intentDetection';
import { getNodeByType, searchNodes, NODE_REGISTRY, NodeDefinition } from './registry/nodeRegistry';

export interface NodeRecommendation {
  nodeType: string;
  nodeDef: NodeDefinition;
  reason: string;
  confidence: number;
}

export function selectNodesForIntent(intent: DetectedIntent): NodeRecommendation[] {
  const recommendations: NodeRecommendation[] = [];

  // 1. Select trigger node
  const triggerRec = selectTriggerNode(intent.trigger, intent.services);
  if (triggerRec) {
    recommendations.push(triggerRec);
  }

  // 2. Select service integration nodes
  intent.services.forEach(service => {
    const serviceRecs = selectServiceNodes(service, intent);
    recommendations.push(...serviceRecs);
  });

  // 3. Select logic nodes for conditions
  intent.conditions.forEach(condition => {
    const conditionRec = selectConditionNode(condition.type);
    if (conditionRec) {
      recommendations.push(conditionRec);
    }
  });

  // 4. Select data operation nodes
  intent.dataOperations.forEach(operation => {
    const dataOpRec = selectDataOperationNode(operation);
    if (dataOpRec) {
      recommendations.push(dataOpRec);
    }
  });

  return recommendations;
}

function selectTriggerNode(trigger: DetectedTrigger, services: DetectedService[]): NodeRecommendation | null {
  switch (trigger.type) {
    case 'manual':
      const startNode = getNodeByType('n8n-nodes-base.start');
      if (startNode) {
        return {
          nodeType: startNode.type,
          nodeDef: startNode,
          reason: 'Manual workflow start',
          confidence: 1.0,
        };
      }
      break;

    case 'webhook':
      const webhookNode = getNodeByType('n8n-nodes-base.webhook');
      if (webhookNode) {
        return {
          nodeType: webhookNode.type,
          nodeDef: webhookNode,
          reason: 'Webhook trigger for HTTP requests',
          confidence: 1.0,
        };
      }
      break;

    case 'schedule':
      const cronNode = getNodeByType('n8n-nodes-base.scheduleTrigger');
      if (cronNode) {
        return {
          nodeType: cronNode.type,
          nodeDef: cronNode,
          reason: 'Schedule-based trigger',
          confidence: 1.0,
        };
      }
      break;

    case 'event':
      // Check if we have a specific service trigger
      const serviceWithTrigger = services.find(s =>
        ['shopify', 'woocommerce'].includes(s.name)
      );

      if (serviceWithTrigger) {
        if (serviceWithTrigger.name === 'shopify') {
          const shopifyTrigger = getNodeByType('n8n-nodes-base.shopifyTrigger');
          if (shopifyTrigger) {
            return {
              nodeType: shopifyTrigger.type,
              nodeDef: shopifyTrigger,
              reason: 'Shopify event trigger (webhook)',
              confidence: 0.9,
            };
          }
        }
      }

      // Default to webhook for event-based triggers
      const eventWebhook = getNodeByType('n8n-nodes-base.webhook');
      if (eventWebhook) {
        return {
          nodeType: eventWebhook.type,
          nodeDef: eventWebhook,
          reason: 'Webhook trigger for external events',
          confidence: 0.7,
        };
      }
      break;
  }

  // Default to Start node
  const defaultStart = getNodeByType('n8n-nodes-base.start');
  if (defaultStart) {
    return {
      nodeType: defaultStart.type,
      nodeDef: defaultStart,
      reason: 'Default manual start',
      confidence: 0.5,
    };
  }

  return null;
}

function selectServiceNodes(service: DetectedService, intent: DetectedIntent): NodeRecommendation[] {
  const recommendations: NodeRecommendation[] = [];

  switch (service.name) {
    case 'shopify':
      const shopifyNode = getNodeByType('n8n-nodes-base.shopify');
      if (shopifyNode) {
        recommendations.push({
          nodeType: shopifyNode.type,
          nodeDef: shopifyNode,
          reason: `Shopify integration for ${service.keywords.join(', ')}`,
          confidence: service.confidence,
        });
      }
      break;

    case 'woocommerce':
      const wooNode = getNodeByType('n8n-nodes-base.wooCommerce');
      if (wooNode) {
        recommendations.push({
          nodeType: wooNode.type,
          nodeDef: wooNode,
          reason: 'WooCommerce integration',
          confidence: service.confidence,
        });
      }
      break;

    case 'hubspot':
      const hubspotNode = getNodeByType('n8n-nodes-base.hubspot');
      if (hubspotNode) {
        recommendations.push({
          nodeType: hubspotNode.type,
          nodeDef: hubspotNode,
          reason: 'HubSpot CRM integration',
          confidence: service.confidence,
        });
      }
      break;

    case 'salesforce':
      const salesforceNode = getNodeByType('n8n-nodes-base.salesforce');
      if (salesforceNode) {
        recommendations.push({
          nodeType: salesforceNode.type,
          nodeDef: salesforceNode,
          reason: 'Salesforce CRM integration',
          confidence: service.confidence,
        });
      }
      break;

    case 'slack':
      const slackNode = getNodeByType('n8n-nodes-base.slack');
      if (slackNode) {
        recommendations.push({
          nodeType: slackNode.type,
          nodeDef: slackNode,
          reason: 'Slack messaging integration',
          confidence: service.confidence,
        });
      }
      break;

    case 'gmail':
      const gmailNode = getNodeByType('n8n-nodes-base.gmail');
      if (gmailNode) {
        recommendations.push({
          nodeType: gmailNode.type,
          nodeDef: gmailNode,
          reason: 'Gmail email integration',
          confidence: service.confidence,
        });
      }
      break;

    case 'sendgrid':
      const sendgridNode = getNodeByType('n8n-nodes-base.sendGrid');
      if (sendgridNode) {
        recommendations.push({
          nodeType: sendgridNode.type,
          nodeDef: sendgridNode,
          reason: 'SendGrid email service',
          confidence: service.confidence,
        });
      }
      break;

    case 'googleSheets':
      const sheetsNode = getNodeByType('n8n-nodes-base.googleSheets');
      if (sheetsNode) {
        recommendations.push({
          nodeType: sheetsNode.type,
          nodeDef: sheetsNode,
          reason: 'Google Sheets integration',
          confidence: service.confidence,
        });
      }
      break;

    case 'airtable':
      const airtableNode = getNodeByType('n8n-nodes-base.airtable');
      if (airtableNode) {
        recommendations.push({
          nodeType: airtableNode.type,
          nodeDef: airtableNode,
          reason: 'Airtable database integration',
          confidence: service.confidence,
        });
      }
      break;

    case 'notion':
      const notionNode = getNodeByType('n8n-nodes-base.notion');
      if (notionNode) {
        recommendations.push({
          nodeType: notionNode.type,
          nodeDef: notionNode,
          reason: 'Notion integration',
          confidence: service.confidence,
        });
      }
      break;

    case 'http':
      const httpNode = getNodeByType('n8n-nodes-base.httpRequest');
      if (httpNode) {
        recommendations.push({
          nodeType: httpNode.type,
          nodeDef: httpNode,
          reason: 'HTTP API request',
          confidence: service.confidence * 0.8, // Lower confidence for generic HTTP
        });
      }
      break;
  }

  return recommendations;
}

function selectConditionNode(conditionType: string): NodeRecommendation | null {
  switch (conditionType) {
    case 'if':
      const ifNode = getNodeByType('n8n-nodes-base.if');
      if (ifNode) {
        return {
          nodeType: ifNode.type,
          nodeDef: ifNode,
          reason: 'Conditional branching (IF/THEN)',
          confidence: 0.9,
        };
      }
      break;

    case 'switch':
      const switchNode = getNodeByType('n8n-nodes-base.switch');
      if (switchNode) {
        return {
          nodeType: switchNode.type,
          nodeDef: switchNode,
          reason: 'Multiple condition routing (SWITCH)',
          confidence: 0.9,
        };
      }
      break;

    case 'filter':
      const filterNode = getNodeByType('n8n-nodes-base.filter');
      if (filterNode) {
        return {
          nodeType: filterNode.type,
          nodeDef: filterNode,
          reason: 'Filter items by conditions',
          confidence: 0.9,
        };
      }
      break;
  }

  return null;
}

function selectDataOperationNode(operation: string): NodeRecommendation | null {
  switch (operation) {
    case 'transform':
      const codeNode = getNodeByType('n8n-nodes-base.code');
      if (codeNode) {
        return {
          nodeType: codeNode.type,
          nodeDef: codeNode,
          reason: 'Transform data with custom code',
          confidence: 0.8,
        };
      }
      break;

    case 'filter':
      const filterNode = getNodeByType('n8n-nodes-base.filter');
      if (filterNode) {
        return {
          nodeType: filterNode.type,
          nodeDef: filterNode,
          reason: 'Filter items',
          confidence: 0.9,
        };
      }
      break;

    case 'merge':
      const mergeNode = getNodeByType('n8n-nodes-base.merge');
      if (mergeNode) {
        return {
          nodeType: mergeNode.type,
          nodeDef: mergeNode,
          reason: 'Merge data from multiple sources',
          confidence: 0.9,
        };
      }
      break;

    case 'split':
    case 'aggregate':
    case 'sort':
      const itemListsNode = getNodeByType('n8n-nodes-base.itemLists');
      if (itemListsNode) {
        return {
          nodeType: itemListsNode.type,
          nodeDef: itemListsNode,
          reason: `${operation.charAt(0).toUpperCase() + operation.slice(1)} items`,
          confidence: 0.85,
        };
      }
      break;
  }

  // Default to Set node for general data manipulation
  const setNode = getNodeByType('n8n-nodes-base.set');
  if (setNode) {
    return {
      nodeType: setNode.type,
      nodeDef: setNode,
      reason: 'Set/modify data fields',
      confidence: 0.6,
    };
  }

  return null;
}

export function getRecommendationSummary(recommendations: NodeRecommendation[]): string {
  if (recommendations.length === 0) {
    return 'No specific node recommendations';
  }

  const lines: string[] = ['Recommended Nodes:'];

  recommendations.forEach((rec, index) => {
    const confidence = (rec.confidence * 100).toFixed(0);
    lines.push(
      `  ${index + 1}. ${rec.nodeDef.displayName} (${rec.nodeType})`
    );
    lines.push(`     Reason: ${rec.reason} (${confidence}% confidence)`);
  });

  return lines.join('\n');
}
