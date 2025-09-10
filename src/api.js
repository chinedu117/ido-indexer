import express from 'express';
import { getDb } from './models/purchases.js';
import logger from './logger.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

export function startApi() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Swagger setup
  const swaggerDocument = YAML.load(new URL('./swagger.yaml', import.meta.url).pathname);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('/purchases', async (req, res) => {
    try {
      const db = getDb();
      const query = {};
      if (req.query.buyer) query.buyer = req.query.buyer.toLowerCase();
      if (req.query.eventName) query.eventName = req.query.eventName;
      if (req.query.blockNumber) query.blockNumber = Number(req.query.blockNumber);

      const docs = await db.collection('purchases')
        .find(query)
        .sort({ blockNumber: -1, logIndex: -1 })
        .limit(50)
        .toArray();

      res.json(docs);
    } catch (err) {
      logger.error('API error', err.message);
      res.status(500).json({ error: 'internal server error' });
    }
  });

  app.listen(port, () => {
    logger.info(`API server listening on port ${port} — Swagger at /docs`);
  });
}
