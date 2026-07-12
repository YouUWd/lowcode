import client from './client';

export const fetchMetaSchema = () => {
  return client.get('/diagram');
};

export const saveMetaSchema = (schema) => {
  return client.post('/diagram', schema);
};

export class ApiError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApiError';
  }
}
