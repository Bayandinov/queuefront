import { createSlice } from '@reduxjs/toolkit';

const loadStateFromLocalStorage = () => {
  const authData = localStorage.getItem('authData');
  if (authData) {
    try {
      const parsedAuthData = JSON.parse(authData);
      return {
        authData: parsedAuthData,
        isAuthenticated: true,
      };
    } catch (e) {
      console.error('Ошибка при парсинге authData из localStorage:', e);
      return {
        authData: { jwtToken: null, id: null, email: null, role: { id: null, name: null } },
        isAuthenticated: false,
      };
    }
  }
  return {
    authData: { jwtToken: null, id: null, email: null, role: { id: null, name: null } },
    isAuthenticated: false,
  };
};

const initialState = loadStateFromLocalStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    saveAuthData: (state, action) => {
      state.authData = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('authData', JSON.stringify(action.payload));
    },
    clearAuthData: (state) => {
      state.authData = { jwtToken: null, id: null, email: null, role: { id: null, name: null } };
      state.isAuthenticated = false;
      localStorage.removeItem('authData');
    },
  },
});

export const { saveAuthData, clearAuthData } = authSlice.actions;
export default authSlice.reducer;