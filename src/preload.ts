// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: () => ipcRenderer.invoke("dialog:openDirectory"),
  injestDocs: (path: string) => ipcRenderer.invoke("ingest-docs", path),
  startSearch: (query: string) => ipcRenderer.send("start-search", query),
  addVault: (path: string) => ipcRenderer.invoke("db:addVault", path),
  getVaults: () => ipcRenderer.invoke("db:getVaults"),
  removeVault: (path: string) => ipcRenderer.invoke("db:removeVault", path),

  onAgentChunk: (callback: (chunk: string) => void) => {
    ipcRenderer.removeAllListeners("agent-chunk");
    ipcRenderer.on("agent-chunk", (_event, chunk) => callback(chunk));
  },
});
