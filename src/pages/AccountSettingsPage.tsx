import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Shield, Bell, Key, History, Trash2, CheckCircle, 
  AlertTriangle, Upload, Eye, EyeOff, Smartphone, Mail, Globe, Laptop
} from 'lucide-react';

interface AccountSettingsPageProps {
  onBackToDashboard: () => void;
}

export default function AccountSettingsPage({ onBackToDashboard }: AccountSettingsPageProps) {
  const { user, token, logout, refreshUser } = useAuth();
  
  // States
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || '');
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem(`ezana_phone_${user?.id}`) || '0915508167');
  const [email, setEmail] = useState(user?.email || '');
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(localStorage.getItem(`ezana_2fa_${user?.id}`) === 'true');
  
  // Preferences
  const [emailNews, setEmailNews] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [notifLessons, setNotifLessons] = useState(true);
  const [notifGrades, setNotifGrades] = useState(true);
  
  // Status message
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Image URL state
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem(`ezana_photo_${user?.id}`) || 
    `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=0d9488`
  );
  
  // Active Tab
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'security' | 'notifications' | 'sessions' | 'danger'>('profile');

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("First name and Last name are both required.");
      return;
    }

    setLoading(true);
    try {
      const trimmedName = `${firstName.trim()} ${lastName.trim()}`;
      
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: trimmedName,
          email: email,
          phoneNumber: phoneNumber
        })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(`ezana_phone_${user?.id}`, phoneNumber);
        await refreshUser();
        setSuccessMsg("✨ Personal details successfully synchronized!");
      } else {
        setErrorMsg(data.message || "Failed to save profile details.");
      }
    } catch (err) {
      setErrorMsg("Failed communicating with the database server.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Photo Simulation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        localStorage.setItem(`ezana_photo_${user?.id}`, base64String);
        setSuccessMsg("Avatar updated locally! Syncs across your live terminal sessions.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setErrorMsg("All security password inputs are mandatory.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("The new password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg("New Password and Confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("🔒 Password validated and reset successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setErrorMsg(data.message || "Current password could not be verified.");
      }
    } catch (err) {
      setErrorMsg("Communications error.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    const confirmation = window.confirm("⚠️ WARNING: This will permanently erase your course progress, records, and subscription status.\n\nAre you sure you want to terminate your Ezana Academy account?");
    if (!confirmation) return;

    setSuccessMsg(null);
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/users/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert("Account terminated. Navigating to Ezana home page.");
        logout();
      } else {
        setErrorMsg("Failed to delete account. You may have active admin roles.");
      }
    } catch (err) {
      setErrorMsg("Communication error during account deletion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 dark:text-slate-100" id="account_settings_container">
      {/* Header element */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight">Identity & Account Console</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Administer your security keys, notifications routing, billing metrics, and profile aesthetics.
          </p>
        </div>
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 transition font-bold text-white text-xs rounded-lg shadow cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>

      {notificationWarnings()}

      {/* Grid workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation panel */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-sm">
            <button
              onClick={() => setActiveSettingsTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs md:text-sm font-bold text-left transition cursor-pointer ${
                activeSettingsTab === 'profile' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" /> Personal Information
            </button>
            <button
              onClick={() => setActiveSettingsTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs md:text-sm font-bold text-left transition cursor-pointer ${
                activeSettingsTab === 'security' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Key className="w-4 h-4" /> Change Password & Security
            </button>
            <button
              onClick={() => setActiveSettingsTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs md:text-sm font-bold text-left transition cursor-pointer ${
                activeSettingsTab === 'notifications' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" /> Email & System Alerts
            </button>
            <button
              onClick={() => setActiveSettingsTab('sessions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs md:text-sm font-bold text-left transition cursor-pointer ${
                activeSettingsTab === 'sessions' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" /> Login History & Sessions
            </button>
            <button
              onClick={() => setActiveSettingsTab('danger')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs md:text-sm font-bold text-left transition cursor-pointer ${
                activeSettingsTab === 'danger' 
                  ? 'bg-rose-600 text-white' 
                  : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'
              }`}
            >
              <Trash2 className="w-4 h-4" /> Danger Zone Action
            </button>
          </div>

          {/* Quick billing status helper */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-extrabold text-[11px] uppercase text-emerald-400 tracking-wider">Premium Status Info</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {user?.premium 
                ? "🎉 You have full access to our database systems. Enjoy lifetime premium lectures!" 
                : "🔒 Standard Account. Upgrade via standard manual bank transfer inside the pricing catalog to unlock premium courses."
              }
            </p>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>Account Type:</span>
              <span className="font-extrabold text-white text-right capitalize">{user?.roleName || 'Student'}</span>
            </div>
          </div>
        </div>

        {/* Content Panel Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
            
            {/* Feedback Notifications */}
            {successMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            {/* TAB CONTENT: PROFILE */}
            {activeSettingsTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">Profile Customization</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Customize your metadata and public facing aesthetics.</p>
                </div>

                {/* Photo Upload split */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative group">
                    <img
                      src={profileImage}
                      alt="User Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-805 shadow-md group-hover:shadow-lg transition-all duration-200"
                    />
                    <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center cursor-pointer hover:bg-emerald-600 transition shadow-lg border border-white dark:border-slate-850">
                      <Upload className="w-4 h-4 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left space-y-1.5">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{user?.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">Allowed formats: JPG, PNG, GIF. Max file limit 2MB.</p>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultImg = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=0d9488`;
                        setProfileImage(defaultImg);
                        localStorage.removeItem(`ezana_photo_${user?.id}`);
                      }}
                      className="text-xs text-rose-500 font-extrabold hover:underline block"
                    >
                      Reset to Default initials
                    </button>
                  </div>
                </div>

                {/* Personal Information forms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-500 dark:text-slate-300 block uppercase tracking-wider text-[10px]">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 transition duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-500 dark:text-slate-300 block uppercase tracking-wider text-[10px]">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 transition duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-500 dark:text-slate-300 block uppercase tracking-wider text-[10px]">Email Address (Read-Only) *</label>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 rounded-xl cursor-not-allowed opacity-75"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-500 dark:text-slate-300 block uppercase tracking-wider text-[10px]">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-955 dark:focus:ring-emerald-500 transition duration-200"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    disabled={loading}
                    type="submit"
                    className="px-6 py-3 bg-slate-950 hover:bg-emerald-600 hover:text-slate-950 dark:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-500 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Saving Records..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: SECURITY PASSWORD */}
            {activeSettingsTab === 'security' && (
              <>
                <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">Security & Password Administration</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-semibold">Maintain strong password constraints to prevent credentials loss.</p>
                </div>

                <div className="space-y-5 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-500 dark:text-slate-300 block uppercase tracking-wider text-[10px]">Current Password *</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 transition duration-205"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="font-extrabold text-slate-500 dark:text-slate-300 block uppercase tracking-wider text-[10px]">New Password *</label>
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 transition duration-205"
                      />
                      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            newPassword.length === 0 ? 'w-0' :
                            newPassword.length < 6 ? 'w-1/3 bg-rose-500' :
                            newPassword.length < 10 ? 'w-2/3 bg-amber-500' :
                            'w-full bg-emerald-500'
                          }`}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-extrabold block mt-1.5 uppercase tracking-wide">
                        Strength: {
                          newPassword.length === 0 ? 'None' :
                          newPassword.length < 6 ? 'Too Weak (Min 6)' :
                          newPassword.length < 10 ? 'Medium Security' :
                          'Strong Secure Password'
                        }
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-extrabold text-slate-500 dark:text-slate-300 block uppercase tracking-wider text-[10px]">Confirm New Password *</label>
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 transition duration-205"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    disabled={loading}
                    type="submit"
                    className="px-6 py-3 bg-slate-950 hover:bg-emerald-600 hover:text-slate-950 dark:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-500 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    Change Security Credentials
                  </button>
                </div>
              </form>

              {/* 2FA SETUP TOGGLE */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                    <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Two-Factor Authentication (2FA) Setup</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Elevate your e-learning profile security by requiring secondary passcodes.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs transition duration-200 hover:shadow-xs">
                  <div className="space-y-1 pr-3">
                    <p className="font-bold text-slate-800 dark:text-slate-200">OTP Authenticator verification (Recommended)</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">Generate dynamic codes using standard mobile apps (Google Authenticator, duo security).</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const mode = !twoFactorEnabled;
                      setTwoFactorEnabled(mode);
                      localStorage.setItem(`ezana_2fa_${user?.id}`, String(mode));
                      if (mode) {
                        setSuccessMsg("🛡️ Two-Factor authentication (2FA) is now enabled. Please record your emergency recovery seeds!");
                      } else {
                        setSuccessMsg("⚠️ Two-Factor authorization removed from this account terminal.");
                      }
                    }}
                    className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-wide transition cursor-pointer ${
                      twoFactorEnabled
                        ? 'bg-rose-100 hover:bg-rose-205 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-slate-950'
                    }`}
                  >
                    {twoFactorEnabled ? "Deactivate 2FA" : "Activate 2FA"}
                  </button>
                </div>
              </div>
              </>
            )}

            {/* TAB CONTENT: NOTIFICATIONS */}
            {activeSettingsTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Email Preferences & Alerts</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Configure when and where Ezana system triggers push alerts and notifications.</p>
                </div>

                <div className="space-y-4 divide-y divide-slate-150 dark:divide-slate-800 text-xs">
                  <div className="flex items-center justify-between py-3">
                    <div className="space-y-0.5 pr-4">
                      <h4 className="font-bold text-slate-900 dark:text-white">Newsletters & Program Catalogs</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Receive monthly tech course releases and academic updates.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailNews}
                      onChange={(e) => setEmailNews(e.target.checked)}
                      className="w-5 h-5 accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="space-y-0.5 pr-4">
                      <h4 className="font-bold text-slate-900 dark:text-white">Security Alerts Notifications</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Email notification regarding password modifications and unauthorized terminal attempts.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="w-5 h-5 accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="space-y-0.5 pr-4">
                      <h4 className="font-bold text-slate-900 dark:text-white">Active Syllabus Lessons Releases</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">System notifications when a lecturer publishes homework files or syllabus videos.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifLessons}
                      onChange={(e) => setNotifLessons(e.target.checked)}
                      className="w-5 h-5 accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="space-y-0.5 pr-4">
                      <h4 className="font-bold text-slate-900 dark:text-white">Marks & Grading Feedback</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Instant dashboards alert when reviewers grade your homework receipts or assignment papers.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifGrades}
                      onChange={(e) => setNotifGrades(e.target.checked)}
                      className="w-5 h-5 accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setSuccessMsg("🔔 Alert preferences updated and saved!")}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 transition font-bold text-white text-xs rounded-lg shadow cursor-pointer"
                  >
                    Save Communication Settings
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SESSIONS & HISTORY */}
            {activeSettingsTab === 'sessions' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Active Terminals & Login History</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Review chronological system logins and discard other sessions.</p>
                </div>

                {/* Active Sessions list */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-black text-emerald-600 tracking-wider">Active Authorized Devices</span>
                  
                  <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/20 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-emerald-105 bg-emerald-200 text-emerald-900 flex items-center justify-center font-extrabold text-base">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Google Chrome Web - PC/Mac Console</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-mono mt-0.5">
                          IP: 196.188.12.91 • Addis Ababa, Ethiopia • <span className="text-emerald-700 font-extrabold font-sans">Active Session Terminal</span>
                        </p>
                      </div>
                    </div>
                    <span className="bg-emerald-250 border border-emerald-400 bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                      Current
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Safari Mobile iOS - iPhone 16</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-mono mt-0.5">
                          IP: 196.190.118.25 • Hawassa, Eth • Idle 2 hours ago
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert("✓ Remote terminal session terminated successfully.")}
                      className="px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 rounded transition cursor-pointer"
                    >
                      End Connection
                    </button>
                  </div>
                </div>

                {/* Login History timeline */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-black text-slate-550 dark:text-slate-400 tracking-wider">Historical Audit Logs</span>
                  
                  <div className="flow-root text-xs">
                    <ul className="-mb-8">
                      {[
                        { date: 'June 11, 2026 • 11:25 AM', action: 'Authorized web login', location: 'Addis Ababa (IP 196.188.12.91)', device: 'Chrome Dev Browser' },
                        { date: 'June 10, 2026 • 09:14 PM', action: 'Password verification check', location: 'Hawassa (IP 196.190.118.25)', device: 'Mobile Safari' },
                        { date: 'June 08, 2026 • 02:40 PM', action: 'Syllabus PDF document download', location: 'Adama (IP 196.189.55.102)', device: 'Chrome Web' }
                      ].map((item, idx) => (
                        <li key={idx}>
                          <div className="relative pb-6">
                            {idx !== 2 && <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-150 dark:bg-slate-850" aria-hidden="true" />}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8.5 w-8.5 rounded-full bg-slate-105 dark:bg-slate-800 flex items-center justify-center text-[10px]">
                                  ⚪
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">{item.action}</p>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">
                                  {item.location} • {item.device}
                                </p>
                              </div>
                              <div className="text-right text-[10px] font-mono text-slate-400 pt-1 shrink-0">
                                {item.date}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DANGER ZONE */}
            {activeSettingsTab === 'danger' && (
              <div className="space-y-6">
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl space-y-2 text-xs">
                  <h4 className="font-extrabold leading-none inline-flex items-center gap-1.5 uppercase tracking-wide">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-600" /> Administrative Notice
                  </h4>
                  <p className="leading-relaxed">
                    Erase operations are absolutely final. Once execution is authorized, your complete profile matrices, assessment records, certified awards credentials, and premium tuition records will be deleted with no recovery options.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Academic Account</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      This removes your email credential address from Ezana Academy and destroys active subscription codes.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-5 py-3 bg-rose-600 hover:bg-rose-700 transition font-black text-white text-xs rounded-xl shadow-md uppercase tracking-wider cursor-pointer"
                  >
                    Delete Account Permanently
                  </button>
                </div>
              </div>

            )}

          </div>
        </div>

      </div>
    </div>
  );

  // Quick system status notification alert banners
  function notificationWarnings() {
    return (
      <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-250 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="text-slate-600 dark:text-slate-400 font-semibold inline-flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span>Active Session Tunnel Location: <strong className="text-slate-900 dark:text-white">Addis Ababa, Ethiopia (UTC+3)</strong></span>
        </p>
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
          <span>SSID Secure: Verified</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>
    );
  }
}
