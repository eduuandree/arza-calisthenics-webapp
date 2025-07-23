'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';
import { motion } from 'framer-motion';

interface RutinaGenerada {
  id: string;
  user_id: string;
  planilla_id: string;
  nombre: string;
  estado: string;
}

interface RutinaDetalle {
  id: string;
  rutina_id: string;
  semana: number;
  dia: number;
  orden: number;
  clasificacion: string;
  ejercicio_nombre: string;
  series: number;
  reps: number;
  descanso_min: number;
  descanso_max: number;
  notas?: string;
  estimulo?: string; // <-- agregado
}

interface User {
  id: string;
  nombre: string;
  email: string;
}

interface Stats {
  id: string;
  evaluation_id: string;
  arza_card: number;
  tiron: number;
  empuje: number;
  handstand: number;
  front: number;
  planche: number;
  total: number;
  clasificacion_general: string;
}

interface GroupedExercises {
  [semana: number]: {
    [dia: number]: RutinaDetalle[];
  };
}

export default function RoutinePage() {
  const params = useParams();
  const router = useRouter();
  const routineId = params.routineId as string;

  const [routine, setRoutine] = useState<RutinaGenerada | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [exercises, setExercises] = useState<RutinaDetalle[]>([]);
  const [groupedExercises, setGroupedExercises] = useState<GroupedExercises>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState(1);

  useEffect(() => {
    const fetchRoutineData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('routineId from params:', routineId);

        // Fetch routine header
        const { data: routineData, error: routineError } = await supabase
          .from('rutinas_generadas')
          .select('*')
          .eq('id', routineId)
          .single();

        if (routineError) {
          console.error('Error fetching routine header:', routineError);
          throw routineError;
        }
        
        console.log('routine data:', routineData);
        setRoutine(routineData);

        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, nombre, email')
          .eq('id', routineData.user_id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          throw userError;
        }
        setUser(userData);

        // Fetch user's latest evaluation and stats
        const { data: evaluationData, error: evaluationError } = await supabase
          .from('arza_evaluations')
          .select('id')
          .eq('user_id', routineData.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (evaluationError) {
          console.error('Error fetching evaluation:', evaluationError);
          // Don't throw error here, stats are optional
        } else if (evaluationData) {
          // Fetch stats for the latest evaluation
          const { data: statsData, error: statsError } = await supabase
            .from('stats')
            .select('*')
            .eq('evaluation_id', evaluationData.id)
            .single();

          if (statsError) {
            console.error('Error fetching stats:', statsError);
            // Don't throw error here, stats are optional
          } else {
            setStats(statsData);
          }
        }

        // Fetch routine details
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('rutinas_generadas_detalle')
          .select('*')
          .eq('rutina_id', routineId)
          .order('semana', { ascending: true })
          .order('dia', { ascending: true })
          .order('orden', { ascending: true });

        if (exercisesError) {
          console.error('Error fetching routine details:', exercisesError);
          throw exercisesError;
        }
        
        if (!exercisesData || exercisesData.length === 0) {
          console.warn('No exercises found for routineId:', routineId);
          console.log('Checking if routine exists in rutinas_generadas...');
          
          // Double check if the routine exists
          const { data: routineCheck, error: routineCheckError } = await supabase
            .from('rutinas_generadas')
            .select('id, nombre')
            .eq('id', routineId);
          
          console.log('Routine check result:', routineCheck);
          if (routineCheckError) {
            console.error('Error checking routine:', routineCheckError);
          }
        }
        
        console.log('routineDetails raw:', exercisesData);
        console.log('Number of exercises found:', exercisesData?.length || 0);
        if (exercisesData && exercisesData.length > 0) {
          console.log('First exercise sample:', exercisesData[0]);
          console.log('All semana values:', exercisesData.map(e => e.semana));
          console.log('All dia values:', exercisesData.map(e => e.dia));
        }
        setExercises(exercisesData);

        // Group exercises by week and day
        const grouped: GroupedExercises = {};
        exercisesData.forEach((exercise) => {
          // Handle both string and number types for semana and dia
          let semana: number;
          let dia: number;
          
          // Try to extract number from string like "Día 1" -> 1
          if (typeof exercise.semana === 'string') {
            const semanaMatch = exercise.semana.match(/\d+/);
            semana = semanaMatch ? Number(semanaMatch[0]) : Number(exercise.semana);
          } else {
            semana = Number(exercise.semana);
          }
          
          if (typeof exercise.dia === 'string') {
            const diaMatch = exercise.dia.match(/\d+/);
            dia = diaMatch ? Number(diaMatch[0]) : Number(exercise.dia);
          } else {
            dia = Number(exercise.dia);
          }
          
          console.log('Processing exercise:', {
            id: exercise.id,
            semana: exercise.semana,
            dia: exercise.dia,
            semanaNumber: semana,
            diaNumber: dia,
            isValid: !isNaN(semana) && semana > 0 && !isNaN(dia) && dia > 0
          });
          
          if (!isNaN(semana) && semana > 0 && !isNaN(dia) && dia > 0) {
            if (!grouped[semana]) {
              grouped[semana] = {};
            }
            if (!grouped[semana][dia]) {
              grouped[semana][dia] = [];
            }
            grouped[semana][dia].push(exercise);
          }
        });

        console.log('groupedExercises:', grouped);
        setGroupedExercises(grouped);

        // Set active week to the first available week
        const availableWeeks = Object.keys(grouped)
          .map(Number)
          .filter(week => !isNaN(week) && week > 0)
          .sort((a, b) => a - b);
        
        console.log('availableWeeks:', availableWeeks);
        
        if (availableWeeks.length > 0) {
          setActiveWeek(availableWeeks[0]);
        } else {
          // If no weeks available, set to 1 as fallback
          setActiveWeek(1);
        }

      } catch (err) {
        console.error('Error fetching routine data:', err);
        setError('Error al cargar la rutina');
      } finally {
        setLoading(false);
      }
    };

    if (routineId) {
      fetchRoutineData();
    }
  }, [routineId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando tu rutina personalizada...</p>
        </div>
      </div>
    );
  }

  if (error || !routine || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-4">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">
            {error || 'No se pudo cargar la rutina'}
          </p>
          <button
            onClick={() => router.back()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const availableWeeks = Object.keys(groupedExercises || {})
    .map(Number)
    .filter(week => !isNaN(week) && week > 0)
    .sort((a, b) => a - b);

  // Simulación de acceso (en producción, reemplazar por lógica real de pago)
  const hasAccess = false;
  const visibleDay = 1; // Solo el día 1 es visible

  // Use real stats from database or fallback to default values
  const arzaCardStats = {
    arza_card: stats ? Math.round(stats.arza_card) : 0,
    tiron: stats?.tiron || 0,
    empuje: stats?.empuje || 0,
    handstand: stats?.handstand || 0,
    front: stats?.front || 0,
    planche: stats?.planche || 0,
    total: stats?.total || 0,
    nombre: user?.nombre || '',
    inicial: user?.nombre?.charAt(0).toUpperCase() || '',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-[#d3b67b] via-[#f0c14b] to-[#d3b67b] bg-clip-text text-transparent">
            ARZA Card
          </h1>
        </motion.div>

        {/* Main Content - Unified Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: ARZA Card */}
            <div className="flex justify-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="relative"
        >
                {/* FIFA-style Card */}
                <div className="relative w-80 h-96 bg-gradient-to-br from-[#d3b67b] via-[#f0c14b] to-[#d3b67b] rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  {/* Card Border Effect */}
                  <div className="absolute inset-1 bg-gradient-to-br from-[#21372b] to-[#1a2a1f] rounded-xl"></div>
                  <div className="absolute inset-2 bg-gradient-to-br from-[#d3b67b] via-[#f0c14b] to-[#d3b67b] rounded-lg"></div>
                  {/* Card Content */}
                  <div className="relative h-full p-6 flex flex-col">
                    {/* Top Section */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-4xl font-bold text-white">{arzaCardStats.arza_card}</div>
                        <div className="text-sm text-white/80 font-medium">ARZA SCORE</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white/80 font-medium">CALISTENICS</div>
                        <div className="text-xs text-white/60">ARZA</div>
                      </div>
                    </div>
                    {/* Center: Avatar Placeholder */}
                    <div className="flex-1 flex items-center justify-center mb-4">
                      <div className="w-32 h-32 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center border-4 border-white/30">
                        <div className="text-4xl font-bold text-white">{arzaCardStats.inicial}</div>
                      </div>
                    </div>
                    {/* Player Name */}
                    <div className="text-center mb-4">
                      <div className="text-xl font-bold text-white tracking-wider">{arzaCardStats.nombre.toUpperCase()}</div>
                    </div>
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-white font-bold">{arzaCardStats.tiron} TIR</div>
                      <div className="text-white font-bold">{arzaCardStats.empuje} EMP</div>
                      <div className="text-white font-bold">{arzaCardStats.handstand} HAN</div>
                      <div className="text-white font-bold">{arzaCardStats.front} FLE</div>
                      <div className="text-white font-bold">{arzaCardStats.planche} PLA</div>
                    </div>
                    {/* Card Type */}
                    <div className="text-center mt-2">
                      <div className="text-xs text-white/80 font-bold">ARZA CARD</div>
                    </div>
              </div>
          </div>
        </motion.div>
            </div>
            {/* Right: Día 1 ejercicios preview */}
        <motion.div
              initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col justify-center"
                  >
              <h2 className="text-2xl font-bold text-[#21372b] mb-6 text-center">Día 1</h2>
                    <div className="space-y-4">
                {(() => {
                  const ejerciciosDia = groupedExercises[activeWeek] && groupedExercises[activeWeek][1] ? groupedExercises[activeWeek][1] : [];
                  if (!hasAccess) {
                    return (
                      <>
                        {/* Primer ejercicio visible */}
                        {ejerciciosDia[0] && (
                          <div key={ejerciciosDia[0].id} className="bg-white rounded-lg p-4 border-l-4" style={{ borderColor: '#d3b67b' }}>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-lg font-semibold" style={{ color: '#21372b' }}>
                                {ejerciciosDia[0].ejercicio_nombre}
                              </h4>
                              <span className="text-sm px-2 py-1 rounded font-semibold" style={{ background: '#d3b67b', color: '#21372b' }}>
                                {ejerciciosDia[0].clasificacion}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ color: '#21372b' }}>
                              <div>
                                <span className="font-medium" style={{ color: '#d3b67b' }}>Series:</span>
                                <span className="ml-2">{ejerciciosDia[0].series}</span>
                              </div>
                              <div>
                                <span className="font-medium" style={{ color: '#d3b67b' }}>
                                  {ejerciciosDia[0].estimulo === 'isometrico'
                                    ? 'Tiempo:'
                                    : ejerciciosDia[0].estimulo === 'excentrico'
                                    ? 'Excéntrico:'
                                    : 'Repeticiones:'}
                                </span>
                                <span className="ml-2">{ejerciciosDia[0].reps}</span>
                              </div>
                              <div>
                                <span className="font-medium" style={{ color: '#d3b67b' }}>Descanso:</span>
                                <span className="ml-2">
                                  {ejerciciosDia[0].descanso_min}-{ejerciciosDia[0].descanso_max} min
                                </span>
                              </div>
                            </div>
                            {ejerciciosDia[0].notas && (
                              <div className="mt-3 p-3 bg-[#f5ecd6] rounded border-l-2" style={{ borderColor: '#d3b67b' }}>
                                <span className="font-medium" style={{ color: '#21372b' }}>Notas:</span>
                                <p className="mt-1" style={{ color: '#21372b' }}>{ejerciciosDia[0].notas}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Resto de ejercicios borrosos */}
                        {ejerciciosDia.slice(1).map((exercise, idx) => (
                          <div key={exercise.id} className="relative">
                            {/* Contenido borroso */}
                            <div className="pointer-events-none select-none filter blur-sm opacity-60">
                              <div className="bg-white rounded-lg p-4 border-l-4" style={{ borderColor: '#d3b67b' }}>
                          <div className="flex justify-between items-start mb-2">
                                  <h4 className="text-lg font-semibold" style={{ color: '#21372b' }}>
                              {exercise.ejercicio_nombre}
                            </h4>
                                  <span className="text-sm px-2 py-1 rounded font-semibold" style={{ background: '#d3b67b', color: '#21372b' }}>
                              {exercise.clasificacion}
                            </span>
                          </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ color: '#21372b' }}>
                            <div>
                                    <span className="font-medium" style={{ color: '#d3b67b' }}>Series:</span>
                              <span className="ml-2">{exercise.series}</span>
                            </div>
                            <div>
                                    <span className="font-medium" style={{ color: '#d3b67b' }}>
                                      {exercise.estimulo === 'isometrico'
                                        ? 'Tiempo:'
                                        : exercise.estimulo === 'excentrico'
                                        ? 'Excéntrico:'
                                        : 'Repeticiones:'}
                                    </span>
                              <span className="ml-2">{exercise.reps}</span>
                            </div>
                            <div>
                                    <span className="font-medium" style={{ color: '#d3b67b' }}>Descanso:</span>
                              <span className="ml-2">
                                {exercise.descanso_min}-{exercise.descanso_max} min
                                    </span>
                                  </div>
                                </div>
                                {exercise.notas && (
                                  <div className="mt-3 p-3 bg-[#f5ecd6] rounded border-l-2" style={{ borderColor: '#d3b67b' }}>
                                    <span className="font-medium" style={{ color: '#21372b' }}>Notas:</span>
                                    <p className="mt-1" style={{ color: '#21372b' }}>{exercise.notas}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Overlay y mensaje */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span
                                className="text-[#21372b] font-bold text-lg px-8 py-4 rounded-xl border border-[#d3b67b] shadow-lg"
                                style={{ background: 'rgba(255,255,255,0.20)', textShadow: '0 2px 8px #fff' }}
                              >
                                Desbloquea el programa completo para ver este ejercicio
                              </span>
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  }
                  // Si tiene acceso, mostrar todo
                  return ejerciciosDia.map((exercise, index) => (
                    <div key={exercise.id} className="bg-white rounded-lg p-4 border-l-4" style={{ borderColor: '#d3b67b' }}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold" style={{ color: '#21372b' }}>
                          {exercise.ejercicio_nombre}
                        </h4>
                        <span className="text-sm px-2 py-1 rounded font-semibold" style={{ background: '#d3b67b', color: '#21372b' }}>
                          {exercise.clasificacion}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ color: '#21372b' }}>
                        <div>
                          <span className="font-medium" style={{ color: '#d3b67b' }}>Series:</span>
                          <span className="ml-2">{exercise.series}</span>
                        </div>
                        <div>
                          <span className="font-medium" style={{ color: '#d3b67b' }}>
                            {exercise.estimulo === 'isometrico'
                              ? 'Tiempo:'
                              : exercise.estimulo === 'excentrico'
                              ? 'Excéntrico:'
                              : 'Repeticiones:'}
                          </span>
                          <span className="ml-2">{exercise.reps}</span>
                        </div>
                        <div>
                          <span className="font-medium" style={{ color: '#d3b67b' }}>Descanso:</span>
                          <span className="ml-2">
                            {exercise.descanso_min}-{exercise.descanso_max} min
                          </span>
                        </div>
                      </div>
                          {exercise.notas && (
                        <div className="mt-3 p-3 bg-[#f5ecd6] rounded border-l-2" style={{ borderColor: '#d3b67b' }}>
                          <span className="font-medium" style={{ color: '#21372b' }}>Notas:</span>
                          <p className="mt-1" style={{ color: '#21372b' }}>{exercise.notas}</p>
                            </div>
                          )}
                    </div>
                  ));
                })()}
              </div>
              {/* Call to Action para desbloquear */}
              {!hasAccess && (
                <div className="flex flex-col items-center mt-12">
                  <div className="text-xl font-bold mb-4" style={{ color: '#21372b' }}>
                    ¿Quieres ver tu rutina completa y acceder a todo el programa?
                  </div>
                  <a
                    href="https://www.webpay.cl/form-pay/263678"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#d3b67b] hover:bg-[#c2a24e] text-[#21372b] font-bold text-lg px-10 py-4 rounded-xl shadow-lg transition-all"
                  >
                    Desbloquear programa completo
                  </a>
            </div>
          )}
        </motion.div>
          </div>
        </motion.div>

        {/* ARZAACCESS Notification Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-6 w-full max-w-6xl mx-auto"
        >
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl p-6 md:p-8 relative overflow-hidden">
            {/* Background image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
              style={{ backgroundImage: 'url(/full planche brazil.png)' }}
            ></div>
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            
            <div className="relative z-10 text-center space-y-4 md:space-y-6">
              {/* Header */}
              <div className="text-white/70 text-xs uppercase tracking-widest font-medium">
                ESTE PROGRAMA ESTÁ INCLUIDO EN
              </div>
              
              {/* Badge de descuento */}
              <div className="inline-flex items-center gap-2 bg-[#d3b67b]/20 border border-[#d3b67b]/30 rounded-full px-3 py-1">
                <span className="text-[#d3b67b] text-xs font-bold">🔥 OFERTA ESPECIAL</span>
              </div>
              
              {/* Main Title */}
              <div>
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  <span className="text-white">ARZA</span><span className="text-[#d3b67b]">ACCESS</span>
                </div>
              </div>
              
              {/* Subtitle */}
              <div className="text-white/80 text-sm md:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
                Acceso ilimitado a todos los programas ARZA por solo
              </div>
              
              {/* Pricing */}
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight space-y-2">
                <div className="flex flex-col items-center">
                  <div className="text-xs md:text-sm font-normal text-white/50 line-through">
                    Antes: $63.000/mes
                  </div>
                  <div className="text-[#d3b67b]">
                    $27.000<span className="text-sm md:text-base lg:text-lg font-normal text-white/70">/mes</span>
                  </div>
                </div>
                <div className="text-xs md:text-sm font-normal text-white/60">o</div>
                <div className="flex flex-col items-center">
                  <div className="text-xs md:text-sm font-normal text-white/50 line-through">
                    Antes: $180.000/3 meses
                  </div>
                  <div className="text-[#d3b67b]">
                    $63.000<span className="text-sm md:text-base lg:text-lg font-normal text-white/70">/3 meses</span>
                  </div>
                </div>
              </div>
              
              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto">
                <div className="flex flex-col items-center gap-2 text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d3b67b] to-[#f0c14b] flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white/90 text-xs uppercase tracking-wider font-bold">EVALUACIÓN GRATUITA</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d3b67b] to-[#f0c14b] flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white/90 text-xs uppercase tracking-wider font-bold">RUTINAS PERSONALIZADAS</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d3b67b] to-[#f0c14b] flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white/90 text-xs uppercase tracking-wider font-bold">PROGRESO GARANTIZADO</span>
                </div>
              </div>
              
              {/* CTA Button */}
              <motion.a
                href="https://www.webpay.cl/form-pay/263678"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-block bg-gradient-to-r from-[#d3b67b] to-[#f0c14b] hover:from-[#c2a24e] hover:to-[#d3b67b] text-white font-bold text-xs md:text-sm lg:text-base px-6 md:px-8 lg:px-10 py-2 md:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 uppercase tracking-wider overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  OBTÉN ACCESO ILIMITADO
                  <svg className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#f0c14b] to-[#d3b67b] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
} 