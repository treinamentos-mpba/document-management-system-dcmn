# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, consultem e baixem documentos armazenados no filesystem local da aplicação, com metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos disponíveis, com filtro opcional pelo identificador do dono.
- Download de um documento pelo identificador.
- Atribuição de cada documento a um identificador de usuário (`owner`).
- Interface web para envio, listagem e download.
- Verificação de saúde do backend pelo endpoint existente `GET /health`.

### Fora do escopo

- Armazenamento em nuvem, serviços de upload externos ou banco de dados.
- Persistência durável dos metadados ou recuperação do catálogo após reinício.
- Autenticação, autorização e gerenciamento de contas.
- Versionamento, edição, exclusão e compartilhamento de documentos.
- Pré-visualização ou conversão de arquivos.

## 3. Requisitos funcionais

| ID | Requisito | Critérios de aceitação |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento associado a um `owner`. | A requisição contém um único arquivo no campo `file` e um `owner` não vazio. O backend grava o arquivo localmente, registra os metadados em memória e responde com `201 Created`. |
| RF-02 | O usuário pode listar documentos. | `GET /documents` responde com os metadados públicos; quando informado `owner` na query, retorna apenas documentos atribuídos a esse valor. |
| RF-03 | O usuário pode baixar um documento pelo identificador. | Um identificador existente retorna o conteúdo como download de anexo, usando o nome original apresentado ao usuário. Um identificador inexistente retorna `404 Not Found`. |
| RF-04 | O sistema valida as entradas de upload. | Requisição sem arquivo, com mais de um arquivo, ou sem `owner` válido é rejeitada com resposta de erro consistente, sem registrar metadados. Arquivos acima do limite configurado são rejeitados. |
| RF-05 | O sistema informa falhas de forma previsível. | Erros de validação, documento ausente e falhas internas são representados pelo schema de erro definido nesta especificação, sem expor caminhos locais ou stack traces. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local, em `backend/storage`, usando Multer com `diskStorage`. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase; reiniciar o processo pode esvaziar o catálogo mesmo que os arquivos continuem no disco. |
| RNF-03 | Configurações variáveis devem ser fornecidas por variáveis de ambiente. `PORT` mantém o padrão atual `3000`; `MAX_FILE_SIZE_BYTES` define o limite de upload e, se ausente, usa `10485760` bytes (10 MiB). |
| RNF-04 | O nome físico do arquivo deve ser gerado pelo sistema, sem usar o nome enviado pelo usuário como caminho. Caminhos internos nunca devem ser retornados pela API. |
| RNF-05 | O backend deve manter a separação `routes -> controllers -> services -> repositories`; routes e controllers tratam HTTP, enquanto services e repositories não dependem de Express nem de detalhes HTTP. |
| RNF-06 | O backend deve usar Node.js, Express e CommonJS; o frontend deve usar React, Vite e ES modules, sem TypeScript nesta fase. |
| RNF-07 | Testes de backend devem usar o runner nativo `node:test` e cobrir os contratos e falhas descritos nesta especificação. |
| RNF-08 | O prefixo `/api` pertence ao proxy de desenvolvimento do Vite. As rotas do backend permanecem sem esse prefixo. |

## 5. Modelo de dados

### Metadados públicos

Este é o objeto retornado pela API. Datas usam ISO 8601 em UTC.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único do documento, gerado pelo backend (UUID). |
| `originalName` | string | Nome original do arquivo, usado apenas para apresentação e download. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em formato ISO 8601. |
| `owner` | string | Identificador informado para atribuir o documento a um usuário. |

### Dados internos de persistência

O repositório pode manter um nome físico aleatório (por exemplo, UUID com extensão segura) para localizar o arquivo em `backend/storage`. Esse dado não faz parte das respostas públicas. `originalName` nunca deve ser usado para construir caminhos no filesystem.

**Decisão desta fase:** `owner` é um atributo de organização, não uma identidade autenticada nem uma fronteira de autorização. A origem confiável da identidade e as regras de acesso ficam fora do escopo.

## 6. Contratos de API

### Convenções gerais

- Os caminhos abaixo são os caminhos servidos pelo backend. No frontend de desenvolvimento, o proxy permite chamá-los com `/api` no início, removendo esse prefixo antes de encaminhar a requisição.
- Respostas de erro usam `Content-Type: application/json` e o formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

- `message` é uma mensagem segura para o cliente. Detalhes internos e stack traces ficam somente nos logs do servidor.

