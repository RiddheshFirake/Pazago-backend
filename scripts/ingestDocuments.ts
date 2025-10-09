import { config } from 'dotenv';
config(); // Load environment variables

import { MDocument } from '@mastra/rag';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PgVector } from '@mastra/pg';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

// Import pdf-parse using require (CommonJS module)
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

async function ingestDocuments() {
  console.log('🚀 Starting document ingestion...\n');

  // Initialize vector database
  const pgVector = new PgVector({
    connectionString: process.env.POSTGRES_CONNECTION_STRING!,
  });

  // Get all PDF files from documents folder
  const documentsPath = path.join(process.cwd(), 'documents');
  const pdfFiles = fs.readdirSync(documentsPath).filter(file => file.endsWith('.pdf'));

  console.log(`📄 Found ${pdfFiles.length} PDF files\n`);

  for (const pdfFile of pdfFiles) {
    console.log(`Processing: ${pdfFile}...`);
    try {
      const pdfPath = path.join(documentsPath, pdfFile);
      let pdfBuffer;
      try {
        pdfBuffer = fs.readFileSync(pdfPath);
      } catch (err) {
        console.error(`  ❌ Error reading file ${pdfFile}:`, err);
        continue;
      }

      // Extract text from PDF
      let pdfData, text;
      try {
        pdfData = await pdfParse(pdfBuffer);
        text = pdfData.text;
      } catch (err) {
        console.error(`  ❌ Error parsing PDF ${pdfFile}:`, err);
        continue;
      }

      if (!text || text.length === 0) {
        console.warn(`  ⚠️ No text extracted from ${pdfFile}`);
        continue;
      }

      console.log(`  - Extracted ${text.length} characters`);

      // Create document and chunk it
      let doc, chunks;
      try {
        doc = MDocument.fromText(text, {
          metadata: {
            source: pdfFile,
            year: extractYear(pdfFile),
          },
        });
        chunks = await doc.chunk({
          strategy: 'recursive',
          maxSize: 800,
          overlap: 100,
        });
      } catch (err) {
        console.error(`  ❌ Error chunking document for ${pdfFile}:`, err);
        continue;
      }

      if (!chunks || chunks.length === 0) {
        console.warn(`  ⚠️ No chunks created for ${pdfFile}`);
        continue;
      }

      console.log(`  - Created ${chunks.length} chunks`);

      // Generate embeddings using Gemini

      let allEmbeddings: any[] = [];
      const batchSize = 100;
      try {
        for (let i = 0; i < chunks.length; i += batchSize) {
          const batch = chunks.slice(i, i + batchSize);
          const result = await embedMany({
            values: batch.map(chunk => chunk.text),
        model: openai.textEmbeddingModel('text-embedding-ada-002'),
          });
          allEmbeddings.push(...result.embeddings);
        }
      } catch (err) {
        console.error(`  ❌ Error generating embeddings for ${pdfFile}:`, err);
        continue;
      }

      if (!allEmbeddings || allEmbeddings.length !== chunks.length) {
        console.error(`  ❌ Embedding count mismatch for ${pdfFile}`);
        continue;
      }

      console.log(`  - Generated ${allEmbeddings.length} embeddings`);

      // Store in vector database
      try {
        await pgVector.upsert({
          indexName: 'berkshire_letters',
          vectors: allEmbeddings.map((embedding, i) => embedding),
          ids: chunks.map((_, i) => `${pdfFile}-chunk-${i}`),
          metadata: chunks.map((chunk, i) => ({
            text: chunk.text,
            source: pdfFile,
            year: extractYear(pdfFile),
            chunkIndex: i,
          })),
        });
        console.log(`  ✅ Stored in database\n`);
      } catch (err) {
        console.error(`  ❌ Error storing embeddings for ${pdfFile}:`, err);
        continue;
      }
    } catch (err) {
      console.error(`  ❌ Unexpected error processing ${pdfFile}:`, err);
      continue;
    }
  }

  console.log('🎉 Document ingestion complete!');
}

// Helper function to extract year from filename
function extractYear(filename: string): string {
  const yearMatch = filename.match(/20\d{2}/);
  return yearMatch ? yearMatch[0] : 'unknown';
}

// Run the ingestion
ingestDocuments().catch(console.error);
