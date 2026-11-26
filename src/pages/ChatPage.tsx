import { useCallback, useEffect, useRef, type CSSProperties, type FC } from 'react';
import { Sidebar } from '../components/chat/Sidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useAppDispatch } from '../store/hooks';
import {
  addRealtimePeopleMessage,
  setCheckedUser,
  setLoadingHistory,
  setPeopleMessages,
  setUserList,
} from '../store/slices/chatSlice';
import type {
  ChatMessage,
  ChatUser,
  SocketEventName,
  SocketRequest,
  SocketResponse,
} from '../types/chat.types';

interface ChatPageProps {
  socket: WebSocket | null;
  currentUser: string;
}

interface CheckUserData {
  status?: boolean;
  online?: boolean;
}

export const ChatPage: FC<ChatPageProps> = ({ socket, currentUser }) => {
  const dispatch = useAppDispatch();

  const pendingHistoryRef = useRef<{ partner: string; page: number } | null>(null);
  const pendingCheckRef = useRef<string | null>(null);

  const sendSocketEvent = useCallback(
    <T,>(event: SocketEventName, data?: T) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn('Socket chưa sẵn sàng để gửi event:', event);
        return false;
      }
      const payload: SocketRequest<T> = {
        action: 'onchat',
        data: data !== undefined ? { event, data } : { event },
      };
      socket.send(JSON.stringify(payload));
      return true;
    },
    [socket]
  );

  useEffect(() => {
    sendSocketEvent('GET_USER_LIST');
  }, [sendSocketEvent]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const response: SocketResponse<unknown> = JSON.parse(event.data as string);
        const ok = response.status === 'success';

        switch (response.event) {
          case 'GET_USER_LIST': {
            if (ok && Array.isArray(response.data)) {
              dispatch(setUserList(response.data as ChatUser[]));
            }
            break;
          }

          case 'GET_PEOPLE_CHAT_MES': {
            const pending = pendingHistoryRef.current;
            pendingHistoryRef.current = null;
            if (ok && Array.isArray(response.data) && pending) {
              dispatch(
                setPeopleMessages({
                  partner: pending.partner,
                  messages: response.data as ChatMessage[],
                  page: pending.page,
                })
              );
            } else {
              dispatch(setLoadingHistory(false));
            }
            break;
          }

          case 'SEND_CHAT': {
            if (!ok || !response.data) break;
            const msg = response.data as ChatMessage;
            const isPeople = msg.type === 'people' || msg.type === 0 || msg.type === undefined;
            if (isPeople && msg.name !== currentUser) {
              dispatch(addRealtimePeopleMessage({ message: msg, currentUser }));
            }
            break;
          }

          case 'CHECK_USER': {
            const username = pendingCheckRef.current;
            if (!username) break;
            pendingCheckRef.current = null;
            const d = (response.data ?? {}) as CheckUserData;
            const exists = ok && Boolean(d.status);
            dispatch(
              setCheckedUser({
                username,
                exists,
                isOnline: exists && Boolean(d.online),
              })
            );
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Lỗi parse JSON từ socket:', err);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, currentUser, dispatch]);

  const requestHistory = (partner: string, page: number) => {
    dispatch(setLoadingHistory(true));
    pendingHistoryRef.current = { partner, page };
    if (!sendSocketEvent('GET_PEOPLE_CHAT_MES', { name: partner, page })) {
      pendingHistoryRef.current = null;
      dispatch(setLoadingHistory(false));
    }
  };

  const handleSelectUser = (username: string) => requestHistory(username, 1);

  const handleLoadMoreHistory = (partner: string, nextPage: number) =>
    requestHistory(partner, nextPage);

  const handleSendMessage = (to: string, text: string) => {
    const sent = sendSocketEvent('SEND_CHAT', { type: 'people', to, mes: text });
    if (!sent) return;
    dispatch(
      addRealtimePeopleMessage({
        message: {
          name: currentUser,
          to,
          mes: text,
          type: 'people',
          createAt: new Date().toLocaleString('vi-VN'),
        },
        currentUser,
      })
    );
  };

  const handleCheckUser = (username: string) => {
    pendingCheckRef.current = username;
    sendSocketEvent('CHECK_USER', { user: username });
  };

  return (
    <div style={styles.pageContainer}>
      <Sidebar onSelectUser={handleSelectUser} onCheckUser={handleCheckUser} />
      <ChatWindow
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
        onLoadMoreHistory={handleLoadMoreHistory}
      />
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  pageContainer: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
};