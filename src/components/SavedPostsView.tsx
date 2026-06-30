import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Post } from '../types';
import { Bookmark, Loader } from 'lucide-react';
import PostCard from './PostCard';

interface SavedPostsViewProps {
  currentUserId: string;
  onViewProfile: (userId: string) => void;
  onStartChat: (userId: string) => void;
}

export default function SavedPostsView({ currentUserId, onViewProfile, onStartChat }: SavedPostsViewProps) {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const savedCollectionRef = collection(db, 'users', currentUserId, 'savedPosts');
    
    const unsubscribe = onSnapshot(savedCollectionRef, async (snapshot) => {
      const fetchPromises: Promise<Post | null>[] = [];

      snapshot.forEach((savedDoc) => {
        const postId = savedDoc.id;
        // Fetch the corresponding full post document
        const fetchPromise = getDoc(doc(db, 'posts', postId))
          .then((postSnap) => {
            if (postSnap.exists()) {
              return { id: postSnap.id, ...postSnap.data() } as Post;
            }
            return null;
          })
          .catch((error) => {
            console.error(`Error fetching saved post ${postId}:`, error);
            return null;
          });
        
        fetchPromises.push(fetchPromise);
      });

      const results = await Promise.all(fetchPromises);
      const filteredResults = results.filter((post): post is Post => post !== null);
      
      // Sort saved posts by id or let them render
      setSavedPosts(filteredResults);
      setLoading(false);
    }, (error) => {
      console.error("Error loading saved posts list:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-[#1877f2] fill-[#1877f2]" /> Publications enregistrées
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Retrouvez les publications réelles que vous avez sauvegardées pour pouvoir les lire plus tard.
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500 text-sm bg-white rounded-lg border border-gray-200">
          Chargement des publications enregistrées...
        </div>
      ) : savedPosts.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Aucune publication enregistrée</p>
            <p className="text-xs text-gray-400 mt-1">
              Cliquez sur "Enregistrer" sur n'importe quel post dans votre fil d'actualités pour le garder ici !
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {savedPosts.map((post) => (
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
  );
}
