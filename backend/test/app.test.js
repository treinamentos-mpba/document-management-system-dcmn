const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');
const { createApp } = require('../src/app');

async function createTestServer(t, maxFileBytes = 1024) {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const server = createApp({ storageDirectory, maxFileBytes }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    // O fetch do Node mantém conexões keep-alive abertas; sem
    // closeIdleConnections() o server.close() nunca resolve.
    server.closeIdleConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDirectory, { recursive: true, force: true });
  });
  return { baseUrl: `http://127.0.0.1:${server.address().port}`, storageDirectory };
}

function uploadForm({ owner = 'usuario-123', content = 'documento de teste', filename = 'teste.txt' } = {}) {
  const form = new FormData();
  if (owner !== undefined) {
    form.append('owner', owner);
  }
  form.append('file', new Blob([content], { type: 'text/plain' }), filename);
  return form;
}

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem filtrada e download funcionam', async (t) => {
  const { baseUrl } = await createTestServer(t);
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadForm(),
  });

  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.equal(document.originalName, 'teste.txt');
  assert.equal(document.owner, 'usuario-123');
  assert.equal(document.size, Buffer.byteLength('documento de teste'));
  assert.ok(document.id);
  assert.ok(document.uploadedAt);
  assert.equal(Object.hasOwn(document, 'storageName'), false);

  const listResponse = await fetch(`${baseUrl}/documents?owner=usuario-123`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual((await listResponse.json()).documents, [document]);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.equal(downloadResponse.status, 200);
  assert.equal(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
  assert.equal(await downloadResponse.text(), 'documento de teste');
});

test('upload sem owner rejeita e remove o arquivo gravado', async (t) => {
  const { baseUrl, storageDirectory } = await createTestServer(t);
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadForm({ owner: ' ' }),
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_UPLOAD');
  assert.deepEqual(await fs.readdir(storageDirectory), []);
  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.deepEqual((await listResponse.json()).documents, []);
});

test('upload acima do limite retorna 413', async (t) => {
  const { baseUrl } = await createTestServer(t, 4);
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadForm({ content: 'grande demais' }),
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
});

test('download de documento inexistente retorna 404', async (t) => {
  const { baseUrl } = await createTestServer(t);
  const response = await fetch(`${baseUrl}/documents/nao-existe/download`);

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
});
