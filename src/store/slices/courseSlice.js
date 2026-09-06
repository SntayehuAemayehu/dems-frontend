import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/courses/');
      let courses = [];
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        courses = response.data.results;
      } else if (Array.isArray(response.data)) {
        courses = response.data;
      } else if (response.data && typeof response.data === 'object') {
        courses = [response.data];
      }
      return courses;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const fetchCourseDetail = createAsyncThunk(
  'courses/fetchCourseDetail',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/courses/${courseId}/`);
      return response.data || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch course details');
    }
  }
);

export const enrollCourse = createAsyncThunk(
  'courses/enrollCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.post('/courses/enrollments/', { course: courseId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to enroll');
    }
  }
);

const initialState = {
  courses: [],
  selectedCourse: null,
  enrollments: [],
  isLoading: false,
  error: null,
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch courses';
        state.courses = [];
      })
      .addCase(fetchCourseDetail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCourse = action.payload;
      })
      .addCase(fetchCourseDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.selectedCourse = null;
      })
      .addCase(enrollCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(enrollCourse.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(enrollCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedCourse, clearError } = courseSlice.actions;
export default courseSlice.reducer;