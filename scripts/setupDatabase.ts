import { config } from 'dotenv';
config();

import { PgVector } from '@mastra/pg';
import { Client } from 'pg';

async function setupDatabase() {
  console.log('🗄️  Setting up database...\n');


  // Drop the old table using pg client
  const client = new Client({ connectionString: process.env.POSTGRES_CONNECTION_STRING! });
  await client.connect();
  try {
    await client.query('DROP TABLE IF EXISTS berkshire_letters;');
    console.log('🗑️  Old table dropped.');
  } catch (err) {
    console.log('ℹ️  Error dropping old table:', err instanceof Error ? err.message : String(err));
  } finally {
    await client.end();
  }

  // Now create the index/table with PgVector
  const pgVector = new PgVector({
    connectionString: process.env.POSTGRES_CONNECTION_STRING!,
  });

  // Drop the old table if it exists
  try {
    await pgVector.client.query('DROP TABLE IF EXISTS berkshire_letters;');
    console.log('🗑️  Old table dropped.');
  } catch (err) {
    console.log('ℹ️  Error dropping old table:', err instanceof Error ? err.message : String(err));
  }

  try {
    // Drop the old index if it exists
    try {
      await pgVector.dropIndex({ indexName: 'berkshire_letters' });
      console.log('🗑️  Old index dropped.');
    } catch (err) {
      console.log('ℹ️  No existing index to drop or error dropping index:', err.message);
    }

    // Create the vector index/table
    await pgVector.createIndex({
      indexName: 'berkshire_letters',
      dimension: 1536, // OpenAI text-embedding-ada-002 produces 1536-dimensional vectors
    });

    console.log('✅ Database table created successfully!\n');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  }
}

setupDatabase();
