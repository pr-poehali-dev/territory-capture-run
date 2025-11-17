import { useEffect, useState } from 'react';

export default function AnimatedLogo() {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full transition-transform duration-500 ${
          isAnimating ? 'scale-110' : 'scale-100'
        }`}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className={`opacity-30 transition-all duration-1000 ${
            isAnimating ? 'stroke-dashoffset-0' : ''
          }`}
          strokeDasharray="283"
          strokeDashoffset={isAnimating ? '0' : '283'}
        />
        
        <path
          d="M 30 50 L 45 35 L 60 50 L 75 35"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-all duration-500 ${
            isAnimating ? 'translate-y-1' : 'translate-y-0'
          }`}
        />
        
        <circle
          cx="50"
          cy="70"
          r="3"
          fill="currentColor"
          className={`transition-all duration-300 ${
            isAnimating ? 'opacity-100 scale-150' : 'opacity-70 scale-100'
          }`}
        />
      </svg>

      <div
        className={`absolute inset-0 rounded-full bg-white/20 transition-all duration-500 ${
          isAnimating ? 'scale-150 opacity-0' : 'scale-100 opacity-0'
        }`}
      />
    </div>
  );
}
