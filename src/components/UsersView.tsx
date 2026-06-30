import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { Search, MessageSquare, User, Calendar } from 'lucide-react';

interface UsersViewProps {
  onStartChat: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  currentUserId: string;
}

export default function UsersView({ onStartChat, onViewProfile, currentUserId }: UsersViewProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('displayName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error loading users: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Annuaire de MaxGram</h2>
        <p className="text-sm text-gray-600 mb-4">
          Découvrez de vrais membres de MaxGram. Lancez une discussion instantanée ou consultez leur journal de publications.
        </p>
        
        {/* Search Bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom, nom d'utilisateur ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1877f2] focus:border-transparent bg-gray-50"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500 text-sm">Chargement de l'annuaire...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">Aucun utilisateur trouvé.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredUsers.map((user) => {
            const isMe = user.id === currentUserId;
            return (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-3 border border-gray-150 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => onViewProfile(user.id)}
                    className="cursor-pointer"
                  >
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.displayName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-[#1877f2] font-bold border border-gray-200">
                        {user.displayName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 
                      onClick={() => onViewProfile(user.id)}
                      className="font-semibold text-gray-900 truncate hover:underline cursor-pointer text-sm sm:text-base"
                    >
                      {user.displayName} {isMe && <span className="text-xs text-gray-400 font-normal">(Moi)</span>}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                    {user.bio && (
                      <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{user.bio}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewProfile(user.id)}
                    className="p-1.5 text-gray-600 hover:text-[#1877f2] hover:bg-gray-100 rounded-full transition-colors"
                    title="Voir Profil"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  {!isMe && (
                    <button
                      onClick={() => onStartChat(user.id)}
                      className="p-1.5 text-[#1877f2] hover:text-[#1565c0] hover:bg-blue-50 rounded-full transition-colors"
                      title="Envoyer un message"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
