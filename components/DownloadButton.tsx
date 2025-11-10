/**
 * Download Button Component
 * Downloads workflow as JSON file
 */

import React, { useState } from 'react';
import { N8nWorkflow } from '../types';

interface DownloadButtonProps {
  workflow: N8nWorkflow;
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ workflow, className = '' }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);

    try {
      // Create JSON blob
      const jsonString = JSON.stringify(workflow, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename from workflow name or use default
      const filename = workflow.name
        ? `${workflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
        : `n8n_workflow_${Date.now()}.json`;

      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Reset button state after a brief delay
      setTimeout(() => setIsDownloading(false), 500);
    } catch (error) {
      console.error('Error downloading workflow:', error);
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium ${className}`}
      title="Download workflow as JSON file"
    >
      {isDownloading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Downloading...</span>
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Download JSON</span>
        </>
      )}
    </button>
  );
};

export default DownloadButton;
