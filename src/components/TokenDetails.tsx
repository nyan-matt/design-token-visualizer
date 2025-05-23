import React from 'react';
import { TokenNode } from '../types/tokens';

interface TokenDetailsProps {
  token: string;
  tokens: TokenNode;
}

export default function TokenDetails({ token, tokens }: TokenDetailsProps) {
  const getTokenValue = (path: string): any => {
    const parts = path.split('.');
    let current: any = tokens;
    
    for (const part of parts) {
      if (!current[part]) return null;
      current = current[part];
    }
    
    return current;
  };

  const tokenValue = getTokenValue(token);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Token Details</h2>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-medium mb-2">Path</h3>
        <code className="block bg-gray-50 p-2 rounded mb-4">{token}</code>
        
        <h3 className="font-medium mb-2">Value</h3>
        <pre className="bg-gray-50 p-2 rounded overflow-auto">
          {JSON.stringify(tokenValue, null, 2)}
        </pre>
      </div>
    </div>
  );
} 