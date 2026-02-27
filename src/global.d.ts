interface ElectronAPI {
  selectFolder: () => Promise<string | undefined>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
