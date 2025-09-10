# IDO Indexer — Starter Repo

This repository is a complete starter scaffold for an indexer that listens to an IDO smart contract events and writes normalized records to MongoDB. It uses Node.js, ethers v6, BullMQ (Redis) as an optional queue, and includes a backfill process, reconnection logic, idempotent writes, and reorg-friendly confirmation logic.

---

## Repo Layout

```
ido-indexer/
├─ .env.example
├─ docker-compose.yml
├─ package.json
├─ README.md
├─ src/
│  ├─ index.js
│  ├─ config.js
│  ├─ logger.js
│  ├─ provider.js
│  ├─ listener.js
│  ├─ processor.js
│  ├─ backfill.js
│  ├─ models/
│  │  └─ purchases.js
│  └─ abi/
│     └─ MedChainIDO.json
└─ scripts/
   └─ populate-sample-data.js
```

## Quick start (locally)

1. Copy `.env.sample` to `.env` and fill values.
2. Start services:
   ```bash
   docker compose up -d
   npm install
````

3. Run the indexer:

   ```bash
   npm run start
   ```
4. Run backfill (optional):

   ```bash
   npm run backfill
   ```

### Using docker

```
docker compose up --build

```
