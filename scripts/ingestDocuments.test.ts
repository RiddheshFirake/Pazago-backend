import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
// import { createRequire } from 'module';
import { MDocument } from '@mastra/rag';
import { PgVector } from '@mastra/pg';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

const documentsPath = path.join(process.cwd(), 'documents');
const samplePdf = path.join(documentsPath, '1977.pdf');

// Mock PgVector for testing
jest.mock('@mastra/pg', () => {
  return {
    PgVector: jest.fn().mockImplementation(() => ({
  upsert: jest.fn().mockResolvedValue(true as unknown as never),
// NOTE: To fix import.meta errors, set "module": "es2020" and "esModuleInterop": true in tsconfig.json
    })),
  };
});

describe('Document Ingestion Pipeline', () => {
  it('should read a sample PDF file', () => {
    expect(fs.existsSync(samplePdf)).toBe(true);
    const buffer = fs.readFileSync(samplePdf);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should extract text from PDF', async () => {
    const buffer = fs.readFileSync(samplePdf);
  const data = await pdfParse(buffer);
    expect(data.text).toBeDefined();
    expect(data.text.length).toBeGreaterThan(0);
  });

  it('should chunk extracted text', async () => {
    const buffer = fs.readFileSync(samplePdf);
  const data = await pdfParse(buffer);
    const doc = MDocument.fromText(data.text, {
      metadata: { source: '1977.pdf', year: '1977' },
    });
    const chunks = await doc.chunk({ strategy: 'recursive', maxSize: 800, overlap: 100 });
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should upsert chunks into vector DB', async () => {
    const buffer = fs.readFileSync(samplePdf);
  const data = await pdfParse(buffer);
    const doc = MDocument.fromText(data.text, {
      metadata: { source: '1977.pdf', year: '1977' },
    });
    const chunks = await doc.chunk({ strategy: 'recursive', maxSize: 800, overlap: 100 });
    const pgVector = new PgVector({ connectionString: 'postgres://test' });
    const result = await pgVector.upsert({
      indexName: 'berkshire_letters',
      vectors: chunks.map((_, i) => [0.1 * i]), // dummy embeddings
      ids: chunks.map((_, i) => `1977.pdf-chunk-${i}`),
      metadata: chunks.map((chunk, i) => ({
        text: chunk.text,
        source: '1977.pdf',
        year: '1977',
        chunkIndex: i,
      })),
    });
    expect(result).toBe(true);
  });
});
