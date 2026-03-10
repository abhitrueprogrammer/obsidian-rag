import { createContext } from 'react';

export const FolderContext = createContext<{
  folder: string;
  setFolder: (path: string) => void;
}>({
  folder: "",
  setFolder: () => {
    // Placeholder implementation, will be overridden by provider
  },
});