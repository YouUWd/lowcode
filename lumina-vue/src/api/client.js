import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor: Smart data extraction
client.interceptors.response.use(
  (response) => {
    const result = response.data;
    
    // Auto-extract 'data' field if present (compatible with standard NestJS wrappers if any)
    if (result && typeof result === 'object' && 'data' in result && Object.keys(result).length <= 3 && ('code' in result || 'message' in result || 'success' in result)) {
        return result.data;
    }
    
    return result;
  },
  (error) => {
    console.error('[API Error]', error.response || error.message);
    return Promise.reject(error);
  }
);

export default client;
