/**
 * Validation Types
 * Types for workflow validation results, errors, and warnings
 */

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  nodeId?: string;
  nodeName?: string;
  fix?: string; // Suggested fix
  details?: any;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  fixable: boolean; // Can issues be auto-fixed?
}

export interface GraphAnalysis {
  hasTrigger: boolean;
  triggerNodes: string[];
  orphanedNodes: string[];
  unreachableNodes: string[];
  circularReferences: boolean;
  allNodesConnected: boolean;
  missingConnections: Array<{
    fromNode: string;
    toNode: string;
    reason: string;
  }>;
}

export function createValidationResult(): ValidationResult {
  return {
    isValid: true,
    issues: [],
    errors: [],
    warnings: [],
    info: [],
    fixable: false,
  };
}

export function addIssue(
  result: ValidationResult,
  severity: ValidationSeverity,
  code: string,
  message: string,
  options?: {
    nodeId?: string;
    nodeName?: string;
    fix?: string;
    details?: any;
  }
): void {
  const issue: ValidationIssue = {
    severity,
    code,
    message,
    ...options,
  };

  result.issues.push(issue);

  if (severity === 'error') {
    result.errors.push(issue);
    result.isValid = false;
  } else if (severity === 'warning') {
    result.warnings.push(issue);
  } else {
    result.info.push(issue);
  }

  if (options?.fix) {
    result.fixable = true;
  }
}
