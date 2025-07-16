
import React, { useState, useCallback } from 'react';
import type { TopologyData } from './types';
import { generateTopologyData, GenerateConfig } from './services/geminiService';
import NetworkVisualizer from './components/NetworkVisualizer';
import { OPENROUTER_MODELS } from './constants';

const exampleDescription = `An edge router, R1, connects to the internet cloud.
This router also connects to a core switch, SW-Core.
SW-Core is connected to two distribution switches: Dist-SW1 and Dist-SW2.
Dist-SW1 connects to a firewall, FW1, which in turn protects a web server, WebSrv-01.
Dist-SW2 connects to two access switches: Acc-SW1 and Acc-SW2.
Acc-SW1 connects to PC-Alice and PC-Bob.
Acc-SW2 connects to PC-Charlie.`;

interface ApiSettings {
  provider: 'gemini' | 'openrouter';
  geminiApiKey: string;
  openRouterApiKey: string;
  openRouterModel: string;
}

const ApiConfigScreen = ({ onConfigured }: { onConfigured: (config: ApiSettings) => void; }) => {
  const [provider, setProvider] = useState<'gemini' | 'openrouter'>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [openRouterModel, setOpenRouterModel] = useState(OPENROUTER_MODELS[0]);
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (provider === 'gemini' && !geminiApiKey.trim()) {
      setError('Please enter a Gemini API Key.');
      return;
    }
    if (provider === 'openrouter' && !openRouterApiKey.trim()) {
      setError('Please enter an OpenRouter API Key.');
      return;
    }
    setError('');
    onConfigured({ provider, geminiApiKey, openRouterApiKey, openRouterModel });
  };
  
  return (
     <div className="flex items-center justify-center min-h-screen bg-gray-900 font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-blue-400">AI Network Visualizer</h1>
          <p className="mt-2 text-gray-400">Configure your AI Provider to begin.</p>
        </header>

        {error && (
          <div className="p-3 text-sm text-red-300 bg-red-900/50 border border-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-lg font-medium text-gray-300">Select Provider</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setProvider('gemini')}
              className={`px-4 py-3 font-semibold rounded-lg transition-all duration-200 ${
                provider === 'gemini'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Gemini
            </button>
            <button
              onClick={() => setProvider('openrouter')}
              className={`px-4 py-3 font-semibold rounded-lg transition-all duration-200 ${
                provider === 'openrouter'
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              OpenRouter
            </button>
          </div>
        </div>

        <div className="min-h-[150px]">
          {provider === 'gemini' && (
            <div className="space-y-2 animate-fade-in">
              <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-300">
                Gemini API Key
              </label>
              <input
                id="gemini-key"
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API Key"
                className="w-full px-3 py-2 text-gray-200 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {provider === 'openrouter' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <label htmlFor="openrouter-key" className="block text-sm font-medium text-gray-300">
                  OpenRouter API Key
                </label>
                <input
                  id="openrouter-key"
                  type="password"
                  value={openRouterApiKey}
                  onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  placeholder="Enter your OpenRouter API Key"
                  className="w-full px-3 py-2 text-gray-200 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="openrouter-model" className="block text-sm font-medium text-gray-300">
                  Select a Free Model
                </label>
                <select
                  id="openrouter-model"
                  value={openRouterModel}
                  onChange={(e) => setOpenRouterModel(e.target.value)}
                  className="w-full px-3 py-2 text-gray-200 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {OPENROUTER_MODELS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleContinue}
          className="w-full px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors"
        >
          Continue
        </button>
      </div>
       <style>{`
        .animate-fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
    </div>
  );
};


const App: React.FC = () => {
  const [description, setDescription] = useState<string>(exampleDescription);
  const [topologyData, setTopologyData] = useState<TopologyData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiSettings | null>(null);

  const handleConfigured = (config: ApiSettings) => {
    setApiConfig(config);
  };

  const handleGenerateTopology = useCallback(async () => {
    if (!apiConfig) {
        setError("API is not configured.");
        return;
    }
    if (!description.trim()) {
      setError("Please enter a network description.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const configForRequest: GenerateConfig = {
        provider: apiConfig.provider,
        apiKey: apiConfig.provider === 'gemini' ? apiConfig.geminiApiKey : apiConfig.openRouterApiKey,
        model: apiConfig.provider === 'openrouter' ? apiConfig.openRouterModel : undefined,
        description: description,
    };

    try {
      const data = await generateTopologyData(configForRequest);
      const nodeIds = new Set(data.nodes.map(n => n.id));
      const validLinks = data.links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
      setTopologyData({ nodes: data.nodes, links: validLinks });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setTopologyData({ nodes: [], links: [] });
    } finally {
      setIsLoading(false);
    }
  }, [description, apiConfig]);
  
  const handleBackToConfig = () => {
    setApiConfig(null);
    setTopologyData({ nodes: [], links: [] });
    setError(null);
  };

  if (!apiConfig) {
    return <ApiConfigScreen onConfigured={handleConfigured} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white font-sans">
      <div className="w-full md:w-1/3 lg:w-1/4 p-4 flex flex-col space-y-4 border-r border-gray-700 bg-gray-800/50">
        <header className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-blue-400">AI Network Visualizer</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Using <span className="font-semibold capitalize text-purple-400">{apiConfig.provider}</span>
                </p>
            </div>
            <button
                onClick={handleBackToConfig}
                className="text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
                title="Change API Provider"
            >
              &#x2190; Change
            </button>
        </header>

        <div className="flex-grow flex flex-col">
          <label htmlFor="description" className="text-gray-300 mb-2 font-semibold">
            Network Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full flex-grow p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow duration-200 text-gray-200 resize-none"
            placeholder="e.g., A router R1 is connected to a switch SW1..."
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleGenerateTopology}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Topology'
          )}
        </button>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
            <p className="font-bold mb-1">Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>

      <main className="w-full md:w-2/3 lg:w-3/4 flex-grow p-4">
        {topologyData.nodes.length === 0 && !isLoading && !error && (
           <div className="flex items-center justify-center h-full text-gray-500 bg-gray-800 rounded-lg">
             <div className="text-center">
                <h2 className="text-2xl font-semibold">Visualization Area</h2>
                <p>Your network graph will appear here.</p>
             </div>
           </div>
        )}
        <NetworkVisualizer data={topologyData} />
      </main>
    </div>
  );
};

export default App;
