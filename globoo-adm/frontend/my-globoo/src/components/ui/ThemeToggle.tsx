"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Verificar o tema atual ao montar o componente
  useEffect(() => {
    setMounted(true);
    
    // Verificar se há tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || 
       (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
    
    // Adicionar listener para eventos de mudança de tema
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        setIsDark(e.newValue === 'dark');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Evitar problemas de hidratação
  if (!mounted) {
    return <div className="w-12 h-6 bg-gray-300 rounded-full"></div>;
  }

  // Função para alternar o tema
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.body.classList.add('dark'); // Aplicar no body em vez de documentElement
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    // Disparar evento
    const event = new CustomEvent('themeToggled', { 
      detail: { theme: newIsDark ? 'dark' : 'light' } 
    });
    window.dispatchEvent(event);
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center transition-colors duration-300"
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      <motion.div
        className="w-5 h-5 rounded-full flex items-center justify-center absolute"
        animate={{
          x: isDark ? 26 : 2,
          backgroundColor: isDark ? "#1f2937" : "#ffffff"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {isDark ? (
          <FiMoon className="h-3 w-3 text-cyan-300" />
        ) : (
          <FiSun className="h-3 w-3 text-yellow-500" />
        )}
      </motion.div>
    </button>
  );
}