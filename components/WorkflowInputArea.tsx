
import React from 'react';
import { INPUT_PLACEHOLDER, GENERATE_BUTTON_TEXT, GENERATING_BUTTON_TEXT } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';

interface WorkflowInputAreaProps {
  description: string;
  setDescription: (description: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const WorkflowInputArea: React.FC<WorkflowInputAreaProps> = ({
  description,
  setDescription,
  onGenerate,
  isLoading,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-700">Describe Your Workflow</h2>
      <p className="text-sm text-slate-500">
        Provide a detailed natural language description of the automation you want to build. The more specific you are, the better the generated n8n workflow will be.
      </p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={INPUT_PLACEHOLDER}
        rows={12}
        className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow resize-y text-sm leading-relaxed"
        disabled={isLoading || disabled}
      />
      <button
        onClick={onGenerate}
        disabled={isLoading || disabled}
        className={`w-full flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
                    ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="mr-2 h-5 w-5 text-white" />
            {GENERATING_BUTTON_TEXT}
          </>
        ) : (
          GENERATE_BUTTON_TEXT
        )}
      </button>
      {disabled && !isLoading && (
         <p className="text-xs text-red-500 text-center mt-2">API Key not configured. Generation is disabled.</p>
      )}
    </div>
  );
};
