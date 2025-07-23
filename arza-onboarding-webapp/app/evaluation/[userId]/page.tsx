'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

type Ability = 'pullups' | 'dips' | 'handstand' | 'front_lever' | 'planche' | 'ninguno';

const openingOptions = [
  { label: 'Pull-ups', value: 'pullups' },
  { label: 'Dips/fondos', value: 'dips' },
  { label: 'Handstand', value: 'handstand' },
  { label: 'Front Lever', value: 'front_lever' },
  { label: 'Planche', value: 'planche' },
  { label: 'Ninguno', value: 'ninguno' },
];

const GOLD = '#d3b67b';
const GREEN = '#21372b';

// Define el tipo de responses
interface ResponseState {
  abilities: string[];
  pullups_reps: string;
  weighted_pullups_kg: string;
  muscle_ups_type: string;
  weighted_muscle_ups_kg: string;
  dips_reps: string;
  weighted_dips_kg: string;
  weighted_dips_reps: boolean;
  extreme_dips_kg: string;
  extreme_dips_reps: boolean;
  handstand_level: string;
  handstand_one_arm: boolean;
  handstand_90_degree: boolean;
  handstand_dynamic_one_arm: boolean;
  front_lever_level: string;
  front_lever_dynamic: string;
  front_lever_elite: string;
  front_lever_victorian: boolean;
  front_lever_sat_supino: boolean;
  planche_level: string;
  planche_dynamic: string;
  planche_elite: string;
  planche_zanetti: boolean;
  planche_pelican: boolean;
  standard_pushups: string;
  knee_pushups_level: string;
  australian_rows_level: string;
}

