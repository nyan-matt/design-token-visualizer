import React, { useState, useEffect } from 'react';
import Split from 'react-split';
import TokenTree from './components/TokenTree';
import MermaidGraph from './components/MermaidGraph';
import TokenDetails from './components/TokenDetails';
import FileUpload from './components/FileUpload';
import { TokenNode, TokenGraph } from './types/tokens';
import { generateTokenGraph } from './utils/referenceResolver';

function App() {
  const [tokens, setTokens] = useState<TokenNode | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [tokenGraph, setTokenGraph] = useState<TokenGraph | null>(null);

  // Listen for tokenNodeClick events from MermaidGraph
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        setSelectedToken(e.detail);
        if (tokens) {
          const graph = generateTokenGraph(tokens, e.detail);
          setTokenGraph(graph);
        }
      }
    };
    window.addEventListener('tokenNodeClick', handler);
    return () => window.removeEventListener('tokenNodeClick', handler);
  }, [tokens]);

  const handleFileUpload = (jsonData: TokenNode) => {
    setTokens(jsonData);
  };

  const handleTokenSelect = (tokenPath: string) => {
    setSelectedToken(tokenPath);
    if (tokens) {
      const graph = generateTokenGraph(tokens, tokenPath);
      setTokenGraph(graph);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Design Token Visualizer</h1>
      </header>
      
      {!tokens ? (
        <FileUpload onUpload={handleFileUpload} />
      ) : (
        <Split
          className="flex-1 flex flex-row"
          sizes={[30, 70]}
          minSize={200}
          gutterSize={8}
          gutterStyle={() => ({
            backgroundColor: '#e5e7eb',
            width: '8px',
          })}
          direction="horizontal"
        >
          <div className="bg-white p-4 overflow-auto">
            <TokenTree
              tokens={tokens}
              onTokenSelect={handleTokenSelect}
              selectedToken={selectedToken}
            />
          </div>
          <div className="bg-gray-50 p-4 overflow-auto">
            {selectedToken && tokenGraph && (
              <>
                <MermaidGraph graph={tokenGraph} tokens={tokens} />
                <TokenDetails token={selectedToken} tokens={tokens} />
              </>
            )}
          </div>
        </Split>
      )}
    </div>
  );
}

export default App; 