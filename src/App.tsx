import { useEffect, useState } from 'react';
import { ChatPage } from './pages/ChatPage';

const WS_URL = 'wss://chat.longapp.io.vn/chat';
const TEST_USER = 'sv1';
const TEST_PASS = '123456';

export default function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          action: 'onchat',
          data: { event: 'LOGIN', data: { user: TEST_USER, pass: TEST_PASS } },
        })
      );
      setSocket(ws);
    };
    return () => ws.close();
  }, []);

  return <ChatPage socket={socket} currentUser={TEST_USER} />;
}