export default function EvaluationPage() {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | { [key: string]: string } | null>(null);
  const [score, setScore] = useState({ tiron: 0, empuje: 0, handstand: 0, front: 0, planche: 0, beginner: 0 });
  const router = useRouter();
  const [currentBlock, setCurrentBlock] = useState<'skills'|'tiron'|'empuje'|'handstand'|'front_lever'|'planche'|'beginner'|'finish'>('skills');
  const blockOrder = ['skills', 'tiron', 'empuje', 'handstand', 'front_lever', 'planche', 'beginner', 'finish'];
  const blockLabels = {
    skills: 'Movimientos',
    tiron: 'Tirón',
    empuje: 'Empuje',
    handstand: 'Handstand',
    front_lever: 'Front Lever',
    planche: 'Planche',
    beginner: 'Principiante',
    finish: 'Resumen',
  };
  const currentStep = blockOrder.indexOf(currentBlock) + 1;
  const totalSteps = blockOrder.length;

  // Estado centralizado responses
  const [responses, setResponses] = useState<ResponseState>({
    abilities: [],
    pullups_reps: '',
    weighted_pullups_kg: '',
    muscle_ups_type: '',
    weighted_muscle_ups_kg: '',
    dips_reps: '',
    weighted_dips_kg: '',
    weighted_dips_reps: false,
    extreme_dips_kg: '',
    extreme_dips_reps: false,
    handstand_level: '',
    handstand_one_arm: false,
    handstand_90_degree: false,
    handstand_dynamic_one_arm: false,
    front_lever_level: '',
    front_lever_dynamic: '',
    front_lever_elite: '',
    front_lever_victorian: false,
    front_lever_sat_supino: false,
    planche_level: '',
    planche_dynamic: '',
    planche_elite: '',
    planche_zanetti: false,
    planche_pelican: false,
    standard_pushups: '',
    knee_pushups_level: '',
    australian_rows_level: '',
  });

  // --- NUEVO: handleInputChange universal ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setResponses(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- HABILIDADES (checkboxes múltiples) ---
  const handleAbilityChange = (value: Ability) => {
    if (value === 'ninguno') {
      setResponses({ ...responses, abilities: ['ninguno'] });
    } else {
      let newAbilities = responses.abilities.filter((a) => a !== 'ninguno');
      if (responses.abilities.includes(value)) {
        newAbilities = newAbilities.filter((a) => a !== value);
      } else {
        newAbilities = [...newAbilities, value];
      }
      setResponses({ ...responses, abilities: newAbilities });
    }
  };

  // TIRÓN block watches
  const pullups_reps = responses.pullups_reps;
  const weighted_pullups_kg = responses.weighted_pullups_kg;
  const muscle_ups_type = responses.muscle_ups_type;
  const weighted_muscle_ups_kg = responses.weighted_muscle_ups_kg;
  // EMPUJE block watches
  const dips_reps = responses.dips_reps;
  const weighted_dips_kg = responses.weighted_dips_kg;
  const weighted_dips_reps = responses.weighted_dips_reps;
  const extreme_dips_kg = responses.extreme_dips_kg;
  const extreme_dips_reps = responses.extreme_dips_reps;
  // HANDSTAND block watches
  const handstand_level = responses.handstand_level;
  const handstand_one_arm = responses.handstand_one_arm;
  const handstand_90_degree = responses.handstand_90_degree;
  const handstand_dynamic_one_arm = responses.handstand_dynamic_one_arm;
  // FRONT LEVER block watches
  const front_lever_level = responses.front_lever_level;
  const front_lever_dynamic = responses.front_lever_dynamic;
  const front_lever_elite = responses.front_lever_elite;
  const front_lever_victorian = responses.front_lever_victorian;
  const front_lever_sat_supino = responses.front_lever_sat_supino;
  // PLANCHE block watches
  const planche_level = responses.planche_level;
  const planche_dynamic = responses.planche_dynamic;
  const planche_elite = responses.planche_elite;
  const planche_zanetti = responses.planche_zanetti;
  const planche_pelican = responses.planche_pelican;
  // BEGINNER block watches
  const standard_pushups = responses.standard_pushups;
  const knee_pushups_level = responses.knee_pushups_level;
  const australian_rows_level = responses.australian_rows_level;

  // Real-time scoring logic
  function calcTironScore() {
    // Si es principiante, asignar score base
    if (responses.abilities?.includes('ninguno')) {
      return 20; // Score base para principiantes
    }
    
    let score = 0;
    // pullups_reps
    if (pullups_reps === '3') score += 1;
    if (pullups_reps === '10') score += 2;
    if (pullups_reps === '18') score += 3;
    if (pullups_reps === '30') score += 4;
    if (pullups_reps === '35') score += 5;
    // weighted_pullups_kg
    if (pullups_reps && Number(pullups_reps) >= 10 && weighted_pullups_kg) {
      if (weighted_pullups_kg === '20') score += 1;
      if (weighted_pullups_kg === '30') score += 2;
      if (weighted_pullups_kg === '40') score += 3;
      if (weighted_pullups_kg === '45') score += 4;
    }
    // muscle_ups_type
    if (muscle_ups_type === 'kipping') score += 1;
    if (muscle_ups_type === 'strict') score += 2;
    if (muscle_ups_type === 'multiple_strict') score += 3;
    if (muscle_ups_type === 'none') score += 0;
    // weighted_muscle_ups_kg
    if ((muscle_ups_type === 'strict' || muscle_ups_type === 'multiple_strict') && weighted_muscle_ups_kg) {
      if (weighted_muscle_ups_kg === '7') score += 1;
      if (weighted_muscle_ups_kg === '14') score += 2;
      if (weighted_muscle_ups_kg === '15') score += 3;
      if (weighted_muscle_ups_kg === '20') score += 4;
    }
    return score;
  }
  function calcEmpujeScore() {
    // Si es principiante, asignar score base
    if (responses.abilities?.includes('ninguno')) {
      return 20; // Score base para principiantes
    }
    
    let score = 0;
    
    // 1. DIPS BASE (máx 7 puntos)
    if (dips_reps === '8') score += 4;
    if (dips_reps === '18') score += 5;
    if (dips_reps === '35') score += 6;
    if (dips_reps === '40') score += 7;
    
    // 2. WEIGHTED DIPS (máx 6 puntos)
    if (responses.weighted_dips_kg && responses.weighted_dips_kg !== 'none') {
      // Nivel 2 (35+ dips)
      if (dips_reps === '35' || dips_reps === '40') {
        if (responses.weighted_dips_kg === 'single_40_60') score += 3;
        if (responses.weighted_dips_kg === 'multiple_40_60') score += 4;
        if (responses.weighted_dips_kg === 'single_60_80') score += 5;
        if (responses.weighted_dips_kg === 'multiple_60_80') score += 6;
      } else {
        // Nivel 1 (menos de 35 dips)
        if (responses.weighted_dips_kg === 'single_40_60') score += 3;
        if (responses.weighted_dips_kg === 'multiple_40_60') score += 4;
      }
    }
    
    // 3. EXTREME DIPS (máx 4 puntos)
    if (responses.extreme_dips_kg && responses.extreme_dips_kg !== 'none') {
      if (responses.extreme_dips_kg === '80_100') score += 1;
      if (responses.extreme_dips_kg === '80_100_reps') score += 2;
      if (responses.extreme_dips_kg === '100') score += 3;
      if (responses.extreme_dips_kg === '130') score += 4;
    }
    
    console.log('=== CÁLCULO EMPUJE ===');
    console.log('Dips base:', dips_reps, '→', score);
    console.log('Weighted dips:', responses.weighted_dips_kg);
    console.log('Extreme dips:', responses.extreme_dips_kg);
    console.log('TOTAL EMPUJE:', score);
    
    return score;
  }
  // HANDSTAND scoring
  function calcHandstandScore() {
    let score = 0;
    if (handstand_level === 'ocasional') score += 1;
    if (handstand_level === 'consistente') score += 2;
    if (handstand_level === 'hspu') score += 3;
    if (handstand_level === 'consistente' || handstand_level === 'hspu') {
      if (handstand_one_arm) score += 1;
      if (handstand_90_degree) score += 1;
      if (handstand_dynamic_one_arm) score += 1;
    }
    return score;
  }
  // FRONT LEVER scoring
  function calcFrontScore() {
    let score = 0;
    if (front_lever_level === 'tuck') score += 1;
    if (front_lever_level === 'tuck_advanced') score += 2;
    if (front_lever_level === 'front_lever') score += 3;
    if (front_lever_level === 'front_lever_touch') score += 4;
    // Dynamic progressions
    if (front_lever_level === 'tuck' || front_lever_level === 'tuck_advanced' || front_lever_level === 'front_lever') {
      if (front_lever_dynamic === 'tuck_pullup') score += 1;
      if (front_lever_dynamic === 'negative') score += 2;
      if (front_lever_dynamic === 'pullup') score += 3;
    }
    // Elite progressions
    if (front_lever_level === 'front_lever_touch') {
      if (front_lever_elite === 'pullup') score += 1;
      if (front_lever_elite === 'pullup_touch') score += 2;
      if (front_lever_elite === 'touch_wide') score += 3;
      if (front_lever_elite === 'sat') score += 4;
    }
    // World class
    if (front_lever_elite === 'sat') {
      if (front_lever_victorian) score += 1;
      if (front_lever_sat_supino) score += 1;
    }
    return score;
  }
  // PLANCHE scoring
  function calcPlancheScore() {
    let score = 0;
    if (planche_level === 'lean') score += 1;
    if (planche_level === 'tuck') score += 2;
    if (planche_level === 'advanced_tuck') score += 3;
    if (planche_level === 'straddle') score += 4;
    if (planche_level === 'full') score += 5;
    // Dynamic progressions
    if (planche_level === 'tuck' || planche_level === 'advanced_tuck' || planche_level === 'straddle' || planche_level === 'full') {
      if (planche_dynamic === 'tuck_negative') score += 1;
      if (planche_dynamic === 'tuck_press') score += 2;
      if (planche_dynamic === 'straddle_negative') score += 3;
    }
    // Elite skills
    if (planche_level === 'full') {
      if (planche_elite === 'full_press') score += 1;
      if (planche_elite === 'full_pushup') score += 2;
      if (planche_elite === 'maltese') score += 3;
    }
    // World class
    if (planche_elite === 'maltese') {
      if (planche_zanetti) score += 1;
      if (planche_pelican) score += 1;
    }
    return score;
  }

  // BEGINNER scoring
  function calcBeginnerScore() {
    let score = 0;
    // standard_pushups
    if (standard_pushups === 'yes') score += 3;
    // knee_pushups_level
    if (knee_pushups_level === 'minima') score += 2;
    if (knee_pushups_level === 'baja') score += 3;
    if (knee_pushups_level === 'media') score += 4;
    // australian_rows_level
    if (australian_rows_level === 'minima') score += 2;
    if (australian_rows_level === 'baja') score += 3;
    if (australian_rows_level === 'media') score += 4;
    return score;
  }

  // Update score state in real time
  useMemo(() => {
    setScore((prev) => ({
      ...prev,
      tiron: calcTironScore(),
      empuje: calcEmpujeScore(),
      handstand: calcHandstandScore(),
      front: calcFrontScore(),
      planche: calcPlancheScore(),
      beginner: calcBeginnerScore(),
    }));
    // eslint-disable-next-line
  }, [pullups_reps, weighted_pullups_kg, muscle_ups_type, weighted_muscle_ups_kg, dips_reps, weighted_dips_kg, weighted_dips_reps, extreme_dips_kg, extreme_dips_reps, handstand_level, handstand_one_arm, handstand_90_degree, handstand_dynamic_one_arm, front_lever_level, front_lever_dynamic, front_lever_elite, front_lever_victorian, front_lever_sat_supino, planche_level, planche_dynamic, planche_elite, planche_zanetti, planche_pelican, standard_pushups, knee_pushups_level, australian_rows_level]);

  // Calculate user level for each block based on RAW scores (not normalized)
  const calculateUserLevels = (scores: typeof score) => {
    const levels = {
      tiron_level: 1,
      empuje_level: 1,
      handstand_level: scores.handstand, // 1-6 direct mapping
      front_lever_level: 1,
      planche_level: 1
    };

    // Tirón levels: 1 (0-7), 2 (8-12), 3 (13-16)
    if (scores.tiron >= 8 && scores.tiron <= 12) levels.tiron_level = 2;
    else if (scores.tiron >= 13) levels.tiron_level = 3;

    // Empuje levels: 1 (0-7), 2 (8-13), 3 (14-17)
    if (scores.empuje >= 8 && scores.empuje <= 13) levels.empuje_level = 2;
    else if (scores.empuje >= 14) levels.empuje_level = 3;

    // Front Lever levels: 1(0-2), 2(3), 3(4), 4(5), 5(6-7), 6(8), 7(9-10)
    if (scores.front === 3) levels.front_lever_level = 2;
    else if (scores.front === 4) levels.front_lever_level = 3;
    else if (scores.front === 5) levels.front_lever_level = 4;
    else if (scores.front >= 6 && scores.front <= 7) levels.front_lever_level = 5;
    else if (scores.front === 8) levels.front_lever_level = 6;
    else if (scores.front >= 9) levels.front_lever_level = 7;

    // Planche levels: 1(0-2), 2(3), 3(4), 4(5), 5(6), 6(7), 7(8), 8(9-10)
    if (scores.planche === 3) levels.planche_level = 2;
    else if (scores.planche === 4) levels.planche_level = 3;
    else if (scores.planche === 5) levels.planche_level = 4;
    else if (scores.planche === 6) levels.planche_level = 5;
    else if (scores.planche === 7) levels.planche_level = 6;
    else if (scores.planche === 8) levels.planche_level = 7;
    else if (scores.planche >= 9) levels.planche_level = 8;

    return levels;
  };

  // ARZA CARD normalization formula: 99 × (Score/Max)^0.6
  const normalizeScore = (rawScore: number, maxScore: number) => {
    if (rawScore === 0) return 0;
    return Math.round(99 * Math.pow(rawScore / maxScore, 0.6));
  };

  // Función de validación condicional mínima
  function validate(responses: ResponseState) {
    const errors: { [key: string]: string } = {};
    if (!responses.abilities || responses.abilities.length === 0) {
      errors.abilities = 'Selecciona al menos una habilidad';
    }
    // Tirón
    if (responses.abilities.includes('pullups')) {
      if (!responses.pullups_reps) errors.pullups_reps = 'Completa tus repeticiones de dominadas';
      if (!responses.muscle_ups_type) errors.muscle_ups_type = 'Selecciona tu tipo de muscle up';
    }
    // Empuje
    if (responses.abilities.includes('dips')) {
      if (!responses.dips_reps) errors.dips_reps = 'Completa tus repeticiones de fondos';
    }
    // Handstand
    if (responses.abilities.includes('handstand')) {
      if (!responses.handstand_level) errors.handstand_level = 'Selecciona tu nivel de handstand';
    }
    // Front lever
    if (responses.abilities.includes('front_lever')) {
      if (!responses.front_lever_level) errors.front_lever_level = 'Selecciona tu nivel de front lever';
    }
    // Planche
    if (responses.abilities.includes('planche')) {
      if (!responses.planche_level) errors.planche_level = 'Selecciona tu nivel de planche';
    }
    // Principiante
    if (responses.abilities.includes('ninguno')) {
      if (!responses.standard_pushups) errors.standard_pushups = 'Indica si puedes hacer pushups estándar';
      if (!responses.knee_pushups_level) errors.knee_pushups_level = 'Selecciona tu nivel de pushups en rodillas';
      if (!responses.australian_rows_level) errors.australian_rows_level = 'Selecciona tu nivel de australian rows';
    }
    return errors;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Validación condicional mínima
    const errors = validate(responses);
    if (Object.keys(errors).length > 0) {
      setError(errors);
      setLoading(false);
      return;
    }
    try {
      // Mapeo responses -> evaluationData
      const evaluationData = {
        user_id: userId,
        can_pullups: responses.abilities?.includes('pullups') || false,
        can_dips: responses.abilities?.includes('dips') || false,
        can_handstand: responses.abilities?.includes('handstand') || false,
        can_front_lever: responses.abilities?.includes('front_lever') || false,
        can_planche: responses.abilities?.includes('planche') || false,
        is_beginner: responses.abilities?.includes('ninguno') || false,
        // Tirón
        ...(responses.abilities?.includes('pullups') && {
          pullups_reps: responses.pullups_reps ? parseInt(responses.pullups_reps) : null,
          weighted_pullups_kg: responses.weighted_pullups_kg ? parseFloat(responses.weighted_pullups_kg) : null,
          muscle_ups_type: responses.muscle_ups_type || null,
          weighted_muscle_ups_kg: responses.weighted_muscle_ups_kg ? parseFloat(responses.weighted_muscle_ups_kg) : null,
        }),
        // Empuje
        ...(responses.abilities?.includes('dips') && {
          dips_reps: responses.dips_reps === '35+' ? 40 : 
                     parseInt(responses.dips_reps?.split('-').pop() || '0'),
          
          // CORRECCIÓN: weighted_dips_kg tiene formato "multiple_60_80"
          weighted_dips_kg: responses.weighted_dips_kg?.includes('80') ? 80 :
                            responses.weighted_dips_kg?.includes('60') ? 60 :
                            responses.weighted_dips_kg?.includes('40') ? 40 : null,
          
          weighted_dips_reps: responses.weighted_dips_kg?.includes('multiple') || false,
          
          // CORRECCIÓN: el peso extremo está en extreme_dips_kg, pero necesitamos extraer el valor correcto
          extreme_dips_kg: responses.extreme_dips_kg ? 
            (() => {
              if (responses.extreme_dips_kg === 'none') return null;
              if (responses.extreme_dips_kg === '80_100') return 90;
              if (responses.extreme_dips_kg === '80_100_reps') return 90;
              if (responses.extreme_dips_kg === '100') return 100;
              if (responses.extreme_dips_kg === '130') return 130;
              return null;
            })() : null,
          
          extreme_dips_reps: false, // Por ahora siempre false
        }),
        // Handstand
        ...(responses.abilities?.includes('handstand') && {
          handstand_level: responses.handstand_level || null,
          handstand_one_arm: !!responses.handstand_one_arm,
          handstand_90_degree: !!responses.handstand_90_degree,
          handstand_dynamic_one_arm: !!responses.handstand_dynamic_one_arm,
        }),
        // Front Lever
        ...(responses.abilities?.includes('front_lever') && {
          front_lever_level: responses.front_lever_level || null,
          front_lever_tuck_pullup: responses.front_lever_dynamic?.includes('tuck_pullup') || false,
          front_lever_negative: responses.front_lever_dynamic?.includes('negative') || false,
          front_lever_pullup: responses.front_lever_dynamic?.includes('pullup') || false,
          front_lever_pullup_touch: responses.front_lever_elite?.includes('pullup_touch') || false,
          front_lever_touch_wide: responses.front_lever_elite?.includes('touch_wide') || false,
          front_lever_sat: responses.front_lever_elite?.includes('sat') || false,
          front_lever_victorian: !!responses.front_lever_victorian,
          front_lever_sat_supino: !!responses.front_lever_sat_supino,
        }),
        // Planche
        ...(responses.abilities?.includes('planche') && {
          planche_level: responses.planche_level || null,
          planche_tuck_negative: responses.planche_dynamic === 'tuck_negative',
          planche_tuck_press: responses.planche_dynamic === 'tuck_press',
          planche_straddle_negative: responses.planche_dynamic === 'straddle_negative',
          planche_full_press: responses.planche_elite === 'full_press',
          planche_full_pushup: responses.planche_elite === 'full_pushup',
          planche_maltese: responses.planche_elite === 'maltese',
          planche_zanetti: !!responses.planche_zanetti,
          planche_pelican: !!responses.planche_pelican,
        }),
        // Principiante
        ...(responses.abilities?.includes('ninguno') && {
          standard_pushups: responses.standard_pushups === 'yes' ? true : (responses.standard_pushups === 'no' ? false : null),
          knee_pushups_level: responses.knee_pushups_level || null,
          australian_rows_level: responses.australian_rows_level || null,
        }),
        tiron_score: Math.round(score.tiron || 0),
        empuje_score: Math.round(score.empuje || 0),
        handstand_score: Math.round(score.handstand || 0),
        front_lever_score: Math.round(score.front || 0),
        planche_score: Math.round(score.planche || 0)
        // TODO: Agregar columna beginner_score a la tabla arza_evaluations en Supabase
        // beginner_score: Math.round(score.beginner || 0)
      };
      // === DEBUG ===
      console.log('=== MAPEO DE DATOS ===');
      console.log('Responses tirón:', {
        pullups_reps: responses.pullups_reps,
        weighted_pullups_kg: responses.weighted_pullups_kg,
        muscle_ups_type: responses.muscle_ups_type,
        weighted_muscle_ups_kg: responses.weighted_muscle_ups_kg
      });

      console.log('Responses empuje:', {
        dips_reps: responses.dips_reps,
        weighted_dips_kg: responses.weighted_dips_kg,
        weighted_dips_reps: responses.weighted_dips_reps,
        extreme_dips_kg: responses.extreme_dips_kg,
        extreme_dips_reps: responses.extreme_dips_reps
      });

      console.log('Responses handstand:', {
        handstand_level: responses.handstand_level,
        handstand_one_arm: responses.handstand_one_arm,
        handstand_90_degree: responses.handstand_90_degree,
        handstand_dynamic_one_arm: responses.handstand_dynamic_one_arm
      });

      console.log('Responses front lever:', {
        front_lever_level: responses.front_lever_level,
        front_lever_dynamic: responses.front_lever_dynamic,
        front_lever_elite: responses.front_lever_elite,
        front_lever_victorian: responses.front_lever_victorian,
        front_lever_sat_supino: responses.front_lever_sat_supino
      });

      console.log('Responses planche:', {
        planche_level: responses.planche_level,
        planche_dynamic: responses.planche_dynamic,
        planche_elite: responses.planche_elite,
        planche_zanetti: responses.planche_zanetti,
        planche_pelican: responses.planche_pelican
      });

      console.log('Responses beginner:', {
        standard_pushups: responses.standard_pushups,
        knee_pushups_level: responses.knee_pushups_level,
        australian_rows_level: responses.australian_rows_level
      });

      console.log('=== DATOS A ENVIAR ===');
      console.log('evaluationData:', evaluationData);
      console.log('Campos incluidos:', Object.keys(evaluationData));
      console.log('abilities seleccionadas:', responses.abilities);

      // Después del mapeo
      console.log('Datos mapeados tirón:', {
        pullups_reps: evaluationData.pullups_reps,
        weighted_pullups_kg: evaluationData.weighted_pullups_kg,
        muscle_ups_type: evaluationData.muscle_ups_type,
        weighted_muscle_ups_kg: evaluationData.weighted_muscle_ups_kg
      });

      console.log('Datos mapeados empuje:', {
        dips_reps: evaluationData.dips_reps,
        weighted_dips_kg: evaluationData.weighted_dips_kg,
        weighted_dips_reps: evaluationData.weighted_dips_reps,
        extreme_dips_kg: evaluationData.extreme_dips_kg,
        extreme_dips_reps: evaluationData.extreme_dips_reps
      });

      console.log('Datos mapeados handstand:', {
        handstand_level: evaluationData.handstand_level,
        handstand_one_arm: evaluationData.handstand_one_arm,
        handstand_90_degree: evaluationData.handstand_90_degree,
        handstand_dynamic_one_arm: evaluationData.handstand_dynamic_one_arm
      });

      console.log('Datos mapeados front lever:', {
        front_lever_level: evaluationData.front_lever_level,
        front_lever_tuck_pullup: evaluationData.front_lever_tuck_pullup,
        front_lever_negative: evaluationData.front_lever_negative,
        front_lever_pullup: evaluationData.front_lever_pullup,
        front_lever_pullup_touch: evaluationData.front_lever_pullup_touch,
        front_lever_touch_wide: evaluationData.front_lever_touch_wide,
        front_lever_sat: evaluationData.front_lever_sat,
        front_lever_victorian: evaluationData.front_lever_victorian,
        front_lever_sat_supino: evaluationData.front_lever_sat_supino
      });

      console.log('Datos mapeados planche:', {
        planche_level: evaluationData.planche_level,
        planche_tuck_negative: evaluationData.planche_tuck_negative,
        planche_tuck_press: evaluationData.planche_tuck_press,
        planche_straddle_negative: evaluationData.planche_straddle_negative,
        planche_full_press: evaluationData.planche_full_press,
        planche_full_pushup: evaluationData.planche_full_pushup,
        planche_maltese: evaluationData.planche_maltese,
        planche_zanetti: evaluationData.planche_zanetti,
        planche_pelican: evaluationData.planche_pelican
      });

      console.log('Datos mapeados beginner:', {
        standard_pushups: evaluationData.standard_pushups,
        knee_pushups_level: evaluationData.knee_pushups_level,
        australian_rows_level: evaluationData.australian_rows_level
      });

      console.log('=== EVALUATIONDATA FINAL ===');
      console.log('evaluationData completo:', evaluationData);
      console.log('¿Incluye weighted_dips_kg?', 'weighted_dips_kg' in evaluationData);
      console.log('¿Incluye extreme_dips_kg?', 'extreme_dips_kg' in evaluationData);
      console.log('Valor weighted_dips_kg:', evaluationData.weighted_dips_kg);
      console.log('Valor extreme_dips_kg:', evaluationData.extreme_dips_kg);
      console.log('Todas las claves de evaluationData:', Object.keys(evaluationData));
      // Insert en Supabase y obtén el ID
      const { data: evalData, error: evalError } = await supabase
        .from('arza_evaluations')
        .insert([evaluationData])
        .select('id')
        .single();
      if (evalError || !evalData) throw evalError || new Error('No se pudo guardar la evaluación');
      const evaluationId = evalData.id;
      setError(null); // Limpia los errores tras éxito
      // Redirige o muestra éxito
      router.push(`/results/${evaluationId}`);
    } catch (e: any) {
      setError(e.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Lógica para mostrar bloques según habilidades seleccionadas
  const nextBlock = () => {
    let idx = blockOrder.indexOf(currentBlock);
    while (idx < blockOrder.length - 1) {
      idx++;
      if (
        (blockOrder[idx] === 'tiron' && responses.abilities.includes('pullups')) ||
        (blockOrder[idx] === 'empuje' && responses.abilities.includes('dips')) ||
        (blockOrder[idx] === 'handstand' && responses.abilities.includes('handstand')) ||
        (blockOrder[idx] === 'front_lever' && responses.abilities.includes('front_lever')) ||
        (blockOrder[idx] === 'planche' && responses.abilities.includes('planche')) ||
        (blockOrder[idx] === 'beginner' && responses.abilities.includes('ninguno')) ||
        blockOrder[idx] === 'finish'
      ) {
        setCurrentBlock(blockOrder[idx] as typeof currentBlock);
        break;
      }
    }
  };
  const prevBlock = () => {
    let idx = blockOrder.indexOf(currentBlock);
    while (idx > 0) {
      idx--;
      if (
        (blockOrder[idx] === 'tiron' && responses.abilities.includes('pullups')) ||
        (blockOrder[idx] === 'empuje' && responses.abilities.includes('dips')) ||
        (blockOrder[idx] === 'handstand' && responses.abilities.includes('handstand')) ||
        (blockOrder[idx] === 'front_lever' && responses.abilities.includes('front_lever')) ||
        (blockOrder[idx] === 'planche' && responses.abilities.includes('planche')) ||
        (blockOrder[idx] === 'beginner' && responses.abilities.includes('ninguno')) ||
        blockOrder[idx] === 'skills'
      ) {
        setCurrentBlock(blockOrder[idx] as typeof currentBlock);
        break;
      }
    }
  };

  // --- FONDOS EXTREMOS ---
  const weightedDipsOptions = [
    { label: 'No he probado', value: 'none' },
    { label: '40-60 kg', value: 'single_40_60' },
    { label: '40-60 kg múltiples reps', value: 'multiple_40_60' },
    { label: '60-80 kg', value: 'single_60_80' },
    { label: '60-80 kg múltiples reps', value: 'multiple_60_80' },
  ];
  // Linter fix: showExtremeDips solo si weighted_dips_kg es 'single_60_80' o 'multiple_60_80'
  const showExtremeDips = responses.weighted_dips_kg === 'single_60_80' || responses.weighted_dips_kg === 'multiple_60_80';
  console.log('weighted_dips_kg value:', responses.weighted_dips_kg);
  console.log('showExtremeDips:', showExtremeDips);

  // --- PLANCHE ---
  const plancheLevel = responses.planche_level || '';
  const showPlancheDynamic = ['lean', 'tuck', 'advanced_tuck', 'straddle'].includes(plancheLevel);
  const showPlancheElite = plancheLevel === 'full';
  console.log('planche_level:', plancheLevel);
  console.log('showPlancheDynamic:', showPlancheDynamic);
  console.log('showPlancheElite:', showPlancheElite);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-8 px-2">
      {/* Logo ARZA */}
      <div className="w-full flex justify-center pt-6 pb-2">
        <Image src="/arza-logo.svg" alt="ARZA Logo" width={160} height={60} priority className="object-contain" />
      </div>
      {/* Progreso */}
      <div className="mb-6 text-center">
        <span className="text-sm font-medium text-gray-700">Paso {currentStep} de {totalSteps} &bull; <span style={{ color: GREEN }}>{blockLabels[currentBlock]}</span></span>
      </div>
      <div className="w-full max-w-2xl flex flex-col items-center justify-center min-h-[420px]">
        <AnimatePresence mode="wait">
          {currentBlock === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-white rounded-2xl shadow-xl p-10 border border-gray-100 flex flex-col items-center"
            >
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8 leading-tight">
                ¿Qué movimientos puedes<br className="hidden md:block" />
                realizar con buena técnica?*
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg mb-8">
                {openingOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                      ${responses.abilities.includes(opt.value as Ability)
                        ? 'border-[#d3b67b] shadow-md'
                        : 'border-gray-300 hover:border-[#d3b67b]'}
                    `}
                  >
                    <input
                      type="checkbox"
                      name="abilities"
                      checked={responses.abilities.includes(opt.value as Ability)}
                      onChange={() => handleAbilityChange(opt.value as Ability)}
                      className="accent-[#d3b67b] w-5 h-5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {error && typeof error === 'object' && error.abilities && (
                <div className="text-red-500 text-sm mt-2 text-center">{error.abilities}</div>
              )}
              <button
                type="button"
                onClick={() => {
                  // Si seleccionó "ninguno", ir directamente al bloque de principiantes
                  if (responses.abilities?.includes('ninguno')) {
                    setCurrentBlock('beginner');
                    return;
                  }
                  
                  // Si no seleccionó ninguna habilidad, mostrar error
                  if (!responses.abilities || responses.abilities.length === 0) {
                    setError({ abilities: 'Selecciona al menos una habilidad' });
                    return;
                  }
                  
                  // Lógica normal para ir al siguiente bloque
                  nextBlock();
                }}
                style={{ background: GOLD, color: '#222' }}
                className="mt-4 px-10 py-3 rounded-lg font-bold shadow hover:scale-105 transition-all text-lg"
              >
                Siguiente
              </button>
            </motion.div>
          )}
          {currentBlock === 'tiron' && responses.abilities.includes('pullups') && (
            <motion.div
              key="tiron"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-white rounded-2xl shadow-xl p-10 border border-gray-100 flex flex-col items-center"
            >
              {/* Barra de progreso */}
              <div className="w-full flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-gray-700">Pregunta {currentStep} de {totalSteps}</span>
                <span className="text-xs font-medium text-gray-700">{Math.round((currentStep/totalSteps)*100)}% Completado</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
                <div className="h-full rounded-full" style={{ width: `${(currentStep/totalSteps)*100}%`, background: GREEN }} />
              </div>
              {/* Pregunta 1 */}
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8 leading-tight">
                ¿Cuántas dominadas estrictas puedes hacer?
              </h2>
              <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                {[{ label: '1-3', value: 3 }, { label: '4-10', value: 10 }, { label: '10-18', value: 18 }, { label: '18-30', value: 30 }, { label: '30+', value: 35 }].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                    ${responses.pullups_reps === String(opt.value) ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                  `}>
                    <input
                      type="radio"
                      name="pullups_reps"
                      value={String(opt.value)}
                      checked={responses.pullups_reps === String(opt.value)}
                      onChange={handleInputChange}
                      className="accent-[#d3b67b] w-5 h-5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {/* Pregunta 2 condicional */}
              {responses.pullups_reps && Number(responses.pullups_reps) >= 10 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-4 mt-2">¿Cuánto peso extra puedes añadir en dominadas?</h2>
                  <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                    {[{ label: 'No he probado', value: 0 }, { label: '10-20 kg', value: 20 }, { label: '20-30 kg', value: 30 }, { label: '30-40 kg', value: 40 }, { label: '40+ kg', value: 45 }].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                        ${responses.weighted_pullups_kg === String(opt.value) ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                      `}>
                        <input
                          type="radio"
                          name="weighted_pullups_kg"
                          value={String(opt.value)}
                          checked={responses.weighted_pullups_kg === String(opt.value)}
                          onChange={handleInputChange}
                          className="accent-[#d3b67b] w-5 h-5"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
              {/* Pregunta 3 */}
              <h2 className="text-xl font-bold text-gray-900 text-center mb-4 mt-2">¿Qué tipo de muscle-up puedes hacer?</h2>
              <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                {[{ label: 'Sí, con kipping', value: 'kipping' }, { label: 'Sí, forma estricta', value: 'strict' }, { label: 'Múltiples reps estrictas', value: 'multiple_strict' }, { label: 'No puedo hacer muscle up', value: 'none' }].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                    ${responses.muscle_ups_type === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                  `}>
                    <input
                      type="radio"
                      name="muscle_ups_type"
                      value={opt.value}
                      checked={responses.muscle_ups_type === opt.value}
                      onChange={handleInputChange}
                      className="accent-[#d3b67b] w-5 h-5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {/* Pregunta 4 condicional */}
              {(responses.muscle_ups_type === 'strict' || responses.muscle_ups_type === 'multiple_strict') && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-4 mt-2">¿Cuánto peso extra puedes añadir en muscle-up estricto?</h2>
                  <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                    {[{ label: 'No he probado', value: 0 }, { label: '7 kg', value: 7 }, { label: '14 kg', value: 14 }, { label: '15 kg', value: 15 }, { label: '20 kg', value: 20 }].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                        ${responses.weighted_muscle_ups_kg === String(opt.value) ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                      `}>
                        <input
                          type="radio"
                          name="weighted_muscle_ups_kg"
                          value={String(opt.value)}
                          checked={responses.weighted_muscle_ups_kg === String(opt.value)}
                          onChange={handleInputChange}
                          className="accent-[#d3b67b] w-5 h-5"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
              <div className="flex w-full justify-between mt-8">
                <button type="button" onClick={prevBlock} className="px-6 py-2 rounded font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all">← Anterior</button>
                {/* El botón Siguiente solo aparece si se responde la pregunta principal y las condicionales si aplican */}
                {responses.pullups_reps &&
                  (!((responses.pullups_reps && Number(responses.pullups_reps) >= 10) && !responses.weighted_pullups_kg) &&
                  (!((responses.muscle_ups_type === 'strict' || responses.muscle_ups_type === 'multiple_strict') && !responses.weighted_muscle_ups_kg))) && (
                  <button type="button" onClick={nextBlock} style={{ background: GOLD, color: '#222' }} className="px-8 py-2 rounded font-bold shadow hover:scale-105 transition-all">Siguiente →</button>
                )}
              </div>
            </motion.div>
          )}
          {currentBlock === 'empuje' && responses.abilities.includes('dips') && (
            <motion.div
              key="empuje"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-white rounded-2xl shadow-xl p-10 border border-gray-100 flex flex-col items-center"
            >
              {/* Barra de progreso */}
              <div className="w-full flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-gray-700">Pregunta {currentStep} de {totalSteps}</span>
                <span className="text-xs font-medium text-gray-700">{Math.round((currentStep/totalSteps)*100)}% Completado</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
                <div className="h-full rounded-full" style={{ width: `${(currentStep/totalSteps)*100}%`, background: GREEN }} />
              </div>
              {/* Pregunta 1 */}
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8 leading-tight">
                ¿Cuántos fondos estrictos puedes hacer?
              </h2>
              <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                {[{ label: '1-8', value: 8 }, { label: '8-18', value: 18 }, { label: '18-35', value: 35 }, { label: '35+', value: 40 }].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                    ${responses.dips_reps === String(opt.value) ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                  `}>
                    <input
                      type="radio"
                      name="dips_reps"
                      value={String(opt.value)}
                      checked={responses.dips_reps === String(opt.value)}
                      onChange={handleInputChange}
                      className="accent-[#d3b67b] w-5 h-5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {/* Pregunta 2 condicional: Weighted dips */}
              {responses.dips_reps && Number(responses.dips_reps) >= 8 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-4 mt-2">¿Cuánto peso extra puedes añadir en fondos?</h2>
                  <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                    {/* Level 1 options (dips_reps < 35) */}
                    {(responses.dips_reps === '8' || responses.dips_reps === '18') && [{ label: 'No he probado', value: 'none' }, { label: '40-60 kg', value: 'single_40_60' }, { label: '40-60 kg múltiples reps', value: 'multiple_40_60' }].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                        ${responses.weighted_dips_kg === String(opt.value) ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                      `}>
                        <input
                          type="radio"
                          name="weighted_dips_kg"
                          value={String(opt.value)}
                          checked={responses.weighted_dips_kg === String(opt.value)}
                          onChange={handleInputChange}
                          className="accent-[#d3b67b] w-5 h-5"
                        />
                        {opt.label}
                      </label>
                    ))}
                    {/* Level 2 options (dips_reps >= 35) */}
                    {(responses.dips_reps === '35' || responses.dips_reps === '40') && [{ label: 'No he probado', value: 'none' }, { label: '40-60 kg', value: 'single_40_60' }, { label: '40-60 kg múltiples reps', value: 'multiple_40_60' }, { label: '60-80 kg', value: 'single_60_80' }, { label: '60-80 kg múltiples reps', value: 'multiple_60_80' }].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                        ${responses.weighted_dips_kg === String(opt.value) ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                      `}>
                        <input
                          type="radio"
                          name="weighted_dips_kg"
                          value={String(opt.value)}
                          checked={responses.weighted_dips_kg === String(opt.value)}
                          onChange={handleInputChange}
                          className="accent-[#d3b67b] w-5 h-5"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
              {/* Pregunta 3 condicional: Fondos extremos */}
              {showExtremeDips && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-4 mt-2">¿Cuánto peso puedes manejar en fondos extremos?</h2>
                  <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                    {[
                      { label: 'No he probado', value: 'none' },
                      { label: '80-100 kg', value: '80_100' },
                      { label: '80-100 kg múltiples reps', value: '80_100_reps' },
                      { label: '100 kg', value: '100' },
                      { label: '130 kg', value: '130' }
                    ].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                        ${responses.extreme_dips_kg === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                      `}>
                        <input
                          type="radio"
                          name="extreme_dips_kg"
                          value={opt.value}
                          checked={responses.extreme_dips_kg === opt.value}
                          onChange={e => {
                            handleInputChange(e);
                            setResponses(prev => ({ ...prev, extreme_dips_reps: opt.value === '80_100_reps' }));
                          }}
                          className="accent-[#d3b67b] w-5 h-5"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
              <div className="flex w-full justify-between mt-8">
                <button type="button" onClick={prevBlock} className="px-6 py-2 rounded font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all">← Anterior</button>
                {/* El botón Siguiente solo aparece si se responde la pregunta principal y las condicionales si aplican */}
                {responses.dips_reps &&
                  (!((responses.dips_reps && Number(responses.dips_reps) >= 8) && !responses.weighted_dips_kg) &&
                  (!(showExtremeDips && !responses.extreme_dips_kg))) && (
                  <button type="button" onClick={nextBlock} style={{ background: GOLD, color: '#222' }} className="px-8 py-2 rounded font-bold shadow hover:scale-105 transition-all">Siguiente →</button>
                )}
              </div>
            </motion.div>
          )}
          {currentBlock === 'handstand' && responses.abilities.includes('handstand') && (
            <motion.div
              key="handstand"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-white rounded-2xl shadow-xl p-10 border border-gray-100 flex flex-col items-center"
            >
              {/* Barra de progreso */}
              <div className="w-full flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-gray-700">Pregunta {currentStep} de {totalSteps}</span>
                <span className="text-xs font-medium text-gray-700">{Math.round((currentStep/totalSteps)*100)}% Completado</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
                <div className="h-full rounded-full" style={{ width: `${(currentStep/totalSteps)*100}%`, background: GREEN }} />
              </div>
              {/* Pregunta principal */}
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8 leading-tight">
                ¿Cuál es tu nivel de handstand?
              </h2>
              <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                {[{ label: 'Éxito ocasional', value: 'ocasional' }, { label: 'Mantención consistente', value: 'consistente' }, { label: 'HSPU (flexiones)', value: 'hspu' }].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                    ${responses.handstand_level === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                  `}>
                    <input
                      type="radio"
                      name="handstand_level"
                      value={opt.value}
                      checked={responses.handstand_level === opt.value}
                      onChange={handleInputChange}
                      className="accent-[#d3b67b] w-5 h-5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {/* Sub-preguntas condicionales */}
              {(responses.handstand_level === 'consistente' || responses.handstand_level === 'hspu') && (
                <div className="flex flex-col gap-4 w-full max-w-lg mb-8 mt-2">
                  {[{ label: 'Handstand a una mano', value: 'handstand_one_arm' }, { label: 'Flexión 90°', value: 'handstand_90_degree' }, { label: 'Movimientos dinámicos a una mano', value: 'handstand_dynamic_one_arm' }].map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                      border-gray-300 hover:border-[#d3b67b]`}>
                      <input
                        type="checkbox"
                        name={opt.value as any}
                        checked={!!responses[opt.value as keyof typeof responses]}
                        onChange={handleInputChange}
                        className="accent-[#d3b67b] w-5 h-5"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}
              <div className="flex w-full justify-between mt-8">
                <button type="button" onClick={prevBlock} className="px-6 py-2 rounded font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all">← Anterior</button>
                {responses.handstand_level && (
                  <button type="button" onClick={nextBlock} style={{ background: GOLD, color: '#222' }} className="px-8 py-2 rounded font-bold shadow hover:scale-105 transition-all">Siguiente →</button>
                )}
              </div>
            </motion.div>
          )}
          {currentBlock === 'front_lever' && responses.abilities.includes('front_lever') && (
            <motion.div
              key="front_lever"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-white rounded-2xl shadow-xl p-10 border border-gray-100 flex flex-col items-center"
            >
              {/* Barra de progreso */}
              <div className="w-full flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-gray-700">Pregunta {currentStep} de {totalSteps}</span>
                <span className="text-xs font-medium text-gray-700">{Math.round((currentStep/totalSteps)*100)}% Completado</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
                <div className="h-full rounded-full" style={{ width: `${(currentStep/totalSteps)*100}%`, background: GREEN }} />
              </div>
              {/* Pregunta principal */}
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8 leading-tight">
                ¿Cuál es tu nivel de front lever?
              </h2>
              <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                {[{ label: 'No puedo', value: 'none' }, { label: 'Tuck', value: 'tuck' }, { label: 'Tuck Avanzado', value: 'tuck_advanced' }, { label: 'Front Lever', value: 'front_lever' }, { label: 'Front Lever Touch', value: 'front_lever_touch' }].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                    ${responses.front_lever_level === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                  `}>
                    <input
                      type="radio"
                      name="front_lever_level"
                      value={opt.value}
                      checked={responses.front_lever_level === opt.value}
                      onChange={handleInputChange}
                      className="accent-[#d3b67b] w-5 h-5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {/* Sub-pregunta: Progresiones dinámicas */}
              {(responses.front_lever_level === 'tuck' || responses.front_lever_level === 'tuck_advanced' || responses.front_lever_level === 'front_lever') && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-4 mt-2">Progresiones dinámicas</h2>
                  <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                    {[{ label: 'Ninguno', value: 'none' }, { label: 'Tuck Pull-up', value: 'tuck_pullup' }, { label: 'Front Lever Negativos Controlados', value: 'negative' }, { label: 'Front Lever Pull-up', value: 'pullup' }].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                        ${responses.front_lever_dynamic === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                      `}>
                        <input
                          type="radio"
                          name="front_lever_dynamic"
                          value={opt.value}
                          checked={responses.front_lever_dynamic === opt.value}
                          onChange={handleInputChange}
                          className="accent-[#d3b67b] w-5 h-5"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
              {/* Sub-pregunta: Progresiones élite */}
              {responses.front_lever_level === 'front_lever_touch' && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-4 mt-2">Progresiones élite</h2>
                  <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                    {[{ label: 'Ninguno', value: 'none' }, { label: 'Front Lever Pull-up', value: 'pullup' }, { label: 'Front Lever Pull-up a Touch', value: 'pullup_touch' }, { label: 'Touch agarre ancho', value: 'touch_wide' }, { label: 'SAT', value: 'sat' }].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                        ${responses.front_lever_elite === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                      `}>
                        <input
                          type="radio"
                          name="front_lever_elite"
                          value={opt.value}
                          checked={responses.front_lever_elite === opt.value}
                          onChange={handleInputChange}
                          className="accent-[#d3b67b] w-5 h-5"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
              {/* Sub-pregunta: World class */}
              {responses.front_lever_elite === 'sat' && (
                <div className="flex flex-col gap-4 w-full max-w-lg mb-8 mt-2">
                  {[{ label: 'Victorian Cross', value: 'front_lever_victorian' }, { label: 'SAT Supino', value: 'front_lever_sat_supino' }].map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                      border-gray-300 hover:border-[#d3b67b]`}>
                      <input
                        type="checkbox"
                        name={opt.value as any}
                        checked={!!responses[opt.value as keyof typeof responses]}
                        onChange={handleInputChange}
                        className="accent-[#d3b67b] w-5 h-5"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}
              <div className="flex w-full justify-between mt-8">
                <button type="button" onClick={prevBlock} className="px-6 py-2 rounded font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all">← Anterior</button>
                {/* El botón Siguiente solo aparece si se responde la pregunta principal y las condicionales si aplican */}
                {responses.front_lever_level &&
                  (!((responses.front_lever_level === 'tuck' || responses.front_lever_level === 'tuck_advanced' || responses.front_lever_level === 'front_lever') && !responses.front_lever_dynamic) &&
                  (!(responses.front_lever_level === 'front_lever_touch' && !responses.front_lever_elite))) && (
                  <button type="button" onClick={nextBlock} style={{ background: GOLD, color: '#222' }} className="px-8 py-2 rounded font-bold shadow hover:scale-105 transition-all">Siguiente →</button>
                )}
              </div>
            </motion.div>
          )}
          {currentBlock === 'planche' && responses.abilities.includes('planche') && (
            <motion.div
              key="planche"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-white rounded-2xl shadow-xl p-10 border border-gray-100 flex flex-col items-center"
            >
              {/* Barra de progreso */}
              <div className="w-full flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-gray-700">Pregunta {currentStep} de {totalSteps}</span>
                <span className="text-xs font-medium text-gray-700">{Math.round((currentStep/totalSteps)*100)}% Completado</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
                <div className="h-full rounded-full" style={{ width: `${(currentStep/totalSteps)*100}%`, background: GREEN }} />
              </div>
              {/* Pregunta principal */}
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8 leading-tight">
                ¿Cuál es tu nivel de planche?
              </h2>
              <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                {[{ label: 'No puedo', value: 'none' }, { label: 'Lean', value: 'lean' }, { label: 'Tuck', value: 'tuck' }, { label: 'Advanced Tucked', value: 'advanced_tuck' }, { label: 'Straddle', value: 'straddle' }, { label: 'Full', value: 'full' }].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                    ${responses.planche_level === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                  `}>
                    <input
                      type="radio"
                      name="planche_level"
                      value={opt.value}
                      checked={responses.planche_level === opt.value}
                      onChange={handleInputChange}
                      className="accent-[#d3b67b] w-5 h-5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {/* Sub-pregunta: Progresiones dinámicas */}
              {(responses.planche_level === 'lean' || responses.planche_level === 'tuck' || responses.planche_level === 'advanced_tuck' || responses.planche_level === 'straddle') && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-4 mt-2">Progresiones dinámicas</h2>
                  <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                    {[{ label: 'Ninguno', value: 'none' }, { label: 'Negativo Tuck', value: 'tuck_negative' }, { label: 'Press en Tuck', value: 'tuck_press' }, { label: 'Negativo Straddle', value: 'straddle_negative' }].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                        ${responses.planche_dynamic === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                      `}>
                        <input
                          type="radio"
                          name="planche_dynamic"
                          value={opt.value}
                          checked={responses.planche_dynamic === opt.value}
                          onChange={handleInputChange}
                          className="accent-[#d3b67b] w-5 h-5"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
              {/* Sub-pregunta: Habilidades élite */}
              {responses.planche_level === 'full' && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-4 mt-2">Habilidades élite</h2>
                  <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                    {[{ label: 'Ninguno', value: 'none' }, { label: 'Full Press', value: 'full_press' }, { label: 'Full Push-Up', value: 'full_pushup' }, { label: 'Maltese', value: 'maltese' }].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                        ${responses.planche_elite === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                      `}>
                        <input
                          type="radio"
                          name="planche_elite"
                          value={opt.value}
                          checked={responses.planche_elite === opt.value}
                          onChange={handleInputChange}
                          className="accent-[#d3b67b] w-5 h-5"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
              {/* Sub-pregunta: World class */}
              {responses.planche_elite === 'maltese' && (
                <div className="flex flex-col gap-4 w-full max-w-lg mb-8 mt-2">
                  {[{ label: 'Zanetti', value: 'planche_zanetti' }, { label: 'Pelican', value: 'planche_pelican' }].map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                      border-gray-300 hover:border-[#d3b67b]`}>
                      <input
                        type="checkbox"
                        name={opt.value as any}
                        checked={!!responses[opt.value as keyof typeof responses]}
                        onChange={handleInputChange}
                        className="accent-[#d3b67b] w-5 h-5"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}
              <div className="flex w-full justify-between mt-8">
                <button type="button" onClick={prevBlock} className="px-6 py-2 rounded font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all">← Anterior</button>
                {/* El botón Siguiente solo aparece si se responde la pregunta principal y las condicionales si aplican */}
                {responses.planche_level &&
                  (!((responses.planche_level === 'lean' || responses.planche_level === 'tuck' || responses.planche_level === 'advanced_tuck' || responses.planche_level === 'straddle') && !responses.planche_dynamic) &&
                  (!(responses.planche_level === 'full' && !responses.planche_elite))) && (
                  <button type="button" onClick={nextBlock} style={{ background: GOLD, color: '#222' }} className="px-8 py-2 rounded font-bold shadow hover:scale-105 transition-all">Siguiente →</button>
                )}
              </div>
            </motion.div>
          )}
          {currentBlock === 'beginner' && responses.abilities.includes('ninguno') && (
            <motion.div
              key="beginner"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-white rounded-2xl shadow-xl p-10 border border-gray-100 flex flex-col items-center"
            >
              {/* Barra de progreso */}
              <div className="w-full flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-gray-700">Pregunta {currentStep} de {totalSteps}</span>
                <span className="text-xs font-medium text-gray-700">{Math.round((currentStep/totalSteps)*100)}% Completado</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
                <div className="h-full rounded-full" style={{ width: `${(currentStep/totalSteps)*100}%`, background: GREEN }} />
              </div>
              {/* Pregunta 1 */}
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-8 leading-tight">
                ¿Puedes hacer pushups estándar?
              </h2>
              <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                {[{ label: 'Sí, puedo hacer pushups estándar', value: 'yes' }, { label: 'No, solo puedo hacer pushups en rodillas', value: 'no' }].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                    ${responses.standard_pushups === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                  `}>
                    <input
                      type="radio"
                      name="standard_pushups"
                      value={opt.value}
                      checked={responses.standard_pushups === opt.value}
                      onChange={handleInputChange}
                      className="accent-[#d3b67b] w-5 h-5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {/* Pregunta 2 */}
              <h2 className="text-xl font-bold text-gray-900 text-center mb-4 mt-2">¿Cuál es tu nivel de pushups en rodillas?</h2>
              <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                {[
                  { value: 'minima', label: 'Menos de 10' },
                  { value: 'baja', label: '10-20' },
                  { value: 'media', label: 'Más de 20' }
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                    ${responses.knee_pushups_level === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                  `}>
                    <input
                      type="radio"
                      name="knee_pushups_level"
                      value={opt.value}
                      checked={responses.knee_pushups_level === opt.value}
                      onChange={handleInputChange}
                      className="accent-[#d3b67b] w-5 h-5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {/* Pregunta 3 */}
              <h2 className="text-xl font-bold text-gray-900 text-center mb-4 mt-2">¿Cuál es tu nivel de australian rows?</h2>
              <div className="flex flex-col gap-4 w-full max-w-lg mb-8">
                {[
                  { value: 'minima', label: 'Menos de 10' },
                  { value: 'baja', label: '10-20' },
                  { value: 'media', label: 'Más de 20' }
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer font-medium text-gray-800 transition-all text-lg bg-white
                    ${responses.australian_rows_level === opt.value ? 'border-[#d3b67b] shadow-md' : 'border-gray-300 hover:border-[#d3b67b]'}
                  `}>
                    <input
                      type="radio"
                      name="australian_rows_level"
                      value={opt.value}
                      checked={responses.australian_rows_level === opt.value}
                      onChange={handleInputChange}
                      className="accent-[#d3b67b] w-5 h-5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div className="flex w-full justify-between mt-8">
                <button type="button" onClick={prevBlock} className="px-6 py-2 rounded font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all">← Anterior</button>
                {responses.standard_pushups && responses.knee_pushups_level && responses.australian_rows_level && (
                  <button type="button" onClick={nextBlock} style={{ background: GOLD, color: '#222' }} className="px-8 py-2 rounded font-bold shadow hover:scale-105 transition-all">Siguiente →</button>
                )}
              </div>
            </motion.div>
          )}
          {currentBlock === 'finish' && (
            <motion.div
              key="finish"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 flex flex-col items-center"
            >
              {/* Resumen y botón de submit final */}
              <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: GREEN }}>Evaluación Técnica ARZA</h1>
              
              {/* Mensaje de finalización */}
              <div className="w-full max-w-2xl bg-gray-50 rounded-2xl shadow-xl p-8 border border-gray-100 mb-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#d3b67b] to-[#f0c14b] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#21372b] mb-2">¡Has finalizado la Evaluación!</h2>
                <p className="text-gray-600">Descubre tu nivel</p>
              </div>
              <form onSubmit={onSubmit}>
                {loading && <div className="flex justify-center my-4"><svg className="animate-spin h-8 w-8" style={{ color: GOLD }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg></div>}
                {typeof error === 'string' && error && (
                  <div className="text-red-500 text-sm mt-4 text-center">{error}</div>
                )}
                {error && typeof error === 'object' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <div className="font-bold mb-2">Errores de validación:</div>
                    <ul className="list-disc pl-5">
                      {Object.entries(error).map(([field, msg]) => (
                        <li key={field}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button type="submit" disabled={loading} style={{ background: GOLD, color: GREEN }} className="w-full mt-4 py-3 rounded font-bold shadow hover:scale-105 transition-all disabled:opacity-60">
                  {loading ? <span className="flex items-center justify-center"><svg className="animate-spin h-5 w-5 mr-2" style={{ color: GOLD }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Guardando...</span> : 'Finalizar Evaluación'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          padding: 0.5rem 0.75rem;
          margin-top: 0.25rem;
          color: #222;
          font-size: 1rem;
          transition: border 0.2s;
        }
        .input:focus {
          outline: none;
          border-color: #d3b67b;
          box-shadow: 0 0 0 2px #d3b67b33;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
} 