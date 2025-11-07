/**
 * Connection Fixer
 * Automatically fixes disconnected nodes and invalid connections
 */

import { N8nWorkflow, N8nNode, N8nConnections } from '../../types';
import { analyzeGraph } from '../validators/graphValidator';
import { getNodeByType } from '../registry/nodeRegistry';

export interface ConnectionFixReport {
  fixed: boolean;
  changes: string[];
  connectionsAdded: number;
  connectionsRemoved: number;
}

export function fixConnections(workflow: N8nWorkflow): ConnectionFixReport {
  const report: ConnectionFixReport = {
    fixed: false,
    changes: [],
    connectionsAdded: 0,
    connectionsRemoved: 0,
  };

  // Ensure connections object exists
  if (!workflow.connections) {
    workflow.connections = {};
    report.changes.push('Created empty connections object');
    report.fixed = true;
  }

  // Remove invalid connections (references to non-existent nodes)
  removeInvalidConnections(workflow, report);

  // Analyze graph to find issues
  const analysis = analyzeGraph(workflow);

  // Fix orphaned nodes
  if (analysis.orphanedNodes.length > 0) {
    fixOrphanedNodes(workflow, analysis.orphanedNodes, report);
  }

  // Fix unreachable nodes
  if (analysis.unreachableNodes.length > 0) {
    fixUnreachableNodes(workflow, analysis.unreachableNodes, report);
  }

  // Ensure trigger nodes are connected
  if (analysis.triggerNodes.length > 0) {
    ensureTriggerConnections(workflow, analysis.triggerNodes, report);
  }

  // Add missing sequential connections if needed
  if (!analysis.allNodesConnected) {
    addSequentialConnections(workflow, report);
  }

  return report;
}

function removeInvalidConnections(workflow: N8nWorkflow, report: ConnectionFixReport): void {
  const nodeIds = new Set(workflow.nodes.map(n => n.id));
  const connectionsToRemove: string[] = [];

  Object.entries(workflow.connections).forEach(([sourceId, outputs]) => {
    // Remove connections from non-existent source nodes
    if (!nodeIds.has(sourceId)) {
      connectionsToRemove.push(sourceId);
      return;
    }

    // Check target nodes
    Object.entries(outputs).forEach(([outputName, outputArray]) => {
      outputArray.forEach((connections, index) => {
        const validConnections = connections.filter(conn => {
          if (!nodeIds.has(conn.node)) {
            report.changes.push(
              `Removed invalid connection from "${sourceId}" to non-existent node "${conn.node}"`
            );
            report.connectionsRemoved++;
            report.fixed = true;
            return false;
          }
          return true;
        });

        if (validConnections.length !== connections.length) {
          outputArray[index] = validConnections;
        }
      });
    });
  });

  // Remove invalid source nodes
  connectionsToRemove.forEach(sourceId => {
    delete workflow.connections[sourceId];
    report.changes.push(`Removed connections for non-existent node "${sourceId}"`);
    report.fixed = true;
  });
}

function fixOrphanedNodes(workflow: N8nWorkflow, orphanedNodes: string[], report: ConnectionFixReport): void {
  orphanedNodes.forEach(nodeId => {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const nodeDef = getNodeByType(node.type);

    // If it's a trigger node, connect it to the next node
    if (nodeDef && nodeDef.category === 'trigger') {
      const nextNode = findNextNodeByPosition(workflow, node);
      if (nextNode) {
        addConnection(workflow, node.id, nextNode.id, 'main');
        report.changes.push(`Connected orphaned trigger "${node.name}" to "${nextNode.name}"`);
        report.connectionsAdded++;
        report.fixed = true;
      }
    } else {
      // For regular nodes, try to connect from previous node and to next node
      const prevNode = findPreviousNodeByPosition(workflow, node);
      const nextNode = findNextNodeByPosition(workflow, node);

      if (prevNode) {
        addConnection(workflow, prevNode.id, node.id, 'main');
        report.changes.push(`Connected "${prevNode.name}" to orphaned node "${node.name}"`);
        report.connectionsAdded++;
        report.fixed = true;
      }

      if (nextNode) {
        addConnection(workflow, node.id, nextNode.id, 'main');
        report.changes.push(`Connected orphaned node "${node.name}" to "${nextNode.name}"`);
        report.connectionsAdded++;
        report.fixed = true;
      }
    }
  });
}

function fixUnreachableNodes(workflow: N8nWorkflow, unreachableNodes: string[], report: ConnectionFixReport): void {
  // Find trigger nodes
  const triggerNodes = workflow.nodes.filter(node => {
    const nodeDef = getNodeByType(node.type);
    return nodeDef && nodeDef.category === 'trigger';
  });

  if (triggerNodes.length === 0) return;

  unreachableNodes.forEach(nodeId => {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Try to connect from the closest previous node
    const prevNode = findPreviousNodeByPosition(workflow, node);
    if (prevNode) {
      addConnection(workflow, prevNode.id, node.id, 'main');
      report.changes.push(`Connected "${prevNode.name}" to unreachable node "${node.name}"`);
      report.connectionsAdded++;
      report.fixed = true;
    } else {
      // If no previous node, connect from main trigger
      const mainTrigger = triggerNodes[0];
      addConnection(workflow, mainTrigger.id, node.id, 'main');
      report.changes.push(`Connected trigger "${mainTrigger.name}" to unreachable node "${node.name}"`);
      report.connectionsAdded++;
      report.fixed = true;
    }
  });
}

