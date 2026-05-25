import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { db, doc, setDoc, getDoc } from '../firebase';
import { Settings as SettingsIcon, Save, User, Mail, PenTool, Loader2, Check, Lock, Filter, Plus, Trash2, Keyboard } from 'lucide-react';
import { cn } from '../lib/utils';
import { useShortcuts } from '../context/ShortcutsContext';

export default function Settings() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const { shortcuts, updateShortcut, resetToDefaults } = useShortcuts();
  const [recordingAction, setRecordingAction] = useState(null);
  
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [appLockPin, setAppLockPin] = useState('');
  const [rules, setRules] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ruleProcessed, setRuleProcessed] = useState(false);

  useEffect(() => {
    if (!recordingAction) return;

    const handleKeyDown = (e) => {
      e.preventDefault();
      const keys = [];
      if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');

      const key = e.key;
      // If it's not a modifier key itself
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
        keys.push(key.length === 1 ? key.toLowerCase() : key);
        updateShortcut(recordingAction, keys);
        setRecordingAction(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingAction, updateShortcut]);

  useEffect(() => {
    async function loadSettings() {
      if (!currentUser) return;
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setSignature(data.signature || '');
        setDisplayName(data.displayName || currentUser.displayName || '');
        setAppLockEnabled(data.appLockEnabled || false);
        setAppLockPin(data.appLockPin || '');
        
        let loadedRules = data.rules || [];
        if (location.state?.newRule && !ruleProcessed) {
          const newRule = { 
            id: Math.random().toString(36).substr(2, 9), 
            ...location.state.newRule, 
            action: 'move', 
            target: 'Work' 
          };
          loadedRules = [newRule, ...loadedRules];
          setRuleProcessed(true);
        }
        
        setRules(loadedRules);
        setLabels(data.labels || ['Work', 'Personal', 'Shopping', 'Finance']);
      }
    }
    loadSettings();
  }, [currentUser, location.state, ruleProcessed]);

  const handleSave = async () => {
    if (!currentUser) return;
    if (appLockEnabled && appLockPin.length !== 4) {
      alert('PIN must be 4 digits.');
      return;
    }
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { 
        signature,
        displayName,
        appLockEnabled,
        appLockPin,
        rules,
        labels
      }, { merge: true });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(null), 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const addRule = () => {
    setRules([...rules, { id: Math.random().toString(36).substr(2, 9), type: 'sender', value: '', action: 'move', target: 'Work' }]);
  };

  const updateRule = (id, field, value) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const deleteRule = (id) => {
    setRules(rules.filter(r => r.id !== id));
  };

  return (
    <div className="flex-1 h-full bg-white dark:bg-[#16171d] p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-3">
          <SettingsIcon className="text-violet-600 dark:text-violet-400" size={32} />
          Settings
        </h1>

        <div className="space-y-8">
          {/* Profile Section */}
          <section className="bg-gray-50 dark:bg-[#1f2028] p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <User size={20} className="text-violet-500" />
              Profile Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Email Address</label>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#111216] px-4 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <Mail size={16} />
                  {currentUser?.email}
                </div>
              </div>
            </div>
          </section>

          {/* Signature Section */}
          <section className="bg-gray-50 dark:bg-[#1f2028] p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <PenTool size={20} className="text-violet-500" />
              Email Signature
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This signature will be automatically added to the end of all your outgoing emails.
            </p>
            <textarea 
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Best regards,&#10;Your Name"
              className="w-full h-32 bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-mono text-sm"
            />
          </section>

          {/* App Lock Section */}
          <section className="bg-gray-50 dark:bg-[#1f2028] p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Lock size={20} className="text-violet-500" />
                App Lock (Privacy PIN)
              </h2>
              <button 
                onClick={() => setAppLockEnabled(!appLockEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                  appLockEnabled ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  appLockEnabled ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Require a 4-digit PIN every time you open Pro Mail to keep your inbox private from others using this device.
            </p>
            
            {appLockEnabled && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Set 4-Digit PIN</label>
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="••••"
                  value={appLockPin}
                  onChange={(e) => setAppLockPin(e.target.value.replace(/\D/g, ''))}
                  className="w-32 bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-center text-2xl tracking-[0.5em] font-bold"
                />
              </div>
            )}
          </section>

          {/* App Lock Section */}
          <section className="bg-gray-50 dark:bg-[#1f2028] p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            {/* ... [existing app lock UI] ... */}
          </section>

          {/* Keyboard Shortcuts Section */}
          <section className="bg-gray-50 dark:bg-[#1f2028] p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Keyboard size={20} className="text-violet-500" />
                Keyboard Shortcuts
              </h2>
              <button 
                onClick={resetToDefaults}
                className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-violet-500 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(shortcuts).map(([actionId, config]) => (
                <div key={actionId} className="flex items-center justify-between p-3 bg-white dark:bg-[#16171d] rounded-xl border border-gray-100 dark:border-gray-800 group">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{config.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {config.keys.map((k, i) => (
                        <kbd key={i} className="px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-300 shadow-sm font-mono">
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <button 
                      onClick={() => setRecordingAction(actionId)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                        recordingAction === actionId 
                          ? "bg-violet-600 text-white animate-pulse" 
                          : "text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                      )}
                    >
                      {recordingAction === actionId ? 'Press Key...' : 'Change'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Inbox Automation Section */}
          <section className="bg-gray-50 dark:bg-[#1f2028] p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Filter size={20} className="text-violet-500" />
                Inbox Automation
              </h2>
              <button 
                onClick={addRule}
                className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors"
              >
                <Plus size={16} />
                Create Rule
              </button>
            </div>
            
            {rules.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-[#16171d] rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <div className="text-gray-400 dark:text-gray-600 text-xs mb-1">No active rules</div>
                <button onClick={addRule} className="text-[10px] font-bold text-violet-500 uppercase tracking-widest hover:underline">Setup your first automation</button>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-[#16171d] p-4 rounded-xl border border-gray-100 dark:border-gray-800 group transition-all hover:shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">If</span>
                      <select 
                        value={rule.type}
                        onChange={(e) => updateRule(rule.id, 'type', e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 text-xs font-medium px-2 py-1.5 rounded-lg outline-none"
                      >
                        <option value="sender">Sender</option>
                        <option value="subject">Subject</option>
                      </select>
                    </div>
                    
                    <input 
                      type="text"
                      placeholder="e.g. amazon.com"
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                      className="flex-1 bg-gray-50 dark:bg-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg border border-transparent focus:border-violet-500/50 outline-none transition-all"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">Move to</span>
                      <select 
                        value={rule.target}
                        onChange={(e) => updateRule(rule.id, 'target', e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 text-xs font-medium px-2 py-1.5 rounded-lg outline-none"
                      >
                        <optgroup label="Folders">
                          <option value="inbox">Inbox</option>
                          <option value="spam">Spam</option>
                          <option value="trash">Trash</option>
                        </optgroup>
                        <optgroup label="Labels">
                          {labels.map(l => <option key={l} value={l}>{l}</option>)}
                        </optgroup>
                      </select>
                    </div>

                    <button 
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-[11px] text-gray-500 dark:text-gray-400 italic">
              Rules are applied instantly as soon as a new message hits your encrypted gateway.
            </p>
          </section>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4 pt-4">
            {showSuccess && (
              <span className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1 animate-in fade-in slide-in-from-right-4">
                <Check size={16} />
                Settings saved successfully
              </span>
            )}
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20 active:scale-95 flex items-center gap-2"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
