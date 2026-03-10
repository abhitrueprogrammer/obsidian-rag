import React, { useContext, useState } from "react";

import { Button } from "./ui/button";
import { toast } from "sonner";
import { FolderContext } from "@/contexts/contexts";

export default function AddVault() {
  const [path, setPath] = useState("");
  const {folder, setFolder} = useContext(FolderContext);
  
  return (
    <Button
      onClick={async () => {
        const folderPath = await window.electronAPI.selectFolder();
        if (folderPath) {
          setPath(folderPath);

          await toast.promise(
            (async () => {
              if(folderPath )
              // TODO: Create a "is injested" state in the DB and check that here before indexing
              await window.electronAPI.injestDocs(folderPath);
              // If the next call fails, we can retry without having to re-ingest the docs or deleting the vault from the DB
              await window.electronAPI.addVault(folderPath);
              
              setFolder(folderPath);
            })(),
            {
              loading: "Storing vault...",
              success: "Vault added successfully.",
              error: (err) =>
                `Failed to add vault: ${
                  err instanceof Error ? err.message : String(err)
                }`,
            },
          );

          //
        }
      }}
    >
      +
    </Button>
  );
}
