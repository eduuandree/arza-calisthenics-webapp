'use client';

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  // Typewriter animation for headline
  const words = ["atlético!", "poderoso!", "fuerte!", "funcional!"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (typing) {
      if (displayed.length < words[currentWordIndex].length) {
        timeout = setTimeout(() => {
          setDisplayed(words[currentWordIndex].slice(0, displayed.length + 1));
        }, 60);
      } else {
        timeout = setTimeout(() => setTyping(false), 1200);
      }
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(words[currentWordIndex].slice(0, displayed.length - 1));
        }, 30);
      } else {
        setTyping(true);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [displayed, typing, currentWordIndex]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-start">
        {/* Logo ARZA */}
        <div className="w-full flex justify-center pt-12 pb-4">
          <Image
            src="/arza-logo.svg"
            alt="ARZA Logo"
            width={220}
            height={80}
            priority
            className="object-contain"
          />
        </div>
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-2 tracking-tight"
        >
          cómo construir un <span className="" style={{ color: '#21372b' }}>físico brutalmente</span>{' '}
          <span className="px-2 py-1 rounded font-bold min-w-[120px] inline-block" style={{ background: '#d3b67b', color: '#222', letterSpacing: '1px' }}>{displayed}&nbsp;</span>
        </motion.h1>
        {/* Subheadline removed as requested */}
        {/* Sección explicativa del programa ARZA (reemplazo de los bloques) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="w-full flex flex-col items-center justify-center mb-12 px-4"
        >
          <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl border border-[#d3b67b] p-8 mt-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#21372b] mb-2 text-center">Programa Personalizado de 12 Semanas</h2>
            <p className="text-gray-700 text-center mb-6 text-lg">Entrena con el método que lleva tu fuerza al siguiente nivel y desbloquea habilidades que creías imposibles.</p>
            <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
              <li className="flex items-start gap-2 text-[#21372b] text-base"><span className="text-xl text-green-600">✓</span> Medición inicial de nivel</li>
              <li className="flex items-start gap-2 text-[#21372b] text-base"><span className="text-xl text-green-600">✓</span> Rutinas personalizadas según progreso</li>
              <li className="flex items-start gap-2 text-[#21372b] text-base"><span className="text-xl text-green-600">✓</span> Video llamada semanal</li>
              <li className="flex items-start gap-2 text-[#21372b] text-base"><span className="text-xl text-green-600">✓</span> Soporte 24/7 personalizado</li>
              <li className="flex items-start gap-2 text-[#21372b] text-base"><span className="text-xl text-green-600">✓</span> Tips exclusivos de Bruno Focacci</li>
              <li className="flex items-start gap-2 text-[#21372b] text-base"><span className="text-xl text-green-600">✓</span> Consejos de Rafael Pizarro</li>
              <li className="flex items-start gap-2 text-[#21372b] text-base"><span className="text-xl text-green-600">✓</span> Evaluaciones periódicas</li>
              <li className="flex items-start gap-2 text-[#21372b] text-base"><span className="text-xl text-green-600">✓</span> Informe completo final</li>
            </ul>
            <div className="bg-[#21372b] rounded-xl p-5 text-center text-white shadow-lg border-2 border-[#d3b67b]">
              <h3 className="text-xl font-bold mb-6 text-[#d3b67b] flex items-center justify-center gap-2">🎁 <span>Recibe estos BONOS de regalo al unirte</span></h3>
              <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center">
                <div className="bg-[#21372b] border-2 border-[#d3b67b] rounded-xl shadow-lg p-6 flex-1 flex flex-col items-center text-center min-h-[160px] justify-center">
                  <span className="text-4xl mb-3">📘</span>
                  <div className="font-semibold text-white text-lg mb-2">Ebook exclusivo "Los cimientos de la isometría"</div>
                  <div className="text-gray-300 text-sm">Descubre estrategias y consejos prácticos para potenciar tus resultados.</div>
                </div>
                <div className="bg-[#21372b] border-2 border-[#d3b67b] rounded-xl shadow-lg p-6 flex-1 flex flex-col items-center text-center min-h-[160px] justify-center">
                  <span className="text-4xl mb-3">🤝</span>
                  <div className="font-semibold text-white text-lg mb-2">Acceso a la Comunidad VIP</div>
                  <div className="text-gray-300 text-sm">Únete a un grupo privado de atletas y recibe apoyo directo de expertos.</div>
                </div>
              </div>
              <p className="text-xs text-[#d3b67b] mt-4">Bonos gratuitos y exclusivos para nuevos miembros del programa.</p>
            </div>
          </div>
        </motion.section>
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mb-16"
        >
          <Link href="/onboarding">
            <button style={{ background: '#d3b67b', color: '#222' }} className="px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200">
              Comenzar Evaluación Gratuita
            </button>
          </Link>
        </motion.div>
      </div>
      
      {/* Footer */}
      <footer className="bg-black text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          {/* Left side - Brand and copyright */}
          <div className="mb-4 md:mb-0">
            <h3 className="text-2xl font-bold mb-2">ARZA</h3>
            <p className="text-sm text-gray-300">2025 ARZA. Todos los derechos reservados.</p>
          </div>
          
          {/* Right side - Social media icons */}
          <div className="flex gap-4">
            <a 
              href="https://www.instagram.com/arzacalisthenics/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a 
              href="http://tiktok.com/@arzacalisthenics" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
