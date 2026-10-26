// frontend/src/hooks/useVideoRecorder.js
// Records webcam video in chunks and uploads to backend.

import { useRef, useCallback } from 'react';
import api from '../api/api';

export const useVideoRecorder = () => {
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const chunkIndexRef = useRef(0);
    const streamRef = useRef(null);
    const activeRef = useRef(false);

    /**
     * Start recording from a MediaStream.
     * @param {MediaStream} stream - the webcam stream
     * @param {number} attemptId - exam attempt ID
     * @param {number} chunkDurationMs - how long each chunk lasts (default 15s)
     */
    const startRecording = useCallback((stream, attemptId, chunkDurationMs = 15000) => {
        if (!stream || !attemptId) {
            console.warn('Cannot start recording: missing stream or attemptId');
            return false;
        }

        streamRef.current = stream;
        activeRef.current = true;
        chunkIndexRef.current = 0;

        // Choose best supported mime type
        const mimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
        ];
        let mimeType = '';
        for (const m of mimeTypes) {
            if (MediaRecorder.isTypeSupported(m)) {
                mimeType = m;
                break;
            }
        }

        if (!mimeType) {
            console.error('No supported video mime type');
            return false;
        }

        try {
            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 500000, // 500kbps - small files
            });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = async (event) => {
                if (!event.data || event.data.size === 0) return;

                const currentIndex = chunkIndexRef.current;
                chunkIndexRef.current++;

                // ✅ FIX: Retry upload up to 3 times on failure
                const formData = new FormData();
                formData.append('chunk', event.data, `chunk_${currentIndex}.webm`);
                formData.append('chunk_index', currentIndex.toString());
                formData.append('duration', (chunkDurationMs / 1000).toString());

                let uploaded = false;
                for (let attempt = 1; attempt <= 3 && !uploaded; attempt++) {
                    try {
                        await api.post(
                            `/exams/attempt/${attemptId}/recording/`,
                            formData,
                            {
                                headers: { 'Content-Type': 'multipart/form-data' },
                                timeout: 30000,
                            }
                        );
                        uploaded = true;
                        console.log(`✅ Video chunk ${currentIndex} uploaded (${(event.data.size / 1024).toFixed(1)}KB)`);
                    } catch (err) {
                        console.warn(`⚠️ Chunk ${currentIndex} attempt ${attempt}/3 failed:`, err.message);
                        if (attempt < 3) {
                            // Wait 2s, 4s between retries
                            await new Promise((r) => setTimeout(r, 2000 * attempt));
                        }
                    }
                }

                if (!uploaded) {
                    console.error(`❌ Chunk ${currentIndex} permanently failed after 3 attempts`);
                }
            };

            recorder.onerror = (e) => {
                console.error('MediaRecorder error:', e);
            };

            // Start recording with timeslice -> triggers ondataavailable periodically
            recorder.start(chunkDurationMs);

            return true;
        } catch (err) {
            console.error('Failed to start recorder:', err);
            return false;
        }
    }, []);

    const stopRecording = useCallback(() => {
        activeRef.current = false;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.warn('Stop error:', e);
            }
        }
        mediaRecorderRef.current = null;
    }, []);

    return {
        startRecording,
        stopRecording,
        isActive: () => activeRef.current,
    };
};