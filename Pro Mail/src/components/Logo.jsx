import React from 'react';

const Logo = ({ className = "h-5" }) => {
  return (
    <svg 
      viewBox="0 0 110 40" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* P - Capital P */}
      <path d="M10 5V35" />
      <path d="M10 5H22C32 5 34 10 34 15C34 20 32 25 22 25H10" />
      
      {/* r - Compact lowercase shape - Moved left for even spacing */}
      <path d="M46 15V35" />
      <path d="M46 15C46 5 58 5 64 8" />
      
      {/* O - Geometric circle - Repositioned for even spacing */}
      <circle cx="88" cy="20" r="14" />
    </svg>
  );
};

export default Logo;
