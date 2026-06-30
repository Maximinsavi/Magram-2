import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, increment, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Comment } from '../types';
import { MessageCircle, Send } from 'lucide-react';

interface CommentsProps {
  postId: string;
  postAuthorId: string;
  currentUser: any;
  onViewProfile: (userId: string) => void;
}

export default function Comments({ postId, postAuthorId, currentUser, onViewProfile }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData: Comment[] = [];
      snapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(commentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching comments: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const commentText = newComment.trim();
    setNewComment('');

    try {
      // 1. Fetch current logged-in user details for exact profile metadata
      const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userSnap.data();
      const displayName = userData?.displayName || currentUser.displayName || 'Membre MaxGram';
      const photoUrl = userData?.photoUrl || '';

      // 2. Add comment to subcollection
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        postId,
        authorId: currentUser.uid,
        authorName: displayName,
        authorPhotoUrl: photoUrl,
        content: commentText,
        createdAt: serverTimestamp()
      });

      // 3. Update commentsCount in post document
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });

      // 4. Send notification to the post's author if it's not the user themselves
      if (postAuthorId !== currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: postAuthorId,
          senderId: currentUser.uid,
          senderName: displayName,
          senderPhotoUrl: photoUrl,
          type: 'comment',
          postId,
          isRead: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 p-3 sm:p-4 rounded-b-lg border-t border-gray-150 space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold mb-1">
        <MessageCircle className="w-4 h-4" />
        <span>COMMENTAIRES ({comments.length})</span>
      </div>

      {loading ? (
        <div className="text-[11px] text-gray-400 py-2">Chargement des commentaires...</div>
      ) : comments.length === 0 ? (
        <div className="text-[11px] text-gray-400 italic py-1">Aucun commentaire. Soyez le premier à commenter !</div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const date = comment.createdAt 
              ? new Date(comment.createdAt.seconds ? comment.createdAt.seconds * 1000 : comment.createdAt).toLocaleDateString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short'
                })
              : '';

            return (
              <div key={comment.id} className="flex gap-2.5 items-start">
                <div 
                  onClick={() => onViewProfile(comment.authorId)}
                  className="cursor-pointer flex-shrink-0"
                >
                  {comment.authorPhotoUrl ? (
                    <img
                      src={comment.authorPhotoUrl}
                      alt={comment.authorName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-[#1877f2] font-semibold text-[10px] border border-gray-300">
                      {comment.authorName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-white p-2 rounded-lg border border-gray-150 text-xs shadow-sm">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span 
                      onClick={() => onViewProfile(comment.authorId)}
                      className="font-bold text-gray-900 hover:underline cursor-pointer"
                    >
                      {comment.authorName}
                    </span>
                    <span className="text-[9px] text-gray-400">{date}</span>
                  </div>
                  <p className="text-gray-800 break-words whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Write Comment Form */}
      <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center pt-2">
        <input
          type="text"
          placeholder="Écrivez un commentaire réel..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={400}
          className="flex-1 text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877f2] bg-white"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="p-2.5 bg-[#1877f2] hover:bg-[#1565c0] text-white rounded-lg transition-colors disabled:bg-gray-300 cursor-pointer flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
