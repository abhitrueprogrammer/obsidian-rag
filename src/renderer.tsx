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
import HomePage from "./homepage";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { FolderContext } from "./contexts/contexts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "./contexts/theme-context";

const queryClient = new QueryClient();

function App() {
  const [folder, setFolder] = useState("");

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SidebarProvider>
            <FolderContext value={{ folder, setFolder }}>
              <div className="flex h-screen w-full overflow-hidden">
                <AppSidebar />
                <SidebarTrigger />
                <main className="flex min-h-0 flex-1">
                  <HomePage />
                </main>
              </div>
            </FolderContext>
            <Toaster />
          </SidebarProvider>
        </TooltipProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
