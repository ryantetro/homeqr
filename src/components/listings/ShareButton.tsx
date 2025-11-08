'use client';

interface ShareButtonProps {
  title: string;
}

export default function ShareButton({ title }: ShareButtonProps) {
  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      }).catch(() => {
        // Fallback: copy to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
        }
      });
    } else if (navigator.clipboard) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/15"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.27 3.27 0 000-1.39l7-4.11a2.99 2.99 0 10-.91-1.45l-7.05 4.14a3 3 0 100 4.22l7.02 4.1a3 3 0 102.03-1.13z"/>
      </svg>
      Share
    </button>
  );
}

