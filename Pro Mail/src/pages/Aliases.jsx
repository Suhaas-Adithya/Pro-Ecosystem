import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, doc, getDoc, setDoc } from '../firebase';
import { Shield, Plus, MoreVertical, Power, PowerOff, Trash2, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Aliases() {
  const { currentUser } = useAuth();
  const [aliases, setAliases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function loadAliases() {
      if (!currentUser) return;
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setAliases(snap.data().burnerAliases || []);
      }
      setLoading(false);
    }
    loadAliases();
  }, [currentUser]);

  const saveAliases = async (newAliases) => {
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, { burnerAliases: newAliases }, { merge: true });
    setAliases(newAliases);
  };

  const generateAlias = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const random = Math.random().toString(36).substring(2, 8);
      const newAlias = {
        id: Math.random().toString(36).substring(7),
        email: `anon_${random}@pro.me`,
        label: 'New Alias',
        active: true,
        createdAt: new Date().toISOString(),
        forwardedCount: 0
      };
      saveAliases([newAlias, ...aliases]);
      setIsGenerating(false);
    }, 1000);
  };

  const toggleAlias = (id) => {
    const newAliases = aliases.map(a => a.id === id ? { ...a, active: !a.active } : a);
    saveAliases(newAliases);
  };

  const deleteAlias = (id) => {
    const newAliases = aliases.filter(a => a.id !== id);
    saveAliases(newAliases);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-[#16171d]">
        <Loader2 className="animate-spin text-violet-500" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#16171d] p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                <Shield size={24} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Identity Cloaking</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Generate burner addresses to protect your real identity from trackers and spammers.
            </p>
          </div>

          <button 
            onClick={generateAlias}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gray-900/10 dark:shadow-white/5 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Generate Alias
          </button>
        </div>

        {aliases.length === 0 ? (
          <div className="py-20 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem] flex flex-col items-center justify-center text-center px-6 bg-gray-50/50 dark:bg-gray-800/20">
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm mb-6">
              <Shield size={40} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No active aliases</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-8">
              Protect your main inbox by using aliases for newsletters, online shopping, or one-time signups.
            </p>
            <button 
              onClick={generateAlias}
              className="text-blue-500 font-bold hover:underline flex items-center gap-2"
            >
              <Sparkles size={16} />
              Create your first burner address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aliases.map((alias) => (
              <div 
                key={alias.id} 
                className={cn(
                  "relative bg-white dark:bg-[#1f2028] border rounded-[2.5rem] p-8 transition-all hover:shadow-2xl group",
                  alias.active ? "border-gray-100 dark:border-gray-800" : "border-gray-100 dark:border-gray-800 opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    alias.active ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                  )}>
                    {alias.active ? 'Active' : 'Paused'}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleAlias(alias.id)}
                      className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                      title={alias.active ? "Pause" : "Activate"}
                    >
                      {alias.active ? <PowerOff size={18} /> : <Power size={18} />}
                    </button>
                    <button 
                      onClick={() => deleteAlias(alias.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{alias.email}</span>
                    <button 
                      onClick={() => copyToClipboard(alias.email, alias.id)}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      {copiedId === alias.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={alias.label}
                    onChange={(e) => {
                      const newAliases = aliases.map(a => a.id === alias.id ? { ...a, label: e.target.value } : a);
                      setAliases(newAliases);
                    }}
                    onBlur={() => saveAliases(aliases)}
                    className="bg-transparent border-none text-sm text-gray-500 dark:text-gray-400 font-medium outline-none hover:text-gray-900 dark:hover:text-gray-200 focus:text-gray-900 dark:focus:text-gray-200 transition-colors"
                    placeholder="Alias Label (e.g. Amazon)"
                  />
                </div>

                <div className="pt-6 border-t border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mails Blocked</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{alias.forwardedCount}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Created</span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {new Date(alias.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 p-8 bg-blue-50 dark:bg-blue-500/5 rounded-[2.5rem] border border-blue-100 dark:border-blue-500/20">
          <div className="flex gap-4">
            <div className="p-3 bg-white dark:bg-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 h-fit shadow-sm">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-2">How Identity Cloaking Works</h3>
              <p className="text-sm text-blue-800/70 dark:text-blue-300/70 leading-relaxed">
                When you use an alias, emails sent to it are forwarded to your main inbox after being stripped of all trackers. 
                If you start receiving spam, simply **Pause** or **Delete** the alias, and those emails will never reach you again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
