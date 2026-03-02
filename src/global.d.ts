interface ElectronAPI {
  selectFolder: () => Promise<string | undefined>;
  injestDocs: (dirPath: string) => Promise<{ count: number }>;
  startSearch: (query: string) => void;
  onAgentChunk: (callback: (chunk: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
