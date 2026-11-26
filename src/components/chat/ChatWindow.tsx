import { useEffect, useRef, type CSSProperties, type FC } from 'react';
import { useAppSelector } from '../../store/hooks';
import { getMessageText } from '../../types/chat.types';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  currentUser: string;
  onSendMessage: (to: string, mess: string) => void;
  onLoadMoreHistory: (partner: string, nextPage: number) => void;
}

export const ChatWindow: FC<ChatWindowProps> = ({
  currentUser,
  onSendMessage,
  onLoadMoreHistory,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastKeyRef = useRef<string>('');

  const { activeChatUser, messagesByUser, pageByUser, hasMoreByUser, userList, isLoadingHistory } =
    useAppSelector((s) => s.chat);

  const messages = activeChatUser ? messagesByUser[activeChatUser] ?? [] : [];
  const currentPage = activeChatUser ? pageByUser[activeChatUser] ?? 1 : 1;
  const hasMore = activeChatUser ? hasMoreByUser[activeChatUser] ?? true : false;
  const partnerInfo = userList.find((u) => u.name === activeChatUser);

  
  const last = messages[messages.length - 1];
  const lastKey = `${activeChatUser}|${last?.id ?? messages.length}|${last ? getMessageText(last) : ''}`;

  useEffect(() => {
    if (lastKey !== lastKeyRef.current) {
      lastKeyRef.current = lastKey;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lastKey]);

  if (!activeChatUser) {
    return (
      <div style={styles.emptyWindow}>
        <h3>Chào mừng, {currentUser}!</h3>
        <p>Chọn một cuộc trò chuyện bên trái hoặc tìm kiếm username để bắt đầu nhắn tin.</p>
      </div>
    );
  }

  return (
    <div style={styles.window}>
      <div style={styles.header}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16 }}>{activeChatUser}</h4>
          {partnerInfo?.isOnline !== undefined && (
            <span style={{ fontSize: 12, color: partnerInfo.isOnline ? '#16a34a' : '#6b7280' }}>
              {partnerInfo.isOnline ? '● Đang hoạt động' : '○ Ngoại tuyến'}
            </span>
          )}
        </div>
      </div>

      <div style={styles.messageList}>
        {hasMore && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <button
              disabled={isLoadingHistory}
              onClick={() => onLoadMoreHistory(activeChatUser, currentPage + 1)}
              style={styles.loadMoreBtn}
            >
              {isLoadingHistory ? 'Đang tải...' : 'Tải tin nhắn cũ hơn'}
            </button>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMine = msg.name === currentUser;
          return (
            <div
              key={msg.id ?? `${index}-${msg.createAt ?? ''}`}
              style={{ ...styles.messageRow, justifyContent: isMine ? 'flex-end' : 'flex-start' }}
            >
              <div
                style={{
                  ...styles.bubble,
                  backgroundColor: isMine ? '#2563eb' : '#f3f4f6',
                  color: isMine ? '#fff' : '#111827',
                }}
              >
                <div>{getMessageText(msg)}</div>
                {msg.createAt && (
                  <div style={{ fontSize: 10, marginTop: 4, opacity: 0.75, textAlign: 'right' }}>
                    {msg.createAt}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        disabled={!activeChatUser}
        onSendMessage={(text) => onSendMessage(activeChatUser, text)}
      />
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  window: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff' },
  emptyWindow: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: '14px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageList: {
    flex: 1,
    padding: 20,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  loadMoreBtn: {
    padding: '6px 12px',
    fontSize: 12,
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    backgroundColor: '#fff',
    cursor: 'pointer',
    color: '#475569',
  },
  messageRow: { display: 'flex', width: '100%' },
  bubble: {
    maxWidth: '65%',
    padding: '10px 14px',
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
};