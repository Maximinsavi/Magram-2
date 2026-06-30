import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AlertCircle, CheckCircle, Smartphone, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export default function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (submitting) return;
    setSubmitting(true);

    const emailInput = email.trim();
    const passInput = password.trim();

    try {
      if (isForgot) {
        // Reset password email
        await sendPasswordResetEmail(auth, emailInput);
        setSuccess('E-mail de réinitialisation du mot de passe envoyé avec succès ! Vérifiez vos spams si nécessaire.');
        setIsForgot(false);
        setIsLogin(true);
      } else if (isLogin) {
        // Login flow
        await signInWithEmailAndPassword(auth, emailInput, passInput);
      } else {
        // Signup flow
        const uName = username.trim().toLowerCase().replace(/\s+/g, '');
        const dispName = displayName.trim();

        if (!dispName || !uName) {
          setError('Tous les champs sont requis pour l\'inscription.');
          setSubmitting(false);
          return;
        }

        if (passInput !== confirmPassword.trim()) {
          setError('Les mots de passe ne correspondent pas.');
          setSubmitting(false);
          return;
        }

        if (passInput.length < 6) {
          setError('Le mot de passe doit comporter au moins 6 caractères.');
          setSubmitting(false);
          return;
        }

        // 1. Create auth account
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passInput);
        const user = userCredential.user;

        // 2. Create the real-time user document in Firestore users collection
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          username: uName,
          displayName: dispName,
          email: emailInput,
          photoUrl: '',
          bio: 'Membre passionné de MaxGram.',
          createdAt: serverTimestamp()
        });

        setSuccess('Compte créé avec succès ! Bienvenue sur MaxGram.');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let errMsg = 'Une erreur est survenue. Veuillez réessayer.';
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        errMsg = 'E-mail ou mot de passe incorrect.';
      } else if (err?.code === 'auth/email-already-in-use') {
        errMsg = 'Cette adresse e-mail est déjà utilisée par un autre compte.';
      } else if (err?.code === 'auth/invalid-email') {
        errMsg = 'Adresse e-mail invalide.';
      } else if (err?.code === 'auth/weak-password') {
        errMsg = 'Le mot de passe choisi est trop faible.';
      } else {
        errMsg = err?.message || errMsg;
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Brand Header */}
      <div className="bg-[#1877f2] text-white p-6 text-center">
        <h1 className="text-3xl font-black tracking-tight flex items-center justify-center gap-2 select-none">
          <span className="bg-white text-[#1877f2] px-2 py-0.5 rounded-lg text-2xl font-black">M</span>
          <span>MaxGram</span>
        </h1>
        <p className="text-xs text-blue-100 mt-2 font-medium">
          Inspiré de Facebook • Ultra-léger, rapide, conçu pour tous les téléphones
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* Tab Toggle */}
        {!isForgot && (
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm font-semibold">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                isLogin ? 'bg-blue-50 text-[#1877f2]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                !isLogin ? 'bg-blue-50 text-[#1877f2]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Créer un compte
            </button>
          </div>
        )}

        {/* Error/Success Feedbacks */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold border border-green-100">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs sm:text-sm">
          {isForgot ? (
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1.5">Réinitialiser le mot de passe</h3>
              <p className="text-xs text-gray-600 mb-3">
                Saisissez votre e-mail pour recevoir un lien réel de réinitialisation de mot de passe.
              </p>
            </div>
          ) : null}

          {/* Registration fields */}
          {!isLogin && !isForgot && (
            <>
              <div>
                <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                  <User className="w-4 h-4 text-gray-400" /> Nom complet
                </label>
                <input
                  type="text"
                  placeholder="Ex: Jean Martin"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877f2] bg-gray-50 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                  <span>@</span> Nom d'utilisateur unique
                </label>
                <input
                  type="text"
                  placeholder="Ex: jeanmartin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877f2] bg-gray-50 placeholder-gray-400"
                />
              </div>
            </>
          )}

          {/* Email field */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
              <Mail className="w-4 h-4 text-gray-400" /> Adresse E-mail
            </label>
            <input
              type="email"
              placeholder="Ex: jean.martin@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877f2] bg-gray-50 placeholder-gray-400"
            />
          </div>

          {/* Password fields */}
          {!isForgot && (
            <>
              <div>
                <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                  <Lock className="w-4 h-4 text-gray-400" /> Mot de passe
                </label>
                <input
                  type="password"
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877f2] bg-gray-50 placeholder-gray-400"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-gray-400" /> Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="Saisissez à nouveau votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877f2] bg-gray-50 placeholder-gray-400"
                  />
                </div>
              )}
            </>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1877f2] hover:bg-[#1565c0] text-white p-3 rounded-lg font-bold transition-colors cursor-pointer disabled:bg-gray-400 flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? 'Traitement en cours...' : (
              isForgot ? 'Envoyer l\'e-mail de réinitialisation' : (isLogin ? 'Se connecter' : 'Créer mon compte')
            )}
          </button>
        </form>

        {/* Forgot password or Back-to-login switches */}
        <div className="text-center pt-2">
          {isForgot ? (
            <button
              onClick={() => {
                setIsForgot(false);
                setIsLogin(true);
                setError('');
                setSuccess('');
              }}
              className="text-[#1877f2] hover:underline font-bold text-xs"
            >
              Retour à l'écran de connexion
            </button>
          ) : (
            isLogin && (
              <button
                onClick={() => {
                  setIsForgot(true);
                  setError('');
                  setSuccess('');
                }}
                className="text-[#1877f2] hover:underline font-bold text-xs"
              >
                Mot de passe oublié ?
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
