'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const GOLD = '#d3b67b';
const GREEN = '#21372b';

const personalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  edad: z.number().min(14, 'Edad mínima 14').max(80, 'Edad máxima 80'),
  peso: z.number().min(20, 'Peso inválido'),
  altura: z.number().min(100, 'Altura inválida'),
  ciudad: z.string().optional(),
  pais: z.string().optional(),
  genero: z.enum(['masculino', 'femenino', 'otro']).optional(),
});

const objetivos = [
  'Bajar de peso',
  'Ganar fuerza',
  'Ganar masa muscular',
  'Mejorar habilidades',
];

const objetivosSchema = z.object({
  objetivo: z.enum([
    'Bajar de peso',
    'Ganar fuerza',
    'Ganar masa muscular',
    'Mejorar habilidades',
  ]),
  meta_3_meses: z.string().min(10, 'Mínimo 10 caracteres'),
  motivacion: z.string().min(10, 'Mínimo 10 caracteres'),
});

const contextoSchema = z.object({
  dias_por_sem: z.enum(['3', '4', '5']),
  tiempo_sesion: z.enum(['45', '60', '90']),
  lugar_entrenamiento: z.enum(['casa', 'parque', 'gimnasio']),
  email: z.string().email('Email inválido'),
});

const schema = personalSchema.merge(objetivosSchema).merge(contextoSchema);

type FormData = z.infer<typeof schema>;

