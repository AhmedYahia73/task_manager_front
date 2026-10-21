// src/utils/salesProject.js

export const SALES_PROJECT_ID_KEY = 'sales_project_id';
export const SALES_PROJECT_DATA_KEY = 'sales_project_data';

export const setActiveSalesProject = (project) => {
  if (!project) return;
  const id = typeof project === 'string' ? project : project.id;
  localStorage.setItem(SALES_PROJECT_ID_KEY, id);
  if (typeof project === 'object') {
    localStorage.setItem(SALES_PROJECT_DATA_KEY, JSON.stringify(project));
  }
};

export const getActiveSalesProjectId = () => {
  return localStorage.getItem(SALES_PROJECT_ID_KEY) || null;
};

export const getActiveSalesProject = () => {
  try {
    const raw = localStorage.getItem(SALES_PROJECT_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearActiveSalesProject = () => {
  localStorage.removeItem(SALES_PROJECT_ID_KEY);
  localStorage.removeItem(SALES_PROJECT_DATA_KEY);
};
