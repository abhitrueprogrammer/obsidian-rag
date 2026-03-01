import {
  createAgent,
  dynamicSystemPromptMiddleware,
  initChatModel,
  SystemMessage,
} from "langchain";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { MarkdownTextSplitter } from "@langchain/textsplitters";

export async function initializeAI() {
  const model = await initChatModel("google-genai:gemini-2.5-flash-lite");
  const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });
  const vectorStore = new Chroma(embeddings, {
    collectionName: "a-test-collection",
  });
  return { model, vectorStore };
}

export async function loadMarkdownToStore(
  directoryPath: string,
  vectorStore: Chroma,
) {
  const textLoader = new TextLoader(directoryPath);
  const docs = await textLoader.load();
  const splitter = new MarkdownTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await splitter.splitDocuments(docs);
  await vectorStore.addDocuments(allSplits);
  return { count: allSplits.length };
}

export async function runSearchAgent(
  event: Electron.IpcMainInvokeEvent,
  query: string,
  model: any,
  vectorStore: Chroma,
) {
  const agent = createAgent({
    model,
    tools: [],
    middleware: [
      dynamicSystemPromptMiddleware(async (state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        const lastQuery =
          typeof lastMessage.content === "string" ? lastMessage.content : "";

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
    event.sender.send("agent-chunk", lastMessage);
  }
}
