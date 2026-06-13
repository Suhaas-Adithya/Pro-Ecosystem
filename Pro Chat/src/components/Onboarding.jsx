import React, { useState, useRef } from 'react';
import './Modals.css';

export default function Onboarding({ profile, onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: profile?.username || '',
    username: profile?.username || '',
    dob: '',
    gender: '',
    pronouns: '',
    bio: '',
    avatar: profile?.avatar || ''
  });

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 4) setStep(step + 1);
    else finishOnboarding();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 128;
        
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        
        const ctx = canvas.getContext('2d');
        // Fill background with dark color in case of transparency
        ctx.fillStyle = '#313338';
        ctx.fillRect(0, 0, MAX_SIZE, MAX_SIZE);
        
        // Center crop/draw
        const offsetX = (MAX_SIZE - width) / 2;
        const offsetY = (MAX_SIZE - height) / 2;
        ctx.drawImage(img, offsetX, offsetY, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, avatar: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const finishOnboarding = async () => {
    try {
      const updatedProfile = {
        ...profile,
        ...formData,
        joinedServers: profile?.joinedServers || [],
        proChatOnboarded: true
      };

      await fetch('http://localhost:3001/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: 'global_device',
          profileData: updatedProfile
        })
      });

      onComplete(updatedProfile);
    } catch (err) {
      console.error('Onboarding sync failed', err);
      alert('Failed to save profile. Please try again.');
    }
  };

  const renderAvatarPreview = () => {
    if (!formData.avatar) return <div className="avatar-placeholder">📸</div>;
    if (formData.avatar.startsWith('data:image')) {
      return <img src={formData.avatar} alt="Avatar" className="avatar-preview-img" />;
    }
    return <div className="avatar-placeholder">{formData.avatar}</div>;
  };

  return (
    <div className="modal-overlay" style={{ background: 'var(--bg-primary)' }}>
      <div className="modal-content premium-onboarding">
        <div className="modal-header">
          <h2>Welcome to Pro Chat</h2>
          <p>Let's personalize your community presence.</p>
        </div>
        
        <form onSubmit={handleNext}>
          <div className="modal-body" style={{ minHeight: '300px' }}>
            
            {step === 1 && (
              <div className="onboarding-step animation-slide-up">
                <h3>Identity</h3>
                <div className="form-group">
                  <label>DISPLAY NAME</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name} 
                    onChange={handleChange}
                    placeholder="How you appear to others"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>USERNAME</label>
                  <input 
                    type="text" 
                    name="username"
                    value={formData.username} 
                    onChange={handleChange}
                    placeholder="e.g. awesome_user_123"
                    required
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="onboarding-step animation-slide-up">
                <h3>Demographics</h3>
                <div className="form-group">
                  <label>DATE OF BIRTH</label>
                  <input 
                    type="date" 
                    name="dob"
                    value={formData.dob} 
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>GENDER</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>PRONOUNS</label>
                  <input 
                    type="text" 
                    name="pronouns"
                    value={formData.pronouns} 
                    onChange={handleChange}
                    placeholder="e.g. they/them, she/her, he/him"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="onboarding-step animation-slide-up">
                <h3>Profile Picture</h3>
                <div className="avatar-upload-container" onClick={() => fileInputRef.current?.click()}>
                  {renderAvatarPreview()}
                  <div className="avatar-upload-hint">Click to Upload</div>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleImageUpload} 
                />
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#b5bac1', marginTop: '16px' }}>
                  Or set an emoji avatar:
                </p>
                <div className="form-group" style={{ width: '100px', margin: '0 auto' }}>
                  <input 
                    type="text" 
                    name="avatar"
                    value={formData.avatar} 
                    onChange={handleChange}
                    placeholder="😎"
                    maxLength={2}
                    style={{ textAlign: 'center', fontSize: '24px', padding: '8px' }}
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="onboarding-step animation-slide-up">
                <h3>About Me</h3>
                <div className="form-group">
                  <label>BIO</label>
                  <textarea 
                    name="bio"
                    value={formData.bio} 
                    onChange={handleChange}
                    placeholder="Tell the community a bit about yourself..."
                    rows="5"
                    style={{
                      width: '100%',
                      background: '#1e1f22',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#dbdee1',
                      padding: '12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      resize: 'none'
                    }}
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="step-dots">
              {[1,2,3,4].map(i => (
                <div key={i} className={`step-dot ${step === i ? 'active' : ''} ${step > i ? 'completed' : ''}`}></div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            {step > 1 ? (
              <button type="button" className="btn-cancel" onClick={() => setStep(step - 1)}>Back</button>
            ) : (
              <div></div>
            )}
            <button type="submit" className="btn-primary">
              {step === 4 ? 'Get Started' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
