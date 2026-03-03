import {
  createAgent,
  dynamicSystemPromptMiddleware,
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
    collectionName: "a-test-collection",
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
  console.log("Split into chunks:", allSplits.length);

  // Test embedding generation on the first chunk before adding to the store
  if (allSplits.length > 0) {
    try {
      console.log("Testing embedding generation...");
      const testEmbedding = await vectorStore.embeddings.embedQuery(
        allSplits[0].pageContent
      );
      console.log("Test embedding length:", testEmbedding.length);
      console.log("First few values:", testEmbedding.slice(0, 5));
    } catch (error) {
      console.error("Embedding generation failed:", error);
      await dialog.showErrorBox(
        "Embedding Generation Failed",
        `Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  await vectorStore.addDocuments(allSplits);

  return { count: allSplits.length };
}

export async function runSearchAgent(
  event: Electron.IpcMainInvokeEvent,
  query: string,
  model: ConfigurableModel<
    BaseLanguageModelInput,
    ConfigurableChatModelCallOptions
  >,
  vectorStore: Chroma,
) {
  const agent = createAgent({
    model,
    tools: [],
    middleware: [
      dynamicSystemPromptMiddleware(async (state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        const lastQuery =
          typeof lastMessage.content === "string"
            ? lastMessage.content
            : lastMessage.content.join("");

        const retrievedDocs = await vectorStore.similaritySearch(lastQuery, 2);
        const docsContent = retrievedDocs
          .map((doc) => doc.pageContent)
          .join("\n\n");

        return new SystemMessage(`Use this context: \n\n${docsContent}`);
      }),
    ],
  });

  const stream = await agent.stream(
    { messages: [{ role: "user", content: query }] },
    { streamMode: "values" },
  );

  for await (const step of stream) {
    const lastMessage = step.messages[step.messages.length - 1];
    event.sender.send("agent-chunk", lastMessage.content);
  }
}
