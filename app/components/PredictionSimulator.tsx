'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

type ModelId = 'dt' | 'rf' | 'lr';
type Sex = 'male' | 'female';
type Embarked = 'S' | 'C' | 'Q';
type CsvChartGroup = 'sex' | 'pclass';

interface PassengerInput {
  Pclass: number;
  Sex: Sex;
  Age: number;
  SibSp: number;
  Parch: number;
  Fare: number;
  Embarked: Embarked;
}

interface ModelPrediction {
  model: {
    id: ModelId;
    displayName: string;
    accuracy: string;
  };
  prediction: 0 | 1;
  label: string;
  probabilitySurvived: number;
  probabilityDied: number;
  confidence: number;
  features: {
    Pclass: number;
    Sex: Sex;
    FamilySize: number;
    IsAlone: boolean;
    Title: string;
  };
}

interface CsvPredictionResponse {
  model: {
    id: ModelId;
    displayName: string;
    accuracy: string;
  };
  filename: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  summary: {
    survived: number;
    notSurvived: number;
    averageSurvivalProbability: number;
  };
  results: Array<ModelPrediction & { row: number }>;
  errors: Array<{ row: number; error: string }>;
}

interface ModelMeta {
  id: ModelId;
  name: string;
  description: string;
  accuracy: string;
  endpoint: string;
  csvEndpoint: string;
  best?: boolean;
}

const MODELS: ModelMeta[] = [
  {
    id: 'dt',
    name: 'Árbol de Decisión',
    description: 'Gini · max_depth=5',
    accuracy: '75.21%',
    endpoint: '/api/predict/dt',
    csvEndpoint: '/api/predict-csv/dt',
  },
  {
    id: 'rf',
    name: 'Random Forest',
    description: '100 árboles · Gini · max_depth=5',
    accuracy: '76.07%',
    endpoint: '/api/predict/rf',
    csvEndpoint: '/api/predict-csv/rf',
    best: true,
  },
  {
    id: 'lr',
    name: 'Regresión Logística',
    description: 'max_iter=1000',
    accuracy: '73.50%',
    endpoint: '/api/predict/lr',
    csvEndpoint: '/api/predict-csv/lr',
  },
];

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  const preview = text.replace(/\s+/g, ' ').slice(0, 120);
  throw new Error(
    `El endpoint respondió ${response.status} con ${contentType || 'contenido no JSON'}: ${preview}`
  );
}

function computeDerivedFeatures(input: PassengerInput) {
  const familySize = input.SibSp + input.Parch + 1;
  const title =
    input.Sex === 'female'
      ? input.Age < 18
        ? 'Miss'
        : 'Mrs'
      : input.Age < 15
        ? 'Master'
        : 'Mr';

  return {
    familySize,
    isAlone: familySize === 1,
    title,
  };
}

interface ModelCardProps {
  meta: ModelMeta;
  result: ModelPrediction | null;
  loading: boolean;
  error: string | null;
}

