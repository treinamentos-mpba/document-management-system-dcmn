import DownloadButton from './DownloadButton';

function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function DocumentList({ documents, loading, onError }) {
  if (loading) {
    return <p>Carregando documentos...</p>;
  }

  if (documents.length === 0) {
    return <p>Nenhum documento encontrado.</p>;
  }

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Nome</th>
          <th style={{ textAlign: 'left' }}>Tamanho</th>
          <th style={{ textAlign: 'left' }}>Enviado em</th>
          <th style={{ textAlign: 'left' }}>Dono</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr key={doc.id}>
            <td>{doc.originalName}</td>
            <td>{formatSize(doc.size)}</td>
            <td>{new Date(doc.uploadedAt).toLocaleString()}</td>
            <td>{doc.owner}</td>
            <td>
              <DownloadButton doc={doc} onError={onError} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
