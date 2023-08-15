import { Vector } from "@pinecone-database/pinecone";
import { Pipeline } from "@xenova/transformers";
import { v4 as uuidv4 } from "uuid";
import { sliceIntoChunks } from "./utils.js";

class Embedder {
  private pipe: Pipeline | null = null;

  async init() {
    const { pipeline } = await import("@xenova/transformers");
    this.pipe = await pipeline("embeddings", "Xenova/all-MiniLM-L6-v2");
  }

  async embed(text: string): Promise<Vector> {
    const result = this.pipe && (await this.pipe(text));
    return {
      id: uuidv4(),
      metadata: { text },
      values: Array.from(result.data),
    };
  }

  async embedBatch(
    texts: string[],
    batchSize: number,
    onDoneBatch: (embeddings: Vector[]) => void
  ) {
    const batches = sliceIntoChunks<string>(texts, batchSize);
    for (const batch of batches) {
      const embeddings = await Promise.all(
        batch.map((text) => this.embed(text))
      );
      onDoneBatch(embeddings);
    }
  }
}

const embedder = new Embedder();

export { embedder };
