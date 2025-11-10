/**
 * Workflow Generation Progress Component
 * Shows detailed progress steps during workflow generation
 */

import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ProgressStep {
  id: string;
  label: string;
  duration: number; // ms to wait before moving to next step
  status: 'pending' | 'active' | 'complete';
}

const GENERATION_STEPS: Omit<ProgressStep, 'status'>[] = [
  { id: 'analyzing', label: 'Analyzing workflow description', duration: 800 },
  { id: 'detecting', label: 'Detecting services and triggers', duration: 600 },
  { id: 'selecting', label: 'Selecting appropriate nodes', duration: 700 },
  { id: 'generating', label: 'Generating workflow with AI', duration: 2000 },
  { id: 'validating', label: 'Validating and auto-fixing', duration: 800 },
];

export const WorkflowGenerationProgress: React.FC = () => {
  const [steps, setSteps] = useState<ProgressStep[]>(
    GENERATION_STEPS.map((step) => ({ ...step, status: 'pending' }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (currentStepIndex >= steps.length) return;

    // Mark current step as active
    setSteps((prevSteps) =>
      prevSteps.map((step, index) => ({
        ...step,
        status: index === currentStepIndex ? 'active' : index < currentStepIndex ? 'complete' : 'pending',
      }))
    );

    // Move to next step after duration
    const timer = setTimeout(() => {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      }
    }, GENERATION_STEPS[currentStepIndex].duration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps.length]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10 p-8">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <LoadingSpinner className="h-12 w-12 text-sky-600" />
        </div>

        <h3 className="text-lg font-semibold text-center text-slate-800 mb-6">
          Generating Workflow
        </h3>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              {/* Status indicator */}
              <div className="flex-shrink-0">
                {step.status === 'complete' ? (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : step.status === 'active' ? (
                  <div className="w-6 h-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                )}
              </div>

              {/* Step label */}
              <div
                className={`flex-1 text-sm font-medium transition-colors ${
                  step.status === 'active'
                    ? 'text-sky-600'
                    : step.status === 'complete'
                    ? 'text-green-600'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-sky-500 h-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-slate-500 text-center mt-2">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowGenerationProgress;
