/**
 * Graph Validator
 * Validates workflow graph connectivity, checks for orphaned nodes, circular references, etc.
 */

import { N8nWorkflow, N8nNode } from '../../types';
import { ValidationResult, createValidationResult, addIssue, GraphAnalysis } from '../../types/validation';
import { getNodeByType } from '../registry/nodeRegistry';

export function validateGraph(workflow: N8nWorkflow): ValidationResult {
  const result = createValidationResult();
  const analysis = analyzeGraph(workflow);

  // Check for trigger nodes
  if (!analysis.hasTrigger) {
    addIssue(
      result,
      'error',
      'NO_TRIGGER',
      'Workflow must have at least one trigger node (e.g., Start, Webhook, Cron)',
      { fix: 'Add a Start node as trigger' }
    );
  }

  // Check for orphaned nodes
  if (analysis.orphanedNodes.length > 0) {
    analysis.orphanedNodes.forEach(nodeId => {
      const node = workflow.nodes.find(n => n.id === nodeId);
      addIssue(
        result,
        'error',
        'ORPHANED_NODE',
        `Node "${node?.name || nodeId}" is not connected to any other node`,
        {
          nodeId,
          nodeName: node?.name,
          fix: 'Connect node to workflow',
          details: { nodeId, nodeName: node?.name },
        }
      );
    });
  }

  // Check for unreachable nodes (not reachable from trigger)
  if (analysis.unreachableNodes.length > 0) {
    analysis.unreachableNodes.forEach(nodeId => {
      const node = workflow.nodes.find(n => n.id === nodeId);
      // Skip if it's a trigger node itself
      const nodeType = node?.type;
      const nodeDef = nodeType ? getNodeByType(nodeType) : null;
      if (nodeDef && nodeDef.category === 'trigger') {
        return;
      }

      addIssue(
        result,
        'error',
        'UNREACHABLE_NODE',
        `Node "${node?.name || nodeId}" is not reachable from any trigger node`,
        {
          nodeId,
          nodeName: node?.name,
          fix: 'Connect node to workflow from trigger',
          details: { nodeId, nodeName: node?.name },
        }
      );
    });
  }

  // Check for invalid connection references
  validateConnectionReferences(workflow, result);

  // Check for circular references (if any)
  if (analysis.circularReferences) {
    addIssue(
      result,
      'warning',
      'CIRCULAR_REFERENCE',
      'Workflow contains circular references (loops)',
      { details: 'This may be intentional for certain workflows' }
    );
  }

  // Add info about missing connections
  if (analysis.missingConnections.length > 0) {
    analysis.missingConnections.forEach(missing => {
      addIssue(
        result,
        'info',
        'SUGGESTED_CONNECTION',
        `Consider connecting "${missing.fromNode}" to "${missing.toNode}": ${missing.reason}`,
        { details: missing }
      );
    });
  }

  return result;
}

