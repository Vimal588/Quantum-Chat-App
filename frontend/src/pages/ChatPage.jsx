import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { useChatStore } from '../store/useChatStore';

export default function ChatPage() {
  const { loadConversations, loadContacts } = useChatStore();

  useEffect(() => {
    loadConversations();
    loadContacts();
  }, [loadConversations, loadContacts]);

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <ChatWindow />
      </div>
    </div>
  );
}
