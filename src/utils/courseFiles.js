import api, { getMediaUrl } from '../api/api';

export const getCourseFileName = (file, preferredName) => {
  const fileUrl = getMediaUrl(file);
  let originalName = 'course-file';
  try {
    originalName = decodeURIComponent(new URL(fileUrl, window.location.origin).pathname.split('/').pop()) || originalName;
  } catch {
    originalName = fileUrl.split('/').pop().split('?')[0] || originalName;
  }

  const extension = originalName.match(/\.[^.]+$/)?.[0] || '';
  const name = preferredName || originalName;
  const safeName = name.replace(/[\\/:*?"<>|]/g, '-').trim();
  return extension && !safeName.toLowerCase().endsWith(extension.toLowerCase())
    ? `${safeName}${extension}`
    : safeName || originalName;
};

export const getCourseFileExtension = (file) => {
  try {
    const pathname = new URL(getMediaUrl(file), window.location.origin).pathname;
    return pathname.split('.').pop().toLowerCase();
  } catch {
    return '';
  }
};

export const isOfficeDocument = (file) => ['docx', 'pptx'].includes(getCourseFileExtension(file));

export const openCourseFile = (file) => {
  const fileUrl = getMediaUrl(file);
  if (!fileUrl) return false;
  window.open(fileUrl, '_blank', 'noopener,noreferrer');
  return true;
};

export const downloadCourseFile = async (file, preferredName) => {
  const fileUrl = getMediaUrl(file);
  if (!fileUrl) throw new Error('No file is available to download.');

  const response = await api.get(fileUrl, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = getCourseFileName(file, preferredName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};
