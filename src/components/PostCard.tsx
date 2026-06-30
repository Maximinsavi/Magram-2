import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, setDoc, deleteDoc, updateDoc, addDoc, increment, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Post, ReactionType } from '../types';
import { ThumbsUp, Heart, MessageCircle, Share2, Bookmark, Check, Smile, VolumeX, Eye } from 'lucide-react';
import Comments from './Comments';
import ReactionSVG from './ReactionSVG';

interface PostCardProps {
  key?: string;
  post: Post;
  currentUserId: string;
  onViewProfile: (userId: string) => void;
  onStartChat: (userId: string) => void;
}

export default function PostCard({ post, currentUserId, onViewProfile, onStartChat }: PostCardProps) {
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [repostText, setRepostText] = useState('');
  const [showRepostModal, setShowRepostModal] = useState(false);

  // Reaction picker state
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Fetch my active reaction for this post
  useEffect(() => {
    const reactionRef = doc(db, 'posts', post.id, 'reactions', currentUserId);
    const unsubscribe = onSnapshot(reactionRef, (docSnap) => {
      if (docSnap.exists()) {
        setMyReaction(docSnap.data().type);
      } else {
        setMyReaction(null);
      }
    });

    return () => unsubscribe();
  }, [post.id, currentUserId]);

  // Fetch whether this post is saved by me
  useEffect(() => {
    const savedRef = doc(db, 'users', currentUserId, 'savedPosts', post.id);
    const unsubscribe = onSnapshot(savedRef, (docSnap) => {
      setIsSaved(docSnap.exists());
    });

    return () => unsubscribe();
  }, [post.id, currentUserId]);

  const handleReaction = async (reactionType: ReactionType) => {
    setShowReactionPicker(false);
    const reactionRef = doc(db, 'posts', post.id, 'reactions', currentUserId);

    try {
      const userSnap = await getDoc(doc(db, 'users', currentUserId));
      const userData = userSnap.data();
      const userName = userData?.displayName || 'Membre MaxGram';
      const userPhoto = userData?.photoUrl || '';

      const postRef = doc(db, 'posts', post.id);

      if (myReaction === reactionType) {
        // User clicked the same reaction -> Undo it
        await deleteDoc(reactionRef);
        // Decrement respective count
        const updateField = `${reactionType}sCount`;
        await updateDoc(postRef, {
          [updateField]: increment(-1)
        });
      } else {
        // User clicked a new reaction or changed reaction
        const batchUpdates: any = {};
        
        if (myReaction) {
          // Decrement old reaction count
          batchUpdates[`${myReaction}sCount`] = increment(-1);
        }
        
        // Increment new reaction count
        batchUpdates[`${reactionType}sCount`] = increment(1);
        await updateDoc(postRef, batchUpdates);

        // Store reaction document
        await setDoc(reactionRef, {
          id: currentUserId,
          type: reactionType,
          createdAt: serverTimestamp()
        });

        // Trigger notification if it's not the user's own post
        if (post.authorId !== currentUserId) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: post.authorId,
            senderId: currentUserId,
            senderName: userName,
            senderPhotoUrl: userPhoto,
            type: reactionType === 'like' ? 'like' : (reactionType === 'love' ? 'love' : 'haha'),
            postId: post.id,
            isRead: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Error setting reaction:", error);
    }
  };

  const handleSaveToggle = async () => {
    const savedRef = doc(db, 'users', currentUserId, 'savedPosts', post.id);
    try {
      if (isSaved) {
        await deleteDoc(savedRef);
      } else {
        await setDoc(savedRef, {
          id: post.id,
          savedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving/unsaving post:", error);
    }
  };

  const handleRepost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReposting) return;

    setIsReposting(true);
    try {
      const userSnap = await getDoc(doc(db, 'users', currentUserId));
      const userData = userSnap.data();
      const displayName = userData?.displayName || 'Membre MaxGram';
      const photoUrl = userData?.photoUrl || '';

      // Create a repost document
      await addDoc(collection(db, 'posts'), {
        authorId: currentUserId,
        authorName: displayName,
        authorPhotoUrl: photoUrl,
        content: repostText.trim() || 'A partagé une publication.',
        originalPostId: post.id,
        originalAuthorId: post.authorId,
        originalAuthorName: post.authorName,
        createdAt: serverTimestamp(),
        likesCount: 0,
        lovesCount: 0,
        hahasCount: 0,
        wowsCount: 0,
        sadsCount: 0,
        angrysCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        // Include properties of original post for robust rendering
        imageUrl: post.imageUrl || '',
        videoUrl: post.videoUrl || ''
      });

      // Update original post repost count
      await updateDoc(doc(db, 'posts', post.id), {
        repostsCount: increment(1)
      });

      // Send notification to author of original post
      if (post.authorId !== currentUserId) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: post.authorId,
          senderId: currentUserId,
          senderName: displayName,
          senderPhotoUrl: photoUrl,
          type: 'repost',
          postId: post.id,
          isRead: false,
          createdAt: serverTimestamp()
        });
      }

      setRepostText('');
      setShowRepostModal(false);
    } catch (error) {
      console.error("Error reposting:", error);
    } finally {
      setIsReposting(false);
    }
  };

  // Human friendly relative dates
  const formatPostDate = (timestamp: any) => {
    if (!timestamp) return 'Récemment';
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return date.toLocaleDateString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  const getActiveReactionIcon = () => {
    if (!myReaction) return <ThumbsUp className="w-4 h-4" />;
    return <ReactionSVG type={myReaction as any} className="w-4 h-4" />;
  };

  const totalReactions = 
    (post.likesCount || 0) + 
    (post.lovesCount || 0) + 
    (post.hahasCount || 0) + 
    (post.wowsCount || 0) + 
    (post.sadsCount || 0) + 
    (post.angrysCount || 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Post Header */}
      <div className="p-3 sm:p-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onViewProfile(post.authorId)}
            className="cursor-pointer"
          >
            {post.authorPhotoUrl ? (
              <img
                src={post.authorPhotoUrl}
                alt={post.authorName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-[#1877f2] font-semibold border border-gray-200">
                {post.authorName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <h4 
              onClick={() => onViewProfile(post.authorId)}
              className="font-bold text-gray-900 text-sm sm:text-base hover:underline cursor-pointer"
            >
              {post.authorName}
            </h4>
            <span className="text-[10px] text-gray-500 block">
              {formatPostDate(post.createdAt)}
            </span>
          </div>
        </div>

        {/* Quick message shortcut */}
        {post.authorId !== currentUserId && (
          <button
            onClick={() => onStartChat(post.authorId)}
            className="text-gray-400 hover:text-[#1877f2] p-1.5 rounded-full transition-colors hover:bg-gray-50"
            title="Message Privé"
          >
            <Smile className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="px-3 sm:px-4 pb-3">
        <p className="text-xs sm:text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed mb-3">
          {post.content}
        </p>

        {/* Post Image Attachment */}
        {post.imageUrl && (
          <div className="relative rounded-lg overflow-hidden border border-gray-150 mb-3 max-h-96 bg-gray-50 flex items-center justify-center">
            <img
              src={post.imageUrl}
              alt="Attachment"
              referrerPolicy="no-referrer"
              className="object-contain max-h-96 w-full"
            />
          </div>
        )}

        {/* Post Video Attachment */}
        {post.videoUrl && (
          <div className="relative rounded-lg overflow-hidden border border-gray-150 mb-3 bg-black aspect-video flex items-center justify-center">
            <video
              src={post.videoUrl}
              controls
              className="w-full h-full"
              poster="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80"
            />
          </div>
        )}

        {/* Embedded Original Post (If Reposted) */}
        {post.originalPostId && (
          <div className="border border-l-4 border-l-[#1877f2] border-gray-200 bg-gray-50 p-3 rounded-r-lg mt-1 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-gray-500 font-medium">Partagé depuis le profil de</span>
              <span 
                onClick={() => onViewProfile(post.originalAuthorId || '')}
                className="text-xs font-bold text-gray-900 hover:underline cursor-pointer"
              >
                {post.originalAuthorName || 'Membre MaxGram'}
              </span>
            </div>
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
              La publication d'origine est consultable sur leur profil.
            </p>
          </div>
        )}
      </div>

      {/* Post Stats Summary */}
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 select-none">
        <div className="flex items-center gap-1">
          {totalReactions > 0 && (
            <div className="flex items-center -space-x-1.5 mr-1.5">
              {(post.likesCount || 0) > 0 && <ReactionSVG type="like" className="w-4.5 h-4.5" />}
              {(post.lovesCount || 0) > 0 && <ReactionSVG type="love" className="w-4.5 h-4.5" />}
              {(post.hahasCount || 0) > 0 && <ReactionSVG type="haha" className="w-4.5 h-4.5" />}
              {(post.wowsCount || 0) > 0 && <ReactionSVG type="wow" className="w-4.5 h-4.5" />}
              {(post.sadsCount || 0) > 0 && <ReactionSVG type="sad" className="w-4.5 h-4.5" />}
              {(post.angrysCount || 0) > 0 && <ReactionSVG type="angry" className="w-4.5 h-4.5" />}
            </div>
          )}
          <span className="hover:underline cursor-pointer">
            {totalReactions === 0 ? "Aucune réaction" : `${totalReactions} réaction${totalReactions > 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="flex gap-3">
          <span onClick={() => setShowComments(!showComments)} className="hover:underline cursor-pointer">
            {post.commentsCount || 0} commentaire{post.commentsCount !== 1 ? 's' : ''}
          </span>
          <span>
            {post.repostsCount || 0} partage{post.repostsCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Post Action Buttons */}
      <div className="px-2 py-1 flex items-center justify-around border-t border-gray-150 text-xs text-gray-600 relative select-none">
        {/* Reaction Button with Long Press / Hover Menu */}
        <div 
          className="relative flex-1"
          onMouseLeave={() => setShowReactionPicker(false)}
        >
          <button
            onClick={() => handleReaction('like')}
            onMouseEnter={() => setShowReactionPicker(true)}
            className={`w-full py-2 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-1.5 font-semibold cursor-pointer transition-colors ${
              myReaction ? 'text-[#1877f2]' : 'text-gray-600'
            }`}
          >
            {getActiveReactionIcon()}
            <span>Reagir</span>
          </button>

          {/* Expanded Reaction Bar */}
          {showReactionPicker && (
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white border border-gray-200 p-1.5 rounded-full shadow-lg flex gap-3.5 z-30 animate-fade-in animate-duration-150">
              <button 
                onClick={() => handleReaction('like')} 
                className="hover:scale-130 transition-transform cursor-pointer"
                title="J'aime"
              >
                <ReactionSVG type="like" className="w-7 h-7" />
              </button>
              <button 
                onClick={() => handleReaction('love')} 
                className="hover:scale-130 transition-transform cursor-pointer"
                title="J'adore"
              >
                <ReactionSVG type="love" className="w-7 h-7" />
              </button>
              <button 
                onClick={() => handleReaction('haha')} 
                className="hover:scale-130 transition-transform cursor-pointer"
                title="Haha"
              >
                <ReactionSVG type="haha" className="w-7 h-7" />
              </button>
              <button 
                onClick={() => handleReaction('wow')} 
                className="hover:scale-130 transition-transform cursor-pointer"
                title="Wow"
              >
                <ReactionSVG type="wow" className="w-7 h-7" />
              </button>
              <button 
                onClick={() => handleReaction('sad')} 
                className="hover:scale-130 transition-transform cursor-pointer"
                title="Triste"
              >
                <ReactionSVG type="sad" className="w-7 h-7" />
              </button>
              <button 
                onClick={() => handleReaction('angry')} 
                className="hover:scale-130 transition-transform cursor-pointer"
                title="En colère"
              >
                <ReactionSVG type="angry" className="w-7 h-7" />
              </button>
            </div>
          )}
        </div>

        {/* Comment Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 py-2 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-1.5 font-semibold cursor-pointer transition-colors ${
            showComments ? 'text-[#1877f2]' : 'text-gray-600'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Commenter</span>
        </button>

        {/* Repost Button */}
        <button
          onClick={() => setShowRepostModal(true)}
          className="flex-1 py-2 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-1.5 font-semibold text-gray-600 cursor-pointer transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Partager</span>
        </button>

        {/* Save/Bookmark Button */}
        <button
          onClick={handleSaveToggle}
          className={`flex-1 py-2 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-1.5 font-semibold cursor-pointer transition-colors ${
            isSaved ? 'text-[#1877f2]' : 'text-gray-600'
          }`}
          title={isSaved ? "Retirer des publications enregistrées" : "Enregistrer pour plus tard"}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#1877f2]' : ''}`} />
          <span>Enregistrer</span>
        </button>
      </div>

      {/* Share/Repost Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 border border-gray-200 shadow-xl">
            <h3 className="font-bold text-gray-900 text-base mb-2">Partager sur votre journal</h3>
            <p className="text-xs text-gray-500 mb-4">
              Ajoutez un mot ou partagez directement cette publication de {post.authorName} sur votre journal d'actualités.
            </p>

            <form onSubmit={handleRepost} className="space-y-4">
              <textarea
                placeholder="Dites quelque chose à propos de cette publication..."
                value={repostText}
                onChange={(e) => setRepostText(e.target.value)}
                rows={3}
                className="w-full text-xs sm:text-sm p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] bg-gray-50 resize-none"
              />

              <div className="flex items-center justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowRepostModal(false)}
                  className="px-3.5 py-2 hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-700 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isReposting}
                  className="px-4 py-2 bg-[#1877f2] hover:bg-[#1565c0] text-white rounded-lg transition-colors disabled:bg-gray-400 cursor-pointer"
                >
                  {isReposting ? 'Partage en cours...' : 'Partager maintenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Drawer / Section */}
      {showComments && (
        <Comments
          postId={post.id}
          postAuthorId={post.authorId}
          currentUser={{ uid: currentUserId }}
          onViewProfile={onViewProfile}
        />
      )}
    </div>
  );
}
