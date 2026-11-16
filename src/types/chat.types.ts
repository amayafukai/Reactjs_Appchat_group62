export type SocketEventName =
  | 'REGISTER'
  | 'LOGIN'
  | 'RE_LOGIN'
  | 'LOGOUT'
  | 'CREATE_ROOM'
  | 'JOIN_ROOM'
  | 'GET_ROOM_CHAT_MES'
  | 'GET_PEOPLE_CHAT_MES'
  | 'SEND_CHAT'
  | 'CHECK_USER'
  | 'GET_USER_LIST';

export interface SocketRequest<T = unknown> {
  action: 'onchat';
  data: {
    event: SocketEventName;
    data?: T;
  };
}

export interface SocketResponse<T = unknown> {
  status: 'success' | 'error';
  event: SocketEventName;
  data: T;
  mes?: string;
}

export interface ChatUser {
  name: string;
  type: number; 
  actionTime: string;
  isOnline?: boolean;
}

export interface ChatMessage {
  id?: number | string;
  name: string;      // Username người gửi
  to: string;        // Username người nhận
  mess: string;      // Nội dung tin nhắn
  createAt?: string;
  type?: 'people' | 'room';
}