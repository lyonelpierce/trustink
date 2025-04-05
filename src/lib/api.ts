// Default API URL to fall back to if environment variable is not set
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Helper for making API requests with consistent options
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Default options
  const defaultOptions: RequestInit = {
    credentials: 'include', // Equivalent to withCredentials in axios
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };
  
  const response = await fetch(url, defaultOptions);
  
  // Check if the request was successful
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  // Parse the response as JSON
  const data = await response.json();
  return data;
}

// Define a generic type for request data
type ApiRequestData = Record<string, unknown>;

// API methods
export const api = {
  get: (endpoint: string) => fetchAPI(endpoint, { method: 'GET' }),
  post: (endpoint: string, data: ApiRequestData) => fetchAPI(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  put: (endpoint: string, data: ApiRequestData) => fetchAPI(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  patch: (endpoint: string, data: ApiRequestData) => fetchAPI(endpoint, { 
    method: 'PATCH', 
    body: JSON.stringify(data) 
  }),
  delete: (endpoint: string) => fetchAPI(endpoint, { method: 'DELETE' }),
};

export const logout = async () => {
  const response = await api.get("/auth/logout");
  return response.data;
};

// Contract revisions API
export const contractRevisions = {
  getRevisions: (contractId: string) => 
    api.get(`/contracts/revisions?contractId=${contractId}`),
  
  submitRevision: (data: { 
    contractId: string, 
    documentId: string, 
    changes: Array<{ 
      sectionId: string, 
      originalText: string, 
      proposedText: string 
    }> 
  }) => api.post('/contracts/revisions', data),
  
  updateRevisionStatus: (revisionId: string, status: 'approved' | 'rejected', comment?: string) => 
    api.patch(`/contracts/revisions`, { revisionId, status, comment })
};
