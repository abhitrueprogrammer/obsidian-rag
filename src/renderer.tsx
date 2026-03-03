/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Button } from "./components/ui/button";
import { toast, Toaster } from "sonner";

function App() {
  const [path, setPath] = useState("");
  const [agentOutput, setAgentOutput] = useState("");

  window.electronAPI.onAgentChunk((chunk) => {
    setAgentOutput((prev) => prev + chunk);
  });
  return (
    <div>
      <Toaster />

      {path}
      <Button
        onClick={async () => {
          const folderPath = await window.electronAPI.selectFolder();
          if (folderPath) {
            setPath(folderPath);
          }
        }}
      >
        Open obsidian folder
      </Button>
      <Button
        onClick={async () => {
          await toast.promise(window.electronAPI.injestDocs(path), {
            loading: "Storing documents in DB...",
            success: "Documents stored successfully.",
            error: (err) =>
              `Failed to store documents: ${
                err instanceof Error ? err.message : String(err)
              }`,
          });
        }}
        disabled={!path}
      >
        Store Data in DB
      </Button>

      <Button
        onClick={async () => {
          window.electronAPI.startSearch("What example for inheritance is in this document?");
        }}
      >
        Search
      </Button>
      {agentOutput}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
