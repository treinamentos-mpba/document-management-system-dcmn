import { useRef, useState } from 'react';

export default function UploadComponent({ owner, onUpload }) {
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const canSubmit = Boolean(file) && Boolean(owner.trim()) && !sending;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSending(true);
    try {
      await onUpload(file);
      setFile(null);
      fileInputRef.current.value = '';
    } catch {
      // O erro já é exibido pela página; o arquivo selecionado é mantido.
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <input
        ref={fileInputRef}
        type="file"
        aria-label="Arquivo para envio"
        onChange={(event) => setFile(event.target.files[0] || null)}
      />
      <button type="submit" disabled={!canSubmit}>
        {sending ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}
