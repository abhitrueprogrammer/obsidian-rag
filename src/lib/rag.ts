import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { BaseRetriever } from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";

import path from "node:path";

/* =========================
   Types
========================= */

type VectorStoreType = "in-memory" | "chroma";
type SearchType = "similarity" | "mmr";

interface PdfQAConfig {
  model: string;
  pdfDocument: string;
  chunkSize: number;
  chunkOverlap: number;
  searchType?: SearchType;
  kDocuments: number;
  temperature?: number;
  searchKwargs?: Record<string, unknown>;
  vectorStoreType?: VectorStoreType;
}

/* =========================
   Class
========================= */

class PdfQA {
  private model: string;
  private pdfDocument: string;
  private chunkSize: number;
  private chunkOverlap: number;
  private searchType: SearchType;
  private kDocuments: number;
  private temperature: number;
  private searchKwargs?: Record<string, unknown>;
  private vectorStoreType: VectorStoreType;

  private llm!: Ollama;
  private documents!: Document[];
  private texts!: Document[];
  private db!: MemoryVectorStore | Chroma;
  private retriever!: BaseRetriever;
  private chain!: Awaited<ReturnType<typeof createRetrievalChain>>;
  private embeddings!: OllamaEmbeddings;

  constructor({
    model,
    pdfDocument,
    chunkSize,
    chunkOverlap,
    searchType = "similarity",
    kDocuments,
    temperature = 0.8,
    searchKwargs,
    vectorStoreType = "in-memory",
  }: PdfQAConfig) {
    this.model = model;
    this.pdfDocument = pdfDocument;
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.searchType = searchType;
    this.kDocuments = kDocuments;
    this.temperature = temperature;
    this.searchKwargs = searchKwargs;
    this.vectorStoreType = vectorStoreType;
  }

  async init(): Promise<this> {
    this.initChatModel();
    await this.loadDocuments();
    await this.splitDocuments();
    this.embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text:latest",
    });
    await this.createVectorStore();
    this.createRetriever();
    this.chain = await this.createChain();
    return this;
  }

  private initChatModel(): void {
    console.log("Loading model...");
    this.llm = new Ollama({
      model: this.model,
      temperature: this.temperature,
    });
  }

  private async loadDocuments(): Promise<void> {
    console.log("Loading PDFs...");
    const pdfLoader = new PDFLoader(
      path.join(import.meta.dirname, this.pdfDocument)
    );
    this.documents = await pdfLoader.load();
  }

  private async splitDocuments(): Promise<void> {
    console.log("Splitting documents...");
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });
    this.texts = await textSplitter.splitDocuments(this.documents);
  }

  private async createVectorStore(): Promise<void> {
    console.log("Creating document embeddings...");

    if (this.vectorStoreType === "in-memory") {
      this.db = await MemoryVectorStore.fromDocuments(
        this.texts,
        this.embeddings
      );
    } else {
      this.db = new Chroma(this.embeddings, {
        collectionName: "embeddings-collection",
        url: "http://localhost:8000",
        collectionMetadata: {
          "hnsw:space": "cosine",
        },
      });

      await this.db.addDocuments(this.texts);
    }
  }

  private createRetriever(): void {
    console.log("Initialize vector store retriever...");

    const retrieverOptions = {
      k: this.kDocuments,
      searchType: this.searchType,
      ...(this.searchKwargs && { searchKwargs: this.searchKwargs }),
    };

    this.retriever = this.db.asRetriever(retrieverOptions);
  }

  private async createChain() {
    console.log("Creating Retrieval QA Chain...");

    const prompt = ChatPromptTemplate.fromTemplate(
      `Answer the user's question: {input} based on the following context {context}`
    );

    const combineDocsChain = await createStuffDocumentsChain({
      llm: this.llm,
      prompt,
    });

    return createRetrievalChain({
      combineDocsChain,
      retriever: this.retriever,
    });
  }

  public queryChain() {
    return this.chain;
  }
}

/* =========================
   Usage
========================= */

const pdfDocument = "../materials/Paul.Graham.What.I.Worked.On.pdf";

const pdfQa = await new PdfQA({
  model: "llama3",
  pdfDocument,
  chunkSize: 1000,
  chunkOverlap: 0,
  vectorStoreType: "chroma",
  kDocuments: 3,
  temperature: 0,
}).init();

const pdfQaChain = pdfQa.queryChain();

const answer = await pdfQaChain.invoke({
  input: "What did the author do growing up?",
});

console.log("🤖", answer.answer);
console.log("# of documents used as context:", answer.context.length);