
import React, { useState, useCallback } from 'react';
import { generateTopology } from './services/geminiService';
import { AIResponse } from './types';
import UserInput from './components/UserInput';
import TopologyDiagram from './components/TopologyDiagram';
import D3TopologyDiagram from './components/D3TopologyDiagram';
import LoadingSpinner from './components/LoadingSpinner';
import Description from './components/Description';

type ViewTab = 'cytoscape' | 'd3';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('cytoscape');

  const handleGenerate = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      const response = await generateTopology(prompt);
      setAiResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const WelcomeMessage: React.FC = () => (
    <div className="text-center p-8 bg-gray-800/50 rounded-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-2">Welcome to the AI Network Visualizer</h2>
      <p className="text-gray-400">Describe the network you want to build in the text area above.</p>
      <p className="text-gray-400 mt-1">The AI will act as a senior network engineer to design and draw it for you.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 sm:text-5xl">
            AI Network Topology Visualizer
          </h1>
          <p className="mt-4 text-xl text-gray-400">
            Generate complex network diagrams from simple text descriptions.
          </p>
        </header>

        <main>
          <div className="mb-8">
            <UserInput onGenerate={handleGenerate} isLoading={isLoading} />
          </div>

          <div className="mt-8 p-4 bg-gray-800/20 rounded-lg min-h-[600px] flex flex-col items-center justify-center">
            {isLoading && <LoadingSpinner />}
            {error && (
              <div className="text-center text-red-400 bg-red-900/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">An Error Occurred</h3>
                <p>{error}</p>
              </div>
            )}
            {!isLoading && !error && !aiResponse && <WelcomeMessage />}
            {aiResponse && (
              <div className="w-full">
                <div className="mb-4 flex justify-center space-x-2">
                  <button onClick={() => setActiveTab('cytoscape')} className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'cytoscape' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
                    Cytoscape View
                  </button>
                  <button onClick={() => setActiveTab('d3')} className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'd3' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
                    D3.js View
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full h-full">
                  <div className="lg:col-span-1">
                    <Description text={aiResponse.description} />
                  </div>
                  <div className="lg:col-span-2 min-h-[600px]">
                    {activeTab === 'cytoscape' && <TopologyDiagram data={aiResponse.cytoscapeData} />}
                    {activeTab === 'd3' && <D3TopologyDiagram data={aiResponse.cytoscapeData} />}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        
        <footer className="text-center mt-12 text-gray-500">
          <p>Powered by Google Gemini, Cytoscape.js, and D3.js</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
