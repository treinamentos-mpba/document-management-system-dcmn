const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');
const { createDocumentsController } = require('../controllers/documents.controller');

function safeExtension(originalName) {
  return path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 16);
}

function documentsRouter({ documentService, storageDirectory, maxFileBytes }) {
  const router = express.Router();
  const controller = createDocumentsController(documentService);
  const storage = multer.diskStorage({
    destination(req, file, callback) {
      // fs.mkdir com recursive retorna undefined quando o diretório já existe;
      // o Multer precisa receber o caminho explicitamente no callback.
      fs.mkdir(storageDirectory, { recursive: true }, (error) => callback(error, storageDirectory));
    },
    filename(req, file, callback) {
      callback(null, `${randomUUID()}${safeExtension(file.originalname)}`);
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: maxFileBytes, files: 1 },
  });

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = { documentsRouter };