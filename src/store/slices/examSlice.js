import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

export const fetchExams = createAsyncThunk(
  'exams/fetchExams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/exams/');
      let exams = [];
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        exams = response.data.results;
      } else if (Array.isArray(response.data)) {
        exams = response.data;
      } else if (response.data && typeof response.data === 'object') {
        exams = [response.data];
      }
      return exams;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exams');
    }
  }
);

export const fetchResults = createAsyncThunk(
  'exams/fetchResults',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/exams/results/');
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch results');
    }
  }
);

export const startExam = createAsyncThunk(
  'exams/startExam',
  async (examId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/exams/${examId}/start/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to start exam');
    }
  }
);

export const submitExam = createAsyncThunk(
  'exams/submitExam',
  async ({ attemptId, answers }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/exams/attempt/${attemptId}/submit/`, { answers });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to submit exam');
    }
  }
);

const initialState = {
  exams: [],
  results: [],
  currentExam: null,
  isLoading: false,
  error: null,
};

const examSlice = createSlice({
  name: 'exams',
  initialState,
  reducers: {
    clearCurrentExam: (state) => {
      state.currentExam = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.isLoading = false;
        state.exams = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch exams';
        state.exams = [];
      })
      .addCase(fetchResults.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.isLoading = false;
        state.results = action.payload || [];
      })
      .addCase(fetchResults.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(startExam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startExam.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentExam = action.payload;
      })
      .addCase(startExam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(submitExam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitExam.fulfilled, (state) => {
        state.isLoading = false;
        state.currentExam = null;
      })
      .addCase(submitExam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentExam, clearError } = examSlice.actions;
export default examSlice.reducer;