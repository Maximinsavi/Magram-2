import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Post } from '../types';
import { Calendar, MessageSquare, Edit2, Bookmark } from 'lucide-react';
import PostCard from './PostCard';

interface ProfileViewProps {
  key?: string;
  userId: string;
  currentUserId: string;
  onStartChat: (userId: string) => void;
  onEditProfile: () => void;
  onViewProfile: (userId: string) => void;
}

export default function ProfileView({
  userId,
  currentUserId,
  onStartChat,
  onEditProfile,
  onViewProfile
}: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  const isMe = userId === currentUserId;

  // Fetch the target user profile
  useEffect(() => {
    setLoading(true);
    const fetchUserProfile = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          console.error("User profile not found in database.");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [userId]);

  // Fetch target user's posts in real-time
  useEffect(() => {
    setPostsLoading(true);
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: Post[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
      setPostsLoading(false);
    }, (error) => {
      console.error("Error fetching user posts:", error);
      setPostsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500 text-sm bg-white rounded-lg border border-gray-200">
        Chargement du profil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-8 text-center text-red-500 text-sm bg-white rounded-lg border border-gray-200">
        Profil introuvable.
      </div>
    );
  }

  const formattedDate = profile.createdAt 
    ? new Date(profile.createdAt.seconds ? profile.createdAt.seconds * 1000 : profile.createdAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  return (
    <div className="space-y-4">
      {/* Profile Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Blue Cover Accent */}
        <div className="h-24 bg-gradient-to-r from-[#1877f2] to-[#1565c0]"></div>

        <div className="px-4 pb-4 relative">
          {/* Avatar and Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 -mt-10 mb-4">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.displayName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border-4 border-white bg-white shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-[#1877f2] font-extrabold text-3xl border-4 border-white shadow-sm">
                {profile.displayName?.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 truncate flex items-center gap-2">
                {profile.displayName}
              </h2>
              <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
            </div>

            {/* Actions button */}
            <div className="w-full sm:w-auto mt-2 sm:mt-0 flex flex-wrap gap-2">
              {isMe ? (
                <button
                  onClick={onEditProfile}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border border-gray-300 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier le profil
                </button>
              ) : (
                <button
                  onClick={() => onStartChat(profile.id)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#1877f2] hover:bg-[#1565c0] text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message Privé
                </button>
              )}
            </div>
          </div>

          {/* Bio & Details */}
          <div className="space-y-2 border-t border-gray-100 pt-3">
            {profile.bio ? (
              <p className="text-sm text-gray-800 leading-relaxed italic bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                "{profile.bio}"
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">Aucune biographie rédigée.</p>
            )}

            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
              <Calendar className="w-4 h-4" />
              <span>Membre inscrit le : {formattedDate || 'Récemment'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Publications / Journal Tab */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3 px-1">
          Publications de {isMe ? 'mon journal' : profile.displayName} ({posts.length})
        </h3>

        {postsLoading ? (
          <div className="py-6 text-center text-gray-500 text-sm bg-white rounded-lg border border-gray-200">
            Chargement du journal...
          </div>
        ) : posts.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm bg-white rounded-lg border border-gray-200">
            Aucune publication pour le moment.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onViewProfile={onViewProfile}
                onStartChat={onStartChat}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
