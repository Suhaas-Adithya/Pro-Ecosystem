import { useState } from 'react';
import { Shield, Zap, Lock, Mail, ChevronRight, X, Sparkles, LayoutGrid, Newspaper } from 'lucide-react';
import { cn } from '../lib/utils';

const STEPS = [
  {
    title: "Welcome to Pro Mail",
    desc: "The world's most private and productive communication platform. Built for those who value security without compromising on speed.",
    icon: Mail,
    color: "bg-violet-500",
    image: "shield" 
  },
  {
    title: "Privacy as a Standard",
    desc: "Every message and attachment is End-to-End Encrypted. Plus, with Self-Destruct timers and Image Blocking, you control exactly what others can see and track.",
    icon: Shield,
    color: "bg-blue-500",
    image: "encryption"
  },
  {
    title: "Smart Inbox Intelligence",
    desc: "Stop the noise. Pro Mail automatically categorizes your Social, Promotional, and Security mail, while custom Rules move repetitive emails to your labels instantly.",
    icon: Newspaper,
    color: "bg-orange-500",
    image: "inbox"
  },
  {
    title: "Uncompromising Security",
    desc: "Protect your local access with a 4-digit Privacy PIN. Your inbox stays locked away from prying eyes, even on shared devices.",
    icon: Lock,
    color: "bg-red-500",
    image: "lock"
  },
  {
    title: "Pro Suite Ecosystem",
    desc: "Seamlessly switch between Mail, Meet, Drive, and Chat using the 9-dot App Launcher. A unified platform for your entire digital life.",
    icon: LayoutGrid,
    color: "bg-green-500",
    image: "apps"
  }
];

export default function OnboardingModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1f2028] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        
        {/* Left Side: Visual */}
        <div className={cn("md:w-5/12 p-10 flex flex-col items-center justify-center text-white transition-colors duration-500", step.color)}>
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md animate-bounce-slow">
            <step.icon size={48} strokeWidth={1.5} />
          </div>
          <div className="flex gap-1.5 mt-auto">
            {STEPS.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentStep === i ? "w-8 bg-white" : "w-1.5 bg-white/40"
                )} 
              />
            ))}
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="md:w-7/12 p-10 md:p-14 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-500/10 rounded-full text-violet-600 dark:text-violet-400 text-[10px] font-bold uppercase tracking-widest">
              <Sparkles size={12} />
              Platform Guide
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={20} />
            </button>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
            {step.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-10">
            {step.desc}
          </p>

          <div className="mt-auto flex items-center justify-between">
            <button 
              onClick={onClose}
              className="text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              Skip
            </button>
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3.5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gray-900/10 dark:shadow-white/5"
            >
              {currentStep === STEPS.length - 1 ? "Get Started" : "Continue"}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
