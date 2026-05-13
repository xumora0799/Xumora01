/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCcw, Swords, Keyboard, Info, CheckCircle2, XCircle } from 'lucide-react';

// Game constants
const WIN_THRESHOLD = 50; // Percentage from center
const PULL_STRENGTH = 8; // Increased pull strength for correct answers
const DECAY_RATE = 0.3; // Automatic drift back to center (optional)

interface MathProblem {
  question: string;
  answer: number;
  options: number[];
}

const generateProblem = (): MathProblem => {
  const types = ['+', '-', '*', '/'];
  const type = types[Math.floor(Math.random() * types.length)];
  let a, b, answer;

  switch (type) {
    case '+':
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 50) + 10;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 80) + 20;
      b = Math.floor(Math.random() * (a - 10)) + 5;
      answer = a - b;
      break;
    case '*':
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
      break;
    case '/':
      answer = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 10) + 2;
      a = answer * b;
      break;
    default:
      a = 10; b = 5; answer = 15;
  }

  // Generate options
  const options = new Set<number>([answer]);
  while (options.size < 3) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const opt = answer + offset;
    if (opt > 0) options.add(opt);
  }

  return {
    question: `${a} ${type === '*' ? '×' : type === '/' ? '÷' : type} ${b} = ?`,
    answer,
    options: Array.from(options).sort(() => Math.random() - 0.5)
  };
};

