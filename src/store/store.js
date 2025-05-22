import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice'; // Путь к вашему authSlice
import clientReducer from './clientSlice'; // Предполагаемый путь к clientSlice из предыдущего контекста
import tableReducer from './tableSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    client: clientReducer, // Если clientSlice существует
    table: tableReducer, // Добавляем tableSlice
  },
});