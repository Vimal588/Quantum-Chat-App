import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Search, UserPlus, ShieldCheck, MessageSquare, ShieldAlert, Ban, Check, User } from 'lucide-react';
import api from '../services/api';
import { useChatStore } from '../store/useChatStore';
import { useNavigate } from 'react-router-dom';
import VerifyContactModal from '../components/VerifyContactModal';

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContactForVerification, setSelectedContactForVerification] = useState(null);

  const { contacts, loadContacts, startConversationWithUser } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/users/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (userId) => {
    try {
      await api.post(`/contacts/add/${userId}`);
      loadContacts();
      // Remove from search results
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Add contact failed:', err);
    }
  };

  const handleStartChat = async (contactUserId) => {
    await startConversationWithUser(contactUserId);
    navigate('/');
  };

  const handleBlockUser = async (contactUserId) => {
    if (window.confirm('Are you sure you want to block this user? They will not be able to message you.')) {
      try {
        await api.post(`/contacts/block/${contactUserId}`);
        loadContacts();
      } catch (err) {
        console.error('Block failed:', err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contacts & Directory</h1>
          <p className="text-sm text-slate-400">Discover and verify post-quantum identities across the network.</p>
        </div>

        {/* User Search Bar */}
        <section className="bg-navy-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-400" />
            Search Registered Users
          </h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              placeholder="Search by full name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 border-t border-slate-800/80 pt-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Search Results</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-teal-400">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{user.fullName}</div>
                        <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddContact(user.id)}
                      className="p-2 text-teal-400 hover:text-white hover:bg-teal-600 rounded-lg transition-colors border border-teal-500/30"
                      title="Add to Contacts"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Existing Contacts List */}
        <section className="bg-navy-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
          <h2 className="text-base font-semibold text-white mb-4">My Contacts ({contacts.length})</h2>

          {contacts.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <User className="w-10 h-10 mx-auto mb-2 opacity-30 text-teal-400" />
              <p className="text-sm font-medium">No contacts yet</p>
              <p className="text-xs text-slate-600 mt-1">Search above to find and add other users.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.contactId}
                  className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-teal-400 border border-slate-700">
                          {contact.avatarUrl ? (
                            <img
                              src={contact.avatarUrl}
                              alt={contact.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{contact.fullName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        {contact.isOnline && (
                          <span className="w-3.5 h-3.5 bg-emerald-500 border-2 border-navy-950 rounded-full absolute bottom-0 right-0" />
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {contact.fullName}
                          {contact.verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                              <ShieldCheck className="w-3 h-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
                              <ShieldAlert className="w-3 h-3" />
                              Unverified
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">{contact.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Fingerprint summary */}
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span className="text-slate-500">Key v{contact.keyVersion || 1}:</span>
                    <span className="truncate max-w-[200px] text-teal-300">
                      {contact.safetyNumberFingerprint || (contact.mlKemPublicKey ? contact.mlKemPublicKey.substring(0, 24) + '...' : 'PQC Key Configured')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleStartChat(contact.userId)}
                      className="flex-1 py-2 px-3 bg-teal-600/90 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/10 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </button>

                    <button
                      onClick={() => setSelectedContactForVerification(contact)}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1 border border-slate-700 transition-colors"
                      title="Inspect and verify Safety Number"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                      Verify
                    </button>

                    <button
                      onClick={() => handleBlockUser(contact.userId)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="Block User"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Safety Number Verification Modal */}
      {selectedContactForVerification && (
        <VerifyContactModal
          contact={selectedContactForVerification}
          onClose={() => setSelectedContactForVerification(null)}
          onVerified={() => loadContacts()}
        />
      )}
    </div>
  );
}
