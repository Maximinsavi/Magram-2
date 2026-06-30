export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  photoUrl: string;
  bio: string;
  createdAt: any;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: any;
  likesCount: number;
  lovesCount: number;
  hahasCount: number;
  wowsCount?: number;
  sadsCount?: number;
  angrysCount?: number;
  commentsCount: number;
  repostsCount: number;
  originalPostId?: string;
  originalAuthorId?: string;
  originalAuthorName?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl: string;
  content: string;
  createdAt: any;
}

export interface Chat {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  lastSenderId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl?: string;
  type: 'like' | 'love' | 'haha' | 'comment' | 'message' | 'repost';
  postId?: string;
  chatSenderId?: string;
  isRead: boolean;
  createdAt: any;
}

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
