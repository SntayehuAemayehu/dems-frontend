import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader } from 'lucide-react';
import api from '../../api/api';

const SEBReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const examId = params.get('examId');
  const launchId = params.get('launchId');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (!examId || !launchId) {
      setError('The Safe Exam Browser launch session is missing. Return to Exams and try again.');
      return undefined;
    }

    let active = true;
    let timer;
    const checkSubmission = async () => {
      try {
        const { data } = await api.get(`/exams/seb-launch/${launchId}/status/`);
        if (!active) return;

        if (data.completed) {
          navigate('/results', { replace: true });
          return;
        }
        if (data.expired) {
          setError('This exam launch expired before the exam started. Return to Exams and try again.');
          return;
        }
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError.response?.data?.error ||
          requestError.message ||
          'Could not check the exam submission status.'
        );
        return;
      }

      timer = window.setTimeout(checkSubmission, 2500);
    };

    checkSubmission();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [examId, launchId, navigate]);

  return (
    <main style={{ maxWidth: 620, margin: '12vh auto', padding: 28, textAlign: 'center' }}>
      {error ? (
        <>
          <AlertCircle size={42} color="#dc2626" />
          <h1>Unable to return to results</h1>
          <p>{error}</p>
          <button type="button" onClick={() => navigate('/exams', { replace: true })}>
            Return to Exams
          </button>
        </>
      ) : (
        <>
          <Loader className="spin" size={42} color="#2563eb" />
          <h1>Exam running in Safe Exam Browser</h1>
          <p>Keep this browser tab open. It will show your results after you submit the exam.</p>
          <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </main>
  );
};

export default SEBReturn;
