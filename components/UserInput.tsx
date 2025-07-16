
import React, { useState } from 'react';

interface UserInputProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState<string>('Create a network for a small office with 2 routers for redundancy, connecting to the internet. Behind the routers, there is a firewall. The internal network has 2 switches and 10 PCs, and 1 server. The PCs should be split between the two switches.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800/50 rounded-lg shadow-lg border border-gray-700">
      <label htmlFor="prompt" className="block text-lg font-medium text-gray-200 mb-2">
        Describe your desired network topology
      </label>
      <textarea
        id="prompt"
        rows={4}
        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-none"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g., A small business network with 1 router, 2 switches, and 15 PCs..."
      />
      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-blue-900 disabled:cursor-not-allowed disabled:text-gray-400 transition-colors"
      >
        {isLoading ? 'Generating...' : 'Generate Topology'}
      </button>
    </form>
  );
};

export default UserInput;
