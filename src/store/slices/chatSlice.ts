import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage, ChatUser } from '../../types/chat.types';

export interface CheckedUserResult {
  username: string;
  exists: boolean;
  isOnline: boolean;
}

interface ChatState {
  userList: ChatUser[];
  activeChatUser: string | null;
  messagesByUser: Record<string, ChatMessage[]>;
  pageByUser: Record<string, number>;
  hasMoreByUser: Record<string, boolean>;
  checkedUser: CheckedUserResult | null;
  isLoadingHistory: boolean;
}

const initialState: ChatState = {
  userList: [],
  activeChatUser: null,
  messagesByUser: {},
  pageByUser: {},
  hasMoreByUser: {},
  checkedUser: null,
  isLoadingHistory: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setUserList: (state, action: PayloadAction<ChatUser[]>) => {
      const incoming = action.payload.filter((item) => item.type === 0);
      // Giữ lại trạng thái online đã biết
      state.userList = incoming.map((u) => ({
        ...u,
        isOnline: state.userList.find((old) => old.name === u.name)?.isOnline,
      }));
    },

    setActiveChatUser: (state, action: PayloadAction<string>) => {
      const username = action.payload;
      state.activeChatUser = username;
      if (!state.pageByUser[username]) state.pageByUser[username] = 1;
      if (state.hasMoreByUser[username] === undefined) state.hasMoreByUser[username] = true;

      if (!state.userList.some((u) => u.name === username)) {
        state.userList.unshift({
          name: username,
          type: 0,
          actionTime: new Date().toISOString(),
        });
      }
    },

    setLoadingHistory: (state, action: PayloadAction<boolean>) => {
      state.isLoadingHistory = action.payload;
    },

    setPeopleMessages: (
      state,
      action: PayloadAction<{ partner: string; messages: ChatMessage[]; page: number }>
    ) => {
      const { partner, messages, page } = action.payload;
      state.isLoadingHistory = false;

      const chronological = [...messages].reverse();

      if (page === 1) {
        state.messagesByUser[partner] = chronological;
      } else {
        const current = state.messagesByUser[partner] ?? [];
        state.messagesByUser[partner] = [...chronological, ...current];
      }

      state.pageByUser[partner] = page;
      state.hasMoreByUser[partner] = messages.length > 0;
    },

    addRealtimePeopleMessage: (
      state,
      action: PayloadAction<{ message: ChatMessage; currentUser: string }>
    ) => {
      const { message, currentUser } = action.payload;
      const partner = message.name === currentUser ? message.to : message.name;

      if (!state.messagesByUser[partner]) state.messagesByUser[partner] = [];
      state.messagesByUser[partner].push(message);

      const existingIndex = state.userList.findIndex((u) => u.name === partner);
      const existingOnline = existingIndex !== -1 ? state.userList[existingIndex].isOnline : undefined;
      if (existingIndex !== -1) state.userList.splice(existingIndex, 1);

      state.userList.unshift({
        name: partner,
        type: 0,
        actionTime: new Date().toISOString(),
        isOnline: existingOnline,
      });
    },

    setCheckedUser: (state, action: PayloadAction<CheckedUserResult | null>) => {
      state.checkedUser = action.payload;
      const result = action.payload;
      if (result && result.exists) {
        const u = state.userList.find((x) => x.name === result.username);
        if (u) u.isOnline = result.isOnline;
      }
    },

    resetChatState: () => initialState,
  },
});

export const {
  setUserList,
  setActiveChatUser,
  setLoadingHistory,
  setPeopleMessages,
  addRealtimePeopleMessage,
  setCheckedUser,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;