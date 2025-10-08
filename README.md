# Berkshire Hathaway RAG Intelligence

This project implements a Retrieval-Augmented Generation (RAG) pipeline for Berkshire Hathaway annual letters, using Mastra's RAG stack and Gemini embeddings. It is designed to ingest, chunk, embed, and store PDF documents for semantic search and question answering, matching the requirements of the Pazago RAG assignment.

## Features
- **PDF Ingestion:** Loads all Berkshire Hathaway letters (1977–2024) from the `documents/` folder.
- **Text Extraction:** Uses `pdf-parse` to extract text from each PDF.
- **Chunking:** Splits extracted text into overlapping chunks for better embedding and retrieval.
- **Embeddings:** Generates vector embeddings for each chunk using Gemini (`google.textEmbeddingModel`).
- **Vector Database:** Stores embeddings and metadata in a PostgreSQL vector database via Mastra's `PgVector`.
- **Metadata:** Tracks source file, year, and chunk index for each chunk.
- **Error Handling:** Robust error handling for file I/O, PDF parsing, chunking, embedding, and database operations.
- **Testing:** Jest test suite for all major pipeline steps (PDF reading, extraction, chunking, upsert).
- **Mastra UI:** Ready for use with Mastra's inbuilt UI for retrieval and user interaction.

## Project Structure
```
berkshire-rag-app/
├── documents/           # All PDF letters (1977–2024)
├── scripts/
│   ├── ingestDocuments.ts      # Main ingestion pipeline
│   └── ingestDocuments.test.ts # Jest test suite
├── src/                # Agents, tools, workflows (Mastra)
│   └── mastra/
│       ├── agents/
│       ├── tools/
│       └── workflows/
├── package.json
├── tsconfig.json
└── jest.config.cjs
```

## How It Works
1. **Ingestion:** Run `ingestDocuments.ts` to process all PDFs, extract text, chunk, embed, and store in the vector DB.
2. **Retrieval:** Use Mastra's UI or workflows to query the database for semantic search and Q&A.
3. **Testing:** Run `npm test` (with the experimental VM modules flag) to validate the pipeline.

## Setup & Usage
1. **Install dependencies:**
   ```powershell
   npm install
   ```
2. **Configure environment:**
   - Set your PostgreSQL connection string in `.env` or as an environment variable.
3. **Ingest documents:**
   ```powershell
   npx ts-node scripts/ingestDocuments.ts
   ```
4. **Run tests:**
   ```powershell
   node --experimental-vm-modules ./node_modules/jest/bin/jest.js
   ```
5. **Use Mastra UI:**
   - Access semantic search and Q&A via Mastra's built-in UI.

## Assignment Coverage
This project fulfills the Pazago RAG assignment requirements:
- End-to-end ingestion and vectorization of Berkshire Hathaway letters
- Metadata tracking for source, year, and chunk
- Error handling and logging
- Automated testing for all pipeline steps
- Ready for retrieval and user-facing UI via Mastra

## Technologies Used
- Node.js, TypeScript
- Mastra RAG stack (`@mastra/rag`, `@mastra/pg`)
- Gemini embeddings (Google AI)
- pdf-parse
- Jest (testing)
- PostgreSQL (vector DB)

## Notes
- For retrieval and Q&A, use Mastra's UI or extend workflows in `src/mastra/`.
- For large-scale ingestion, monitor logs for errors and progress.
- All code is modular and ready for extension.

## License
MIT