export function analyzeGraph(workflow: N8nWorkflow): GraphAnalysis {
  const analysis: GraphAnalysis = {
    hasTrigger: false,
    triggerNodes: [],
    orphanedNodes: [],
    unreachableNodes: [],
    circularReferences: false,
    allNodesConnected: true,
    missingConnections: [],
  };

  // Identify trigger nodes
  workflow.nodes.forEach(node => {
    const nodeDef = getNodeByType(node.type);
    if (nodeDef && nodeDef.category === 'trigger') {
      analysis.hasTrigger = true;
      analysis.triggerNodes.push(node.id);
    }
  });

  // Build adjacency list for graph traversal
  const adjacencyList: Map<string, Set<string>> = new Map();
  const reverseAdjacencyList: Map<string, Set<string>> = new Map();

  // Initialize all nodes
  workflow.nodes.forEach(node => {
    adjacencyList.set(node.id, new Set());
    reverseAdjacencyList.set(node.id, new Set());
  });

  // Build connections graph
  if (workflow.connections) {
    Object.entries(workflow.connections).forEach(([sourceId, outputs]) => {
      Object.values(outputs).forEach(outputArray => {
        outputArray.forEach(connections => {
          connections.forEach(conn => {
            adjacencyList.get(sourceId)?.add(conn.node);
            reverseAdjacencyList.get(conn.node)?.add(sourceId);
          });
        });
      });
    });
  }

  // Find orphaned nodes (nodes with no incoming or outgoing connections)
  workflow.nodes.forEach(node => {
    const nodeDef = getNodeByType(node.type);
    const isTrigger = nodeDef && nodeDef.category === 'trigger';

    const outgoing = adjacencyList.get(node.id)?.size || 0;
    const incoming = reverseAdjacencyList.get(node.id)?.size || 0;

    // Trigger nodes don't need incoming connections
    if (isTrigger) {
      if (outgoing === 0) {
        analysis.orphanedNodes.push(node.id);
        analysis.allNodesConnected = false;
      }
    } else {
      // Regular nodes need at least one connection (incoming or outgoing)
      if (incoming === 0 && outgoing === 0) {
        analysis.orphanedNodes.push(node.id);
        analysis.allNodesConnected = false;
      }
    }
  });

  // Find unreachable nodes (not reachable from any trigger)
  const reachableNodes = new Set<string>();
  analysis.triggerNodes.forEach(triggerId => {
    dfs(triggerId, adjacencyList, reachableNodes);
  });

  workflow.nodes.forEach(node => {
    const nodeDef = getNodeByType(node.type);
    const isTrigger = nodeDef && nodeDef.category === 'trigger';

    // Skip trigger nodes in unreachable check
    if (!isTrigger && !reachableNodes.has(node.id)) {
      analysis.unreachableNodes.push(node.id);
      analysis.allNodesConnected = false;
    }
  });

  // Check for circular references (simple cycle detection)
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  for (const nodeId of adjacencyList.keys()) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId, adjacencyList, visited, recursionStack)) {
        analysis.circularReferences = true;
        break;
      }
    }
  }

  // Suggest missing connections for sequential workflows
  if (workflow.nodes.length >= 2) {
    const sortedNodes = [...workflow.nodes].sort((a, b) => a.position[0] - b.position[0]);
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const currentNode = sortedNodes[i];
      const nextNode = sortedNodes[i + 1];

      const hasConnection = adjacencyList.get(currentNode.id)?.has(nextNode.id);
      if (!hasConnection && !analysis.orphanedNodes.includes(currentNode.id)) {
        const currentNodeDef = getNodeByType(currentNode.type);
        const nextNodeDef = getNodeByType(nextNode.type);

        // Don't suggest connecting to trigger nodes
        if (nextNodeDef && nextNodeDef.category !== 'trigger') {
          analysis.missingConnections.push({
            fromNode: currentNode.name || currentNode.id,
            toNode: nextNode.name || nextNode.id,
            reason: 'Sequential nodes based on position',
          });
        }
      }
    }
  }

  return analysis;
}

// Depth-first search to find all reachable nodes
function dfs(nodeId: string, adjacencyList: Map<string, Set<string>>, visited: Set<string>): void {
  visited.add(nodeId);
  const neighbors = adjacencyList.get(nodeId);
  if (neighbors) {
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        dfs(neighbor, adjacencyList, visited);
      }
    });
  }
}

// Detect cycles in directed graph
function hasCycle(
  nodeId: string,
  adjacencyList: Map<string, Set<string>>,
  visited: Set<string>,
  recursionStack: Set<string>
): boolean {
  visited.add(nodeId);
  recursionStack.add(nodeId);

  const neighbors = adjacencyList.get(nodeId);
  if (neighbors) {
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor, adjacencyList, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }
  }

  recursionStack.delete(nodeId);
  return false;
}

// Validate that all connection references point to existing nodes
function validateConnectionReferences(workflow: N8nWorkflow, result: ValidationResult): void {
  const nodeIds = new Set(workflow.nodes.map(n => n.id));

  if (!workflow.connections) {
    return;
  }

  Object.entries(workflow.connections).forEach(([sourceId, outputs]) => {
    // Check if source node exists
    if (!nodeIds.has(sourceId)) {
      addIssue(
        result,
        'error',
        'INVALID_CONNECTION_SOURCE',
        `Connection references non-existent source node: ${sourceId}`,
        { nodeId: sourceId, fix: 'Remove invalid connection' }
      );
      return;
    }

    // Check all target nodes
    Object.values(outputs).forEach(outputArray => {
      outputArray.forEach(connections => {
        connections.forEach(conn => {
          if (!nodeIds.has(conn.node)) {
            const sourceNode = workflow.nodes.find(n => n.id === sourceId);
            addIssue(
              result,
              'error',
              'INVALID_CONNECTION_TARGET',
              `Connection from "${sourceNode?.name || sourceId}" references non-existent target node: ${conn.node}`,
              { nodeId: sourceId, fix: 'Remove invalid connection' }
            );
          }
        });
      });
    });
  });
}
