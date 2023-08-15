import { utils } from "@pinecone-database/pinecone";
import cliProgress from "cli-progress";
import { config } from "dotenv";
import { getEnv, getIndexingCommandLineArguments } from "./utils.js";
import { getPineconeClient } from "./pinecone.js";
import { loadCSVFile } from "./csvLoader.js";
import { embedder } from "./embeddings.js";

config({ path: "../../.env" });

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

const indexName = getEnv("PINECONE_INDEX");
let counter = 0;

const run = async () => {
  const { csvPath, column } = getIndexingCommandLineArguments();

  const pineconeClient = await getPineconeClient();

  const { data, meta } = await loadCSVFile(csvPath);

  if (!meta.fields?.includes(column)) {
    console.error(`Column ${column} not found in CSV file`);
    process.exit(1);
  }

  const documents = data.map((row) => row[column] as string);

  await utils.createIndexIfNotExists(pineconeClient, indexName, 384);

  const index = pineconeClient.Index(indexName);

  progressBar.start(documents.length, 0);

  await embedder.init();
  await embedder.embedBatch(documents, 10, async (embeddings) => {
    counter += embeddings.length;
    await index.upsert({
      upsertRequest: {
        vectors: embeddings,
        namespace: "default",
      },
    });
    progressBar.update(counter);
  });

  progressBar.stop();
  console.log(`Indexed ${documents.length} documents into index ${indexName}`);
};

run();
