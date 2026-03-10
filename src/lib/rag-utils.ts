import {
  createAgent,
  dynamicSystemPromptMiddleware,
  HumanMessage,
  initChatModel,
  SystemMessage,
} from "langchain";
import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import {
  ConfigurableModel,
  ConfigurableChatModelCallOptions,
} from "langchain/chat_models/universal";
import { dialog } from "electron";

export async function initializeAI() {
  const model = await initChatModel("google-genai:gemini-2.5-flash-lite");
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001", // free tier available
  });
  const vectorStore = new Chroma(embeddings, {
    collectionName: "obsidian-vaults", // Single collection for all vaults
  });
  return { model, vectorStore };
}

export async function loadMarkdownToStore(
  directoryPath: string,
  vectorStore: Chroma,
): Promise<{ count: number }> {
  const loader = new DirectoryLoader(
    directoryPath,
    {
      ".md": (filePath: string) => new TextLoader(filePath),
    },
    true,
    "ignore",
  );
  const docs = await loader.load();
  const splitter = new MarkdownTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await splitter.splitDocuments(docs);

  // Add vault path to metadata for filtering/deletion
  allSplits.forEach((doc) => {
    doc.metadata.vaultPath = directoryPath;
  });

  console.log("Split into chunks:", allSplits.length);

  // Test embedding generation on the first chunk before adding to the store
  if (allSplits.length > 0) {
    try {
      console.log("Testing embedding generation...");
      const testEmbedding = await vectorStore.embeddings.embedQuery(
        allSplits[0].pageContent,
      );
      console.log("Test embedding length:", testEmbedding.length);
      console.log("First few values:", testEmbedding.slice(0, 5));
    } catch (error) {
      console.error("Embedding generation failed:", error);
      await dialog.showErrorBox(
        "Embedding Generation Failed",
        `Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  await vectorStore.addDocuments(allSplits);

  return { count: allSplits.length };
}

export async function deleteVaultFromStore(
  vaultPath: string,
  vectorStore: Chroma,
): Promise<void> {
  // Delete all documents with matching vaultPath metadata
  await vectorStore.delete({ filter: { vaultPath } });
}

export async function runSearchAgent(
  event: Electron.IpcMainInvokeEvent,
  query: string,
  model: ConfigurableModel<
    BaseLanguageModelInput,
    ConfigurableChatModelCallOptions
  >,
  vectorStore: Chroma,
  vaultPath?: string, // Optional: filter to specific vault
) {
  const retrievedDocs = await vectorStore.similaritySearch(
    query,
    4,
    vaultPath ? { vaultPath } : undefined, // Filter by vault if specified
  );
  console.log("Retrieved docs:", retrievedDocs);
  const docsContent = retrievedDocs.map((doc) => doc.pageContent).join("\n\n");
  event.sender.send(
    "agent-sources",
    retrievedDocs.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    })),
  );
  const systemPrompt = `You are a helpful assistant.
Use the context below to answer.
If the answer is not in context, say you don't know.

Context:
${docsContent}`;

  const stream = await model.stream([
    new SystemMessage(systemPrompt),
    new HumanMessage(query),
  ]);

  for await (const chunk of stream) {
    const content =
      typeof chunk.content === "string"
        ? chunk.content
        : chunk.content
            .map((c: unknown) => {
              if (typeof c === "string") return c;
              if (c && typeof c === "object" && "text" in c) {
                const text = (c as { text?: unknown }).text;
                return typeof text === "string" ? text : "";
              }
              return "";
            })
            .join("");

    if (content) event.sender.send("agent-chunk", content);
  }
}
