import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  client: {
    email: '',
    firstName: '',
    lastName: '',
    middleName: '',
    id: 0,
  },
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    saveClientData(state, action) {
      state.client = action.payload;
    },
    clearClientData(state) {
      state.client = initialState.client;
    },
  },
});

export const { saveClientData, clearClientData } = clientSlice.actions;
export default clientSlice.reducer;