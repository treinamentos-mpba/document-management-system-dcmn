import { useCallback, useEffect, useState } from 'react';
import UploadForm from '../components/UploadForm';
import DocumentList from '../components/DocumentList';
import { listDocuments, uploadDocument } from '../services/documentsService';

export default function DocumentsPage() {
  const [owner, setOwner] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (ownerFilter) => {
    setLoading(true);
    setError(null);
    try {
      setDocuments(await listDocuments(ownerFilter.trim() || undefined));
    } catch (refreshError) {
      setError(refreshError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Pequeno atraso para evitar uma requisição a cada tecla digitada.
    const debounce = setTimeout(() => refresh(owner), 300);
    return () => clearTimeout(debounce);
  }, [owner, refresh]);

  async function handleUpload(file) {
    setError(null);
    try {
      await uploadDocument(owner.trim(), file);
      await refresh(owner);
    } catch (uploadError) {
      setError(uploadError.message);
      throw uploadError;
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '60rem', margin: '0 auto' }}>
      <h1>Document Management System</h1>

      <section style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="owner">Usuário: </label>
        <input
          id="owner"
          type="text"
          value={owner}
          placeholder="identificador do dono"
          onChange={(event) => setOwner(event.target.value)}
        />
        <p style={{ color: '#555', margin: '0.25rem 0 0' }}>
          O identificador é usado para filtrar a listagem e como dono dos uploads.
        </p>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Enviar documento</h2>
        <UploadForm owner={owner} onUpload={handleUpload} />
      </section>

      {error && (
        <p role="alert" style={{ color: '#b00020' }}>
          {error}
        </p>
      )}

      <section>
        <h2>Documentos</h2>
        <DocumentList documents={documents} loading={loading} onError={setError} />
      </section>
    </main>
  );
}
