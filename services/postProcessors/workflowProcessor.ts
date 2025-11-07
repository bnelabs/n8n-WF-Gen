/**
 * Workflow Processor
 * Main orchestrator for validation and auto-fixing
 */

import { N8nWorkflow } from '../../types';
import { ValidationResult } from '../../types/validation';
import { validateWorkflow, getValidationSummary } from '../validators/workflowValidator';
import { fixConnections, ConnectionFixReport } from './connectionFixer';
import { fillMissingParameters, ParameterFixReport } from './parameterFiller';

export interface ProcessingReport {
  originalValidation: ValidationResult;
  finalValidation: ValidationResult;
  connectionFixes: ConnectionFixReport;
  parameterFixes: ParameterFixReport;
  totalChanges: number;
  summary: string;
}

export function processWorkflow(workflow: N8nWorkflow, autoFix: boolean = true): ProcessingReport {
  // Initial validation
  const originalValidation = validateWorkflow(workflow);

  const report: ProcessingReport = {
    originalValidation,
    finalValidation: originalValidation,
    connectionFixes: {
      fixed: false,
      changes: [],
      connectionsAdded: 0,
      connectionsRemoved: 0,
    },
    parameterFixes: {
      fixed: false,
      changes: [],
      parametersFilled: 0,
    },
    totalChanges: 0,
    summary: '',
  };

  // If auto-fix is enabled and there are fixable issues
  if (autoFix && originalValidation.fixable) {
    // Fix missing parameters first
    const parameterFixes = fillMissingParameters(workflow);
    report.parameterFixes = parameterFixes;

    // Then fix connections
    const connectionFixes = fixConnections(workflow);
    report.connectionFixes = connectionFixes;

    // Re-validate after fixes
    report.finalValidation = validateWorkflow(workflow);

    // Calculate total changes
    report.totalChanges =
      parameterFixes.parametersFilled +
      connectionFixes.connectionsAdded +
      connectionFixes.connectionsRemoved;
  } else {
    report.finalValidation = originalValidation;
  }

  // Generate summary
  report.summary = generateProcessingSummary(report);

  return report;
}

function generateProcessingSummary(report: ProcessingReport): string {
  const lines: string[] = [];

  // Original validation status
  lines.push('Original Validation:');
  lines.push(`  ${getValidationSummary(report.originalValidation)}`);

  if (report.originalValidation.errors.length > 0) {
    lines.push(`  ${report.originalValidation.errors.length} error(s) found`);
  }

  if (report.originalValidation.warnings.length > 0) {
    lines.push(`  ${report.originalValidation.warnings.length} warning(s) found`);
  }

  // Fixes applied
  if (report.totalChanges > 0) {
    lines.push('');
    lines.push('Auto-Fixes Applied:');

    if (report.parameterFixes.fixed) {
      lines.push(`  ✓ Filled ${report.parameterFixes.parametersFilled} parameter(s)`);
    }

    if (report.connectionFixes.fixed) {
      if (report.connectionFixes.connectionsAdded > 0) {
        lines.push(`  ✓ Added ${report.connectionFixes.connectionsAdded} connection(s)`);
      }
      if (report.connectionFixes.connectionsRemoved > 0) {
        lines.push(`  ✓ Removed ${report.connectionFixes.connectionsRemoved} invalid connection(s)`);
      }
    }
  }

  // Final validation status
  if (report.totalChanges > 0) {
    lines.push('');
    lines.push('Final Validation:');
    lines.push(`  ${getValidationSummary(report.finalValidation)}`);
  }

  // Recommendations
  if (report.finalValidation.errors.length > 0 || report.finalValidation.warnings.length > 0) {
    lines.push('');
    lines.push('Remaining Issues:');

    if (report.finalValidation.errors.length > 0) {
      lines.push(`  ${report.finalValidation.errors.length} error(s) - manual review required`);
    }

    if (report.finalValidation.warnings.length > 0) {
      lines.push(`  ${report.finalValidation.warnings.length} warning(s) - check configuration`);
    }
  }

  return lines.join('\n');
}

export function getDetailedReport(report: ProcessingReport): string {
  const lines: string[] = [];

  lines.push('=== WORKFLOW PROCESSING REPORT ===');
  lines.push('');
  lines.push(report.summary);

  // Parameter fixes details
  if (report.parameterFixes.changes.length > 0) {
    lines.push('');
    lines.push('Parameter Changes:');
    report.parameterFixes.changes.forEach(change => {
      lines.push(`  • ${change}`);
    });
  }

  // Connection fixes details
  if (report.connectionFixes.changes.length > 0) {
    lines.push('');
    lines.push('Connection Changes:');
    report.connectionFixes.changes.forEach(change => {
      lines.push(`  • ${change}`);
    });
  }

  // Detailed validation issues
  if (report.finalValidation.errors.length > 0) {
    lines.push('');
    lines.push('Remaining Errors:');
    report.finalValidation.errors.forEach(error => {
      lines.push(`  ✗ [${error.code}] ${error.message}`);
      if (error.nodeId) {
        lines.push(`    Node: ${error.nodeName || error.nodeId}`);
      }
      if (error.fix) {
        lines.push(`    Suggested fix: ${error.fix}`);
      }
    });
  }

  if (report.finalValidation.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    report.finalValidation.warnings.forEach(warning => {
      lines.push(`  ⚠ [${warning.code}] ${warning.message}`);
      if (warning.nodeId) {
        lines.push(`    Node: ${warning.nodeName || warning.nodeId}`);
      }
    });
  }

  return lines.join('\n');
}
