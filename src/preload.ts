// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: () => ipcRenderer.invoke("dialog:openDirectory"),
  injestDocs: (path: string) => ipcRenderer.invoke("ingest-docs", path),
  startSearch: (query: string, vaultPath?: string) =>
    ipcRenderer.send("start-search", query, vaultPath),
  addVault: (path: string) => ipcRenderer.invoke("db:addVault", path),
  getVaults: () => ipcRenderer.invoke("db:getVaults"),
  removeVault: (path: string) => ipcRenderer.invoke("db:removeVault", path),

  onAgentChunk: (callback: (chunk: string) => void) => {
    ipcRenderer.removeAllListeners("agent-chunk");
    ipcRenderer.on("agent-chunk", (_event, chunk) => callback(chunk));
  },
  onAgentSources: (
    callback: (
      sources: Array<{ content: string; metadata: Record<string, unknown> }>,
    ) => void,
  ) => {
    ipcRenderer.removeAllListeners("agent-sources");
    ipcRenderer.on("agent-sources", (_event, sources) => callback(sources));
  },
});
