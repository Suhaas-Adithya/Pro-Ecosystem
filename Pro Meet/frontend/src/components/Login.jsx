import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Check, X, Eye, EyeOff, ShieldCheck, Smartphone } from 'lucide-react';
import { updateUserProfile } from '../firebase';

function Login() {
  const { login, loginWithEmail, signupWithEmail, setPasswordForSocialAccount, confirm2FA } = useAuth();
  const navigate = useNavigate();

  // ─── Phase 1: Auth Mode ───────────────────────────────────────────────────
  const [authMode, setAuthMode] = useState('choice'); // 'choice' | 'email-login' | 'email-signup'
  const [onboardingStep, setOnboardingStep] = useState('auth'); // 'auth' | 'name' | 'password-setup' | 'mfa-challenge'

  // ─── Form State ────────────────────────────────────────────────────────────
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [newName, setNewName]   = useState("");
  const [showPass, setShowPass] = useState(false);
  
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [mfaCode, setMfaCode]   = useState("");

  // ─── Password Complexity Logic ─────────────────────────────────────────────
  const requirements = useMemo(() => [
    { label: '8+ Characters',       met: password.length >= 8 },
    { label: 'Uppercase & Lowercase', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'At least one number',  met: /[0-9]/.test(password) },
    { label: 'A special character',  met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const isPasswordValid = requirements.every(r => r.met);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await login();
      
      if (result.needs2FA) {
        setOnboardingStep('mfa-challenge');
        return;
      }

      const isNew = result?.user?.metadata?.creationTime === result?.user?.metadata?.lastSignInTime;
      
      if (isNew) {
        setPendingUser(result.user);
        setNewName(result.user.displayName || "");
        setOnboardingStep('name');
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Failed to authenticate with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginWithEmail(email, password);
      
      if (result.needs2FA) {
        setOnboardingStep('mfa-challenge');
        return;
      }

      navigate("/");
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    if (mfaCode.length !== 6) return;
    
    setLoading(true);
    setError("");
    try {
      await confirm2FA(mfaCode);
      navigate("/");
    } catch (err) {
      setError("Invalid 2FA code. Please check your app.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    if (password !== confirm) { setError("Passwords do not match."); return; }
    
    setError("");
    setLoading(true);
    try {
      const result = await signupWithEmail(email, password);
      setPendingUser(result.user);
      setOnboardingStep('name');
    } catch (err) {
      setError(err.message.includes("email-already-in-use") ? "Email already registered." : "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setLoading(true);
    try {
      await updateUserProfile(pendingUser, { displayName: newName.trim() });
      // If they came from Google, they need to set an account password now
      if (pendingUser.providerData.some(p => p.providerId === 'google.com')) {
        setOnboardingStep('password-setup');
        setPassword(""); // Clear any dummy state
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    
    setLoading(true);
    try {
      await setPasswordForSocialAccount(pendingUser, pendingUser.email, password);
      navigate("/");
    } catch (err) {
      setError("Failed to secure account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Sub-Components ────────────────────────────────────────────────────────
  const PasswordRequirement = ({ met, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: met ? '#00e6a8' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
      {met ? <Check size={12} /> : <X size={12} />}
      <span>{label}</span>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(circle at center, #0f0f1a 0%, #05050a 100%)' }}>
      <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        
        {/* Back Button */}
        {authMode !== 'choice' && onboardingStep === 'auth' && (
          <button onClick={() => setAuthMode('choice')} style={{ position: 'absolute', top: '25px', left: '25px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ArrowLeft size={18} /> Back
          </button>
        )}

        <div style={{ marginBottom: '30px' }}>
          <img src="/logo.png" alt="Logo" className="logo-glow" style={{ width: '80px', height: '80px', marginBottom: '20px' }} />
          
          {onboardingStep === 'auth' && (
            <>
              <h2 className="glow-text" style={{ fontSize: '2rem', marginBottom: '10px' }}>
                {authMode === 'email-signup' ? 'Create Space' : 'Welcome Back'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {authMode === 'email-signup' 
                  ? 'Join the future of end-to-end encrypted conferencing.' 
                  : 'Identification is required to establish secure P2P handshakes.'}
              </p>
            </>
          )}

          {onboardingStep === 'name' && (
            <>
              <h2 className="glow-text" style={{ fontSize: '2rem', marginBottom: '10px' }}>Who are you?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Your name will be visible to other participants.</p>
            </>
          )}

          {onboardingStep === 'password-setup' && (
            <>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(233,59,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: '#e93b6e' }}>
                <ShieldCheck size={28} />
              </div>
              <h2 className="glow-text" style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Secure Your Space</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create a local password so you can access Pro without Google service dependency.</p>
            </>
          )}

          {onboardingStep === 'mfa-challenge' && (
            <>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(0, 230, 168, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: '#00e6a8' }}>
                <Smartphone size={28} />
              </div>
              <h2 className="glow-text" style={{ fontSize: '2rem', marginBottom: '10px' }}>Secure Entry</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Enter the 6-digit synchronization code from your authenticator device.</p>
            </>
          )}
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', borderRadius: '10px', color: '#ff3366', fontSize: '0.85rem', marginBottom: '20px', animation: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' }}>
            {error}
          </div>
        )}

        {/* ── Auth Select ───────────────────────────────────────────────────── */}
        {onboardingStep === 'auth' && authMode === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button onClick={handleGoogleLogin} disabled={loading} className="primary" style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ margin: '0 15px', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>
            <button onClick={() => setAuthMode('email-login')} className="icon-btn" style={{ width: '100%', padding: '16px', borderRadius: '12px', borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'white' }}>
              <Mail size={18} style={{marginRight:'10px'}} /> Email & Password
            </button>
            <p style={{ marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Don't have an account? <span onClick={() => setAuthMode('email-signup')} style={{ color: 'var(--neon-blue)', cursor: 'pointer', fontWeight: 600 }}>Sign up</span>
            </p>
          </div>
        )}

        {/* ── Email Login ───────────────────────────────────────────────────── */}
        {onboardingStep === 'auth' && authMode === 'email-login' && (
          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input type="email" placeholder="Email Address" className="text-input" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: '48px' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input type={showPass ? "text" : "password"} placeholder="Password" className="text-input" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingLeft: '48px', paddingRight: '48px' }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="submit" className="primary" disabled={loading} style={{ padding: '16px', marginTop: '10px' }}>
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        )}

        {/* ── Email Signup ──────────────────────────────────────────────────── */}
        {onboardingStep === 'auth' && authMode === 'email-signup' && (
          <form onSubmit={handleEmailSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input type="email" placeholder="Email Address" className="text-input" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: '48px' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input type="password" placeholder="Password" className="text-input" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingLeft: '48px' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input type="password" placeholder="Confirm Password" className="text-input" value={confirm} onChange={e => setConfirm(e.target.value)} required style={{ paddingLeft: '48px' }} />
            </div>
            
            <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              {requirements.map(req => <PasswordRequirement key={req.label} {...req} />)}
            </div>

            <button type="submit" className="primary" disabled={loading || !isPasswordValid} style={{ padding: '16px', marginTop: '10px' }}>
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
        )}

        {/* ── Onboarding: Name Setup ────────────────────────────────────────── */}
        {onboardingStep === 'name' && (
          <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input type="text" placeholder="Display Name" className="text-input" value={newName} onChange={e => setNewName(e.target.value)} required autoFocus style={{ paddingLeft: '48px' }} />
            </div>
            <button type="submit" className="primary" disabled={loading || !newName.trim()} style={{ padding: '16px', marginTop: '10px' }}>
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        )}

        {/* ── Onboarding: Password Setup (for Google) ───────────────────────── */}
        {onboardingStep === 'password-setup' && (
          <form onSubmit={handleSetupPassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input type={showPass ? "text" : "password"} placeholder="New Account Password" className="text-input" value={password} onChange={e => setPassword(e.target.value)} required autoFocus style={{ paddingLeft: '48px', paddingRight: '48px' }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              {requirements.map(req => <PasswordRequirement key={req.label} {...req} />)}
            </div>

            <button type="submit" className="primary" disabled={loading || !isPasswordValid} style={{ padding: '16px', marginTop: '10px' }}>
              {loading ? "Protecting Account..." : "Finalize & Sign In"}
            </button>
          </form>
        )}

        {/* ── MFA Challenge ─────────────────────────────────────────────────── */}
        {onboardingStep === 'mfa-challenge' && (
          <form onSubmit={handleMfaVerify} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <Smartphone size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input 
                type="text" 
                maxLength={6} 
                className="text-input" 
                placeholder="000000" 
                value={mfaCode} 
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                autoFocus 
                style={{ paddingLeft: '48px', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }} 
              />
            </div>
            <button type="submit" className="primary" disabled={loading || mfaCode.length !== 6} style={{ padding: '16px', marginTop: '10px' }}>
              {loading ? "Verifying..." : "Enter Secure Workspace"}
            </button>
            <button type="button" onClick={() => { setOnboardingStep('auth'); setAuthMode('choice'); setMfaCode(""); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer' }}>
               Cancel
            </button>
          </form>
        )}

      </div>
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
}

export default Login;