function ensureTriggerConnections(workflow: N8nWorkflow, triggerNodes: string[], report: ConnectionFixReport): void {
  triggerNodes.forEach(triggerId => {
    const trigger = workflow.nodes.find(n => n.id === triggerId);
    if (!trigger) return;

    // Check if trigger has any outgoing connections
    const hasOutgoing = workflow.connections[triggerId] &&
      Object.values(workflow.connections[triggerId]).some(outputs =>
        outputs.some(conns => conns.length > 0)
      );

    if (!hasOutgoing) {
      // Connect to next node by position
      const nextNode = findNextNodeByPosition(workflow, trigger);
      if (nextNode) {
        addConnection(workflow, triggerId, nextNode.id, 'main');
        report.changes.push(`Connected trigger "${trigger.name}" to "${nextNode.name}"`);
        report.connectionsAdded++;
        report.fixed = true;
      }
    }
  });
}

function addSequentialConnections(workflow: N8nWorkflow, report: ConnectionFixReport): void {
  // Sort nodes by x position
  const sortedNodes = [...workflow.nodes].sort((a, b) => a.position[0] - b.position[0]);

  for (let i = 0; i < sortedNodes.length - 1; i++) {
    const currentNode = sortedNodes[i];
    const nextNode = sortedNodes[i + 1];

    // Skip if nodes are already connected
    const hasConnection = workflow.connections[currentNode.id]?.main?.[0]?.some(
      conn => conn.node === nextNode.id
    );

    if (hasConnection) continue;

    // Skip connecting to trigger nodes
    const nextNodeDef = getNodeByType(nextNode.type);
    if (nextNodeDef && nextNodeDef.category === 'trigger') continue;

    // Check if current node already has outgoing connections
    const currentHasOutgoing = workflow.connections[currentNode.id] &&
      Object.values(workflow.connections[currentNode.id]).some(outputs =>
        outputs.some(conns => conns.length > 0)
      );

    // Check if next node already has incoming connections
    const nextHasIncoming = Object.values(workflow.connections).some(outputs =>
      Object.values(outputs).some(outputArray =>
        outputArray.some(conns => conns.some(conn => conn.node === nextNode.id))
      )
    );

    // Only add connection if both nodes are isolated or form a logical sequence
    if (!currentHasOutgoing || !nextHasIncoming) {
      const currentNodeDef = getNodeByType(currentNode.type);

      // Don't connect from IF or Switch nodes automatically (they need specific output handling)
      if (currentNodeDef && (currentNodeDef.type === 'n8n-nodes-base.if' || currentNodeDef.type === 'n8n-nodes-base.switch')) {
        continue;
      }

      addConnection(workflow, currentNode.id, nextNode.id, 'main');
      report.changes.push(`Added sequential connection: "${currentNode.name}" → "${nextNode.name}"`);
      report.connectionsAdded++;
      report.fixed = true;
    }
  }
}

function addConnection(
  workflow: N8nWorkflow,
  sourceId: string,
  targetId: string,
  outputType: string = 'main'
): void {
  if (!workflow.connections[sourceId]) {
    workflow.connections[sourceId] = {};
  }

  if (!workflow.connections[sourceId][outputType]) {
    workflow.connections[sourceId][outputType] = [[]];
  }

  // Check if connection already exists
  const existingConnection = workflow.connections[sourceId][outputType][0].find(
    conn => conn.node === targetId
  );

  if (!existingConnection) {
    workflow.connections[sourceId][outputType][0].push({
      node: targetId,
      type: 'main',
    });
  }
}

function findNextNodeByPosition(workflow: N8nWorkflow, currentNode: N8nNode): N8nNode | null {
  const nodesAfter = workflow.nodes.filter(
    n => n.id !== currentNode.id && n.position[0] > currentNode.position[0]
  );

  if (nodesAfter.length === 0) return null;

  // Find closest node by x position
  nodesAfter.sort((a, b) => a.position[0] - b.position[0]);
  return nodesAfter[0];
}

function findPreviousNodeByPosition(workflow: N8nWorkflow, currentNode: N8nNode): N8nNode | null {
  const nodesBefore = workflow.nodes.filter(
    n => n.id !== currentNode.id && n.position[0] < currentNode.position[0]
  );

  if (nodesBefore.length === 0) return null;

  // Find closest node by x position
  nodesBefore.sort((a, b) => b.position[0] - a.position[0]);
  return nodesBefore[0];
}
