// frontend/src/services/proctoringService.js
// COMPLETE FIXED PROCTORING SERVICE

import api from '../api/api';

class ProctoringService {
    /**
     * Capture and send proctoring image to backend
     */
    async captureImage(attemptId, imageData, metadata = {}) {
        try {
            // If no attemptId, just log and return
            if (!attemptId) {
                console.warn('No attemptId provided for proctoring capture');
                return { success: true, message: 'No attemptId - skipping capture' };
            }
            
            // ✅ FIX: Use the correct endpoint with attempt_id
            const response = await api.post('/proctoring/sessions/capture/', {
                exam_id: attemptId,
                image_data: imageData,
                metadata: {
                    face_detected: metadata.faceDetected !== undefined ? metadata.faceDetected : true,
                    multiple_faces: metadata.multipleFaces || false,
                    mobile_detected: metadata.mobileDetected || false,
                    gaze_direction: metadata.gazeDirection || 'CENTER',
                    gaze_confidence: metadata.gazeConfidence || 0,
                    gaze_x: metadata.gazeX || 0,
                    gaze_y: metadata.gazeY || 0,
                    head_tilt_x: metadata.headTiltX || 0,
                    head_tilt_y: metadata.headTiltY || 0,
                    eyes_closed: metadata.eyesClosed || false,
                    objects_detected: metadata.objectsDetected || [],
                    suspicious_count: metadata.suspiciousCount || 0,
                }
            });
            return response.data;
        } catch (error) {
            console.error('Proctoring capture error:', error);
            // Don't throw - just return a fallback response
            return { 
                success: false, 
                error: error.message,
                is_flagged: false,
                message: 'Failed to send proctoring data' 
            };
        }
    }

    /**
     * Get proctoring session status
     */
    async getSessionStatus(attemptId) {
        try {
            const response = await api.get(`/proctoring/sessions/${attemptId}/status/`);
            return response.data;
        } catch (error) {
            console.error('Session status error:', error);
            return { is_active: false, total_captures: 0, suspicious_events: 0 };
        }
    }

    /**
     * Get proctoring images for review
     */
    async getProctoringImages(attemptId) {
        try {
            const response = await api.get(`/proctoring/sessions/${attemptId}/images/`);
            return response.data;
        } catch (error) {
            console.error('Get images error:', error);
            return { images: [], total: 0 };
        }
    }

    /**
     * Flag an image as suspicious
     */
    async flagImage(imageId, reason) {
        try {
            const response = await api.post(`/proctoring/images/${imageId}/flag/`, {
                reason: reason
            });
            return response.data;
        } catch (error) {
            console.error('Flag image error:', error);
            throw error;
        }
    }

    /**
     * Clear flag from image
     */
    async clearFlag(imageId) {
        try {
            const response = await api.post(`/proctoring/images/${imageId}/clear/`);
            return response.data;
        } catch (error) {
            console.error('Clear flag error:', error);
            throw error;
        }
    }

    /**
     * Get AI proctoring analysis
     */
    async getAIAnalysis(sessionId) {
        try {
            const response = await api.post('/proctoring/ai/analyze/', {
                session_id: sessionId
            });
            return response.data;
        } catch (error) {
            console.error('AI analysis error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get AI session summary
     */
    async getAISummary(sessionId) {
        try {
            const response = await api.get(`/proctoring/ai/session/${sessionId}/summary/`);
            return response.data;
        } catch (error) {
            console.error('AI summary error:', error);
            return { error: error.message };
        }
    }

    /**
     * Auto-flag a session
     */
    async autoFlagSession(sessionId, reason) {
        try {
            const response = await api.post(`/proctoring/ai/auto-flag/${sessionId}/`, {
                reason: reason || 'Auto-flagged by AI'
            });
            return response.data;
        } catch (error) {
            console.error('Auto-flag error:', error);
            throw error;
        }
    }

    /**
     * Send object detection data
     */
    async sendObjectDetection(attemptId, objects) {
        try {
            const response = await api.post('/proctoring/ai/objects/', {
                attempt_id: attemptId,
                objects: objects
            });
            return response.data;
        } catch (error) {
            console.error('Object detection error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send gaze analysis data
     */
    async sendGazeAnalysis(attemptId, gazeData) {
        try {
            const response = await api.post('/proctoring/ai/gaze-analysis/', {
                attempt_id: attemptId,
                gaze_data: gazeData
            });
            return response.data;
        } catch (error) {
            console.error('Gaze analysis error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send heartbeat data
     */
    async sendHeartbeat(attemptId, data) {
        try {
            const response = await api.post(`/exams/attempt/${attemptId}/heartbeat/`, data);
            return response.data;
        } catch (error) {
            console.error('Heartbeat error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send face verification
     */
    async sendFaceVerification(attemptId, imageData, faceData = {}) {
        try {
            // ✅ FIX: Use the correct endpoint - /exams/verify-face/
            const response = await api.post(`/exams/verify-face/`, {
                image_data: imageData,
                user_id: faceData.user_id,
                exam_id: attemptId
            });
            return response.data;
        } catch (error) {
            console.error('Face verification error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new ProctoringService();