import React, { useState, useEffect } from 'react';
import { 
  User, 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Save, 
  Edit3, 
  X,
  Stethoscope,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(() => {
    const cached = localStorage.getItem('pillbox_doctor_profile');
    return cached ? JSON.parse(cached) : null;
  });
  const [editedProfile, setEditedProfile] = useState(profile);
  const [isLoading, setIsLoading] = useState(!profile);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:3000/doctor');
      const data = await res.json();
      setProfile(data);
      setEditedProfile(data);
      localStorage.setItem('pillbox_doctor_profile', JSON.stringify(data));
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:3000/doctor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedProfile)
      });
      if (res.ok) {
        setProfile(editedProfile);
        localStorage.setItem('pillbox_doctor_profile', JSON.stringify(editedProfile));
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 h-[calc(100vh-140px)] overflow-y-auto no-scrollbar">
      {/* Profile Header */}
      <div className="relative mb-8">
        <div className="h-48 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/5 to-purple-500/20 border border-white/10 overflow-hidden relative shadow-glow-sm">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="absolute top-4 right-4 group">
             <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/80 text-white rounded-xl transition-all shadow-glow-sm hover:shadow-glow-md disabled:opacity-50"
             >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isEditing ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Edit3 className="w-4 h-4" />
                )}
                <span className="font-bold uppercase tracking-wider text-xs">
                  {isEditing ? 'Save Profile' : 'Edit Profile'}
                </span>
             </button>
          </div>
        </div>

        <div className="absolute -bottom-12 left-12 flex items-end gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl glass p-1 border border-white/20 shadow-glow-md overflow-hidden bg-card">
              <img 
                src={profile?.avatar} 
                alt="Doctor" 
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            {isEditing && (
              <button className="absolute bottom-2 right-2 p-2 bg-primary rounded-lg text-white shadow-glow-sm hover:scale-110 transition-all border border-white/20">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="pb-4">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                  className="bg-card/50 border border-primary/30 rounded-lg px-2 py-1 text-2xl focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              ) : profile?.name}
            </h1>
            <div className="flex items-center gap-2 text-primary font-medium mt-1">
              <Stethoscope className="w-4 h-4" />
              <span className="text-sm uppercase tracking-widest font-bold">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editedProfile.specialization}
                    onChange={(e) => setEditedProfile({...editedProfile, specialization: e.target.value})}
                    className="bg-card/30 border border-white/10 rounded px-2 py-0.5 text-xs focus:outline-none"
                  />
                ) : profile?.specialization}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/10 shadow-glow-sm">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-6">Contact Information</h3>
            <div className="space-y-4">
              <InfoItem icon={Mail} label="Email" value={profile?.email} isEditing={isEditing} editedValue={editedProfile?.email} onChange={(v) => setEditedProfile({...editedProfile, email: v})} />
              <InfoItem icon={Phone} label="Phone" value={profile?.phone} isEditing={isEditing} editedValue={editedProfile?.phone} onChange={(v) => setEditedProfile({...editedProfile, phone: v})} />
              <InfoItem icon={Building} label="Hospital" value={profile?.hospital} isEditing={isEditing} editedValue={editedProfile?.hospital} onChange={(v) => setEditedProfile({...editedProfile, hospital: v})} />
              <div className="flex items-center gap-3 text-secondary pt-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Verified Medical ID</span>
              </div>
            </div>
          </div>
        </div>

        {/* Biography & Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-8 rounded-3xl border border-white/10 shadow-glow-sm">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-6">Professional Biography</h3>
            {isEditing ? (
              <textarea 
                value={editedProfile.bio}
                onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                rows={6}
                className="w-full bg-card/30 border border-white/10 rounded-2xl p-4 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none"
              />
            ) : (
              <p className="text-sm text-text-muted leading-relaxed">
                {profile?.bio}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <StatCard label="Patients Monitored" value="128" />
             <StatCard label="Last Login" value="2 hours ago" />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, isEditing, editedValue, onChange }) => (
  <div className="flex items-start gap-4 group">
    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-text-muted group-hover:text-primary transition-colors">
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 overflow-hidden">
      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-0.5">{label}</p>
      {isEditing ? (
        <input 
          type="text" 
          value={editedValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-b border-primary/30 text-sm text-text-primary focus:outline-none"
        />
      ) : (
        <p className="text-sm text-text-primary font-medium truncate">{value}</p>
      )}
    </div>
  </div>
);

const StatCard = ({ label, value }) => (
  <div className="glass p-6 rounded-3xl border border-white/10 hover:border-primary/20 transition-all group">
    <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.15em] mb-2">{label}</p>
    <p className="text-2xl font-bold text-text-primary group-hover:text-primary transition-colors">{value}</p>
  </div>
);

export default Profile;