const steps = [
  'Información Personal',
  'Objetivos y Motivación',
  'Contexto y Disponibilidad',
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      genero: 'masculino',
      dias_por_sem: '3',
      tiempo_sesion: '45',
      lugar_entrenamiento: 'casa',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = methods;

  const nextStep = async () => {
    let valid = false;
    if (step === 0) valid = await trigger(['nombre', 'edad', 'peso', 'altura', 'ciudad', 'pais', 'genero']);
    if (step === 1) valid = await trigger(['objetivo', 'meta_3_meses', 'motivacion']);
    if (step === 2) valid = await trigger(['dias_por_sem', 'tiempo_sesion', 'lugar_entrenamiento', 'email']);
    if (valid) setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const { data: user, error: supaError } = await supabase
        .from('users')
        .insert([
          {
            nombre: data.nombre,
            edad: data.edad,
            peso: data.peso,
            altura: data.altura,
            ciudad: data.ciudad,
            pais: data.pais,
            genero: data.genero,
            objetivo: data.objetivo,
            meta_3_meses: data.meta_3_meses,
            motivacion: data.motivacion,
            dias_por_sem: Number(data.dias_por_sem),
            tiempo_sesion: Number(data.tiempo_sesion),
            lugar_entrenamiento: data.lugar_entrenamiento,
            email: data.email,
          },
        ])
        .select('id')
        .single();
      if (supaError || !user) throw supaError || new Error('No se pudo crear el usuario');
      router.push(`/evaluation/${user.id}`);
    } catch (e: any) {
      setError(e.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-8 px-2">
      {/* Logo ARZA */}
      <div className="w-full flex justify-center pt-6 pb-2">
        <Image src="/arza-logo.svg" alt="ARZA Logo" width={160} height={60} priority className="object-contain" />
      </div>
      {/* Mensaje motivacional */}
      <div className="text-center mb-6 px-4">
        <h2 className="text-xl font-bold text-[#21372b] mb-2">Entrena Inteligente.</h2>
        <span className="block text-gray-700 font-bold text-sm mb-1" style={{fontFamily: 'inherit'}}>Progresar no es cuestión de suerte, sino de</span>
        <div className="flex items-center justify-center gap-3">
          <span className="bg-[#21372b] text-white font-bold px-3 py-1.5 rounded-lg text-base">método</span>
          <span className="text-gray-700 font-medium text-base">y</span>
          <span className="bg-[#d3b67b] text-white font-bold px-3 py-1.5 rounded-lg text-base">disciplina</span>
        </div>
      </div>
      <div className="w-full max-w-xl bg-gray-50 rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-xs font-semibold" style={{ color: GREEN }}>
            {steps.map((label, i) => (
              <span key={label} className={i === step ? 'font-bold' : ''}>{label}</span>
            ))}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%`, background: GOLD }}
            />
          </div>
        </div>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 0 && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <label className="text-gray-800 font-medium">
                  Nombre completo*
                  <input {...register('nombre')} className="input" />
                  {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message as string}</span>}
                </label>
                <label className="text-gray-800 font-medium">
                  Edad*
                  <input type="number" min={14} max={80} {...register('edad', { valueAsNumber: true })} className="input" />
                  {errors.edad && <span className="text-red-500 text-xs">{errors.edad.message as string}</span>}
                </label>
                <label className="text-gray-800 font-medium">
                  Peso (kg)*
                  <input type="number" step="0.1" {...register('peso', { valueAsNumber: true })} className="input" />
                  {errors.peso && <span className="text-red-500 text-xs">{errors.peso.message as string}</span>}
                </label>
                <label className="text-gray-800 font-medium">
                  Altura (cm)*
                  <input type="number" step="0.1" {...register('altura', { valueAsNumber: true })} className="input" />
                  {errors.altura && <span className="text-red-500 text-xs">{errors.altura.message as string}</span>}
                </label>
                <label className="text-gray-800 font-medium">
                  Ciudad*
                  <input {...register('ciudad')} className="input" />
                </label>
                <label className="text-gray-800 font-medium">
                  País*
                  <input {...register('pais')} className="input" />
                </label>
                <label className="text-gray-800 font-medium">
                  Género*
                  <select {...register('genero')} className="input">
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>
              </div>
            )}
            {step === 1 && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <label className="text-gray-800 font-medium">
                  Objetivo*
                  <select {...register('objetivo')} className="input">
                    <option value="">Selecciona...</option>
                    {objetivos.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  {errors.objetivo && <span className="text-red-500 text-xs">{errors.objetivo.message as string}</span>}
                </label>
                <label className="text-gray-800 font-medium">
                  ¿Cuál es tu meta a 3 meses?
                  <textarea {...register('meta_3_meses')} minLength={10} className="input" rows={2} />
                  {errors.meta_3_meses && <span className="text-red-500 text-xs">{errors.meta_3_meses.message as string}</span>}
                </label>
                <label className="text-gray-800 font-medium">
                  ¿Por qué es importante lograrlo?
                  <textarea {...register('motivacion')} minLength={10} className="input" rows={2} />
                  {errors.motivacion && <span className="text-red-500 text-xs">{errors.motivacion.message as string}</span>}
                </label>
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <label className="text-gray-800 font-medium">
                  Días por semana*
                  <div className="flex gap-4 mt-1">
                    {[3, 4, 5].map((n) => (
                      <label key={n} className="flex items-center gap-1">
                        <input type="radio" value={n} {...register('dias_por_sem')} /> {n}
                      </label>
                    ))}
                  </div>
                  {errors.dias_por_sem && <span className="text-red-500 text-xs">{errors.dias_por_sem.message as string}</span>}
                </label>
                <label className="text-gray-800 font-medium">
                  Tiempo por sesión*
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-1">
                      <input type="radio" value="45" {...register('tiempo_sesion')} /> 45 min
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="radio" value="60" {...register('tiempo_sesion')} /> 1 hora
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="radio" value="90" {...register('tiempo_sesion')} /> 1h 30min
                    </label>
                  </div>
                  {errors.tiempo_sesion && <span className="text-red-500 text-xs">{errors.tiempo_sesion.message as string}</span>}
                </label>
                <label className="text-gray-800 font-medium">
                  Lugar de entrenamiento*
                  <div className="flex gap-4 mt-1">
                    {['casa', 'parque', 'gimnasio'].map((l) => (
                      <label key={l} className="flex items-center gap-1 capitalize">
                        <input type="radio" value={l} {...register('lugar_entrenamiento')} /> {l}
                      </label>
                    ))}
                  </div>
                  {errors.lugar_entrenamiento && <span className="text-red-500 text-xs">{errors.lugar_entrenamiento.message as string}</span>}
                </label>
                <label className="text-gray-800 font-medium">
                  Email*
                  <input type="email" {...register('email')} className="input" />
                  {errors.email && <span className="text-red-500 text-xs">{errors.email.message as string}</span>}
                </label>
              </div>
            )}
            {error && <div className="text-red-500 text-sm mt-4 text-center">{error}</div>}
            <div className="flex justify-between mt-8">
              {step > 0 && (
                <button type="button" onClick={prevStep} style={{ background: GREEN, color: GOLD }} className="px-4 py-2 rounded font-semibold border border-gray-200 hover:opacity-90 transition-all">
                  Atrás
                </button>
              )}
              {step < steps.length - 1 && (
                <button type="button" onClick={nextStep} style={{ background: GOLD, color: GREEN }} className="ml-auto px-6 py-2 rounded font-semibold shadow hover:scale-105 transition-all">
                  Siguiente
                </button>
              )}
              {step === steps.length - 1 && (
                <button type="submit" disabled={loading} style={{ background: GOLD, color: GREEN }} className="ml-auto px-6 py-2 rounded font-semibold shadow hover:scale-105 transition-all disabled:opacity-60">
                  {loading ? 'Guardando...' : 'Finalizar'}
                </button>
              )}
            </div>
          </form>
        </FormProvider>
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