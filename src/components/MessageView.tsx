import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy, addDoc, doc, setDoc, updateDoc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Chat, Message, UserProfile } from '../types';
import { Send, MessageSquare, ArrowLeft, Loader, Smile } from 'lucide-react';

interface MessageViewProps {
  currentUserId: string;
  initialChatUserId?: string | null;
  onClearInitialChatUser?: () => void;
  onViewProfile: (userId: string) => void;
}

export default function MessageView({
  currentUserId,
  initialChatUserId,
  onClearInitialChatUser,
  onViewProfile
}: MessageViewProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatUsers, setChatUsers] = useState<{ [userId: string]: UserProfile }>({});
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Helper to generate consistent chat ID sorted lexicographically
  const getChatId = (uid1: string, uid2: string) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  // 1. Listen to user's chat threads in real-time
  useEffect(() => {
    setLoadingChats(true);
    const q = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', currentUserId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData: Chat[] = [];
      const userFetchPromises: Promise<any>[] = [];

      snapshot.forEach((snapshotDoc) => {
        const chat = { id: snapshotDoc.id, ...snapshotDoc.data() } as Chat;
        chatsData.push(chat);

        // Find the other participant in this chat
        const otherUserId = chat.participantIds.find((id) => id !== currentUserId);
        if (otherUserId && !chatUsers[otherUserId]) {
          // Fetch their profile
          const fetchPromise = getDoc(doc(db, 'users', otherUserId)).then((userSnap) => {
            if (userSnap.exists()) {
              setChatUsers((prev) => ({
                ...prev,
                [otherUserId]: { id: userSnap.id, ...(userSnap.data() || {}) } as UserProfile
              }));
            }
          });
          userFetchPromises.push(fetchPromise);
        }
      });

      await Promise.all(userFetchPromises);

      // Sort chats by lastMessageAt client side since firebase array-contains queries cannot be easily sorted with secondary fields without indexes
      chatsData.sort((a, b) => {
        const timeA = a.lastMessageAt?.seconds ? a.lastMessageAt.seconds * 1000 : (a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0);
        const timeB = b.lastMessageAt?.seconds ? b.lastMessageAt.seconds * 1000 : (b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0);
        return timeB - timeA;
      });

      setChats(chatsData);
      setLoadingChats(false);
    }, (error) => {
      console.error("Error loading chat threads:", error);
      setLoadingChats(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // 2. Handle initial Chat User from external click (e.g. Users directory or post author)
  useEffect(() => {
    if (initialChatUserId) {
      const targetChatId = getChatId(currentUserId, initialChatUserId);
      
      // Check if thread already exists in current loaded threads
      const existingChat = chats.find(c => c.id === targetChatId);
      if (existingChat) {
        setActiveChatId(targetChatId);
      } else {
        // Fetch target user profile to display thread heading before sending first message
        getDoc(doc(db, 'users', initialChatUserId)).then((userSnap) => {
          if (userSnap.exists()) {
            const targetProfile = { id: userSnap.id, ...userSnap.data() } as UserProfile;
            setChatUsers((prev) => ({
              ...prev,
              [initialChatUserId]: targetProfile
            }));
            
            // Set active chat ID to start thread visually
            setActiveChatId(targetChatId);
          }
        });
      }

      // Clear the trigger prop in parent
      if (onClearInitialChatUser) {
        onClearInitialChatUser();
      }
    }
  }, [initialChatUserId, chats]);

  // 3. Listen to messages for the active conversation in real-time
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setLoadingMessages(false);
      
      // Scroll to bottom on load/new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      console.error("Error loading messages:", error);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [activeChatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Deduce target participant ID from chat ID
    const parts = activeChatId.split('_');
    const targetUserId = parts.find((id) => id !== currentUserId);
    if (!targetUserId) return;

    try {
      // 1. Fetch my profile info for notification sending
      const mySnap = await getDoc(doc(db, 'users', currentUserId));
      const myData = mySnap.data();
      const myName = myData?.displayName || 'Membre MaxGram';
      const myPhotoUrl = myData?.photoUrl || '';

      // 2. Ensure chat thread document exists
      const chatRef = doc(db, 'chats', activeChatId);
      await setDoc(chatRef, {
        id: activeChatId,
        participantIds: [currentUserId, targetUserId],
        lastMessage: messageText,
        lastMessageAt: serverTimestamp(),
        lastSenderId: currentUserId
      }, { merge: true });

      // 3. Add message to the messages sub-collection
      await addDoc(collection(db, 'chats', activeChatId, 'messages'), {
        senderId: currentUserId,
        receiverId: targetUserId,
        content: messageText,
        createdAt: serverTimestamp()
      });

      // 4. Trigger message notification to target user
      await addDoc(collection(db, 'notifications'), {
        recipientId: targetUserId,
        senderId: currentUserId,
        senderName: myName,
        senderPhotoUrl: myPhotoUrl,
        type: 'message',
        chatSenderId: currentUserId,
        isRead: false,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Get active chat partner details
  const getActiveChatPartner = (): UserProfile | null => {
    if (!activeChatId) return null;
    const parts = activeChatId.split('_');
    const targetId = parts.find((id) => id !== currentUserId);
    return targetId ? chatUsers[targetId] || null : null;
  };

  const partner = getActiveChatPartner();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row h-[550px]">
      {/* Chats Threads List Column */}
      <div className={`w-full md:w-80 border-r border-gray-150 flex flex-col ${
        activeChatId ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-gray-150 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Messagerie Privée</h2>
          <p className="text-xs text-gray-500 mt-0.5">Discussions en temps réel.</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loadingChats ? (
            <div className="p-4 text-center text-gray-500 text-xs">Chargement des fils de discussion...</div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs italic">
              Aucune conversation pour le moment. Allez sur l'onglet "Utilisateurs" pour commencer à discuter !
            </div>
          ) : (
            chats.map((chat) => {
              const otherId = chat.participantIds.find(id => id !== currentUserId) || '';
              const otherUser = chatUsers[otherId];
              const isActive = chat.id === activeChatId;

              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    isActive ? 'bg-blue-50/70 border-l-4 border-l-[#1877f2]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {otherUser?.photoUrl ? (
                      <img
                        src={otherUser.photoUrl}
                        alt={otherUser.displayName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-[#1877f2] font-semibold border border-gray-300">
                        {otherUser?.displayName?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        {otherUser?.displayName || 'Membre MaxGram'}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {chat.lastSenderId === currentUserId ? 'Moi : ' : ''}
                      {chat.lastMessage || 'Lancer la discussion'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Chat Column */}
      <div className={`flex-1 flex flex-col bg-gray-50 ${
        !activeChatId ? 'hidden md:flex items-center justify-center' : 'flex'
      }`}>
        {activeChatId && partner ? (
          <>
            {/* Thread Header */}
            <div className="p-3 bg-white border-b border-gray-200 flex items-center gap-3">
              <button
                onClick={() => setActiveChatId(null)}
                className="md:hidden p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors mr-1"
                title="Retour aux discussions"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div 
                onClick={() => onViewProfile(partner.id)}
                className="cursor-pointer"
              >
                {partner.photoUrl ? (
                  <img
                    src={partner.photoUrl}
                    alt={partner.displayName}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border border-gray-150"
                  />
                ) : (
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-[#1877f2] font-semibold text-xs border border-gray-300">
                    {partner.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 
                  onClick={() => onViewProfile(partner.id)}
                  className="font-bold text-gray-900 text-sm sm:text-base hover:underline cursor-pointer truncate"
                >
                  {partner.displayName}
                </h3>
                <p className="text-[10px] text-gray-500 truncate">@{partner.username}</p>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {loadingMessages ? (
                <div className="py-4 text-center text-gray-400 text-xs">Chargement des messages...</div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs italic">
                  Envoyez un message réel pour démarrer la discussion !
                </div>
              ) : (
                messages.map((msg) => {
                  const isSenderMe = msg.senderId === currentUserId;
                  const date = msg.createdAt 
                    ? new Date(msg.createdAt.seconds ? msg.createdAt.seconds * 1000 : msg.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '';

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSenderMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] rounded-lg p-3 text-xs sm:text-sm shadow-sm ${
                        isSenderMe 
                          ? 'bg-[#1877f2] text-white rounded-br-none' 
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                      }`}>
                        <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <span className={`text-[9px] block text-right mt-1 ${
                          isSenderMe ? 'text-blue-100' : 'text-gray-400'
                        }`}>{date}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Écrivez votre message privé..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={1000}
                className="flex-1 text-xs sm:text-sm p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877f2]"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 bg-[#1877f2] hover:bg-[#1565c0] text-white rounded-lg transition-colors disabled:bg-gray-300 cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center justify-center h-full space-y-3.5">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-[#1877f2]">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Aucune discussion active</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Sélectionnez une discussion dans le menu latéral ou commencez-en une depuis l'annuaire des membres !
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
