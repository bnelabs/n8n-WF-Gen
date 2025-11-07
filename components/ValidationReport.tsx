import React from 'react';
import { ProcessingReport } from '../services/postProcessors/workflowProcessor';
import { ValidationIssue } from '../types/validation';

interface ValidationReportProps {
  report: ProcessingReport;
}

export const ValidationReport: React.FC<ValidationReportProps> = ({ report }) => {
  const { finalValidation, connectionFixes, parameterFixes, totalChanges } = report;

  if (finalValidation.isValid && totalChanges === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-green-500 mt-0.5 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-green-800">Workflow Valid</h3>
            <p className="text-sm text-green-700 mt-1">
              No issues found. Workflow is ready to import into n8n.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-4">
      {/* Auto-fixes applied */}
      {totalChanges > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-500 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">Auto-Fixes Applied</h3>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                {connectionFixes.connectionsAdded > 0 && (
                  <p>✓ Added {connectionFixes.connectionsAdded} connection(s)</p>
                )}
                {connectionFixes.connectionsRemoved > 0 && (
                  <p>✓ Removed {connectionFixes.connectionsRemoved} invalid connection(s)</p>
                )}
                {parameterFixes.parametersFilled > 0 && (
                  <p>✓ Filled {parameterFixes.parametersFilled} missing parameter(s)</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {finalValidation.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {finalValidation.errors.length} Error(s) Found
              </h3>
              <div className="mt-2 space-y-2">
                {finalValidation.errors.slice(0, 5).map((error, index) => (
                  <IssueItem key={index} issue={error} type="error" />
                ))}
                {finalValidation.errors.length > 5 && (
                  <p className="text-xs text-red-600">
                    ...and {finalValidation.errors.length - 5} more error(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {finalValidation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {finalValidation.warnings.length} Warning(s)
              </h3>
              <div className="mt-2 space-y-2">
                {finalValidation.warnings.slice(0, 3).map((warning, index) => (
                  <IssueItem key={index} issue={warning} type="warning" />
                ))}
                {finalValidation.warnings.length > 3 && (
                  <p className="text-xs text-yellow-600">
                    ...and {finalValidation.warnings.length - 3} more warning(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status summary */}
      {finalValidation.isValid && totalChanges > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">Workflow Fixed & Valid</h3>
              <p className="text-sm text-green-700 mt-1">
                All issues have been automatically resolved. Workflow is ready to use.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface IssueItemProps {
  issue: ValidationIssue;
  type: 'error' | 'warning';
}

const IssueItem: React.FC<IssueItemProps> = ({ issue, type }) => {
  const colorClass = type === 'error' ? 'text-red-700' : 'text-yellow-700';
  const bgClass = type === 'error' ? 'bg-red-100' : 'bg-yellow-100';

  return (
    <div className={`text-xs ${colorClass} space-y-1`}>
      <div className="flex items-start">
        <span className={`${bgClass} px-1.5 py-0.5 rounded text-xs font-mono mr-2 flex-shrink-0`}>
          {issue.code}
        </span>
        <p className="flex-1">{issue.message}</p>
      </div>
      {issue.nodeName && (
        <p className="text-xs opacity-75 ml-12">Node: {issue.nodeName}</p>
      )}
      {issue.fix && (
        <p className="text-xs opacity-75 ml-12">💡 Suggested fix: {issue.fix}</p>
      )}
    </div>
  );
};
