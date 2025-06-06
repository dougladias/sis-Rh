"use client";

import React from "react";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-white font-bold">G</span>
    </div>
  ),
});

// Atualizar a interface de props para incluir isOpen
interface LottieLogoProps {
  isOpen?: boolean;
}

export default function LottieLogo({ isOpen }: LottieLogoProps) {
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);
  
  useEffect(() => {
    // Dynamically import the animation JSON file
    import('../../../public/logofinal.json')
      .then((data) => {
        setAnimationData(data.default);
      })
      .catch((err) => console.error("Failed to load animation:", err));
  }, []);
  
  if (!animationData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-white font-bold">G</span>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="w-full h-full flex items-center justify-center"
      whileHover={{ 
        scale: 1.08,
        transition: {
          duration: 0.2
        }
      }}      
      style={{ 
        transform: isOpen ? 'scale(1)' : 'scale(0.8)',
      }}
    >
      <Lottie 
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid slice'
        }}
      />
    </motion.div>
  );
}