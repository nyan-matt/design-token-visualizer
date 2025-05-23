import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { TokenGraph, TokenNode } from '../types/tokens';
import { buildUpstreamChain } from '../utils/referenceResolver';

interface MermaidGraphProps {
  graph: TokenGraph;
  tokens: TokenNode;
}

export default function MermaidGraph({ graph, tokens }: MermaidGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Initialize Mermaid once when component mounts
  useEffect(() => {
    const initMermaid = async () => {
      try {
        await mermaid.initialize({ 
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose'
        });
        setIsInitialized(true);
        setRenderError(null);
      } catch (error) {
        console.error('Error initializing Mermaid:', error);
        setRenderError('Failed to initialize diagram renderer');
      }
    };

    initMermaid();
  }, []);

  // Handle graph rendering
  useEffect(() => {
    if (!containerRef.current || !isInitialized) return;

    const generateMermaidCode = () => {
      const nodes = new Set<string>();
      const edges: string[] = [];

      // Build the upstream chain (root-most to selected)
      const upstreamChain = buildUpstreamChain(tokens, graph.selectedToken);
      for (let i = 0; i < upstreamChain.length - 1; i++) {
        nodes.add(upstreamChain[i]);
        nodes.add(upstreamChain[i + 1]);
        edges.push(`${upstreamChain[i]} --> ${upstreamChain[i + 1]}`);
      }

      // Add downstream references from the selected token
      graph.downstream.forEach((ref) => {
        nodes.add(ref.path);
        edges.push(`${graph.selectedToken} --> ${ref.path}`);
      });

      return `
        graph LR
          ${Array.from(nodes).map((node) => `    ${node}`).join('\n')}
          ${edges.join('\n')}
      `;
    };

    const renderDiagram = async () => {
      try {
        setRenderError(null);
        const { svg } = await mermaid.render('graphDiv', generateMermaidCode());
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        setRenderError('Error rendering diagram');
        if (containerRef.current) {
          containerRef.current.innerHTML = '<div class="text-red-500">Error rendering diagram</div>';
        }
      }
    };

    renderDiagram();
  }, [graph, tokens, isInitialized]);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Token Dependencies</h2>
      <div ref={containerRef} className="bg-white p-4 rounded shadow">
        {!isInitialized && <div className="text-gray-500">Initializing diagram...</div>}
        {renderError && <div className="text-red-500">{renderError}</div>}
      </div>
    </div>
  );
} 