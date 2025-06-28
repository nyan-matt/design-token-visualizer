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

// Helper: get the value from a token node, supporting both $value and value
function getTokenValue(node: any): string | undefined {
  if (!node) return undefined;
  if (typeof node.$value === 'string') return node.$value;
  if (typeof node.value === 'string') return node.value;
  return undefined;
}

export function findUpstreamReferences(
  tokens: TokenNode,
  tokenPath: string,
  visited: Set<string> = new Set()
): TokenReference[] {
  if (visited.has(tokenPath)) return [];
  visited.add(tokenPath);

  const references: TokenReference[] = [];
  //const tokenValue = resolveTokenValue(tokens, tokenPath);

  // Find the node for the selected token
  const node = findNodeByDotPath(tokens, getDotPath(tokenPath));
  const nodeValue = getTokenValue(node);
  if (node && typeof nodeValue === 'string') {
    const refs = parseTokenReferences(nodeValue);
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

    const value = getTokenValue(node);
    if (typeof value === 'string' && value.includes(`{${dotPath}}`)) {
      references.push({
        path: currentPath,
        value: value
      });
    }

    // Traverse children if not a leaf node
    Object.entries(node).forEach(([key, child]) => {
      // Avoid recursing into $value or value keys
      if (key === '$value' || key === 'value') return;
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      traverse(child, newPath);
    });
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
    const nodeValue = getTokenValue(node);
    if (node && typeof nodeValue === 'string') {
      const refs = parseTokenReferences(nodeValue);
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