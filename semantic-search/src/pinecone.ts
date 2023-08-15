import { PineconeClient } from "@pinecone-database/pinecone";
import { config } from "dotenv";
import { getEnv, validateEnvironmentVariables } from "./utils.js";

config();

let pineconeClient: PineconeClient | null = null;

export const getPineconeClient = async (): Promise<PineconeClient> => {
  validateEnvironmentVariables();

  if (pineconeClient) {
    return pineconeClient;
  } else {
    pineconeClient = new PineconeClient();
    await pineconeClient.init({
      apiKey: getEnv("PINECONE_API_KEY"),
      environment: getEnv("PINECONE_ENVIRONMENT"),
    });
  }

  return pineconeClient;
};
