import { config } from 'dotenv';
config();

import { PgVector } from '@mastra/pg';

async function setupDatabase() {
  console.log('🗄️  Setting up database...\n');

  const pgVector = new PgVector({
    connectionString: process.env.POSTGRES_CONNECTION_STRING!,
  });

  try {
    // Create the vector index/table
    await pgVector.createIndex({
      indexName: 'berkshire_letters',
      dimension: 768, // text-embedding-004 produces 768-dimensional vectors
    });

    console.log('✅ Database table created successfully!\n');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  }
}

setupDatabase();
