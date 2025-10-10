import { Mastra } from '@mastra/core';
import { PgVector } from '@mastra/pg';
import { buffettAgent } from './agents/buffettAgent';
import { createVectorQueryTool } from '@mastra/rag';
import { openai } from '@ai-sdk/openai';

export const mastra = new Mastra({
  agents: {
    buffettAgent,
  },
  vectors: {
    pgVector: new PgVector({
      connectionString: process.env.POSTGRES_CONNECTION_STRING!,
    }),
  },
  tools: {
    vectorQueryTool: createVectorQueryTool({
      vectorStoreName: 'pgVector',
      indexName: 'berkshire_letters',
      model: openai.textEmbeddingModel('text-embedding-ada-002'),
    }),
  },
});
