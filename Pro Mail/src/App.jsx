import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Inbox from "./pages/Inbox";
import Starred from "./pages/Starred";
import Snoozed from "./pages/Snoozed";
import Sent from "./pages/Sent";
import Drafts from "./pages/Drafts";
import Spam from "./pages/Spam";
import Trash from "./pages/Trash";
import Security from "./pages/Security";
import Aliases from "./pages/Aliases";
import Settings from "./pages/Settings";
import Contacts from "./pages/Contacts";
import Newsletters from "./pages/Newsletters";
import Attachments from "./pages/Attachments";
import Calendar from "./pages/Calendar";
import Keep from "./pages/Keep";
import EmailDetail from "./components/EmailDetail";
import Login from "./pages/Login";
import OnboardingModal from "./components/OnboardingModal";
import { useAuth } from "./context/AuthContext";
import { db, doc, getDoc } from "./firebase";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";

function App() {
  const { currentUser } = useAuth();
  useKeyboardShortcuts();
  const [isLocked, setIsLocked] = useState(false);
  const [correctPin, setCorrectPin] = useState(null);
  const [enteredPin, setEnteredPin] = useState("");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding && currentUser) {
      setShowOnboarding(true);
    }
  }, [currentUser]);

  useEffect(() => {
    async function checkLock() {
      if (!currentUser) {
        setIsLoadingSettings(false);
        return;
      }
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().appLockEnabled) {
          setIsLocked(true);
          setCorrectPin(snap.data().appLockPin);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    checkLock();
  }, [currentUser]);

  const handleCloseOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  if (!currentUser) {
    return <Login />;
  }

  if (isLoadingSettings) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-[#16171d]">
        <Loader2 className="animate-spin text-violet-500" size={40} />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#111216] p-4">
        <div className="w-full max-w-sm bg-white dark:bg-[#1f2028] p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-violet-100 dark:bg-violet-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-violet-600 dark:text-violet-400">
             <Lock size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">App Locked</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-10">Enter your 4-digit PIN to access Pro Mail</p>
          
          <div className="flex justify-center gap-3 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  enteredPin.length > i 
                    ? "bg-violet-600 border-violet-600 scale-110 shadow-[0_0_10px_rgba(124,58,237,0.5)]" 
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "delete"].map((num, i) => (
              <button
                key={i}
                onClick={() => {
                  if (num === "delete") setEnteredPin(prev => prev.slice(0, -1));
                  else if (num !== "" && enteredPin.length < 4) {
                    const newPin = enteredPin + num;
                    setEnteredPin(newPin);
                    if (newPin === correctPin) {
                      setTimeout(() => setIsLocked(false), 200)
                    } else if (newPin.length === 4) {
                      // Wrong PIN feedback
                      setTimeout(() => setEnteredPin(""), 500);
                    }
                  }
                }}
                className={`h-16 rounded-2xl flex items-center justify-center text-xl font-bold transition-all active:scale-90 ${
                  num === "" ? "opacity-0 pointer-events-none" : 
                  num === "delete" ? "text-gray-400 hover:text-red-500" : 
                  "bg-gray-50 dark:bg-[#16171d] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {num === "delete" ? <ShieldCheck size={24} /> : num}
              </button>
            ))}
          </div>
          
          <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
            <ShieldCheck size={14} className="text-green-500" />
            Biometric-ready E2EE Protection
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onClose={handleCloseOnboarding} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Inbox />} />
          <Route path="email/:id" element={<EmailDetail />} />
          <Route path="starred" element={<Starred />} />
          <Route path="snoozed" element={<Snoozed />} />
          <Route path="sent" element={<Sent />} />
          <Route path="drafts" element={<Drafts />} />
          <Route path="spam" element={<Spam />} />
          <Route path="trash" element={<Trash />} />
          <Route path="security" element={<Security />} />
          <Route path="aliases" element={<Aliases />} />
          <Route path="settings" element={<Settings />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="newsletters" element={<Newsletters />} />
          <Route path="attachments" element={<Attachments />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="keep" element={<Keep />} />
          {/* We will add more routes here later */}
          <Route path="*" element={<div className="p-6">Not Implemented Yet</div>} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
