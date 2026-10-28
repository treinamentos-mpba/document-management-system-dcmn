const fs = require('node:fs/promises');
const path = require('node:path');

class LocalFileRepository {
  constructor(storageDirectory) {
    this.storageDirectory = storageDirectory;
  }

  resolvePath(storageName) {
    if (!storageName || path.basename(storageName) !== storageName) {
      throw new Error('Nome de armazenamento inválido.');
    }

    return path.join(this.storageDirectory, storageName);
  }

  async remove(storageName) {
    await fs.rm(this.resolvePath(storageName), { force: true });
  }

  async assertReadable(storageName) {
    const filePath = this.resolvePath(storageName);
    await fs.access(filePath);
    return filePath;
  }
}

module.exports = { LocalFileRepository };