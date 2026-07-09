import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

axios.defaults.withCredentials = true;

const nativeFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url;
  const isBackendRequest = typeof url === 'string' && url.startsWith(API_BASE_URL);

  if (!isBackendRequest) {
    return nativeFetch(input, init);
  }

  return nativeFetch(input, {
    ...init,
    credentials: init.credentials || 'include',
  });
};
