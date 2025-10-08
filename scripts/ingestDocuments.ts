import { config } from 'dotenv';
config(); // Load environment variables

import { MDocument } from '@mastra/rag';
import { embedMany } from 'ai';
import { google } from '@ai-sdk/google';
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
    
    const pdfPath = path.join(documentsPath, pdfFile);
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    console.log(`  - Extracted ${text.length} characters`);

    // Create document and chunk it
    const doc = MDocument.fromText(text, {
      metadata: {
        source: pdfFile,
        year: extractYear(pdfFile),
      },
    });

    const chunks = await doc.chunk({
        strategy: 'recursive',
        maxSize: 800,  // ← Use maxSize instead
        overlap: 100,
    });


    console.log(`  - Created ${chunks.length} chunks`);

    // Generate embeddings using Gemini
    const { embeddings } = await embedMany({
      values: chunks.map(chunk => chunk.text),
      model: google.textEmbeddingModel('text-embedding-004'),
    });

    console.log(`  - Generated ${embeddings.length} embeddings`);

    // Store in vector database
    await pgVector.upsert({
      indexName: 'berkshire_letters',
      vectors: embeddings.map((embedding, i) => embedding),
      ids: chunks.map((_, i) => `${pdfFile}-chunk-${i}`),
      metadata: chunks.map((chunk, i) => ({
        text: chunk.text,
        source: pdfFile,
        year: extractYear(pdfFile),
        chunkIndex: i,
      })),
    });

    console.log(`  ✅ Stored in database\n`);
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
