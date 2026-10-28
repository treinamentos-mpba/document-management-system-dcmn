// Controller do recurso documents.
//
// Trata a entrada/saída HTTP e a validação básica, delegando as regras de
// negócio ao service. Erros são encaminhados ao middleware central.

const { AppError } = require('../errors/appError');

function createDocumentsController(documentService) {
  return {
    async upload(req, res, next) {
      try {
        const document = await documentService.create(req.file, req.body.owner);
        res.status(201).json(document);
      } catch (error) {
        next(error);
      }
    },

    list(req, res, next) {
      try {
        const { owner } = req.query;
        if (owner !== undefined && typeof owner !== 'string') {
          throw new AppError(400, 'INVALID_QUERY', 'O filtro owner deve ser um único valor.');
        }
        res.json({ documents: documentService.list(owner) });
      } catch (error) {
        next(error);
      }
    },

    async download(req, res, next) {
      try {
        const { document, filePath } = await documentService.getDownload(req.params.id);
        res.download(
          filePath,
          document.originalName,
          { headers: { 'Content-Type': 'application/octet-stream' } },
          (error) => {
            if (error && !res.headersSent) {
              next(error);
            } else if (error) {
              res.destroy(error);
            }
          },
        );
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createDocumentsController };
