import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Post } from '../types';
import { PenTool, Image as ImageIcon, Video, Send, RefreshCw, Layers, AlertCircle } from 'lucide-react';
import PostCard from './PostCard';

interface FeedViewProps {
  currentUserId: string;
  onViewProfile: (userId: string) => void;
  onStartChat: (userId: string) => void;
  activePostId?: string | null;
  onClearActivePost?: () => void;
}

export default function FeedView({
  currentUserId,
  onViewProfile,
  onStartChat,
  activePostId,
  onClearActivePost
}: FeedViewProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all posts in real-time
  useEffect(() => {
    setLoading(true);
    setError(null);
    // Query the raw collection and sort in memory.
    // This is 100% resilient, does not require composite indexes, and guarantees
    // posts with missing or pending timestamps are not ignored or excluded!
    const q = query(collection(db, 'posts'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: Post[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      
      // Sort in memory safely
      postsData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
        const timeB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
        return timeB - timeA; // Descending order (newest first)
      });

      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      console.error("Error loading posts in real-time:", err);
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Post Submit Handler
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    const postContent = content.trim();
    const attachedImage = imageUrl.trim();
    const attachedVideo = videoUrl.trim();

    // Reset Form Fields early for fast UI response
    setContent('');
    setImageUrl('');
    setVideoUrl('');
    setShowAttachments(false);

    try {
      // 1. Fetch current logged-in user profile metadata to ensure exact accuracy (no simulated account info)
      const userDocSnap = await getDoc(doc(db, 'users', currentUserId));
      const userData = userDocSnap.data();
      const displayName = userData?.displayName || 'Membre MaxGram';
      const photoUrl = userData?.photoUrl || '';

      // 2. Add real post document to firestore
      await addDoc(collection(db, 'posts'), {
        authorId: currentUserId,
        authorName: displayName,
        authorPhotoUrl: photoUrl,
        content: postContent,
        imageUrl: attachedImage || '',
        videoUrl: attachedVideo || '',
        createdAt: serverTimestamp(),
        likesCount: 0,
        lovesCount: 0,
        hahasCount: 0,
        wowsCount: 0,
        sadsCount: 0,
        angrysCount: 0,
        commentsCount: 0,
        repostsCount: 0
      });
    } catch (err: any) {
      console.error("Error creating post:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter posts if there's an active specific post to view (e.g., from comment notifications click)
  const filteredPosts = activePostId 
    ? posts.filter((post) => post.id === activePostId)
    : posts;

  return (
    <div className="space-y-4">
      {/* Informative Error/Troubleshooting Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg space-y-2 text-xs sm:text-sm">
          <div className="flex items-start gap-2 font-bold text-red-900">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>Erreur d'accès à la base de données Firestore</span>
          </div>
          <p className="text-gray-600">
            Les publications n'ont pas pu s'afficher à cause de l'erreur suivante retournée par votre projet Firebase :
          </p>
          <pre className="bg-red-100 p-2.5 rounded font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-32 text-red-900 border border-red-200">
            {error}
          </pre>
          <div className="pt-1 text-gray-700 leading-relaxed font-medium">
            💡 <span className="underline">Comment résoudre cela :</span>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                Assurez-vous d'avoir bien <strong>activé Firestore Database</strong> dans la console Firebase (sur votre projet <strong>maxgram-e0a89</strong>).
              </li>
              <li>
                Vérifiez vos <strong>Règles de sécurité Firestore</strong>. Pour le développement, vous pouvez temporairement autoriser la lecture/écriture ou publier vos règles de sécurité de l'application.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Create Post Card */}
      {!activePostId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 text-xs sm:text-sm">
            <PenTool className="w-4.5 h-4.5 text-[#1877f2]" />
            <span>CRÉER UNE PUBLICATION</span>
          </div>

          <form onSubmit={handlePostSubmit} className="space-y-3">
            <textarea
              placeholder="Exprimez-vous sur MaxGram... Partagez des textes, images ou vidéos !"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={1500}
              required
              className="w-full text-xs sm:text-sm p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877f2] bg-gray-50 resize-none placeholder-gray-400 text-gray-800"
            />

            {showAttachments && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">URL de l'image (optionnel) :</label>
                  <input
                    type="url"
                    placeholder="https://exemple.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">URL de la vidéo (optionnel) :</label>
                  <input
                    type="url"
                    placeholder="https://exemple.com/video.mp4"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 pt-3 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowAttachments(!showAttachments)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer ${
                  showAttachments ? 'text-[#1877f2]' : 'text-gray-500'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-green-500" />
                <Video className="w-4 h-4 text-red-500" />
                <span>Photos/Vidéos</span>
              </button>

              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="flex items-center gap-1.5 bg-[#1877f2] hover:bg-[#1565c0] text-white font-bold text-xs sm:text-sm px-4.5 py-2 rounded-lg transition-colors disabled:bg-gray-400 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Showing alert if viewing a specific post only */}
      {activePostId && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg flex items-center justify-between text-xs">
          <span>Vous consultez une publication spécifique liée à vos notifications.</span>
          <button 
            onClick={onClearActivePost}
            className="font-bold underline text-[#1877f2] hover:text-[#1565c0] ml-2 cursor-pointer"
          >
            Afficher tout le fil d'actualités
          </button>
        </div>
      )}

      {/* Publications Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm bg-white rounded-lg border border-gray-200">
            Chargement du fil d'actualités...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm bg-white rounded-lg border border-gray-200">
            Aucune publication sur le fil. Soyez le premier à poster !
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onViewProfile={onViewProfile}
              onStartChat={onStartChat}
            />
          ))
        )}
      </div>
    </div>
  );
}
