import { createSlice } from '@reduxjs/toolkit';

const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    items: [],
    pagination: null,
    loading: false,
    error: null
  },
  reducers: {
    setCoursesLoading: (state, action) => {
      state.loading = action.payload;
    },
    setCourses: (state, action) => {
      state.items = action.payload.courses || [];
      state.pagination = action.payload.pagination || null;
      state.error = null;
    },
    setCoursesError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setCoursesLoading, setCourses, setCoursesError } = courseSlice.actions;
export default courseSlice.reducer;
