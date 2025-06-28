import { useState, useEffect } from 'react';
import { TokenNode, TokenValue } from '../types/tokens';

interface TokenTreeProps {
  tokens: TokenNode;
  onTokenSelect: (path: string) => void;
  selectedToken: string | null;
}

export default function TokenTree({ tokens, onTokenSelect, selectedToken }: TokenTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Expand all parent nodes when selectedToken changes, while preserving existing expanded nodes
  useEffect(() => {
    if (selectedToken) {
      const parts = selectedToken.split('.');
      const newExpanded = new Set(expandedNodes); // Create a copy of existing expanded nodes
      let path = '';
      for (let i = 0; i < parts.length - 1; i++) {
        path = path ? `${path}.${parts[i]}` : parts[i];
        newExpanded.add(path); // Add parent nodes to existing set
      }
      setExpandedNodes(newExpanded);
    }
  }, [selectedToken]);

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: TokenNode | TokenValue, path: string = '', level: number = 0) => {
    const basePadding = level * 12;
    const leafExtraPadding = 20;

    if ('$value' in node || 'value' in node) {
      return (
        <div
          key={path}
          style={{ paddingLeft: basePadding + leafExtraPadding }}
          className={`py-1 cursor-pointer hover:bg-gray-100 ${
            selectedToken === path ? 'bg-blue-50' : ''
          }`}
          onClick={() => onTokenSelect(path)}
        >
          {path.split('.').pop()}
        </div>
      );
    }

    return Object.entries(node)
      .filter(([key]) => !key.startsWith('$')) // Filter out metadata blocks
      .map(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        const isExpanded = expandedNodes.has(currentPath);

        return (
          <div key={currentPath}>
            <div
              style={{ paddingLeft: basePadding }}
              className="flex items-center py-1 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleNode(currentPath)}
            >
              <span className="mr-2 text-sm">{isExpanded ? '▼' : '▶'}</span>
              {key}
            </div>
            {isExpanded && renderNode(value, currentPath, level + 1)}
          </div>
        );
      });
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search tokens..."
        className="w-full p-2 mb-4 border rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="token-tree">
        {renderNode(tokens)}
      </div>
    </div>
  );
} 