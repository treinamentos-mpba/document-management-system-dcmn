import { useState } from 'react';
import { downloadDocument } from '../services/documentsService';

export default function DownloadButton({ doc, onError }) {
  const [downloading, setDownloading] = useState(false);

  async function handleClick() {
    setDownloading(true);
    try {
      await downloadDocument(doc);
    } catch (error) {
      onError(error.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={downloading}>
      {downloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
