import { TokenFile } from '../types/tokens';

export function parseTokenReferences(value: string): string[] {
  const regex = /\{([^}]+)\}/g;
  const matches = value.match(regex) || [];
  return matches.map(match => match.slice(1, -1));
}

// Helper: sanitize a key by replacing spaces with dashes
function sanitizeKey(key: string): string {
  return key.replace(/\s+/g, '-');
}

// Recursively replace spaces in all object keys with dashes
export function replaceSpacesInKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(replaceSpacesInKeys);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = sanitizeKey(key);
      acc[newKey] = replaceSpacesInKeys(value);
      return acc;
    }, {} as any);
  }
  return obj;
}

// Helper: find a node by dot-path across all top-level keys (now all keys are sanitized)
export function findNodeByDotPath(tokens: TokenFile, dotPath: string): any {
  const parts = dotPath.split('.').map(sanitizeKey);
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
  const parts = path.split('.').map(sanitizeKey);
  let current: any = tokens;

  // Skip metadata blocks during traversal
  for (const part of parts) {
    if (part.startsWith('$')) continue;
    if (!current[part]) {
      return null;
    } else {
      current = current[part];
    }
  }

  if ('$value' in current || 'value' in current) {
    const value = ('$value' in current) ? current.$value : current.value;
    if (typeof value === 'string' && value.includes('{')) {
      const references = parseTokenReferences(value);
      let resolvedValue = value;
      for (const ref of references) {
        // Try to resolve reference by searching all top-level keys
        const refNode = findNodeByDotPath(tokens, ref);
        const refValue =
          refNode && ('$value' in refNode)
            ? refNode.$value
            : refNode && ('value' in refNode)
            ? refNode.value
            : refNode;
        resolvedValue = resolvedValue.replace(`{${ref}}`, refValue);
      }
      return resolvedValue;
    }
    return value;
  }
  return current;
}