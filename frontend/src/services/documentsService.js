// Serviço de acesso à API de documentos.
// Em desenvolvimento, o proxy do Vite encaminha /api para o backend local.

const API_PREFIX = '/api';

async function toError(response, fallbackMessage) {
  try {
    const body = await response.json();
    if (body && body.error && body.error.message) {
      return new Error(body.error.message);
    }
  } catch {
    // Resposta sem corpo JSON: usa a mensagem padrão.
  }
  return new Error(fallbackMessage);
}

export async function uploadDocument(owner, file) {
  const form = new FormData();
  form.append('owner', owner);
  form.append('file', file);

  const response = await fetch(`${API_PREFIX}/upload`, { method: 'POST', body: form });
  if (!response.ok) {
    throw await toError(response, 'Não foi possível enviar o documento.');
  }
  return response.json();
}

export async function listDocuments(owner) {
  const query = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const response = await fetch(`${API_PREFIX}/documents${query}`);
  if (!response.ok) {
    throw await toError(response, 'Não foi possível listar os documentos.');
  }
  return (await response.json()).documents;
}

export async function downloadDocument(doc) {
  const response = await fetch(`${API_PREFIX}/documents/${doc.id}/download`);
  if (!response.ok) {
    throw await toError(response, 'Não foi possível baixar o documento.');
  }

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = doc.originalName;
  link.click();
  URL.revokeObjectURL(url);
}
