import { createSlice } from '@reduxjs/toolkit';

const tableSlice = createSlice({
  name: 'table',
  initialState: {
    selectedTable: null, // Хранит данные выбранного стола, например: { id: 1, number: 1, status: 'OCCUPIED' }
    availableTables: [], // Список доступных столов
    error: null, // Ошибка при загрузке или выборе стола
  },
  reducers: {
    setSelectedTable: (state, action) => {
      state.selectedTable = action.payload; // Устанавливаем выбранный стол
      state.error = null;
    },
    setAvailableTables: (state, action) => {
      state.availableTables = action.payload; // Устанавливаем список доступных столов
      state.error = null;
    },
    setTableError: (state, action) => {
      state.error = action.payload; // Устанавливаем ошибку
    },
    clearTableData: (state) => {
      state.selectedTable = null;
      state.availableTables = [];
      state.error = null;
    },
  },
});

export const { setSelectedTable, setAvailableTables, setTableError, clearTableData } = tableSlice.actions;
export default tableSlice.reducer;      