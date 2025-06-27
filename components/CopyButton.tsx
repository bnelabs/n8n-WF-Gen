
import React, { useState, useCallback } from 'react';
import { COPY_BUTTON_TEXT, COPIED_BUTTON_TEXT } from '../constants';

interface CopyButtonProps {
  textToCopy: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!navigator.clipboard) {
      // Fallback for older browsers or insecure contexts
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text (fallback): ", err);
        alert("Failed to copy text. Please try again or copy manually.");
      }
      return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert("Failed to copy text. Please try again or copy manually.");
    });
  }, [textToCopy]);

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
                  ${copied ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}
    >
      {copied ? COPIED_BUTTON_TEXT : COPY_BUTTON_TEXT}
    </button>
  );
};
