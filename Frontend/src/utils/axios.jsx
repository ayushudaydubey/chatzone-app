import axios from 'axios';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: 'https://chatzone-1.onrender.com',
  withCredentials: true, // This is crucial for cookie-based auth
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Create a separate instance for file uploads
const fileUploadInstance = axios.create({
  baseURL: 'https://chatzone-1.onrender.com',
  withCredentials: true, // Important for file uploads too
  timeout: 120000,
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
  
    return config;
  },
  (error) => {
    // console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with cookie-based auth handling
axiosInstance.interceptors.response.use(
  (response) => {
    // console.log(`Response from ${response.config.url}:`, response.status, response.data);
    return response;
  },
  (error) => {
    // console.error('Response error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      // console.error('Cannot connect to server. Make sure your backend is running on http://localhost:3000');
    }
    
    if (error.code === 'ECONNABORTED') {
      // console.error('Request timeout. The server took too long to respond.');
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // console.log('Authentication failed - redirecting to login');
      
      // Only redirect if not already on login/register pages
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        window.location.href = '/login';
      }
    }
    
    if (error.response) {
      // console.error('Error status:', error.response.status);
      // console.error('Error data:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// File upload interceptors
fileUploadInstance.interceptors.request.use(
  (config) => {
    // console.log(`Making file upload request to:`, config.baseURL + config.url);
    return config;
  },
  (error) => {
    // console.error('File upload request error:', error);
    return Promise.reject(error);
  }
);

fileUploadInstance.interceptors.response.use(
  (response) => {
    // console.log(`File upload response:`, response.status);
    return response;
  },
  (error) => {
    // console.error('File upload response error:', error);
    
    if (error.code === 'ECONNABORTED') {
      // console.error('File upload timeout. The file upload took too long.');
    }
    
    // Handle auth errors for file uploads too
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { fileUploadInstance };