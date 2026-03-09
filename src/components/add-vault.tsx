import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";

export default function AddVault() {
  const [path, setPath] = useState("");

  return (
    <Button
      onClick={async () => {
        const folderPath = await window.electronAPI.selectFolder();
        if (folderPath) {
          setPath(folderPath);

        await toast.promise(
          (async () => {
            await window.electronAPI.addVault(folderPath);

            // TODO: Create a "is injested" state in the DB and check that here before indexing
            await window.electronAPI.injestDocs(folderPath);
          })(),
          {
            loading: "Storing vault...",
            success: "Vault added successfully.",
            error: (err) =>
              `Failed to add vault: ${
                err instanceof Error ? err.message : String(err)
              }`,
          }
        );

          // 
        }
      }}
    >
      +
    </Button>
  );
}
