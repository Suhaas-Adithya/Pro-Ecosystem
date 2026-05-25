import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, addDoc, getDocs, deleteDoc, doc, query, where } from '../firebase';
import { Users, UserPlus, Trash2, Mail, User, Search, Loader2, Star, MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Contacts() {
  const { currentUser } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadContacts() {
      if (!currentUser) return;
      try {
        const q = query(collection(db, 'contacts'), where('ownerUid', '==', currentUser.uid));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setContacts(fetched.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadContacts();
  }, [currentUser]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !currentUser) return;
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'contacts'), {
        ownerUid: currentUser.uid,
        name: newName,
        email: newEmail,
        starred: false,
        createdAt: new Date().toISOString()
      });
      setContacts([...contacts, { id: docRef.id, name: newName, email: newEmail, starred: false }]);
      setNewName('');
      setNewEmail('');
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
      alert('Failed to add contact.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteContact = async (id) => {
    try {
      await deleteDoc(doc(db, 'contacts', id));
      setContacts(contacts.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 h-full bg-white dark:bg-[#16171d] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-8 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Users className="text-violet-600 dark:text-violet-400" size={32} />
              Contacts
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your professional network and address book.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20 active:scale-95 flex items-center gap-2"
          >
            <UserPlus size={20} />
            Add Contact
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#1f2028] border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-24 py-3 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-gray-900 dark:text-gray-100"
          />
          {!searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 select-none rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 py-0.5 font-mono text-[9px] font-bold text-gray-400 dark:text-gray-500 shadow-sm uppercase">
                <span>{typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}</span>
                <span>+</span>
                <span>Shift</span>
                <span>+</span>
                <span>S</span>
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-violet-500" size={32} />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Users size={40} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">No contacts found</h3>
            <p className="max-w-xs">Start building your address book by adding your first contact.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map(contact => (
              <div 
                key={contact.id}
                className="group bg-white dark:bg-[#1f2028] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:shadow-xl hover:shadow-violet-500/5 transition-all relative overflow-hidden"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 text-xl font-bold">
                    {contact.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{contact.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                      <Mail size={12} />
                      {contact.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800/50">
                   <div className="flex items-center gap-1">
                     <button className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/5 rounded-lg transition-colors">
                       <Star size={18} className={cn(contact.starred && "fill-yellow-500 text-yellow-500")} />
                     </button>
                     <button className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/5 rounded-lg transition-colors">
                       <Mail size={18} />
                     </button>
                   </div>
                   <button 
                    onClick={() => deleteContact(contact.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1f2028] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">New Contact</h3>
              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-gray-50 dark:bg-[#16171d] border border-gray-100 dark:border-gray-800 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="jane@pro.me"
                      className="w-full bg-gray-50 dark:bg-[#16171d] border border-gray-100 dark:border-gray-800 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-100 dark:bg-[#16171d] text-gray-600 dark:text-gray-400 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving && <Loader2 size={18} className="animate-spin" />}
                    Save Contact
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
