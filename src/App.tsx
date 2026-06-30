import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';

// Importing Custom Lightweight Components
import Header from './components/Header';
import AuthView from './components/AuthView';
import FeedView from './components/FeedView';
import UsersView from './components/UsersView';
import MessageView from './components/MessageView';
import NotificationView from './components/NotificationView';
import SavedPostsView from './components/SavedPostsView';
import SettingsView from './components/SettingsView';
import ProfileView from './components/ProfileView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs / Active views state
  const [activeTab, setActiveTab] = useState<string>('feed');
  
  // Dynamic navigation targets
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  // Unread badges counters
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen to Firestore logged-in User profile document in real-time
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to user profile:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 3. Listen to unread notifications and messages counters in real-time
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Unread interaction notifications (likes, loves, hahas, comments, reposts)
    const notifsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      where('isRead', '==', false)
    );

    const unsubscribeNotifs = onSnapshot(notifsQuery, (snapshot) => {
      // Filter out message notifications from total interaction count for separate chat badge
      let interactionsCount = 0;
      let messagesCount = 0;

      snapshot.forEach((doc) => {
        const notif = doc.data();
        if (notif.type === 'message') {
          messagesCount++;
        } else {
          interactionsCount++;
        }
      });

      setUnreadNotifications(interactionsCount);
      setUnreadMessages(messagesCount);
    });

    return () => unsubscribeNotifs();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Reset tab and states
      setActiveTab('feed');
      setSelectedProfileId(null);
      setSelectedChatUserId(null);
      setActivePostId(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Helper callbacks to transition between views
  const handleViewProfile = (userId: string) => {
    setSelectedProfileId(userId);
    setActiveTab('profile');
  };

  const handleStartChat = (userId: string) => {
    setSelectedChatUserId(userId);
    setActiveTab('messages');
  };

  const handleNavigateToPost = (postId: string) => {
    setActivePostId(postId);
    setActiveTab('feed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center font-black text-2xl text-[#1877f2] select-none">
            M
          </div>
          <span className="text-xs font-bold text-gray-500 animate-pulse tracking-wide uppercase">
            Chargement de MaxGram...
          </span>
        </div>
      </div>
    );
  }

  // Not logged-in -> Show Authenticator Screen
  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
        <AuthView />
      </div>
    );
  }

  // Render the selected Tab component
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <FeedView
            currentUserId={currentUser.uid}
            onViewProfile={handleViewProfile}
            onStartChat={handleStartChat}
            activePostId={activePostId}
            onClearActivePost={() => setActivePostId(null)}
          />
        );
      case 'users':
        return (
          <UsersView
            currentUserId={currentUser.uid}
            onViewProfile={handleViewProfile}
            onStartChat={handleStartChat}
          />
        );
      case 'messages':
        return (
          <MessageView
            currentUserId={currentUser.uid}
            initialChatUserId={selectedChatUserId}
            onClearInitialChatUser={() => setSelectedChatUserId(null)}
            onViewProfile={handleViewProfile}
          />
        );
      case 'notifications':
        return (
          <NotificationView
            currentUserId={currentUser.uid}
            onNavigateToPost={handleNavigateToPost}
            onNavigateToChat={handleStartChat}
          />
        );
      case 'saved':
        return (
          <SavedPostsView
            currentUserId={currentUser.uid}
            onViewProfile={handleViewProfile}
            onStartChat={handleStartChat}
          />
        );
      case 'profile':
        // If profile click from header, show current user profile
        const targetUserId = selectedProfileId || currentUser.uid;
        return (
          <ProfileView
            key={targetUserId} // Force recreate on viewing a different user profile
            userId={targetUserId}
            currentUserId={currentUser.uid}
            onStartChat={handleStartChat}
            onEditProfile={() => setActiveTab('settings')}
            onViewProfile={handleViewProfile}
          />
        );
      case 'settings':
        return (
          <SettingsView
            currentUser={currentUser}
            onProfileUpdated={() => {
              // Quick callback to refresh context
              console.log("Settings updated.");
            }}
          />
        );
      default:
        return (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            Page introuvable.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col text-gray-800 antialiased selection:bg-[#1877f2]/25">
      {/* Universal Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          // If profile clicked, reset target profile ID to me
          if (tab === 'profile') {
            setSelectedProfileId(currentUser.uid);
          }
          setActiveTab(tab);
        }}
        currentUser={userProfile}
        unreadNotificationsCount={unreadNotifications}
        unreadMessagesCount={unreadMessages}
        onLogout={handleLogout}
      />

      {/* Main Responsive Grid Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Sidebar Panel - Desktop Only */}
          <section className="hidden md:block col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center flex flex-col items-center">
              {userProfile.photoUrl ? (
                <img
                  src={userProfile.photoUrl}
                  alt={userProfile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-[#1877f2] font-black text-xl border border-gray-300">
                  {userProfile.displayName?.charAt(0).toUpperCase()}
                </div>
              )}

              <h3 className="font-extrabold text-gray-900 mt-2.5 truncate max-w-full">
                {userProfile.displayName}
              </h3>
              <p className="text-xs text-gray-400 truncate max-w-full">@{userProfile.username}</p>

              <button
                onClick={() => handleViewProfile(currentUser.uid)}
                className="mt-3.5 w-full bg-blue-50 text-[#1877f2] hover:bg-blue-100 py-1.5 px-3 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Mon Journal
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-500 space-y-2 select-none">
              <h4 className="font-bold text-gray-700">À propos de MaxGram</h4>
              <p className="leading-relaxed">
                Réseau social 100% réel. Les publications, commentaires, réactions et messages s'affichent en temps réel sur tous les appareils connectés.
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px]">
                <span>Version 1.2 Lite</span>
                <span>© 2026 MaxGram</span>
              </div>
            </div>
          </section>

          {/* Active Router Tab View Area */}
          <section className="col-span-1 md:col-span-3">
            {renderActiveTabContent()}
          </section>
          
        </div>
      </main>
    </div>
  );
}
