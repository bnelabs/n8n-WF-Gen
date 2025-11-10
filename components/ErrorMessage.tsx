
import React from 'react';

interface ErrorMessageProps {
  message: string | null;
}

// Error type detection and suggestions
function getErrorSuggestion(message: string): string | null {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('rate limit')) {
    return 'You have made too many requests. Please wait a minute before trying again.';
  }

  if (lowerMessage.includes('cannot connect') || lowerMessage.includes('backend server')) {
    return 'Make sure the backend server is running. Run `npm run server:dev` in a separate terminal.';
  }

  if (lowerMessage.includes('api key') || lowerMessage.includes('configuration error')) {
    return 'The server API key is not configured. Set GEMINI_API_KEY in server/.env file.';
  }

  if (lowerMessage.includes('quota exceeded')) {
    return 'The API quota has been exceeded. Please check your Gemini API usage limits or try again later.';
  }

  if (lowerMessage.includes('invalid request')) {
    return 'Try rephrasing your workflow description or make it more specific.';
  }

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'The request took too long. Try simplifying your workflow description or try again.';
  }

  return null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  const suggestion = getErrorSuggestion(message);

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md" role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
            {suggestion && (
              <div className="mt-3 bg-red-100 border border-red-200 rounded-md p-3">
                <p className="text-sm font-medium text-red-800">💡 Suggestion:</p>
                <p className="text-sm text-red-700 mt-1">{suggestion}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
