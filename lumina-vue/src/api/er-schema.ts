import client from './client';

export const fetchMetaSchema = () => {
  return client.get('/er-schema');
};

export const saveMetaSchema = (schema) => {
  return client.post('/er-schema', schema);
};

export class ApiError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApiError';
  }
}
