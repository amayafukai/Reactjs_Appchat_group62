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
    // 1. Lưu danh sách từ GET_USER_LIST
    setUserList: (state, action: PayloadAction<ChatUser[]>) => {
      // Lọc các cuộc trò chuyện cá nhân (type === 0)
      state.userList = action.payload.filter((item) => item.type === 0);
    },

    // 2. Chọn người dùng để mở khung chat
    setActiveChatUser: (state, action: PayloadAction<string>) => {
      const username = action.payload;
      state.activeChatUser = username;
      if (!state.pageByUser[username]) {
        state.pageByUser[username] = 1;
      }
      if (state.hasMoreByUser[username] === undefined) {
        state.hasMoreByUser[username] = true;
      }
    },

    setLoadingHistory: (state, action: PayloadAction<boolean>) => {
      state.isLoadingHistory = action.payload;
    },

    // 3. Lưu lịch sử tin nhắn từ GET_PEOPLE_CHAT_MES
    setPeopleMessages: (
      state,
      action: PayloadAction<{ partner: string; messages: ChatMessage[]; page: number }>
    ) => {
      const { partner, messages, page } = action.payload;
      state.isLoadingHistory = false;

      // Server thường trả về tin nhắn mới nhất ở đầu mảng -> đảo ngược để hiển thị từ cũ đến mới
      const chronologicalMessages = [...messages].reverse();

      if (page === 1) {
        state.messagesByUser[partner] = chronologicalMessages;
      } else {
        const currentMessages = state.messagesByUser[partner] || [];
        state.messagesByUser[partner] = [...chronologicalMessages, ...currentMessages];
      }

      state.pageByUser[partner] = page;
      // Nếu server trả về rỗng nghĩa là đã hết tin nhắn cũ
      state.hasMoreByUser[partner] = messages.length > 0;
    },

    // 4. Xử lý gửi/nhận tin nhắn realtime từ SEND_CHAT (type = 'people')
    addRealtimePeopleMessage: (
      state,
      action: PayloadAction<{ message: ChatMessage; currentUser: string }>
    ) => {
      const { message, currentUser } = action.payload;
      // Nếu mình gửi thì đối phương là `to`, nếu đối phương gửi thì đối phương là `name`
      const partner = message.name === currentUser ? message.to : message.name;

      if (!state.messagesByUser[partner]) {
        state.messagesByUser[partner] = [];
      }
      state.messagesByUser[partner].push(message);

      // Cập nhật và đẩy partner lên đầu danh sách cuộc trò chuyện
      const existingIndex = state.userList.findIndex((u) => u.name === partner);
      const existingOnlineStatus =
        existingIndex !== -1 ? state.userList[existingIndex].isOnline : true;

      const updatedUser: ChatUser = {
        name: partner,
        type: 0,
        actionTime: new Date().toISOString(),
        isOnline: existingOnlineStatus,
      };

      if (existingIndex !== -1) {
        state.userList.splice(existingIndex, 1);
      }
      state.userList.unshift(updatedUser);
    },

    // 5. Lưu kết quả kiểm tra tồn tại & online từ CHECK_USER
    setCheckedUser: (state, action: PayloadAction<CheckedUserResult | null>) => {
      state.checkedUser = action.payload;

      // Đồng bộ luôn trạng thái online nếu user này đang nằm trong userList
      if (action.payload && action.payload.exists) {
        const userInList = state.userList.find((u) => u.name === action.payload?.username);
        if (userInList) {
          userInList.isOnline = action.payload.isOnline;
        }
      }
    },

    // 6. Xóa dữ liệu khi LOGOUT[cite: 1]
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