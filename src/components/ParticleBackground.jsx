import { useEffect, useRef } from 'react';

const ParticleBackground = () => {
  return (
    <>
      {/* Purple gradient overlay */}
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{
          zIndex: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(192, 132, 252, 0.1) 0%, transparent 50%)
          `,
        }}
      />
    </>
  );
};

export default ParticleBackground;
