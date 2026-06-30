import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { Save, User, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

interface SettingsViewProps {
  currentUser: any;
  onProfileUpdated: () => void;
}

export default function SettingsView({ currentUser, onProfileUpdated }: SettingsViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sample quick avatars to pick easily (super lightweight, no uploading needed)
  const avatarPresets = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&h=150',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150',
  ];

  useEffect(() => {
    if (currentUser?.uid) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            setDisplayName(data.displayName || '');
            setUsername(data.username || '');
            setBio(data.bio || '');
            setPhotoUrl(data.photoUrl || '');
          }
        } catch (err) {
          console.error("Error fetching settings profile:", err);
        }
      };
      fetchProfile();
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim()) {
      setError('Le nom complet et le nom d\'utilisateur sont obligatoires.');
      return;
    }

    setSubmitting(true);
    setSuccess(false);
    setError('');

    try {
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, ''),
        bio: bio.trim(),
        photoUrl: photoUrl.trim()
      });

      setSuccess(true);
      onProfileUpdated();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error updating settings:", err);
      setError(err?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Paramètres de mon compte</h2>
      <p className="text-sm text-gray-600 mb-6">
        Gérez votre identité et personnalisez votre profil MaxGram visible de tous les membres.
      </p>

      {success && (
        <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>Profil mis à jour avec succès !</span>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Image Presets */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <ImageIcon className="w-4 h-4 text-[#1877f2]" /> Choisir une photo de profil
          </label>
          <div className="flex flex-wrap gap-2.5 mb-3">
            {avatarPresets.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPhotoUrl(preset)}
                className={`relative rounded-full overflow-hidden border-2 transition-all ${
                  photoUrl === preset ? 'border-[#1877f2] scale-105 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <img
                  src={preset}
                  alt={`Avatar preset ${index + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-cover"
                />
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Ou collez l'URL d'une image personnalisée..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full text-xs sm:text-sm p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] bg-gray-50"
            />
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <User className="w-4 h-4 text-[#1877f2]" /> Nom complet
          </label>
          <input
            type="text"
            placeholder="Ex: Maxime Dupont"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full text-xs sm:text-sm p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] bg-gray-50"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <span>@</span> Nom d'utilisateur (sans espaces)
          </label>
          <input
            type="text"
            placeholder="Ex: max_dupont"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full text-xs sm:text-sm p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] bg-gray-50"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <FileText className="w-4 h-4 text-[#1877f2]" /> Biographie (Bio)
          </label>
          <textarea
            placeholder="Racontez quelque chose sur vous..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            className="w-full text-xs sm:text-sm p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] bg-gray-50 resize-none"
          />
          <p className="text-right text-[10px] text-gray-400">
            {160 - bio.length} caractères restants
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-[#1877f2] text-white p-2.5 rounded-lg hover:bg-[#1565c0] font-semibold text-xs sm:text-sm transition-colors disabled:bg-gray-400 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
}
