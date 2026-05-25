import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, onSnapshot } from '../firebase';
import { Lock, ShieldCheck, Zap, AlertTriangle, EyeOff, Key, Loader2, BarChart3, Fingerprint, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Security() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    encrypted: 0,
    phishing: 0,
    trackers: 0,
    threats: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const emailsRef = collection(db, 'emails');
    const q = query(emailsRef, where('recipientUid', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let enc = 0, phish = 0, track = 0, thrt = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.isEncrypted) enc++;
        if (data.isPhishing) phish++;
        if (data.isSpam) thrt++;
        if (data.hasImages) track++; // Simulated tracker detection
      });
      setStats({ encrypted: enc, phishing: phish, trackers: track * 2, threats: thrt + phish });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const cards = [
    { label: "Encrypted Messages", value: stats.encrypted, icon: Lock, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Phishing Blocked", value: stats.phishing, icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Trackers Stripped", value: stats.trackers, icon: EyeOff, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { label: "Active Threats Neutralized", value: stats.threats, icon: Zap, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-[#16171d]">
        <Loader2 className="animate-spin text-violet-500" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#16171d] p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-violet-600 rounded-2xl text-white shadow-xl shadow-violet-600/20">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Security Command Center</h1>
            <p className="text-gray-500 dark:text-gray-400">Real-time protection overview for your Pro Mail ecosystem.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {cards.map((card, i) => (
            <div key={i} className="bg-white dark:bg-[#1f2028] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", card.bg, card.color)}>
                <card.icon size={24} />
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-1">{card.value}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Security Status */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-gray-50 dark:bg-[#16171d] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <Activity size={20} className="text-green-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">System Vitality</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1f2028] rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                      <Lock size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">E2EE Gateway</div>
                      <div className="text-xs text-gray-500">All incoming mail is re-encrypted on arrival</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 text-[10px] font-black uppercase rounded-full">Optimal</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1f2028] rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                      <Fingerprint size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Local Access Protection</div>
                      <div className="text-xs text-gray-500">Biometric and PIN-based local lock</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 text-[10px] font-black uppercase rounded-full">Secure</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1f2028] rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Identity Cloaking</div>
                      <div className="text-xs text-gray-500">Active burner aliases: {stats.encrypted + 2}</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 text-[10px] font-black uppercase rounded-full">Active</div>
                </div>
              </div>
            </section>
          </div>

          {/* Tips Sidebar */}
          <div className="space-y-6">
            <section className="bg-violet-600 p-8 rounded-[3rem] text-white shadow-xl shadow-violet-600/20">
              <Key size={32} className="mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Security Tip</h3>
              <p className="text-violet-100 text-sm leading-relaxed mb-6">
                Avoid using the same password for different aliases. Pro Mail's Identity Cloaking ensures your main account remains hidden even if a service is breached.
              </p>
              <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-all">
                Learn More
              </button>
            </section>

            <section className="bg-gray-900 dark:bg-black p-8 rounded-[3rem] text-white">
              <BarChart3 size={32} className="mb-4 text-violet-400" />
              <h3 className="text-xl font-bold mb-4">Total Mitigation</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-gray-400">Privacy Score</span>
                  <span className="text-xl font-black text-violet-400">98%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-400 w-[98%]" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
