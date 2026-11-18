import React, { useState } from 'react';
import { Search, Plus, ShieldCheck, Lock, UserPlus } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  const { conversations, activeConversation, selectConversation } = useChatStore();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.otherParticipantEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-80 sm:w-96 border-r border-slate-800 bg-navy-900/60 flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Search & Actions */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Conversations</h2>
          <Link
            to="/contacts"
            className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 hover:border-teal-500/40 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            New Chat
          </Link>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-400" />
            <p className="text-sm font-medium">No conversations found</p>
            <p className="text-xs text-slate-600 mt-1">Start a post-quantum chat from Contacts</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = activeConversation?.id === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                  isSelected
                    ? 'bg-teal-500/10 border-l-4 border-teal-500'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Avatar with Online Dot */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-teal-400 border border-slate-700">
                    {conv.otherParticipantAvatar ? (
                      <img
                        src={conv.otherParticipantAvatar}
                        alt={conv.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{conv.title ? conv.title.charAt(0).toUpperCase() : '?'}</span>
                    )}
                  </div>
                  {conv.isOnline && (
                    <span className="w-3 h-3 bg-emerald-500 border-2 border-navy-950 rounded-full absolute bottom-0 right-0" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-slate-200 truncate flex items-center gap-1.5">
                      {conv.title}
                      {conv.otherParticipantVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-400 inline" title="Safety Number Verified" />
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {conv.lastMessageTimestamp
                        ? new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 truncate font-mono">
                    {conv.lastMessageSnippet || 'Secure channel ready'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
