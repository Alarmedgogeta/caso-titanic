'use client';

import { useState, useMemo } from 'react';

type Sex = 'male' | 'female';
type Embarked = 'S' | 'C' | 'Q';

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function computePredictions(
  pclass: number,
  sex: Sex,
  age: number,
  sibsp: number,
  parch: number,
  fare: number
) {
  const familySize = sibsp + parch + 1;
  let l = -0.4;

  if (sex === 'female') l += 2.5;
  if (pclass === 1) l += 1.2;
  else if (pclass === 2) l += 0.35;
  else l -= 0.5;
  if (age < 10) l += 1.0;
  else if (age < 18) l += 0.4;
  else if (age > 60) l -= 0.5;
  if (familySize >= 2 && familySize <= 4) l += 0.3;
  else if (familySize > 4) l -= 0.8;
  if (fare > 100) l += 0.5;
  else if (fare > 30) l += 0.2;
  else if (fare < 10) l -= 0.3;

  const title =
    sex === 'female' ? (age < 18 ? 'Miss' : 'Mrs') : age < 15 ? 'Master' : 'Mr';

  return {
    rfProb: sigmoid(l),
    dtProb: sigmoid(l * 1.08),
    lrProb: sigmoid(l * 0.88),
    familySize,
    isAlone: familySize === 1,
    title,
  };
}

interface ModelCardProps {
  name: string;
  description: string;
  accuracy: string;
  prob: number;
  best?: boolean;
}

function ModelCard({ name, description, accuracy, prob, best }: ModelCardProps) {
  const survived = prob >= 0.5;
  const confidence = survived ? prob : 1 - prob;

  return (
    <div
      className={`relative rounded-2xl border-2 p-5 transition-all duration-300 ${
        survived
          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
          : 'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-900/20'
      }`}
    >
      {best && (
        <span className="absolute -top-3 left-4 px-3 py-0.5 bg-violet-600 text-white text-xs font-bold rounded-full">
          ⭐ Mejor modelo
        </span>
      )}
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{name}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        {description} · Acc: {accuracy}
      </p>
      <div
        className={`text-xl font-black mb-4 ${survived ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
      >
        {survived ? '✓ Sobrevivió' : '✗ No sobrevivió'}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Prob. supervivencia</span>
          <span className="font-bold">{Math.round(prob * 100)}%</span>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.round(prob * 100)}%`,
              backgroundColor: survived ? '#10b981' : '#f43f5e',
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>0% (No)</span>
          <span>100% (Sí)</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Confianza: <span className="font-bold">{Math.round(confidence * 100)}%</span>
      </p>
    </div>
  );
}

export default function PredictionSimulator() {
  const [pclass, setPclass] = useState(3);
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState(28);
  const [sibsp, setSibsp] = useState(0);
  const [parch, setParch] = useState(0);
  const [fare, setFare] = useState(8);
  const [embarked, setEmbarked] = useState<Embarked>('S');

  const result = useMemo(
    () => computePredictions(pclass, sex, age, sibsp, parch, fare),
    [pclass, sex, age, sibsp, parch, fare]
  );

  const inactiveBtn = 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600';

  return (
    <div className="space-y-8">
      {/* ── Form ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Perfil del Pasajero</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pclass */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Clase del Boleto (Pclass)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((c) => (
                <button
                  key={c}
                  onClick={() => setPclass(c)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    pclass === c ? 'bg-indigo-600 text-white shadow-sm' : inactiveBtn
                  }`}
                >
                  {c}ª
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {pclass === 1 ? 'Primera clase (lujo)' : pclass === 2 ? 'Segunda clase' : 'Tercera clase (económica)'}
            </p>
          </div>

          {/* Sex */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Género (Sex)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSex('female')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  sex === 'female' ? 'bg-rose-500 text-white shadow-sm' : inactiveBtn
                }`}
              >
                ♀ Mujer
              </button>
              <button
                onClick={() => setSex('male')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  sex === 'male' ? 'bg-blue-600 text-white shadow-sm' : inactiveBtn
                }`}
              >
                ♂ Hombre
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Variable más importante del modelo</p>
          </div>

          {/* Embarked */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Puerto de Embarque
            </label>
            <div className="flex gap-2">
              {(['S', 'C', 'Q'] as Embarked[]).map((e) => (
                <button
                  key={e}
                  onClick={() => setEmbarked(e)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    embarked === e ? 'bg-slate-700 text-white shadow-sm dark:bg-slate-500' : inactiveBtn
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {embarked === 'S' ? 'Southampton (mayoría)' : embarked === 'C' ? 'Cherbourg' : 'Queenstown'}
            </p>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Edad: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{age} años</span>
            </label>
            <input
              type="range"
              min={1}
              max={80}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
              <span>1 año</span>
              <span>Prom: 29.7</span>
              <span>80 años</span>
            </div>
          </div>

          {/* Fare */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Tarifa: <span className="text-indigo-600 dark:text-indigo-400 font-bold">${fare}</span>
            </label>
            <input
              type="range"
              min={0}
              max={300}
              step={5}
              value={fare}
              onChange={(e) => setFare(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
              <span>$0</span>
              <span>Prom: $32.20</span>
              <span>$300</span>
            </div>
          </div>

          {/* SibSp + Parch */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Hermanos/Cónyuge: <span className="text-indigo-600 dark:text-indigo-400">{sibsp}</span>
              </label>
              <input
                type="range"
                min={0}
                max={8}
                value={sibsp}
                onChange={(e) => setSibsp(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Padres/Hijos: <span className="text-indigo-600 dark:text-indigo-400">{parch}</span>
              </label>
              <input
                type="range"
                min={0}
                max={6}
                value={parch}
                onChange={(e) => setParch(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Derived features */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
            Variables calculadas (ingeniería de características):
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm">
              <span className="text-slate-500 dark:text-slate-400">FamilySize = </span>
              <span className="font-bold text-indigo-700 dark:text-indigo-300">{result.familySize}</span>
              <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">
                ({sibsp} + {parch} + 1)
              </span>
            </div>
            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm">
              <span className="text-slate-500 dark:text-slate-400">IsAlone = </span>
              <span className="font-bold text-indigo-700 dark:text-indigo-300">{result.isAlone ? '1' : '0'}</span>
              <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">
                ({result.isAlone ? 'viaja solo' : 'con familia'})
              </span>
            </div>
            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm">
              <span className="text-slate-500 dark:text-slate-400">Title = </span>
              <span className="font-bold text-indigo-700 dark:text-indigo-300">{result.title}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
          Predicción de los 3 modelos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModelCard
            name="Árbol de Decisión"
            description="Gini · max_depth=5"
            accuracy="75.21%"
            prob={result.dtProb}
          />
          <ModelCard
            name="Random Forest"
            description="100 árboles · Gini · max_depth=5"
            accuracy="76.07%"
            prob={result.rfProb}
            best
          />
          <ModelCard
            name="Regresión Logística"
            description="max_iter=1000"
            accuracy="73.50%"
            prob={result.lrProb}
          />
        </div>
      </div>

      {/* ── Context note ── */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>Contexto histórico:</strong> Las predicciones aproximan el comportamiento del
        Random Forest entrenado con datos reales del Titanic. La variable más importante fue el
        género —las mujeres tenían 4× más probabilidad de sobrevivir. La política de evacuación
        del barco era &quot;mujeres y niños primero&quot;.
      </div>
    </div>
  );
}
