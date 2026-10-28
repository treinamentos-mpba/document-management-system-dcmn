const multer = require('multer');
const { AppError } = require('../errors/appError');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof AppError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
  }

  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === 'LIMIT_FILE_SIZE';
    return res.status(isTooLarge ? 413 : 400).json({
      error: {
        code: isTooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
        message: isTooLarge
          ? 'O arquivo excede o limite permitido.'
          : 'A requisição de upload é inválida.',
      },
    });
  }

  if (req.method === 'POST' && req.path === '/upload') {
    return res.status(500).json({
      error: { code: 'UPLOAD_FAILED', message: 'Não foi possível salvar o documento.' },
    });
  }

  if (req.method === 'GET' && req.path.endsWith('/download')) {
    return res.status(500).json({
      error: { code: 'DOWNLOAD_FAILED', message: 'Não foi possível baixar o documento.' },
    });
  }

  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro interno.' },
  });
}

module.exports = { errorHandler };