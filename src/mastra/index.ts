import { Mastra } from '@mastra/core';
import { PgVector } from '@mastra/pg';
import { buffettAgent } from './agents/buffettAgent';

export const mastra = new Mastra({
  agents: {
    buffettAgent,
  },
  vectors: {
    pgVector: new PgVector({
      connectionString: process.env.POSTGRES_CONNECTION_STRING!,
    }),
  },
});
