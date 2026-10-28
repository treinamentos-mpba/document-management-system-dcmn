const express = require('express');
const config = require('./config');
const { documentsRouter } = require('./routes/documents.routes');
const { DocumentRepository } = require('./repositories/documents.repository');
const { LocalFileRepository } = require('./repositories/localFileRepository');
const { DocumentService } = require('./services/documents.service');
const { errorHandler } = require('./middleware/errorHandler');

function createApp({
  storageDirectory = config.storageDirectory,
  maxFileBytes = config.maxFileBytes,
} = {}) {
  const app = express();
  const documentRepository = new DocumentRepository();
  const localFileRepository = new LocalFileRepository(storageDirectory);
  const documentService = new DocumentService(documentRepository, localFileRepository);

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(documentsRouter({ documentService, storageDirectory, maxFileBytes }));
  app.use(errorHandler);

  return app;
}

const app = createApp();
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
