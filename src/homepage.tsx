import React, { useContext, useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { FolderContext } from "./contexts/contexts";

interface Source {
  content: string;
  metadata: Record<string, unknown>;
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [agentOutput, setAgentOutput] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { folder } = useContext(FolderContext);

  useEffect(() => {
    window.electronAPI.onAgentChunk((chunk) => {
      setAgentOutput((prev) => prev + chunk);
      setIsSearching(false);
    });

    window.electronAPI.onAgentSources((sources) => {
      setSources(sources);
    });
  }, []);

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setAgentOutput("");
    setSources([]);
    setIsSearching(true);
    window.electronAPI.startSearch(trimmed, folder || undefined);
  };

  if (!folder) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-muted-foreground">Select a vault to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {/* Answer section */}
          <div className="whitespace-pre-wrap rounded-md border p-4 text-sm">
            {agentOutput || "Ask a question below and the answer will appear here."}
          </div>

          {/* Sources section */}
          {sources.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Sources</h3>
              {sources.map((source, index) => (
                <details key={index} className="rounded-md border">
                  <summary className="cursor-pointer p-2 text-sm hover:bg-muted">
                    {source.metadata.source 
                      ? String(source.metadata.source).split("/").pop() 
                      : `Source ${index + 1}`}
                  </summary>
                  <div className="border-t p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                    {source.content}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-3">
        <div className="mx-auto flex w-full max-w-4xl gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Ask about your vault..."
          />
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>
    </div>
  );
}