'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';
import { motion } from 'framer-motion';

const GOLD = '#d3b67b';
const GREEN = '#21372b';

const categoryLabels = [
  { key: 'tiron', label: 'Tirón', shortLabel: 'TIR', color: 'from-blue-400 to-blue-600' },
  { key: 'empuje', label: 'Empuje', shortLabel: 'EMP', color: 'from-purple-400 to-purple-600' },
  { key: 'handstand', label: 'Handstand', shortLabel: 'HAN', color: 'from-fuchsia-400 to-fuchsia-600' },
  { key: 'front', label: 'Front Lever', shortLabel: 'FLE', color: 'from-cyan-400 to-cyan-600' },
  { key: 'planche', label: 'Planche', shortLabel: 'PLA', color: 'from-yellow-400 to-yellow-600' },
];

const getClassificationColor = (classification: string) => {
  switch (classification?.toLowerCase()) {
    case 'inicial':
      return 'from-gray-400 to-gray-600';
    case 'intermedio':
      return 'from-green-400 to-green-600';
    case 'élite':
    case 'elite':
      return 'from-yellow-400 to-yellow-600';
    default:
      return 'from-blue-400 to-blue-600';
  }
};

export default function ResultsPage() {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get stats (ya calculados en Supabase)
        const { data: statsData, error: statsError } = await supabase
          .from('stats')
          .select('*')
          .eq('evaluation_id', evaluationId)
          .single();
        if (statsError || !statsData) throw statsError || new Error('No se encontraron los resultados');
        setStats(statsData);
        // Get evaluation (para user_id y fecha)
        const { data: evalData, error: evalError } = await supabase
          .from('arza_evaluations')
          .select('user_id, created_at, handstand_level, front_lever_level, planche_level, knee_pushups_level, australian_rows_level, tiron_score, empuje_score, handstand_score, front_lever_score, planche_score')
          .eq('id', evaluationId)
          .single();
        if (evalError || !evalData) throw evalError || new Error('No se encontró la evaluación');
        setEvaluation(evalData);
        // Get user
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', evalData.user_id)
          .single();
        if (userError || !userData) throw userError || new Error('No se encontró el usuario');
        setUser(userData);
      } catch (e: any) {
        setError(e.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    if (evaluationId) fetchData();
  }, [evaluationId]);

  if (loading) return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 border-4 border-[#d3b67b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#21372b] text-lg font-medium">Cargando resultados...</p>
      </motion.div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      <div className="text-red-500 text-center">
        <p className="text-xl font-bold mb-2">Error</p>
        <p>{error}</p>
      </div>
    </div>
  );
  
  if (!user || !stats || !evaluation) return null;

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
          {/* Left: Player Card */}
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
                      <div className="text-4xl font-bold text-white">{Math.round(stats.arza_card)}</div>
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
                      <div className="text-4xl font-bold text-white">{user.nombre.charAt(0).toUpperCase()}</div>
                    </div>
                  </div>

                  {/* Player Name */}
                  <div className="text-center mb-4">
                    <div className="text-xl font-bold text-white tracking-wider">{user.nombre.toUpperCase()}</div>
                  </div>

                  {/* Key Stats - Hidden */}
                  {/* <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-white font-bold">{stats.tiron} TIR</div>
                    <div className="text-white font-bold">{stats.empuje} EMP</div>
                    <div className="text-white font-bold">{stats.handstand} HAN</div>
                    <div className="text-white font-bold">{stats.front} FLE</div>
                    <div className="text-white font-bold">{stats.planche} PLA</div>
                  </div> */}

                  {/* Card Type */}
                  <div className="text-center mt-2">
                    <div className="text-xs text-white/80 font-bold">ARZA CARD</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Detailed Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <h2 className="text-2xl font-bold text-[#21372b] mb-6 text-center">Atributos Detallados</h2>
            
            {/* Classification Badge */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${getClassificationColor(stats.clasificacion_general)} text-white font-bold text-lg shadow-lg`}>
                {stats.clasificacion_general}
              </div>
            </div>

            {/* Stats Bars */}
            <div className="space-y-4">
              {categoryLabels.map((cat, index) => (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="font-semibold text-[#21372b]">{cat.label}</div>
                      <div className="text-sm text-gray-600">{cat.shortLabel}</div>
                    </div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-[#d3b67b] to-[#f0c14b] bg-clip-text text-transparent">
                      {stats[cat.key]}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      className={`h-3 rounded-full bg-gradient-to-r ${cat.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats[cat.key] / 99) * 100}%` }}
                      transition={{ delay: 1.2 + index * 0.1, duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>



            {/* Generate Routine Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.6 }}
              className="mt-8 text-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  try {
                    // Verificar si ya existe una rutina
                    const { data: existingRoutine, error: routineError } = await supabase
                      .from('rutinas_generadas')
                      .select('id')
                      .eq('user_id', user.id)
                      .single();

                    if (routineError && routineError.code !== 'PGRST116') {
                      console.error('Error checking for existing routine:', routineError);
                    }

                    if (existingRoutine) {
                      router.push(`/routine/${existingRoutine.id}`);
                      return;
                    }

                    setLoading(true);

                    // Calcular niveles del usuario basados en los scores
                    const userLevels = {
                      tiron_level: 1,
                      empuje_level: 1,
                      handstand_level: Math.min(Math.max(stats.handstand, 1), 6),
                      front_lever_level: 1,
                      planche_level: 1
                    };

                    // Tirón levels: 1 (0-7), 2 (8-12), 3 (13-16)
                    if (stats.tiron >= 8 && stats.tiron <= 12) userLevels.tiron_level = 2;
                    else if (stats.tiron >= 13) userLevels.tiron_level = 3;

                    // Empuje levels: 1 (0-7), 2 (8-13), 3 (14-17)
                    if (stats.empuje >= 8 && stats.empuje <= 13) userLevels.empuje_level = 2;
                    else if (stats.empuje >= 14) userLevels.empuje_level = 3;

                    // Front Lever levels: 1(0-2), 2(3), 3(4), 4(5), 5(6-7), 6(8), 7(9-10)
                    if (stats.front === 3) userLevels.front_lever_level = 2;
                    else if (stats.front === 4) userLevels.front_lever_level = 3;
                    else if (stats.front === 5) userLevels.front_lever_level = 4;
                    else if (stats.front >= 6 && stats.front <= 7) userLevels.front_lever_level = 5;
                    else if (stats.front === 8) userLevels.front_lever_level = 6;
                    else if (stats.front >= 9) userLevels.front_lever_level = 7;

                    // Planche levels: 1(0-2), 2(3), 3(4), 4(5), 5(6), 6(7), 7(8), 8(9-10)
                    if (stats.planche === 3) userLevels.planche_level = 2;
                    else if (stats.planche === 4) userLevels.planche_level = 3;
                    else if (stats.planche === 5) userLevels.planche_level = 4;
                    else if (stats.planche === 6) userLevels.planche_level = 5;
                    else if (stats.planche === 7) userLevels.planche_level = 6;
                    else if (stats.planche === 8) userLevels.planche_level = 7;
                    else if (stats.planche >= 9) userLevels.planche_level = 8;

                    console.log('User levels:', userLevels);

                    // Obtener datos del usuario para la rutina
                    const { data: userData, error: userError } = await supabase
                      .from('users')
                      .select('dias_por_sem, tiempo_sesion')
                      .eq('id', user.id)
                      .single();

                    if (userError) {
                      throw new Error('No se pudieron obtener los datos del usuario');
                    }

                    // Seleccionar planilla basada en disponibilidad
                    const { data: planilla, error: planillaError } = await supabase
                      .from('planillas')
                      .select('id')
                      .eq('dias_por_sem', userData.dias_por_sem)
                      .eq('tiempo_sesion', userData.tiempo_sesion)
                      .single();

                    if (planillaError) {
                      throw new Error('No se encontró una planilla adecuada');
                    }

                    // Crear la rutina generada
                    const { data: newRoutine, error: createRoutineError } = await supabase
                      .from('rutinas_generadas')
                      .insert([{
                        user_id: user.id,
                        planilla_id: planilla.id,
                        tiron_level: userLevels.tiron_level,
                        empuje_level: userLevels.empuje_level,
                        handstand_level: userLevels.handstand_level,
                        front_lever_level: userLevels.front_lever_level,
                        planche_level: userLevels.planche_level,
                        created_at: new Date().toISOString()
                      }])
                      .select('id')
                      .single();

                    if (createRoutineError) {
                      throw new Error('Error al crear la rutina: ' + createRoutineError.message);
                    }

                    console.log('Rutina creada:', newRoutine);

                    // Generar detalles de la rutina basados en la planilla y niveles
                    const { data: planillaBlocks, error: blocksError } = await supabase
                      .from('planilla_blocks')
                      .select('*')
                      .eq('planilla_id', planilla.id)
                      .order('orden');

                    if (blocksError) {
                      throw new Error('Error al obtener bloques de la planilla');
                    }

                    // Para cada bloque, seleccionar ejercicios apropiados
                    const routineDetails: Array<{
                      rutina_id: string;
                      planilla_block_id: string;
                      ejercicio_id: string;
                      orden: number;
                      series: number;
                      repeticiones: string;
                      descanso: string;
                    }> = [];
                    for (const block of planillaBlocks) {
                      let ejercicios = [];
                      
                      // Seleccionar ejercicios basados en el tipo de bloque y nivel
                      if (block.tipo === 'tiron') {
                        const { data: tironEjercicios } = await supabase
                          .from('ejercicios')
                          .select('*')
                          .eq('categoria', 'tiron')
                          .eq('nivel', userLevels.tiron_level)
                          .limit(3);
                        ejercicios = tironEjercicios || [];
                      } else if (block.tipo === 'empuje') {
                        const { data: empujeEjercicios } = await supabase
                          .from('ejercicios')
                          .select('*')
                          .eq('categoria', 'empuje')
                          .eq('nivel', userLevels.empuje_level)
                          .limit(3);
                        ejercicios = empujeEjercicios || [];
                      } else if (block.tipo === 'handstand') {
                        const { data: handstandEjercicios } = await supabase
                          .from('ejercicios')
                          .select('*')
                          .eq('categoria', 'handstand')
                          .eq('nivel', userLevels.handstand_level)
                          .limit(3);
                        ejercicios = handstandEjercicios || [];
                      } else if (block.tipo === 'front_lever') {
                        const { data: frontEjercicios } = await supabase
                          .from('ejercicios')
                          .select('*')
                          .eq('categoria', 'front_lever')
                          .eq('nivel', userLevels.front_lever_level)
                          .limit(3);
                        ejercicios = frontEjercicios || [];
                      } else if (block.tipo === 'planche') {
                        const { data: plancheEjercicios } = await supabase
                          .from('ejercicios')
                          .select('*')
                          .eq('categoria', 'planche')
                          .eq('nivel', userLevels.planche_level)
                          .limit(3);
                        ejercicios = plancheEjercicios || [];
                      }

                      // Crear detalles para cada ejercicio seleccionado
                      ejercicios.forEach((ejercicio, index) => {
                        routineDetails.push({
                          rutina_id: newRoutine.id,
                          planilla_block_id: block.id,
                          ejercicio_id: ejercicio.id,
                          orden: index + 1,
                          series: block.series || 3,
                          repeticiones: ejercicio.repeticiones || '8-12',
                          descanso: ejercicio.descanso || '90s'
                        });
                      });
                    }

                    // Insertar todos los detalles de la rutina
                    if (routineDetails.length > 0) {
                      const { error: detailsError } = await supabase
                        .from('rutinas_generadas_detalle')
                        .insert(routineDetails);

                      if (detailsError) {
                        console.error('Error al crear detalles de rutina:', detailsError);
                        // No lanzar error aquí, la rutina principal ya se creó
                      }
                    }

                    setLoading(false);
                    router.push(`/routine/${newRoutine.id}`);

                  } catch (error: any) {
                    console.error('Error handling routine generation:', error);
                    setError(error.message || 'Error al procesar la generación de rutina');
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#d3b67b] via-[#f0c14b] to-[#d3b67b] text-[#21372b] font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      Generando Rutina...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Generar Mi Rutina
                      <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#f0c14b] to-[#d3b67b] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
              </motion.button>
              
              <div className="mt-4 text-sm text-gray-600">
                La rutina se adaptará a tus niveles y objetivos.
              </div>
            </motion.div>
          </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
} 