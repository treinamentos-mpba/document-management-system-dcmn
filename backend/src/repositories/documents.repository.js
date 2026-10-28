class DocumentRepository {
  constructor() {
    this.documents = new Map();
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
}

module.exports = { DocumentRepository };