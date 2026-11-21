import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    // Thành viên 1 thêm: auth: authReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;