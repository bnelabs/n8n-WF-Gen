/**
 * Structure Validator
 * Validates basic workflow structure and required properties
 */

import { N8nWorkflow } from '../../types';
import { ValidationResult, createValidationResult, addIssue } from '../../types/validation';

export function validateStructure(workflow: any): ValidationResult {
  const result = createValidationResult();

  // Check if workflow is an object
  if (!workflow || typeof workflow !== 'object') {
    addIssue(result, 'error', 'INVALID_WORKFLOW', 'Workflow must be a valid object');
    return result;
  }

  // Check required top-level properties
  if (!workflow.name || typeof workflow.name !== 'string') {
    addIssue(
      result,
      'error',
      'MISSING_NAME',
      'Workflow must have a name property',
      { fix: 'Add default workflow name' }
    );
  }

  if (!workflow.nodes) {
    addIssue(
      result,
      'error',
      'MISSING_NODES',
      'Workflow must have a nodes array',
      { fix: 'Cannot auto-fix missing nodes array' }
    );
    return result; // Can't continue without nodes
  }

  if (!Array.isArray(workflow.nodes)) {
    addIssue(result, 'error', 'INVALID_NODES', 'Nodes must be an array');
    return result;
  }

  if (workflow.nodes.length === 0) {
    addIssue(
      result,
      'error',
      'EMPTY_NODES',
      'Workflow must have at least one node',
      { fix: 'Cannot auto-fix empty workflow' }
    );
    return result;
  }

  if (!workflow.connections) {
    addIssue(
      result,
      'error',
      'MISSING_CONNECTIONS',
      'Workflow must have a connections object',
      { fix: 'Create empty connections object' }
    );
  }

  if (workflow.connections && typeof workflow.connections !== 'object') {
    addIssue(result, 'error', 'INVALID_CONNECTIONS', 'Connections must be an object');
  }

  // Check optional but recommended properties
  if (workflow.active === undefined) {
    addIssue(
      result,
      'warning',
      'MISSING_ACTIVE',
      'Workflow should have an active property',
      { fix: 'Set active to false' }
    );
  }

  if (!workflow.settings) {
    addIssue(
      result,
      'warning',
      'MISSING_SETTINGS',
      'Workflow should have a settings object',
      { fix: 'Add empty settings object' }
    );
  }

  if (!workflow.id) {
    addIssue(
      result,
      'warning',
      'MISSING_ID',
      'Workflow should have an id property',
      { fix: 'Generate unique ID' }
    );
  }

  // Validate individual nodes
  const nodeIds = new Set<string>();
  workflow.nodes.forEach((node: any, index: number) => {
    validateNode(node, index, nodeIds, result);
  });

  return result;
}

function validateNode(node: any, index: number, nodeIds: Set<string>, result: ValidationResult): void {
  const nodeRef = `Node ${index}`;

  if (!node || typeof node !== 'object') {
    addIssue(result, 'error', 'INVALID_NODE', `${nodeRef} is not a valid object`);
    return;
  }

  // Check required node properties
  if (!node.id) {
    addIssue(
      result,
      'error',
      'MISSING_NODE_ID',
      `${nodeRef} is missing id property`,
      { fix: 'Generate unique node ID' }
    );
  } else {
    if (nodeIds.has(node.id)) {
      addIssue(
        result,
        'error',
        'DUPLICATE_NODE_ID',
        `Duplicate node ID found: ${node.id}`,
        { nodeId: node.id, fix: 'Generate unique node ID' }
      );
    }
    nodeIds.add(node.id);
  }

  if (!node.name) {
    addIssue(
      result,
      'warning',
      'MISSING_NODE_NAME',
      `${nodeRef} (${node.id}) is missing name property`,
      { nodeId: node.id, fix: 'Generate node name from type' }
    );
  }

  if (!node.type) {
    addIssue(
      result,
      'error',
      'MISSING_NODE_TYPE',
      `${nodeRef} (${node.id}) is missing type property`,
      { nodeId: node.id, nodeName: node.name }
    );
  }

  if (!node.parameters) {
    addIssue(
      result,
      'warning',
      'MISSING_NODE_PARAMETERS',
      `${nodeRef} (${node.id}) is missing parameters property`,
      { nodeId: node.id, nodeName: node.name, fix: 'Add empty parameters object' }
    );
  }

  if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
    addIssue(
      result,
      'warning',
      'INVALID_NODE_POSITION',
      `${nodeRef} (${node.id}) has invalid position`,
      { nodeId: node.id, nodeName: node.name, fix: 'Calculate position based on node order' }
    );
  }

  if (node.typeVersion === undefined) {
    addIssue(
      result,
      'warning',
      'MISSING_TYPE_VERSION',
      `${nodeRef} (${node.id}) is missing typeVersion property`,
      { nodeId: node.id, nodeName: node.name, fix: 'Set typeVersion to 1' }
    );
  }
}
