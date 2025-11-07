/**
 * Workflow Validator
 * Main orchestrator for all validation steps
 */

import { N8nWorkflow } from '../../types';
import { ValidationResult, createValidationResult, addIssue } from '../../types/validation';
import { validateStructure } from './structureValidator';
import { validateGraph } from './graphValidator';
import { validateNodes } from './nodeValidator';

export function validateWorkflow(workflow: any): ValidationResult {
  // Combine results from all validators
  const structureResult = validateStructure(workflow);

  // If structure validation fails critically, stop here
  if (structureResult.errors.length > 0) {
    const criticalErrors = structureResult.errors.filter(
      e => e.code === 'INVALID_WORKFLOW' ||
           e.code === 'MISSING_NODES' ||
           e.code === 'INVALID_NODES' ||
           e.code === 'EMPTY_NODES'
    );

    if (criticalErrors.length > 0) {
      return structureResult;
    }
  }

  // Continue with graph and node validation
  const graphResult = validateGraph(workflow as N8nWorkflow);
  const nodeResult = validateNodes(workflow as N8nWorkflow);

  // Combine all results
  const combinedResult = createValidationResult();

  // Merge all issues
  combinedResult.issues = [
    ...structureResult.issues,
    ...graphResult.issues,
    ...nodeResult.issues,
  ];

  combinedResult.errors = [
    ...structureResult.errors,
    ...graphResult.errors,
    ...nodeResult.errors,
  ];

  combinedResult.warnings = [
    ...structureResult.warnings,
    ...graphResult.warnings,
    ...nodeResult.warnings,
  ];

  combinedResult.info = [
    ...structureResult.info,
    ...graphResult.info,
    ...nodeResult.info,
  ];

  combinedResult.isValid = combinedResult.errors.length === 0;
  combinedResult.fixable =
    structureResult.fixable ||
    graphResult.fixable ||
    nodeResult.fixable;

  return combinedResult;
}

export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    if (result.warnings.length === 0 && result.info.length === 0) {
      return '✓ Workflow is valid with no issues';
    }
    return `✓ Workflow is valid with ${result.warnings.length} warning(s) and ${result.info.length} suggestion(s)`;
  }

  return `✗ Workflow has ${result.errors.length} error(s), ${result.warnings.length} warning(s), and ${result.info.length} suggestion(s)`;
}