export default function App() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won'>('start');
  const [position, setPosition] = useState(0); // -50 to 50
  const [winner, setWinner] = useState<number | null>(null);
  
  const [p1Problem, setP1Problem] = useState<MathProblem>(generateProblem());
  const [p2Problem, setP2Problem] = useState<MathProblem>(generateProblem());
  
  const [p1Status, setP1Status] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [p2Status, setP2Status] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const startGame = () => {
    setPosition(0);
    setWinner(null);
    setP1Problem(generateProblem());
    setP2Problem(generateProblem());
    setP1Status('idle');
    setP2Status('idle');
    setGameState('playing');
  };

  const win = (player: number) => {
    setWinner(player);
    setGameState('won');
  };

  const handlePull = useCallback((player: number) => {
    setPosition(prev => {
      const next = player === 1 ? prev - PULL_STRENGTH : prev + PULL_STRENGTH;
      if (next <= -WIN_THRESHOLD) { win(1); return -WIN_THRESHOLD; }
      if (next >= WIN_THRESHOLD) { win(2); return WIN_THRESHOLD; }
      return next;
    });
  }, []);

  const handleAnswer = (player: number, selected: number) => {
    if (gameState !== 'playing') return;

    if (player === 1) {
      if (selected === p1Problem.answer) {
        setP1Status('correct');
        handlePull(1);
      } else {
        setP1Status('wrong');
      }
      setTimeout(() => {
        setP1Problem(generateProblem());
        setP1Status('idle');
      }, 500);
    } else {
      if (selected === p2Problem.answer) {
        setP2Status('correct');
        handlePull(2);
      } else {
        setP2Status('wrong');
      }
      setTimeout(() => {
        setP2Problem(generateProblem());
        setP2Status('idle');
      }, 500);
    }
  };

  // Decay effect
  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setPosition(prev => {
          if (Math.abs(prev) < 0.1) return 0;
          return prev > 0 ? prev - DECAY_RATE : prev + DECAY_RATE;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  return (
    <div className="min-h-screen bg-[#34A853] text-white font-sans overflow-hidden flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 opacity-20 hidden md:block" />
      <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-red-500 via-yellow-400 to-blue-500 opacity-20 hidden md:block" />

      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative z-10 mb-6 text-center">
        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-4">
          <Swords className="w-10 h-10 md:w-14 md:h-14" />
          Zukko Tortishvach
        </h1>
        <p className="text-lg opacity-90 font-medium uppercase tracking-widest mt-1">
          Bilimdonlar Turniri!
        </p>
      </motion.div>

      <div className="relative w-full max-w-5xl aspect-video bg-white/10 backdrop-blur-sm rounded-3xl border-4 border-white overflow-hidden shadow-2xl flex flex-col">
        
        {/* Game Stage (Top 60%) */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-full w-1 bg-white/20" />
          </div>

          <motion.div 
            className="absolute h-4 md:h-6 bg-[#C19A6B] w-[150%] flex items-center justify-center shadow-lg"
            animate={{ x: `${position}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="w-full h-full opacity-30 flex gap-2 overflow-hidden px-4">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="h-full w-4 border-r border-black/20 skew-x-12" />
              ))}
            </div>
            <div className="absolute w-1 h-32 bg-red-600 shadow-xl">
              <div className="absolute top-0 right-0 w-8 h-6 bg-red-600 rounded-sm -mr-8 flex items-center justify-start px-1 border-y border-white/20"></div>
            </div>
          </motion.div>

          <motion.div 
            className="absolute left-10 md:left-20 flex flex-col items-center gap-2" 
            animate={{ 
              x: `${position}%`,
              rotate: p1Status === 'correct' ? -10 : 0,
              scale: p1Status === 'correct' ? 1.1 : 1
            }}
          >
            <div className="relative w-24 h-28 md:w-36 md:h-44 flex flex-col items-center">
              {/* Do'ppa (Skullcap) */}
              <div className="z-20 w-12 md:w-16 h-6 bg-black rounded-t-lg border border-white/20 relative">
                <div className="absolute inset-0 grid grid-cols-4 p-1">
                  {[1,2,3,4].map(i => <div key={i} className="bg-white/40 w-1 h-1 rounded-full m-auto" />)}
                </div>
              </div>
              {/* Face */}
              <div className="z-10 w-16 md:w-20 h-16 md:h-20 bg-[#FFDBAC] rounded-full -mt-2 border-2 border-[#D2B48C] flex items-center justify-center text-4xl md:text-5xl">
                👦
              </div>
              {/* Chopon (Robe) */}
              <div className="w-20 md:w-24 h-24 md:h-32 bg-blue-800 rounded-t-3xl border-t-4 border-blue-400 relative overflow-hidden -mt-4">
                <div className="absolute inset-y-0 left-1/2 w-2 bg-yellow-500/50 -translate-x-1/2" />
                <div className="absolute top-8 left-0 right-0 h-1 bg-yellow-600/30" />
                {/* Hands holding rope */}
                <div className="absolute top-10 -left-2 w-8 h-4 bg-[#FFDBAC] rounded-full rotate-12 border border-black/10" />
                <div className="absolute top-10 -right-2 w-8 h-4 bg-[#FFDBAC] rounded-full -rotate-12 border border-black/10" />
              </div>
            </div>
            <div className="bg-blue-700 px-3 py-1 rounded-full font-black text-xs uppercase shadow-lg border border-white/20">O'G'IL BOLALAR</div>
          </motion.div>

          {/* Player 2 (Girl in Detailed National Dress) */}
          <motion.div 
            className="absolute right-10 md:right-20 flex flex-col items-center gap-2" 
            animate={{ 
              x: `${position}%`,
              rotate: p2Status === 'correct' ? 10 : 0,
              scale: p2Status === 'correct' ? 1.1 : 1
            }}
          >
            <div className="relative w-24 h-28 md:w-36 md:h-44 flex flex-col items-center">
              {/* Hair / Jewelry */}
              <div className="absolute -top-1 flex gap-6 z-20">
                <div className="w-4 h-4 bg-yellow-400 rounded-full border border-white/40 animate-bounce" />
                <div className="w-4 h-4 bg-yellow-400 rounded-full border border-white/40 animate-bounce delay-150" />
              </div>
              {/* Face */}
              <div className="z-10 w-16 md:w-20 h-16 md:h-20 bg-[#FFDBAC] rounded-full border-2 border-[#D2B48C] flex items-center justify-center text-4xl md:text-5xl">
                👧
              </div>
              {/* Atlas Dress */}
              <div className="w-20 md:w-28 h-24 md:h-32 bg-pink-600 rounded-t-[40px] border-t-4 border-pink-300 relative overflow-hidden -mt-2">
                {/* Atlas Pattern */}
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-full flex-1 ${i % 3 === 0 ? 'bg-yellow-400' : i % 3 === 1 ? 'bg-red-500' : 'bg-purple-600'} opacity-40 skew-x-12`} 
                    />
                  ))}
                </div>
                {/* Hands holding rope */}
                <div className="absolute top-10 -left-2 w-8 h-4 bg-[#FFDBAC] rounded-full rotate-12 border border-black/10 z-10" />
                <div className="absolute top-10 -right-2 w-8 h-4 bg-[#FFDBAC] rounded-full -rotate-12 border border-black/10 z-10" />
              </div>
            </div>
            <div className="bg-pink-700 px-3 py-1 rounded-full font-black text-xs uppercase shadow-lg border border-white/20">QIZ BOLALAR</div>
          </motion.div>
        </div>

        {/* Problems Area (Bottom 40%) */}
        {gameState === 'playing' && (
          <div className="h-2/5 grid grid-cols-2 gap-4 p-4 border-t-2 border-white/20 bg-black/20">
            {/* Player 1 Card */}
            <div className="bg-blue-900/50 rounded-xl p-3 flex flex-col items-center justify-between border-2 border-blue-400/30">
              <div className="text-center">
                <h3 className="text-xs font-bold uppercase opacity-60 mb-1">Misolni yeching:</h3>
                <p className="text-2xl md:text-3xl font-black mb-2 tracking-tighter">{p1Problem.question}</p>
              </div>
              <div className="flex gap-2 w-full max-w-xs justify-center">
                {p1Problem.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(1, opt)}
                    disabled={p1Status !== 'idle'}
                    className={`flex-1 py-3 rounded-lg font-black text-xl transition-all shadow-lg border-b-4 
                      ${p1Status === 'idle' ? 'bg-white text-blue-900 hover:scale-105 active:translate-y-1' : 
                        p1Status === 'correct' && opt === p1Problem.answer ? 'bg-green-500 text-white border-green-700' :
                        p1Status === 'wrong' && opt !== p1Problem.answer ? 'bg-red-500 text-white border-red-700 opacity-50' : 'bg-white/10'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Player 2 Card */}
            <div className="bg-pink-900/50 rounded-xl p-3 flex flex-col items-center justify-between border-2 border-pink-400/30">
              <div className="text-center">
                <h3 className="text-xs font-bold uppercase opacity-60 mb-1">Misolni yeching:</h3>
                <p className="text-2xl md:text-3xl font-black mb-2 tracking-tighter">{p2Problem.question}</p>
              </div>
              <div className="flex gap-2 w-full max-w-xs justify-center">
                {p2Problem.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(2, opt)}
                    disabled={p2Status !== 'idle'}
                    className={`flex-1 py-3 rounded-lg font-black text-xl transition-all shadow-lg border-b-4 
                      ${p2Status === 'idle' ? 'bg-white text-pink-900 hover:scale-105 active:translate-y-1' : 
                        p2Status === 'correct' && opt === p2Problem.answer ? 'bg-green-500 text-white border-green-700' :
                        p2Status === 'wrong' && opt !== p2Problem.answer ? 'bg-red-500 text-white border-red-700 opacity-50' : 'bg-white/10'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6">
              <h2 className="text-5xl font-black mb-2 uppercase italic tracking-tighter">QIROM TORTISH</h2>
              <p className="text-xl mb-8 opacity-80 max-w-md">Misollarni tezroq yeching va raqibingizni o'z tomoningizga torting!</p>
              <button 
                onClick={startGame}
                className="group relative px-16 py-6 bg-white text-[#34A853] rounded-full font-black text-3xl uppercase tracking-tighter hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                Jamoalar Tayyormi?
              </button>
            </motion.div>
          )}

          {gameState === 'won' && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center text-[#34A853] p-6">
              <motion.div animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Trophy className="w-32 h-32 mb-6 drop-shadow-2xl" />
              </motion.div>
              <h2 className="text-7xl font-black uppercase italic mb-2 tracking-tighter">TABRIKLAYMIZ!</h2>
              <p className="text-4xl font-bold uppercase mb-10 text-black/80">
                {winner === 1 ? "O'G'IL BOLALAR" : "QIZ BOLALAR"} JAMOASI YUTDI!
              </p>
              <button onClick={startGame} className="flex items-center gap-3 px-10 py-4 bg-[#34A853] text-white rounded-full font-black text-xl uppercase hover:scale-105 transition-all shadow-xl">
                <RefreshCcw className="w-6 h-6" /> QAYTA O'YNASH
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
        <div className="bg-white/10 p-3 rounded-xl flex items-center gap-3">
          <Info className="w-5 h-5 shrink-0 opacity-60" />
          <p className="text-xs font-medium uppercase leading-tight">Har bir to'g'ri javob arqonni <b>8 qadam</b> tortadi. Diqqatli bo'ling!</p>
        </div>
        <div className="bg-white/10 p-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />
          <p className="text-xs font-medium uppercase leading-tight">Noto'g'ri javob bersangiz, <b>0.5 soniya</b> kutiladi. Tezlashing!</p>
        </div>
      </div>
      
      {/* Author/Creator Info */}
      <div className="mt-8 text-center opacity-50 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
        <div className="h-px w-8 bg-white/20" />
        Muallif: Xamroqulova Xumora
        <div className="h-px w-8 bg-white/20" />
      </div>
    </div>
  );
}

