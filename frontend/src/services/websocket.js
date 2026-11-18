import { Client } from '@stomp/stompjs';

function getBrokerURL() {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) {
    if (envUrl.startsWith('http://')) return envUrl.replace('http://', 'ws://');
    if (envUrl.startsWith('https://')) return envUrl.replace('https://', 'wss://');
    return envUrl;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Connect directly to backend WebSocket port or via dev server proxy
  return `${protocol}//localhost:8080/ws`;
}

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  connect(token, onConnected, onError) {
    if (this.client && this.connected) {
      if (onConnected) onConnected();
      return;
    }

    // Use native browser WebSocket via STOMP brokerURL
    // This avoids legacy SockJS unload event listener violations in modern browsers
    this.client = new Client({
      brokerURL: getBrokerURL(),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // console.debug('[STOMP]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.connected = true;
        if (onConnected) onConnected();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        if (onError) onError(frame);
      },
      onDisconnect: () => {
        this.connected = false;
      },
      onWebSocketError: (error) => {
        console.warn('Native WebSocket error or reconnecting:', error);
      }
    });

    this.client.activate();
  }

  subscribe(topic, callback) {
    if (!this.client || !this.connected) {
      console.warn('STOMP not connected yet, queuing subscription for:', topic);
      return null;
    }

    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    const sub = this.client.subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (e) {
        callback(message.body);
      }
    });

    this.subscriptions.set(topic, sub);
    return sub;
  }

  unsubscribe(topic) {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  sendMessage(destination, payload) {
    if (!this.client || !this.connected) {
      console.error('Cannot send message, WebSocket not connected');
      return;
    }
    this.client.publish({
      destination,
      body: JSON.stringify(payload),
    });
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.connected = false;
      this.client = null;
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;
