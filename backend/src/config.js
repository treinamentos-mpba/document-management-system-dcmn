const path = require('node:path');

const DEFAULT_MAX_FILE_BYTES = 10 * 1024 * 1024;

function parsePositiveInteger(value, fallback, variableName) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsedValue = Number(value);
  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${variableName} deve ser um inteiro positivo.`);
  }

  return parsedValue;
}

module.exports = {
  storageDirectory: path.resolve(__dirname, '..', 'storage'),
  maxFileBytes: parsePositiveInteger(
    process.env.MAX_FILE_SIZE_BYTES,
    DEFAULT_MAX_FILE_BYTES,
    'MAX_FILE_SIZE_BYTES',
  ),
};