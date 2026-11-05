import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, Loader, X } from 'lucide-react';
import api, { getMediaUrl } from '../api/api';
import { downloadCourseFile, getCourseFileExtension } from '../utils/courseFiles';

const CourseFilePreview = ({ file, title, onClose }) => {
  const extension = getCourseFileExtension(file);
  const [officeFile, setOfficeFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const wordPreviewRef = useRef(null);
  const officeUrlsRef = useRef([]);

  useEffect(() => {
    let active = true;

    const loadPreview = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get(getMediaUrl(file), { responseType: 'blob' });
        const blob = response.data;

        if (extension === 'docx') {
          const { renderAsync } = await import('docx-preview');
          const styles = document.createElement('div');
          const content = document.createElement('div');
          await renderAsync(blob, content, styles, { inWrapper: true });
          if (active) setOfficeFile({ type: 'docx', styles, content });
        } else if (extension === 'pptx') {
          const [{ loadPresentation, getSlides }, { renderSlideToSvg }] = await Promise.all([
            import('@office-kit/pptx'),
            import('@office-kit/pptx-preview'),
          ]);
          const presentation = await loadPresentation(new Uint8Array(await blob.arrayBuffer()));
          const slides = getSlides(presentation);
          if (!slides.length) throw new Error('This presentation does not contain any slides.');
          const urls = slides.map((slide) => URL.createObjectURL(
            new Blob([renderSlideToSvg(presentation, slide)], { type: 'image/svg+xml' })
          ));
          if (active) {
            officeUrlsRef.current = urls;
            setOfficeFile({ type: 'pptx', urls });
          } else {
            urls.forEach(URL.revokeObjectURL);
          }
        } else {
          throw new Error('This file type cannot be previewed here.');
        }
      } catch (previewError) {
        console.error('Could not preview course file:', previewError);
        if (active) setError('This document could not be previewed. You can still download the original file.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPreview();
    return () => {
      active = false;
      officeUrlsRef.current.forEach(URL.revokeObjectURL);
      officeUrlsRef.current = [];
    };
  }, [extension, file]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (officeFile?.type !== 'docx' || !wordPreviewRef.current) return;
    wordPreviewRef.current.replaceChildren(officeFile.styles, officeFile.content);
  }, [officeFile]);

  const handleDownload = async () => {
    try {
      await downloadCourseFile(file, title);
    } catch (downloadError) {
      console.error('Could not download course file:', downloadError);
      setError('Could not download this file. Please try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${title}`}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#0f172acc', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        style={{ width: 'min(1100px, 100%)', height: 'min(850px, 94vh)', background: '#f8fafc', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px #0005' }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <FileText size={20} color="#2563eb" />
          <strong style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0f172a' }}>{title}</strong>
          <button type="button" onClick={handleDownload} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 7, background: '#2563eb', color: '#fff', border: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Download size={16} /> Download
          </button>
          <button type="button" aria-label="Close preview" onClick={onClose} style={{ display: 'inline-flex', border: 0, background: 'transparent', color: '#475569', cursor: 'pointer', padding: 4 }}>
            <X size={22} />
          </button>
        </header>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 20 }}>
          {loading && <div role="status" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 48, color: '#475569' }}><Loader size={20} /> Preparing document preview…</div>}
          {error && <div role="alert" style={{ padding: 32, textAlign: 'center', color: '#b91c1c' }}>{error}</div>}
          {!loading && !error && officeFile?.type === 'docx' && (
            <div ref={wordPreviewRef} style={{ maxWidth: 900, minHeight: '100%', margin: '0 auto', background: '#fff', padding: 24 }} />
          )}
          {!loading && !error && officeFile?.type === 'pptx' && (
            <div style={{ display: 'grid', gap: 20, justifyItems: 'center' }}>
              {officeFile.urls.map((url, index) => (
                <img key={url} src={url} alt={`${title}, slide ${index + 1}`} style={{ width: '100%', maxWidth: 1000, background: '#fff', boxShadow: '0 2px 12px #0002' }} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CourseFilePreview;
