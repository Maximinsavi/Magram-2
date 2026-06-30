import React from 'react';
import { Home, MessageSquare, Bell, User, Settings, Bookmark, Users, LogOut } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: any;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  onLogout: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  currentUser,
  unreadNotificationsCount,
  unreadMessagesCount,
  onLogout
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#1877f2] text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('feed')} 
          className="flex items-center gap-2 cursor-pointer font-bold text-2xl tracking-tight select-none"
        >
          <span className="bg-white text-[#1877f2] px-2.5 py-0.5 rounded-lg font-black text-xl">M</span>
          <span className="hidden sm:inline font-semibold">MaxGram</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex items-center gap-1 sm:gap-2 h-full">
          {/* Feed */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center justify-center p-2 rounded-lg relative transition-colors ${
              activeTab === 'feed' ? 'bg-[#1565c0]' : 'hover:bg-[#1976d2]'
            }`}
            title="Accueil"
          >
            <Home className="w-5.5 h-5.5" />
          </button>

          {/* Directory */}
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center p-2 rounded-lg relative transition-colors ${
              activeTab === 'users' ? 'bg-[#1565c0]' : 'hover:bg-[#1976d2]'
            }`}
            title="Utilisateurs"
          >
            <Users className="w-5.5 h-5.5" />
          </button>

          {/* Private Messages */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center justify-center p-2 rounded-lg relative transition-colors ${
              activeTab === 'messages' ? 'bg-[#1565c0]' : 'hover:bg-[#1976d2]'
            }`}
            title="Messages"
          >
            <MessageSquare className="w-5.5 h-5.5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-[#1877f2]">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center justify-center p-2 rounded-lg relative transition-colors ${
              activeTab === 'notifications' ? 'bg-[#1565c0]' : 'hover:bg-[#1976d2]'
            }`}
            title="Notifications"
          >
            <Bell className="w-5.5 h-5.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-[#1877f2]">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Bookmarks */}
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center justify-center p-2 rounded-lg relative transition-colors ${
              activeTab === 'saved' ? 'bg-[#1565c0]' : 'hover:bg-[#1976d2]'
            }`}
            title="Enregistrés"
          >
            <Bookmark className="w-5.5 h-5.5" />
          </button>

          {/* Profile */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center justify-center p-2 rounded-lg relative transition-colors ${
              activeTab === 'profile' ? 'bg-[#1565c0]' : 'hover:bg-[#1976d2]'
            }`}
            title="Profil"
          >
            <User className="w-5.5 h-5.5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center justify-center p-2 rounded-lg relative transition-colors ${
              activeTab === 'settings' ? 'bg-[#1565c0]' : 'hover:bg-[#1976d2]'
            }`}
            title="Paramètres"
          >
            <Settings className="w-5.5 h-5.5" />
          </button>

          {/* Simple Logout for ease of use */}
          <button
            onClick={onLogout}
            className="flex items-center justify-center p-2 rounded-lg hover:bg-red-600 transition-colors ml-1"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </nav>
      </div>
    </header>
  );
}
