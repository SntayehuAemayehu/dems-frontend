import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FaceEnrollment from '../../components/Proctoring/FaceEnrollment';

export default function EnrollFacePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return');

  const goBack = () => {
    if (returnUrl) {
      // ✅ Return to the exact exam URL the student came from
      navigate(decodeURIComponent(returnUrl), { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '24px' }}>
      <FaceEnrollment onComplete={goBack} onSkip={goBack} />
    </div>
  );
}