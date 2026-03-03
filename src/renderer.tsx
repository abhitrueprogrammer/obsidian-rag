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

function App() {
  const [path, setPath] = useState("");
  const [agentOutput, setAgentOutput] = useState("");

  window.electronAPI.onAgentChunk((chunk) => {
    setAgentOutput((prev) => prev + chunk);
  });
  return (
    <div>
      <h1 className="bg-amber-950 text-red-800">
        Hello Electron + Vite + React
      </h1>
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
          try {
            console.log("Ingesting documents from path:", path);
            await window.electronAPI.injestDocs(path);
            console.log("Document ingestion completed successfully.");
          } catch (error) {
            console.error("Error ingesting docs:", error);
          }
        }}
        disabled={!path}
      >
        Store Data in DB
      </Button>

      <Button
        onClick={async () => {
          window.electronAPI.startSearch("What is in this doc?");
        }}
      >
        Search
      </Button>
      {agentOutput}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
