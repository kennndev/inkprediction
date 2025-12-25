import { useEffect, useRef } from 'react';

const ParticleBackground = () => {
  return (
    <div
      className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20"
      style={{
        zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}
    />
  );
};

export default ParticleBackground;
