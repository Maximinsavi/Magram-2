import React from 'react';

interface ReactionSVGProps {
  type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
  className?: string;
}

export default function ReactionSVG({ type, className = "w-6 h-6" }: ReactionSVGProps) {
  // Common IDs for linear gradients to avoid collisions
  const gradId = `reaction-grad-${type}`;

  switch (type) {
    case 'like':
      return (
        <svg
          viewBox="0 0 36 36"
          className={`${className} select-none transition-transform duration-150`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1877f2" />
              <stop offset="100%" stopColor="#0a54b6" />
            </linearGradient>
            <filter id="like-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.15" />
            </filter>
          </defs>
          <circle cx="18" cy="18" r="17" fill={`url(#${gradId})`} />
          <path
            d="M24.5 17.5h-3.8c.4-1 .6-2.2.6-3.2 0-2.1-1.2-3.8-3.3-3.8-.8 0-1.4.6-1.5 1.3l-.2 2c-.1 1-.7 1.9-1.5 2.5v7.2c1.2.6 2.6 1 4 1h4c1.2 0 2.2-.8 2.5-2l1.1-3.8c.4-1.2-.5-2.2-1.9-2.2z"
            fill="#ffffff"
            filter="url(#like-shadow)"
          />
          <path
            d="M10.5 17.5c-.8 0-1.5.7-1.5 1.5v4.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-4.5c0-.8-.7-1.5-1.5-1.5z"
            fill="#ffffff"
            opacity="0.95"
          />
        </svg>
      );

    case 'love':
      return (
        <svg
          viewBox="0 0 36 36"
          className={`${className} select-none transition-transform duration-150`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4b72" />
              <stop offset="100%" stopColor="#e01b44" />
            </linearGradient>
          </defs>
          <circle cx="18" cy="18" r="17" fill={`url(#${gradId})`} />
          <path
            d="M18 26.5l-1.3-1.2C12 21.1 9 18.4 9 15c0-2.8 2.2-5 5-5 1.6 0 3.1.7 4 2 1-.3 2.5-2 4-2 2.8 0 5 2.2 5 5 0 3.4-3 6.1-7.7 10.3L18 26.5z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'haha':
      return (
        <svg
          viewBox="0 0 36 36"
          className={`${className} select-none transition-transform duration-150`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fecd30" />
              <stop offset="100%" stopColor="#f39c12" />
            </linearGradient>
          </defs>
          <circle cx="18" cy="18" r="17" fill={`url(#${gradId})`} />
          {/* Left Eye: Squinting > */}
          <path
            d="M9.5 14l4 2.5-4 2.5"
            stroke="#652c00"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Right Eye: Squinting < */}
          <path
            d="M26.5 14l-4 2.5 4 2.5"
            stroke="#652c00"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Big Laughing Mouth with Tongue */}
          <path
            d="M10 21c1.5 5 5.5 7 8 7s6.5-2 8-7H10z"
            fill="#652c00"
          />
          {/* Upper teeth block inside mouth */}
          <path
            d="M10.8 21.5c1.5 2 4.5 2.5 7.2 2.5s5.7-.5 7.2-2.5h-14.4z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'wow':
      return (
        <svg
          viewBox="0 0 36 36"
          className={`${className} select-none transition-transform duration-150`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fecd30" />
              <stop offset="100%" stopColor="#e67e22" />
            </linearGradient>
          </defs>
          <circle cx="18" cy="18" r="17" fill={`url(#${gradId})`} />
          {/* Left Eyebrow */}
          <path
            d="M10 11.5c1-1.5 3-1.5 4 0"
            stroke="#652c00"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Right Eyebrow */}
          <path
            d="M22 11.5c1-1.5 3-1.5 4 0"
            stroke="#652c00"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Oval surprised eyes */}
          <ellipse cx="12.5" cy="16.5" rx="2.5" ry="3.5" fill="#652c00" />
          <ellipse cx="23.5" cy="16.5" rx="2.5" ry="3.5" fill="#652c00" />
          {/* Big vertical surprised oval mouth */}
          <ellipse cx="18" cy="24.5" rx="4.5" ry="6" fill="#652c00" />
        </svg>
      );

    case 'sad':
      return (
        <svg
          viewBox="0 0 36 36"
          className={`${className} select-none transition-transform duration-150`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffdd67" />
              <stop offset="100%" stopColor="#e5a93b" />
            </linearGradient>
            <linearGradient id="tear-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#54a0ff" />
              <stop offset="100%" stopColor="#00d2fc" />
            </linearGradient>
          </defs>
          <circle cx="18" cy="18" r="17" fill={`url(#${gradId})`} />
          {/* Downcast Left Eye */}
          <path
            d="M10 16c1.5-1.5 3.5-1.5 5 0"
            stroke="#652c00"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* Downcast Right Eye */}
          <path
            d="M21 16c1.5-1.5 3.5-1.5 5 0"
            stroke="#652c00"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* Downturned Sad Mouth */}
          <path
            d="M13 24.5c2.5-2.5 7.5-2.5 10 0"
            stroke="#652c00"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* Glistening Teardrop from left eye */}
          <path
            d="M11.5 17c0 2 1.5 3.5 1.5 5.5s-1.5 3-3 3-3-1-3-3 1.5-3.5 1.5-5.5"
            fill="url(#tear-grad)"
          />
        </svg>
      );

    case 'angry':
      return (
        <svg
          viewBox="0 0 36 36"
          className={`${className} select-none transition-transform duration-150`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5515f" />
              <stop offset="100%" stopColor="#9f031b" />
            </linearGradient>
          </defs>
          <circle cx="18" cy="18" r="17" fill={`url(#${gradId})`} />
          {/* Angled Left Eyebrow */}
          <path
            d="M9 13l5.5 2.5"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Angled Right Eyebrow */}
          <path
            d="M27 13l-5.5 2.5"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Angry Squinting Eyes */}
          <ellipse cx="12" cy="18.5" rx="2" ry="2" fill="#ffffff" />
          <ellipse cx="24" cy="18.5" rx="2" ry="2" fill="#ffffff" />
          {/* Furrowed Scowling Downturned Mouth */}
          <path
            d="M13.5 26c2.5-3.5 6.5-3.5 9 0"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    default:
      return null;
  }
}
