import React, { useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { toast } from "sonner";

export default function HomePage() {
  const [path, setPath] = useState("");
  
  const [agentOutput, setAgentOutput] = useState("");

  window.electronAPI.onAgentChunk((chunk) => {
    setAgentOutput((prev) => prev + chunk);
  });
  return (
    <div>
      
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
          window.electronAPI.startSearch(
            "What example for inheritance is in this document?",
          );
        }}
      >
        Search
      </Button>
      {agentOutput}
    </div>
  );
}
