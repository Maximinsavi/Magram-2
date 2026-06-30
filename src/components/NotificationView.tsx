import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Notification } from '../types';
import { Bell, Check, Trash2, CheckSquare, MessageSquare, Heart, MessageCircle, Share2, Award } from 'lucide-react';
import ReactionSVG from './ReactionSVG';

interface NotificationViewProps {
  currentUserId: string;
  onNavigateToPost: (postId: string) => void;
  onNavigateToChat: (senderId: string) => void;
}

export default function NotificationView({
  currentUserId,
  onNavigateToPost,
  onNavigateToChat
}: NotificationViewProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's notifications in real-time
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUserId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      console.error("Error loading notifications: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      const docRef = doc(db, 'notifications', notifId);
      await updateDoc(docRef, { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', currentUserId),
        where('isRead', '==', false)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', notifId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read first
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }

    // Navigate appropriately
    if (notif.type === 'message' && notif.chatSenderId) {
      onNavigateToChat(notif.chatSenderId);
    } else if (notif.postId) {
      onNavigateToPost(notif.postId);
    }
  };

  const renderNotifIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <ReactionSVG type="like" className="w-5 h-5" />;
      case 'love':
        return <ReactionSVG type="love" className="w-5 h-5" />;
      case 'haha':
        return <ReactionSVG type="haha" className="w-5 h-5" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'repost':
        return <Share2 className="w-5 h-5 text-indigo-500" />;
      default:
        return <Bell className="w-5 h-5 text-[#1877f2]" />;
    }
  };

  const getNotifText = (notif: Notification) => {
    switch (notif.type) {
      case 'like':
        return 'a aimé votre publication.';
      case 'love':
        return 'adore votre publication.';
      case 'haha':
        return 'a rigolé à votre publication.';
      case 'comment':
        return 'a commenté votre publication.';
      case 'message':
        return 'vous a envoyé un message privé.';
      case 'repost':
        return 'a partagé/republié votre publication.';
      default:
        return 'a interagi avec vous.';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between border-b border-gray-150 pb-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#1877f2]" /> Notifications
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Restez informé des likes, commentaires, messages et activités réels.
          </p>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-[#1877f2] hover:text-[#1565c0] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Tout marquer comme lu</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500 text-sm">Chargement des notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Aucune notification</p>
            <p className="text-xs text-gray-500 mt-1">Vous êtes complètement à jour !</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const date = notif.createdAt 
              ? new Date(notif.createdAt.seconds ? notif.createdAt.seconds * 1000 : notif.createdAt).toLocaleDateString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short'
                })
              : '';

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`flex items-start justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  notif.isRead 
                    ? 'bg-white border-gray-150 hover:bg-gray-50' 
                    : 'bg-blue-50/70 border-blue-100 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Icon */}
                  <div className="mt-1 flex-shrink-0">
                    {renderNotifIcon(notif.type)}
                  </div>

                  {/* Profile Pic of Action Initiator */}
                  <div className="flex-shrink-0">
                    {notif.senderPhotoUrl ? (
                      <img
                        src={notif.senderPhotoUrl}
                        alt={notif.senderName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-[#1877f2] font-semibold border border-gray-200">
                        {notif.senderName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Body Text */}
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-900 leading-snug">
                      <span className="font-bold">{notif.senderName}</span> {getNotifText(notif)}
                    </p>
                    <span className="text-[10px] text-gray-500 block mt-1">{date}</span>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-1.5 ml-2">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
                      className="p-1 text-[#1877f2] hover:bg-white rounded-full transition-colors border border-transparent hover:border-blue-200"
                      title="Marquer comme lu"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(notif.id, e)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-white rounded-full transition-colors border border-transparent hover:border-red-100"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
