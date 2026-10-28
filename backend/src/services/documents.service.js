// Service do recurso documents.
//
// Concentra as regras de negócio: validação do upload, associação ao owner,
// geração de identificadores e localização do arquivo para download. Não
// conhece Express nem detalhes de HTTP.

const { randomUUID } = require('node:crypto');
const { AppError } = require('../errors/appError');

function toPublicDocument(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

class DocumentService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
  }

  async create(file, owner) {
    const normalizedOwner = typeof owner === 'string' ? owner.trim() : '';
    if (!file || !normalizedOwner) {
      if (file) {
        // O Multer já gravou o arquivo: remove para não deixar órfãos.
        await this.documentRepository.remove(file.filename);
      }
      throw new AppError(400, 'INVALID_UPLOAD', 'Envie um arquivo e informe um owner válido.');
    }

    const document = {
      id: randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: normalizedOwner,
      storageName: file.filename,
    };

    this.documentRepository.create(document);
    return toPublicDocument(document);
  }

  list(owner) {
    return this.documentRepository
      .list(owner)
      .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
      .map(toPublicDocument);
  }

  async getDownload(id) {
    const document = this.documentRepository.findById(id);
    if (!document) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    try {
      const filePath = await this.documentRepository.assertReadable(document.storageName);
      return { document: toPublicDocument(document), filePath };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AppError(404, 'DOCUMENT_FILE_NOT_FOUND', 'Arquivo do documento não encontrado.');
      }
      throw new AppError(500, 'DOWNLOAD_FAILED', 'Não foi possível ler o documento.');
    }
  }
}

module.exports = { DocumentService };
