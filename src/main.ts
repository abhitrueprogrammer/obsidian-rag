import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import {
  initializeAI,
  loadMarkdownToStore,
  runSearchAgent,
  deleteVaultFromStore,
} from "@/lib/rag-utils";
import { config } from "dotenv";
import { addVault, getVaults, removeVault } from "./lib/db";
// Load environment variables from .env file
config();
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  let ai;

  try {
    ai = await initializeAI();
  } catch (error) {
    console.error("Failed to initialize AI services:", error);
    dialog.showErrorBox(
      "Initialization Failed",
      `Failed to initialize AI services:\n\n${error instanceof Error ? error.message : String(error)}\n\nThe application will now quit.`,
    );
    app.quit();
    return;
  }
  ipcMain.handle("ingest-docs", async (_, dirPath) => {
    try {
      return await loadMarkdownToStore(dirPath, ai.vectorStore);
    } catch (error) {
      console.error("Failed to ingest documents:", error);
      
     throw error;
    }
  });

  ipcMain.on("start-search", (event, query, vaultPath) =>
    runSearchAgent(event, query, ai.model, ai.vectorStore, vaultPath),
  );
  ipcMain.handle("db:addVault", (_event, vaultPath: string) =>
    addVault(vaultPath),
  );
  ipcMain.handle("db:getVaults", () => getVaults());
  ipcMain.handle("db:removeVault", async (_event, vaultPath: string) => {
    try {
      // Delete from vector store first
      await deleteVaultFromStore(vaultPath, ai.vectorStore);
      // Then remove from database
      return removeVault(vaultPath);
    } catch (error) {
      console.error("Failed to remove vault:", error);
      throw error;
    }
  });

  ipcMain.handle("dialog:openDirectory", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select your obsidian Folder",
      buttonLabel: "Select Folder",
    });

    if (result.canceled) {
      return null;
    } else {
      return result.filePaths[0];
    }
  });
  createWindow();
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
