// frontend/src/services/aiService.js
// COMPLETE FRONTEND AI SERVICE

import api from '../api/api';

class AIService {
    // ============================================================
    // 1. SMART ESSAY GRADING
    // ============================================================
    
    async gradeEssay(answerId) {
        try {
            const response = await api.post('/analytics/ai/grade-essay/', {
                answer_id: answerId
            });
            return response.data;
        } catch (error) {
            console.error('AI Grading failed:', error);
            throw error;
        }
    }
    
    async batchGradeEssays(answerIds) {
        try {
            const response = await api.post('/analytics/ai/batch-grade/', {
                answer_ids: answerIds
            });
            return response.data;
        } catch (error) {
            console.error('Batch AI Grading failed:', error);
            throw error;
        }
    }
    
    // ============================================================
    // 2. PLAGIARISM CHECK
    // ============================================================
    
    async checkPlagiarism(text, context = '') {
        try {
            const response = await api.post('/analytics/ai/plagiarism-check/', {
                text: text,
                context: context
            });
            return response.data;
        } catch (error) {
            console.error('Plagiarism check failed:', error);
            throw error;
        }
    }
    
    // ============================================================
    // 3. QUESTION GENERATION
    // ============================================================
    
    async generateQuestions(topic, difficulty = 'medium', count = 5) {
        try {
            const response = await api.post('/analytics/ai/generate-questions/', {
                topic: topic,
                difficulty: difficulty,
                count: count
            });
            return response.data;
        } catch (error) {
            console.error('Question generation failed:', error);
            throw error;
        }
    }
    
    // ============================================================
    // 4. FEEDBACK GENERATION
    // ============================================================
    
    async generateFeedback(answerId) {
        try {
            const response = await api.post('/analytics/ai/generate-feedback/', {
                answer_id: answerId
            });
            return response.data;
        } catch (error) {
            console.error('Feedback generation failed:', error);
            throw error;
        }
    }
    
    // ============================================================
    // 5. PROCTORING ANALYSIS
    // ============================================================
    
    async analyzeProctoring(attemptId) {
        try {
            const response = await api.post('/analytics/ai/proctoring-analysis/', {
                attempt_id: attemptId
            });
            return response.data;
        } catch (error) {
            console.error('Proctoring analysis failed:', error);
            throw error;
        }
    }
    
    // ============================================================
    // 6. COURSE RECOMMENDATIONS
    // ============================================================
    
    async getRecommendations() {
        try {
            const response = await api.get('/analytics/ai/recommendations/');
            return response.data;
        } catch (error) {
            console.error('Recommendations failed:', error);
            throw error;
        }
    }
}

export default new AIService();