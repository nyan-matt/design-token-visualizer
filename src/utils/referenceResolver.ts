import { TokenNode, TokenReference, TokenGraph, TokenValue } from '../types/tokens';
import { parseTokenReferences, resolveTokenValue, findNodeByDotPath } from './tokenParser';

// Helper: get the dot-path (without top-level key) from a full path
function getDotPath(fullPath: string): string {
  const parts = fullPath.split('.');
  // Remove the top-level key if it contains a slash
  if (parts.length > 1 && parts[0].includes('/')) {
    return parts.slice(1).join('.');
  }
  return fullPath;
}

export function findUpstreamReferences(
  tokens: TokenNode,
  tokenPath: string,
  visited: Set<string> = new Set()
): TokenReference[] {
  if (visited.has(tokenPath)) return [];
  visited.add(tokenPath);

  const references: TokenReference[] = [];
  const tokenValue = resolveTokenValue(tokens, tokenPath);

  // Find the node for the selected token
  const node = findNodeByDotPath(tokens, getDotPath(tokenPath));
  if (node && typeof node.$value === 'string') {
    const refs = parseTokenReferences(node.$value);
    for (const ref of refs) {
      // Find the full path for the referenced node
      const refNode = findNodeByDotPath(tokens, ref);
      if (refNode) {
        // Find the full path for display
        const refFullPath = findFullPathForDotPath(tokens, ref);
      references.push({
          path: refFullPath,
          value: resolveTokenValue(tokens, refFullPath)
      });
        references.push(...findUpstreamReferences(tokens, refFullPath, visited));
      }
    }
  }
  return references;
}

// Helper: find the full path (including top-level key) for a given dot-path
function findFullPathForDotPath(tokens: TokenNode, dotPath: string): string {
  const parts = dotPath.split('.');
  for (const topLevelKey of Object.keys(tokens)) {
    let current: any = tokens[topLevelKey];
    let found = true;
    for (const part of parts) {
      if (!current || !(part in current)) {
        found = false;
        break;
      }
      current = current[part];
    }
    if (found) return `${topLevelKey}.${dotPath}`;
  }
  return dotPath;
}

export function findDownstreamReferences(
  tokens: TokenNode,
  tokenPath: string
): TokenReference[] {
  const references: TokenReference[] = [];
  const dotPath = getDotPath(tokenPath);

  function traverse(node: TokenNode | TokenValue, currentPath: string = '') {
    // Skip if node is not an object
    if (typeof node !== 'object' || node === null) return;

    if ('$value' in node) {
      const value = node.$value;
      if (typeof value === 'string' && value.includes(`{${dotPath}}`)) {
        references.push({
          path: currentPath,
          value: value
        });
      }
    } else {
      Object.entries(node).forEach(([key, value]) => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        traverse(value, newPath);
      });
    }
  }

  traverse(tokens);
  return references;
}

export function generateTokenGraph(
  tokens: TokenNode,
  tokenPath: string
): TokenGraph {
  return {
    selectedToken: tokenPath,
    upstream: findUpstreamReferences(tokens, tokenPath),
    downstream: findDownstreamReferences(tokens, tokenPath)
  };
}

// Build the upstream reference chain as a path (from root-most to selected token)
export function buildUpstreamChain(tokens: TokenNode, tokenPath: string): string[] {
  const chain: string[] = [];
  let currentPath = tokenPath;
  const visited = new Set<string>();
  while (true) {
    if (visited.has(currentPath)) break; // Prevent cycles
    visited.add(currentPath);
    chain.unshift(currentPath); // Add to the front (so root-most is first)
    const node = findNodeByDotPath(tokens, getDotPath(currentPath));
    if (node && typeof node.$value === 'string') {
      const refs = parseTokenReferences(node.$value);
      if (refs.length > 0) {
        // Only follow the first reference for the chain (assume single inheritance)
        const refFullPath = findFullPathForDotPath(tokens, refs[0]);
        currentPath = refFullPath;
        continue;
      }
    }
    break;
  }
  return chain;
} 