interface ElectronAPI {
  selectFolder: () => Promise<string | undefined>;
  injestDocs: (dirPath: string) => Promise<{ count: number }>;
  startSearch: (query: string, vaultPath?: string) => void;
  onAgentChunk: (callback: (chunk: string) => void) => void;
  addVault: (path: string) => Promise<void>;
  getVaults: () => Promise<{ id: number; path: string; created_at: string }[]>;
  removeVault: (path: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
