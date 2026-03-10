import React, { useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderContext } from "@/contexts/contexts";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { MoreHorizontalIcon, FolderIcon, Trash2Icon } from "lucide-react"

export function NavProjects() {
  const { isMobile } = useSidebar();
  const { folder, setFolder } = useContext(FolderContext);
  const queryClient = useQueryClient();

  const { data: vaults = [] } = useQuery({
    queryKey: ["vaults"],
    queryFn: () => window.electronAPI.getVaults(),
  });

  const deleteVaultMutation = useMutation({
    mutationFn: (vaultPath: string) => window.electronAPI.removeVault(vaultPath),
    onSuccess: async (_data, deletedPath) => {
      await queryClient.invalidateQueries({ queryKey: ["vaults"] });
      if (folder === deletedPath) {
        setFolder("");
      }
    },
  });

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Vaults</SidebarGroupLabel>
      <SidebarMenu>
        {vaults.map((vault) => (
          <SidebarMenuItem key={vault.id}>
            <SidebarMenuButton onClick={() => setFolder(vault.path)}>
              <FolderIcon />
              <span>{vault.path.split('/').pop()}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="aria-expanded:bg-muted"
                >
                  <MoreHorizontalIcon
                  />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem onClick={() => setFolder(vault.path)}>
                  <FolderIcon className="text-muted-foreground" />
                  <span>Select Vault</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    toast.promise(deleteVaultMutation.mutateAsync(vault.path), {
                      loading: "Deleting vault...",
                      success: "Vault deleted.",
                      error: (err) =>
                        `Failed to delete vault: ${
                          err instanceof Error ? err.message : String(err)
                        }`,
                    });
                  }}
                >
                  <Trash2Icon className="text-muted-foreground" />
                  <span>Delete Vault</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