function ModelCard({ meta, result, loading, error }: ModelCardProps) {
  const probability = result?.probabilitySurvived ?? 0;
  const survived = result ? result.prediction === 1 : false;
  const confidence = result?.confidence ?? 0;

  return (
    <div
      className={`relative rounded-2xl border-2 p-5 transition-all duration-300 ${
        !result
          ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
          : survived
            ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
            : 'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-900/20'
      }`}
    >
      {meta.best && (
        <span className="absolute -top-3 left-4 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-bold text-white">
          Mejor modelo
        </span>
      )}
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{meta.name}</p>
      <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
        {meta.description} · Acc: {meta.accuracy}
      </p>

      {loading ? (
        <div className="space-y-3">
          <div className="h-6 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Consultando endpoint Python...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          {error}
        </div>
      ) : result ? (
        <>
          <div
            className={`mb-4 text-xl font-black ${
              survived ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {survived ? 'Sobrevivió' : 'No sobrevivió'}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Prob. supervivencia</span>
              <span className="font-bold">{Math.round(probability * 100)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.round(probability * 100)}%`,
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
        </>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">Sin respuesta todavía.</p>
      )}
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
  const [selectedModel, setSelectedModel] = useState<ModelId>('rf');
  const [prediction, setPrediction] = useState<ModelPrediction | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [csvModel, setCsvModel] = useState<ModelId>('rf');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<CsvPredictionResponse | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvChartGroup, setCsvChartGroup] = useState<CsvChartGroup>('sex');

  const passengerInput = useMemo<PassengerInput>(
    () => ({
      Pclass: pclass,
      Sex: sex,
      Age: age,
      SibSp: sibsp,
      Parch: parch,
      Fare: fare,
      Embarked: embarked,
    }),
    [age, embarked, fare, parch, pclass, sex, sibsp]
  );

  const derived = useMemo(() => computeDerivedFeatures(passengerInput), [passengerInput]);
  const selectedModelMeta = useMemo(
    () => MODELS.find((model) => model.id === selectedModel) ?? MODELS[1],
    [selectedModel]
  );
  const inactiveBtn =
    'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600';
  const csvDistribution = useMemo(() => {
    if (!csvResult) return [];

    const labels =
      csvChartGroup === 'sex'
        ? [
            { key: 'female', label: 'Mujer' },
            { key: 'male', label: 'Hombre' },
          ]
        : [
            { key: '1', label: '1ª clase' },
            { key: '2', label: '2ª clase' },
            { key: '3', label: '3ª clase' },
          ];

    return labels.map(({ key, label }) => {
      const rows = csvResult.results.filter((row) =>
        csvChartGroup === 'sex' ? row.features.Sex === key : String(row.features.Pclass) === key
      );
      const survived = rows.filter((row) => row.prediction === 1).length;
      const notSurvived = rows.length - survived;

      return {
        key,
        label,
        survived,
        notSurvived,
        total: rows.length,
        survivedRate: rows.length === 0 ? 0 : survived / rows.length,
      };
    });
  }, [csvChartGroup, csvResult]);

  async function handlePassengerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsPredicting(true);
    setPrediction(null);
    setPredictionError(null);

    try {
      const response = await fetch(selectedModelMeta.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passengerInput),
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(payload.error || `Error ${response.status}`);
      }
      setPrediction(payload as ModelPrediction);
    } catch (error) {
      setPredictionError(error instanceof Error ? error.message : 'No se pudo consultar el endpoint.');
    } finally {
      setIsPredicting(false);
    }
  }

  function handleCsvFileChange(event: ChangeEvent<HTMLInputElement>) {
    setCsvResult(null);
    setCsvError(null);
    setCsvFile(event.target.files?.[0] ?? null);
  }

  async function handleCsvUpload() {
    if (!csvFile) {
      setCsvError('Selecciona un archivo CSV primero.');
      return;
    }

    const model = MODELS.find((item) => item.id === csvModel);
    if (!model) {
      setCsvError('Modelo no válido.');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    setIsUploadingCsv(true);
    setCsvError(null);
    setCsvResult(null);

    try {
      const response = await fetch(model.csvEndpoint, {
        method: 'POST',
        body: formData,
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(payload.error || `Error ${response.status}`);
      }
        setCsvResult(payload as CsvPredictionResponse);
        setCsvChartGroup('sex');
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : 'No se pudo procesar el CSV.');
    } finally {
      setIsUploadingCsv(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handlePassengerSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <h3 className="mb-6 text-lg font-bold text-slate-800 dark:text-white">Perfil del Pasajero</h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Clase del Boleto (Pclass)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((ticketClass) => (
                <button
                  type="button"
                  key={ticketClass}
                  onClick={() => setPclass(ticketClass)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                    pclass === ticketClass ? 'bg-indigo-600 text-white shadow-sm' : inactiveBtn
                  }`}
                >
                  {ticketClass}ª
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {pclass === 1 ? 'Primera clase (lujo)' : pclass === 2 ? 'Segunda clase' : 'Tercera clase (económica)'}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Género (Sex)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSex('female')}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  sex === 'female' ? 'bg-rose-500 text-white shadow-sm' : inactiveBtn
                }`}
              >
                Mujer
              </button>
              <button
                type="button"
                onClick={() => setSex('male')}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  sex === 'male' ? 'bg-blue-600 text-white shadow-sm' : inactiveBtn
                }`}
              >
                Hombre
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Variable más importante del modelo</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Puerto de Embarque
            </label>
            <div className="flex gap-2">
              {(['S', 'C', 'Q'] as Embarked[]).map((port) => (
                <button
                  type="button"
                  key={port}
                  onClick={() => setEmbarked(port)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                    embarked === port ? 'bg-slate-700 text-white shadow-sm dark:bg-slate-500' : inactiveBtn
                  }`}
                >
                  {port}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {embarked === 'S' ? 'Southampton (mayoría)' : embarked === 'C' ? 'Cherbourg' : 'Queenstown'}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Edad: <span className="font-bold text-indigo-600 dark:text-indigo-400">{age} años</span>
            </label>
            <input
              type="range"
              min={1}
              max={80}
              value={age}
              onChange={(event) => setAge(Number(event.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>1 año</span>
              <span>Prom: 29.7</span>
              <span>80 años</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Tarifa: <span className="font-bold text-indigo-600 dark:text-indigo-400">${fare}</span>
            </label>
            <input
              type="range"
              min={0}
              max={300}
              step={5}
              value={fare}
              onChange={(event) => setFare(Number(event.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>$0</span>
              <span>Prom: $32.20</span>
              <span>$300</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Hermanos/Cónyuge: <span className="text-indigo-600 dark:text-indigo-400">{sibsp}</span>
              </label>
              <input
                type="range"
                min={0}
                max={8}
                value={sibsp}
                onChange={(event) => setSibsp(Number(event.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Padres/Hijos: <span className="text-indigo-600 dark:text-indigo-400">{parch}</span>
              </label>
              <input
                type="range"
                min={0}
                max={6}
                value={parch}
                onChange={(event) => setParch(Number(event.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-700">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Variables calculadas (ingeniería de características):
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm dark:border-indigo-700 dark:bg-indigo-900/30">
              <span className="text-slate-500 dark:text-slate-400">FamilySize = </span>
              <span className="font-bold text-indigo-700 dark:text-indigo-300">{derived.familySize}</span>
              <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                ({sibsp} + {parch} + 1)
              </span>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm dark:border-indigo-700 dark:bg-indigo-900/30">
              <span className="text-slate-500 dark:text-slate-400">IsAlone = </span>
              <span className="font-bold text-indigo-700 dark:text-indigo-300">{derived.isAlone ? '1' : '0'}</span>
              <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                ({derived.isAlone ? 'viaja solo' : 'con familia'})
              </span>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm dark:border-indigo-700 dark:bg-indigo-900/30">
              <span className="text-slate-500 dark:text-slate-400">Title = </span>
              <span className="font-bold text-indigo-700 dark:text-indigo-300">{derived.title}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 dark:border-slate-700 lg:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Modelo para esta predicción
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {MODELS.map((model) => (
                <button
                  type="button"
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setPrediction(null);
                    setPredictionError(null);
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                    selectedModel === model.id ? 'bg-indigo-600 text-white shadow-sm' : inactiveBtn
                  }`}
                >
                  {model.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Endpoint seleccionado: <span className="font-mono">{selectedModelMeta.endpoint}</span>
            </p>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isPredicting}
              className="w-full rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 lg:w-auto"
            >
              {isPredicting ? 'Prediciendo...' : 'Ejecutar predicción'}
            </button>
          </div>
        </div>
      </form>

      <div>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Predicción del modelo seleccionado</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              El resultado aparece después de enviar el formulario al endpoint Python.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {isPredicting ? 'Consultando...' : prediction ? 'Listo' : 'Pendiente'}
          </span>
        </div>
        <div className="max-w-md">
          <ModelCard
            meta={selectedModelMeta}
            result={prediction}
            loading={isPredicting}
            error={predictionError}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Predicción por CSV</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sube un CSV con columnas como Pclass, Sex, Age, SibSp, Parch, Fare y Embarked.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Modelo para el archivo
            </label>
            <div className="flex gap-2">
              {MODELS.map((model) => (
                <button
                  type="button"
                  key={model.id}
                  onClick={() => setCsvModel(model.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                    csvModel === model.id ? 'bg-indigo-600 text-white shadow-sm' : inactiveBtn
                  }`}
                >
                  {model.id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Archivo CSV
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFileChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-300 dark:file:bg-slate-700 dark:file:text-slate-200 dark:hover:file:bg-slate-600"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCsvUpload}
              disabled={isUploadingCsv}
              className="w-full rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {isUploadingCsv ? 'Procesando...' : 'Predecir CSV'}
            </button>
          </div>
        </div>

        {csvError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
            {csvError}
          </div>
        )}

        {csvResult && (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">Filas procesadas</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{csvResult.successfulRows}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Sobrevivió</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  {csvResult.summary.survived}
                </p>
              </div>
              <div className="rounded-lg bg-rose-50 p-3 dark:bg-rose-900/20">
                <p className="text-xs text-rose-700 dark:text-rose-300">No sobrevivió</p>
                <p className="text-xl font-black text-rose-700 dark:text-rose-300">
                  {csvResult.summary.notSurvived}
                </p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/20">
                <p className="text-xs text-indigo-700 dark:text-indigo-300">Prob. promedio</p>
                <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                  {Math.round(csvResult.summary.averageSurvivalProbability * 100)}%
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/40">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">
                    ¿Cómo se distribuyen las predicciones por sexo o clase social?
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Barras apiladas por resultado predicho en el CSV procesado.
                  </p>
                </div>
                <div className="flex rounded-lg bg-white p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setCsvChartGroup('sex')}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                      csvChartGroup === 'sex'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    Sexo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCsvChartGroup('pclass')}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                      csvChartGroup === 'pclass'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    Clase social
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {csvDistribution.map((group) => {
                  const survivedWidth = group.total === 0 ? 0 : Math.round((group.survived / group.total) * 100);
                  const notSurvivedWidth = group.total === 0 ? 0 : 100 - survivedWidth;

                  return (
                    <div key={group.key} className="grid gap-2 sm:grid-cols-[110px_1fr_130px] sm:items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{group.label}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{group.total} pasajeros</p>
                      </div>
                      <div className="h-8 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                        {group.total > 0 ? (
                          <div className="flex h-full">
                            <div
                              className="flex items-center justify-center bg-emerald-500 text-xs font-bold text-white transition-all"
                              style={{ width: `${survivedWidth}%` }}
                            >
                              {survivedWidth >= 16 ? group.survived : ''}
                            </div>
                            <div
                              className="flex items-center justify-center bg-rose-500 text-xs font-bold text-white transition-all"
                              style={{ width: `${notSurvivedWidth}%` }}
                            >
                              {notSurvivedWidth >= 16 ? group.notSurvived : ''}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-full items-center px-3 text-xs text-slate-400">Sin registros</div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {Math.round(group.survivedRate * 100)}%
                        </span>{' '}
                        supervivencia
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-emerald-500 align-middle" />
                  Sobrevivió
                </span>
                <span>
                  <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-rose-500 align-middle" />
                  No sobrevivió
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Fila</th>
                      <th className="px-4 py-3">Modelo</th>
                      <th className="px-4 py-3">Predicción</th>
                      <th className="px-4 py-3">Prob. supervivencia</th>
                      <th className="px-4 py-3">Confianza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {csvResult.results.slice(0, 8).map((row) => (
                      <tr key={row.row} className="bg-white dark:bg-slate-800">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.row}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {csvResult.model.displayName}
                        </td>
                        <td
                          className={`px-4 py-3 font-bold ${
                            row.prediction === 1
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {row.label}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {Math.round(row.probabilitySurvived * 100)}%
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {Math.round(row.confidence * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {(csvResult.results.length > 8 || csvResult.failedRows > 0) && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando las primeras {Math.min(csvResult.results.length, 8)} filas exitosas.
                {csvResult.failedRows > 0 ? ` Filas con error: ${csvResult.failedRows}.` : ''}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
        <strong>Contexto histórico:</strong> Las predicciones ahora vienen de los modelos reales
        entrenados en Python y guardados como artefactos `.pkl`. La variable más importante fue el
        género: las mujeres tenían mayor probabilidad de sobrevivir, en línea con la política de
        evacuación de mujeres y niños primero.
      </div>
    </div>
  );
}
