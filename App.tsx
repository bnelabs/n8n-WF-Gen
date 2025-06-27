
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { WorkflowInputArea } from './components/WorkflowInputArea';
import { WorkflowOutputArea } from './components/WorkflowOutputArea';
import { ErrorMessage } from './components/ErrorMessage';
import { generateWorkflow } from './services/geminiService';
import { N8nWorkflow } from './types';
import { APP_TITLE, FOOTER_TEXT } from './constants';

const App: React.FC = () => {
  const [workflowDescription, setWorkflowDescription] = useState<string>('');
  const [generatedWorkflow, setGeneratedWorkflow] = useState<N8nWorkflow | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);

  React.useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
      setError("API_KEY environment variable is not set. Please configure it to use the AI features.");
    }
  }, []);

  const handleGenerateWorkflow = useCallback(async () => {
    if (!workflowDescription.trim()) {
      setError('Please enter a workflow description.');
      return;
    }
    if (apiKeyMissing) {
      setError("API_KEY environment variable is not set. Cannot generate workflow.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedWorkflow(null);

    try {
      const workflow = await generateWorkflow(workflowDescription);
      setGeneratedWorkflow(workflow);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to generate workflow: ${err.message}`);
      } else {
        setError('An unknown error occurred while generating the workflow.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [workflowDescription, apiKeyMissing]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Header title={APP_TITLE} />
      
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-6">
        {apiKeyMissing && (
          <ErrorMessage message="Warning: API_KEY is not configured. AI functionality will be disabled."/>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
            <WorkflowInputArea
              description={workflowDescription}
              setDescription={setWorkflowDescription}
              onGenerate={handleGenerateWorkflow}
              isLoading={isLoading}
              disabled={apiKeyMissing}
            />
          </div>
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg min-h-[300px] flex flex-col">
            <WorkflowOutputArea
              workflow={generatedWorkflow}
              isLoading={isLoading}
              error={error && !apiKeyMissing ? error : null} 
            />
          </div>
        </div>
        {error && apiKeyMissing && <ErrorMessage message={error} /> }
      </main>

      <footer className="bg-slate-800 text-slate-200 text-center p-4 shadow-md">
        <p>{FOOTER_TEXT}</p>
      </footer>
    </div>
  );
};

export default App;
