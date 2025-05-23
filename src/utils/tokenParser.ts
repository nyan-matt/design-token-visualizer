import { TokenNode, TokenValue, TokenFile } from '../types/tokens';

export function parseTokenReferences(value: string): string[] {
  const regex = /\{([^}]+)\}/g;
  const matches = value.match(regex) || [];
  return matches.map(match => match.slice(1, -1));
}

// Helper: find a node by dot-path across all top-level keys
export function findNodeByDotPath(tokens: TokenFile, dotPath: string): any {
  const parts = dotPath.split('.');
  for (const topLevelKey of Object.keys(tokens)) {
    // Skip metadata blocks (keys starting with $)
    if (topLevelKey.startsWith('$')) continue;
    
    let current: any = tokens[topLevelKey];
    let found = true;
    for (const part of parts) {
      if (!current || !(part in current)) {
        found = false;
        break;
      }
      current = current[part];
    }
    if (found) return current;
  }
  return null;
}

export function resolveTokenValue(tokens: TokenFile, path: string): any {
  const parts = path.split('.');
  let current: any = tokens;
  
  // Skip metadata blocks during traversal
  for (const part of parts) {
    if (part.startsWith('$')) continue;
    if (!current[part]) return null;
    current = current[part];
  }
  
  if ('$value' in current) {
    const value = current.$value;
    if (typeof value === 'string' && value.includes('{')) {
      const references = parseTokenReferences(value);
      let resolvedValue = value;
      for (const ref of references) {
        // Try to resolve reference by searching all top-level keys
        const refNode = findNodeByDotPath(tokens, ref);
        const refValue = refNode && ('$value' in refNode) ? refNode.$value : refNode;
        resolvedValue = resolvedValue.replace(`{${ref}}`, refValue);
      }
      return resolvedValue;
    }
    return value;
  }
  return current;
} 