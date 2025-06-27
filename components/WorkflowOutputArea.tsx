
import React from 'react';
import { N8nWorkflow } from '../types';
import { OUTPUT_PLACEHOLDER_TEXT } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { CopyButton } from './CopyButton';

interface WorkflowOutputAreaProps {
  workflow: N8nWorkflow | null;
  isLoading: boolean;
  error: string | null;
}

export const WorkflowOutputArea: React.FC<WorkflowOutputAreaProps> = ({ workflow, isLoading, error }) => {
  const workflowJson = workflow ? JSON.stringify(workflow, null, 2) : '';

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-slate-700">Generated n8n Workflow</h2>
        {workflow && !isLoading && <CopyButton textToCopy={workflowJson} />}
      </div>
      
      <div className="flex-grow bg-slate-50 border border-slate-200 rounded-md p-1 relative min-h-[200px] overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-10">
            <LoadingSpinner className="h-12 w-12 text-sky-600" />
            <p className="mt-2 text-slate-600">Generating workflow...</p>
          </div>
        ) : error ? (
          <div className="p-4 h-full flex items-center justify-center">
            <ErrorMessage message={error} />
          </div>
        ) : workflow ? (
          <pre className="text-xs p-3 h-full overflow-auto custom-scrollbar">
            <code>{workflowJson}</code>
          </pre>
        ) : (
          <div className="p-4 h-full flex items-center justify-center text-slate-400">
            {OUTPUT_PLACEHOLDER_TEXT}
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; /* slate-100 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #94a3b8; /* slate-400 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b; /* slate-500 */
        }
      `}</style>
    </div>
  );
};
