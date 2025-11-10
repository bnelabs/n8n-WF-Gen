
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { WorkflowInputArea } from './components/WorkflowInputArea';
import { WorkflowOutputArea } from './components/WorkflowOutputArea';
import { ErrorMessage } from './components/ErrorMessage';
import { ValidationReport } from './components/ValidationReport';
import { generateEnhancedWorkflow } from './services/enhancedWorkflowGenerator';
import { N8nWorkflow } from './types';
import { ProcessingReport } from './services/postProcessors/workflowProcessor';
import { APP_TITLE, FOOTER_TEXT } from './constants';

const App: React.FC = () => {
  const [workflowDescription, setWorkflowDescription] = useState<string>('');
  const [generatedWorkflow, setGeneratedWorkflow] = useState<N8nWorkflow | null>(null);
  const [processingReport, setProcessingReport] = useState<ProcessingReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateWorkflow = useCallback(async () => {
    if (!workflowDescription.trim()) {
      setError('Please enter a workflow description.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedWorkflow(null);
    setProcessingReport(null);

    try {
      const result = await generateEnhancedWorkflow(workflowDescription);

      if (result.success) {
        setGeneratedWorkflow(result.workflow);
        setProcessingReport(result.processingReport);
      } else {
        setError(`${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while generating the workflow.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [workflowDescription]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Header title={APP_TITLE} />
      
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
            <WorkflowInputArea
              description={workflowDescription}
              setDescription={setWorkflowDescription}
              onGenerate={handleGenerateWorkflow}
              isLoading={isLoading}
              disabled={false}
            />
          </div>
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg min-h-[300px] flex flex-col">
            {/* Show validation report if available */}
            {processingReport && <ValidationReport report={processingReport} />}

            <WorkflowOutputArea
              workflow={generatedWorkflow}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </main>

      <footer className="bg-slate-800 text-slate-200 text-center p-4 shadow-md">
        <p>{FOOTER_TEXT}</p>
      </footer>
    </div>
  );
};

export default App;
