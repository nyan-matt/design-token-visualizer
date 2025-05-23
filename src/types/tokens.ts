export interface TokenValue {
  $value: string | number | object;
  $type?: string;
  $description?: string;
}

export interface TokenNode {
  [key: string]: TokenValue | TokenNode;
}

// Special handling for metadata blocks
export interface TokenMetadata {
  [key: string]: any;
}

export interface TokenFile {
  [key: string]: TokenNode | TokenMetadata;
}

export interface TokenReference {
  path: string;
  value: any;
}

export interface TokenGraph {
  selectedToken: string;
  upstream: TokenReference[];
  downstream: TokenReference[];
} 