### `POST /upload`

- **Content-Type:** `multipart/form-data`.
- **Campos:** `file` (um arquivo, obrigatório) e `owner` (texto não vazio, obrigatório).
- **Limite:** `MAX_FILE_SIZE_BYTES`, padrão de 10 MiB. Nesta fase, não há allowlist de tipos MIME.
- **Processamento:** gerar um identificador e nome físico seguros, gravar em `backend/storage` via Multer `diskStorage` e registrar os metadados em memória.
- **Sucesso:** `201 Created`, `Content-Type: application/json`.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-28T12:00:00.000Z",
  "owner": "usuario-123"
}
```

- **Erros:** `400 Bad Request` para arquivo ausente ou campos inválidos; `413 Payload Too Large` para arquivo acima do limite; `500 Internal Server Error` para falha inesperada de gravação. Se a gravação falhar, nenhum metadado deve ser registrado.
- **Códigos de erro:** `INVALID_UPLOAD`, `FILE_TOO_LARGE`, `UPLOAD_FAILED`.

### `GET /documents`

- **Query opcional:** `owner` filtra os resultados pelo valor exato do campo `owner`. Sem filtro, lista todos os documentos conhecidos pelo processo.
- **Sucesso:** `200 OK`, `Content-Type: application/json`. A lista é ordenada por `uploadedAt` decrescente.

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-10-28T12:00:00.000Z",
      "owner": "usuario-123"
    }
  ]
}
```

- Uma consulta sem resultados retorna `200 OK` com `"documents": []`.

### `GET /documents/:id/download`

- **Parâmetro:** `id`, identificador UUID do documento.
- **Sucesso:** `200 OK`, conteúdo binário como anexo; `Content-Disposition` deve indicar `originalName` de forma segura e `Content-Type` deve ser `application/octet-stream`.
- **Erros:** `404 Not Found` se o identificador não estiver no catálogo ou se o arquivo local correspondente não existir; `500 Internal Server Error` para outras falhas de leitura.
- **Códigos de erro:** `DOCUMENT_NOT_FOUND`, `DOCUMENT_FILE_NOT_FOUND`, `DOWNLOAD_FAILED`.

### `GET /health`

- Endpoint existente, fora do fluxo de documentos. Deve continuar respondendo `200 OK` com `{ "status": "ok" }`.

## 7. Decisões arquiteturais

- **Routes:** registram os caminhos e encaminham as requisições para controllers.
- **Controllers:** validam o formato básico da entrada HTTP, chamam services e convertem resultados em status, cabeçalhos e respostas HTTP.
- **Services:** aplicam as regras de upload, listagem, associação ao `owner` e download sem conhecer Express.
- **Repositories:** mantêm os metadados em memória e abstraem a localização/leitura dos arquivos locais.
- **Multer:** configurado na borda HTTP com `diskStorage`, destino `backend/storage`, limite definido por `MAX_FILE_SIZE_BYTES` e nome físico gerado pelo sistema.
- **Frontend:** componentes React organizados em `components/`, `pages/` e `services/`; chamadas HTTP usam `fetch` pelo prefixo `/api` do proxy Vite.
- **Persistência:** arquivos e metadados têm ciclos de vida distintos. A perda do catálogo após reinício e a existência possível de arquivos órfãos são limitações conhecidas desta fase.
- **Compatibilidade:** preservar o endpoint `GET /health` e as funcionalidades existentes ao adicionar as rotas de documentos.

## 8. Plano de execução

As etapas abaixo descrevem implementação futura; esta especificação não executa nem altera arquivos de aplicação.

1. Preparar configuração de ambiente, criação/validação da pasta local e configuração do Multer com `diskStorage` e limite de tamanho.
2. Implementar repositório local para arquivos e metadados em memória, incluindo geração de identificadores e nomes físicos seguros.
3. Implementar services, controllers e routes para upload, listagem e download, mantendo as responsabilidades e contratos definidos acima.
4. Adicionar testes backend com `node:test` para casos de sucesso, validação, limites, documentos inexistentes e falhas de filesystem; preservar o teste de saúde existente.
5. Implementar no frontend os fluxos de envio, listagem por `owner` e download usando `fetch` e o prefixo `/api`.
6. Validar a integração frontend/backend e os critérios de aceitação, incluindo o comportamento após reinício e a ausência de exposição de caminhos locais.