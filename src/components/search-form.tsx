"use client";
import React, { useContext, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import AddVault from "./add-vault";
import { FolderContext } from "@/contexts/contexts";
import { ChevronsUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function SearchForm({ ...props }: React.ComponentProps<"div">) {
  const { folder, setFolder } = useContext(FolderContext);
  const [open, setOpen] = useState(false);

  const formatVaultPath = (vaultPath: string) => {
    const parts = vaultPath.split(/[\\/]/).filter(Boolean);
    return parts.slice(-2).join("/") || vaultPath;
  };

  const { data: vaults = [] } = useQuery({
    queryKey: ["vaults"],
    queryFn: () => window.electronAPI.getVaults(),
  });

  return (
    <div className="flex items-center gap-2" {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
          >
            {folder ? formatVaultPath(folder) : "Select vault..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search vaults..." />
            <CommandList>
              <CommandEmpty>No vaults found.</CommandEmpty>
              <CommandGroup >
                {vaults.map((vault) => (
                  <CommandItem
                    key={vault.id}
                    value={vault.path}
                    onSelect={(value) => {
                      setFolder(value);
                      setOpen(false);
                    }}
                  >
                    {formatVaultPath(vault.path)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <AddVault />
    </div>
  );
}