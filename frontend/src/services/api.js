import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadResumes = async (fileList) => {
  const formData = new FormData();
  for (let i = 0; i < fileList.length; i++) {
    formData.append('files', fileList[i]);
  }
  const response = await api.post('/upload-resumes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const parseJD = async (jdText, jobTitle = 'Target Position') => {
  const response = await api.post('/parse-jd', {
    jd_text: jdText,
    job_title: jobTitle,
  });
  return response.data;
};

export const searchJD = async (query) => {
  const response = await api.post('/search-jd', { query });
  return response.data;
};

export const suggestJobTitles = async (query) => {
  const response = await api.get('/suggest-job-titles', { params: { q: query } });
  return response.data;
};

export const scoreCandidates = async () => {
  const response = await api.get('/score');
  return response.data;
};

export const explainCandidate = async (candidateId) => {
  const response = await api.get(`/explain/${candidateId}`);
  return response.data;
};

export const generateQuestions = async (candidateId) => {
  const response = await api.get(`/generate-questions/${candidateId}`);
  return response.data;
};

export const generateEmails = async (candidateId) => {
  const response = await api.get(`/generate-emails/${candidateId}`);
  return response.data;
};

export const generateOnboarding = async (candidateId) => {
  const response = await api.get(`/generate-onboarding/${candidateId}`);
  return response.data;
};

export const updateCandidateStatus = async (candidateId, updateData) => {
  const response = await api.post(`/update-candidate/${candidateId}`, updateData);
  return response.data;
};

export const getResults = async () => {
  const response = await api.get('/results');
  return response.data;
};

export const resetSession = async () => {
  const response = await api.post('/reset');
  return response.data;
};

export default api;
