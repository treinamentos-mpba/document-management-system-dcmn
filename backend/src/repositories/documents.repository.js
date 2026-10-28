// Repository do recurso documents.
//
// Persistência desta fase: metadados em memória (Map) e arquivos no
// filesystem local. O nome físico (storageName) nunca sai da camada interna.

const fs = require('node:fs/promises');
const path = require('node:path');

class DocumentRepository {
  constructor(storageDirectory) {
    this.documents = new Map();
    this.storageDirectory = storageDirectory;
  }

  create(document) {
    this.documents.set(document.id, document);
    return document;
  }

  list(owner) {
    const documents = [...this.documents.values()];
    return owner === undefined
      ? documents
      : documents.filter((document) => document.owner === owner);
  }

  findById(id) {
    return this.documents.get(id);
  }

  resolvePath(storageName) {
    if (!storageName || path.basename(storageName) !== storageName) {
      throw new Error('Nome de armazenamento inválido.');
    }

    return path.join(this.storageDirectory, storageName);
  }

  async assertReadable(storageName) {
    const filePath = this.resolvePath(storageName);
    await fs.access(filePath);
    return filePath;
  }

  async remove(storageName) {
    await fs.rm(this.resolvePath(storageName), { force: true });
  }
}

module.exports = { DocumentRepository };
