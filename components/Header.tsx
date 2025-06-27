
import React from 'react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-slate-800 text-white p-6 shadow-md">
      <div className="container mx-auto flex items-center space-x-3">
        <span className="text-3xl" role="img" aria-label="Robot icon">🤖</span>
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
    </header>
  );
};
