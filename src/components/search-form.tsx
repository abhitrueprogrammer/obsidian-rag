"use client";
import React, { useContext, useState, useEffect } from "react";
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

export function SearchForm({ ...props }: React.ComponentProps<"div">) {
  const [vaults, setVaults] = useState<
    { id: number; path: string; created_at: string }[]
  >([]);
  const { folder, setFolder } = useContext(FolderContext);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchVaults() {
      const vaults = await window.electronAPI.getVaults();
      setVaults(vaults);
    }
    fetchVaults();
  }, []);

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
            {folder ? folder : "Select vault..."}
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
                    {vault.path}
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