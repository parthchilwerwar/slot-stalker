'use client';

import { useEffect, useState } from 'react';

export default function ShaderGradientBg() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Dynamic import at runtime only — avoids SSR and TS module resolution issues
    import('@shadergradient/react').then((mod) => {
      const { ShaderGradientCanvas, ShaderGradient } = mod;

      function Inner() {
        return (
          <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.35 }}>
            <ShaderGradientCanvas
              style={{ width: '100%', height: '100%' }}
              fov={45}
              pointerEvents="none"
            >
              <ShaderGradient
                type="waterPlane"
                animate="on"
                uTime={0}
                uSpeed={0.08}
                uStrength={1.5}
                uDensity={1.8}
                uFrequency={3.5}
                uAmplitude={3}
                positionX={0}
                positionY={0}
                positionZ={0}
                rotationX={0}
                rotationY={0}
                rotationZ={0}
                color1="#FF6A00"
                color2="#1a1a1a"
                color3="#000000"
                reflection={0.1}
                wireframe={false}
                shader="defaults"
                cAzimuthAngle={180}
                cPolarAngle={80}
                cDistance={3.6}
                cameraZoom={1}
                lightType="3d"
                brightness={0.8}
                envPreset="city"
                grain="off"
                toggleAxis={false}
              />
            </ShaderGradientCanvas>
          </div>
        );
      }

      setComponent(() => Inner);
    });
  }, []);

  if (!Component) return null;
  return <Component />;
}
