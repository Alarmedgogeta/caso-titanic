import type { Metadata } from 'next';
import PredictionSimulator from './components/PredictionSimulator';
import ThemeToggle from './components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Titanic ML — Documentación Interactiva',
  description:
    'Documentación didáctica e interactiva de los modelos de predicción de supervivencia del Titanic',
};

// ── Constants from the notebook ──────────────────────────────────────────────

const COLUMNS = [
  { name: 'PassengerId', type: 'int64', nulls: 0, keep: false, desc: 'ID único del pasajero' },
  { name: 'Survived', type: 'int64', nulls: 0, keep: true, desc: 'Variable objetivo (0=No, 1=Sí)' },
  { name: 'Pclass', type: 'int64', nulls: 0, keep: true, desc: 'Clase del boleto (1, 2 ó 3)' },
  { name: 'Name', type: 'str', nulls: 0, keep: false, desc: 'Nombre completo — se usa para extraer Title' },
  { name: 'Sex', type: 'str', nulls: 0, keep: true, desc: 'Género del pasajero' },
  { name: 'Age', type: 'float64', nulls: 177, keep: true, desc: '19.87% nulos — imputado con mediana por Title' },
  { name: 'SibSp', type: 'int64', nulls: 0, keep: true, desc: 'Hermanos/cónyuge a bordo' },
  { name: 'Parch', type: 'int64', nulls: 0, keep: true, desc: 'Padres/hijos a bordo' },
  { name: 'Ticket', type: 'str', nulls: 0, keep: false, desc: 'Número de boleto — sin valor predictivo' },
  { name: 'Fare', type: 'float64', nulls: 0, keep: true, desc: 'Tarifa del boleto' },
  { name: 'Cabin', type: 'str', nulls: 687, keep: false, desc: '77.10% nulos — eliminada' },
  { name: 'Embarked', type: 'str', nulls: 2, keep: true, desc: 'Puerto: S=Southampton · C=Cherbourg · Q=Queenstown' },
];

const MODELS = [
  {
    name: 'Árbol de Decisión',
    badge: 'DT',
    headerColor: 'bg-indigo-600',
    criterion: 'Gini',
    params: 'max_depth=5',
    trainAcc: 80.28,
    testAcc: 75.21,
    f1: 0.7471,
    precision: 0.7478,
    recall: 0.7521,
    desc: 'Aprende una secuencia de reglas "si/entonces" sobre las variables, dividiéndolas en grupos con impureza Gini mínima. Cada nodo del árbol hace una pregunta sobre una característica y según la respuesta dirige el pasajero hacia "sobrevivió" o "no sobrevivió".',
    pros: ['Altamente interpretable — el árbol es visualmente inspectable', 'No requiere escalado de datos', 'Permite visualizar reglas de decisión'],
    cons: ['Propenso a sobreajuste si la profundidad no está limitada', 'Sensible a pequeñas variaciones en los datos de entrenamiento'],
    codeLine: 'DecisionTreeClassifier(criterion="gini", max_depth=5, random_state=0)',
  },
  {
    name: 'Random Forest',
    badge: 'RF',
    headerColor: 'bg-violet-600',
    criterion: 'Gini',
    params: 'n_estimators=100 · max_depth=5',
    trainAcc: 80.28,
    testAcc: 76.07,
    f1: 0.7607,
    precision: 0.7607,
    recall: 0.7607,
    desc: 'Ensemble de 100 árboles de decisión entrenados sobre submuestras aleatorias del dataset y subconjuntos aleatorios de variables. La predicción final es la votación mayoritaria de todos los árboles, lo que reduce el sobreajuste y mejora la generalización.',
    pros: ['Mejor generalización que un árbol individual', 'Robusto a outliers y ruido', 'Proporciona importancia de variables'],
    cons: ['Menor interpretabilidad que un árbol único', 'Mayor tiempo de entrenamiento'],
    codeLine: 'RandomForestClassifier(criterion="gini", max_depth=5, n_estimators=100, random_state=0)',
    isBest: true,
  },
  {
    name: 'Regresión Logística',
    badge: 'LR',
    headerColor: 'bg-amber-500',
    params: 'max_iter=1000',
    trainAcc: 75.53,
    testAcc: 73.50,
    f1: 0.7366,
    precision: 0.7392,
    recall: 0.7350,
    desc: 'Modelo lineal que estima P(Survived=1) aplicando una función sigmoide sobre una combinación lineal de las variables. Sirve como línea base de comparación. Aunque asume relaciones lineales, es eficiente y proporciona probabilidades bien calibradas.',
    pros: ['Muy interpretable (coeficientes indican dirección e importancia)', 'Proporciona probabilidades calibradas', 'Computacionalmente eficiente'],
    cons: ['Asume relaciones lineales entre variables y probabilidad', 'No captura interacciones complejas entre variables'],
    codeLine: 'LogisticRegression(max_iter=1000, random_state=0)',
  },
];

const COMPARISON = [
  { model: 'Árbol de Decisión', trainAcc: 80.28, testAcc: 75.21, f1: 0.7471, precision: 0.7478, recall: 0.7521, badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  { model: 'Random Forest', trainAcc: 80.28, testAcc: 76.07, f1: 0.7607, precision: 0.7607, recall: 0.7607, badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', best: true },
  { model: 'Regresión Logística', trainAcc: 75.53, testAcc: 73.50, f1: 0.7366, precision: 0.7392, recall: 0.7350, badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
];

const CONFUSION_MATRICES = [
  { name: 'Árbol de Decisión', matrix: [[62, 11], [18, 26]] },
  { name: 'Random Forest', matrix: [[59, 14], [14, 30]] },
  { name: 'Regresión Logística', matrix: [[56, 17], [14, 30]] },
];

const FEATURE_IMPORTANCE = [
  { feature: 'Sex', dt: 30, rf: 28 },
  { feature: 'Title', dt: 26, rf: 24 },
  { feature: 'Fare', dt: 14, rf: 16 },
  { feature: 'Age', dt: 11, rf: 13 },
  { feature: 'Pclass', dt: 9, rf: 8 },
  { feature: 'FamilySize', dt: 5, rf: 6 },
  { feature: 'IsAlone', dt: 2, rf: 3 },
  { feature: 'Embarked', dt: 2, rf: 1 },
  { feature: 'SibSp', dt: 1, rf: 1 },
  { feature: 'Parch', dt: 0, rf: 0 },
];

const EDA_INSIGHTS = [
  {
    icon: '⚖️',
    title: 'Dataset desbalanceado',
    body: 'Solo el 38.4% de los pasajeros sobrevivió (342 de 891). Los modelos se entrenaron con oversampling para corregir este desequilibrio.',
    light: 'bg-rose-50 border-rose-200',
    dark: 'dark:bg-rose-900/20 dark:border-rose-800',
  },
  {
    icon: '♀',
    title: 'Género — el factor más importante',
    body: 'Las mujeres tuvieron una tasa de supervivencia mucho mayor que los hombres debido a la política "mujeres y niños primero" durante la evacuación.',
    light: 'bg-pink-50 border-pink-200',
    dark: 'dark:bg-pink-900/20 dark:border-pink-800',
  },
  {
    icon: '🎫',
    title: 'Clase del boleto importa',
    body: 'Los pasajeros de 1ª clase sobrevivieron en mayor proporción que los de 3ª clase. Las cabinas de 1ª clase estaban más cerca de los botes salvavidas.',
    light: 'bg-amber-50 border-amber-200',
    dark: 'dark:bg-amber-900/20 dark:border-amber-800',
  },
  {
    icon: '👶',
    title: 'Los niños primero',
    body: 'Los pasajeros menores de 10 años tuvieron mayor probabilidad de sobrevivir. La edad promedio de los sobrevivientes fue menor que la de los fallecidos.',
    light: 'bg-sky-50 border-sky-200',
    dark: 'dark:bg-sky-900/20 dark:border-sky-800',
  },
  {
    icon: '💰',
    title: 'Tarifa como proxy de riqueza',
    body: 'Las tarifas más altas se asocian con mayor supervivencia, ya que correlacionan fuertemente con la clase del boleto y la ubicación de la cabina.',
    light: 'bg-emerald-50 border-emerald-200',
    dark: 'dark:bg-emerald-900/20 dark:border-emerald-800',
  },
];

const PIPELINE_STEPS = [
  { n: '1', label: 'Cargar CSV', desc: 'pd.read_csv()', color: 'bg-slate-600' },
  { n: '2', label: 'Feature Engineering', desc: 'FamilySize, IsAlone, Title', color: 'bg-indigo-600' },
  { n: '3', label: 'Valores Nulos', desc: 'Age → mediana por Title', color: 'bg-violet-600' },
  { n: '4', label: 'Eliminar columnas', desc: 'Cabin, Name, Ticket, PassId', color: 'bg-rose-600' },
  { n: '5', label: 'Codificación', desc: 'Sex, Embarked, Title → numérico', color: 'bg-amber-600' },
  { n: '6', label: 'Deduplicación', desc: '891 → 778 registros', color: 'bg-teal-600' },
  { n: '7', label: 'Outliers IQR', desc: '778 → 583 registros', color: 'bg-emerald-600' },
];

const CONCLUSIONS = [
  {
    icon: '📊',
    title: 'Datos desbalanceados',
    body: 'El dataset presenta un desequilibrio de clases (~62% No sobrevivió / ~38% Sobrevivió). El oversampling fue esencial para evitar que el modelo se sesgara hacia la clase mayoritaria.',
  },
  {
    icon: '🔧',
    title: 'Ingeniería de características',
    body: 'La creación de FamilySize, IsAlone y Title mejoró el poder predictivo. En particular, Title captura información de género, clase social y edad simultáneamente.',
  },
  {
    icon: '🌲',
    title: 'Random Forest es el mejor modelo',
    body: 'Con 76.07% de accuracy en prueba, Random Forest supera al árbol individual (75.21%) y a la regresión logística (73.50%). El ensemble de 100 árboles reduce el sobreajuste.',
  },
  {
    icon: '🏆',
    title: 'Variables más importantes',
    body: 'Sex, Title y Fare resultan ser los predictores más relevantes, consistente con la realidad histórica: mujeres, clase alta y tarifas altas → mayor supervivencia.',
  },
  {
    icon: '🚀',
    title: 'Sistema de predicción',
    body: 'Los tres modelos se guardan como archivos .pkl con joblib y pueden cargarse sin reentrenar. El simulador interactivo de abajo aproxima su comportamiento en tiempo real.',
  },
];

// ── Helper components ─────────────────────────────────────────────────────────

function SectionTitle({ n, title, id }: { n: string; title: string; id: string }) {
  return (
    <div id={id} className="scroll-mt-16 mb-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-lg shrink-0">
          {n}
        </span>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-indigo-400 to-transparent rounded-full" />
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-slate-900 text-emerald-300 rounded-xl p-4 text-xs sm:text-sm overflow-x-auto font-mono leading-relaxed">
      <code>{code}</code>
    </pre>
  );
}

function ConfusionMatrix({ name, matrix }: { name: string; matrix: number[][] }) {
  const [[tn, fp], [fn, tp]] = matrix;
  const total = tn + fp + fn + tp;
  const acc = (((tn + tp) / total) * 100).toFixed(1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center mb-1">{name}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-4">Accuracy: {acc}%</p>
      <div className="grid grid-cols-3 gap-1 text-xs">
        <div />
        <div className="text-center font-semibold text-slate-500 dark:text-slate-400 py-1 px-2 bg-slate-50 dark:bg-slate-700 rounded">
          Pred: No
        </div>
        <div className="text-center font-semibold text-slate-500 dark:text-slate-400 py-1 px-2 bg-slate-50 dark:bg-slate-700 rounded">
          Pred: Sí
        </div>
        <div className="font-semibold text-slate-500 dark:text-slate-400 flex items-center pr-1">Real: No</div>
        <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3 text-center">
          <span className="font-black text-slate-700 dark:text-slate-200 text-xl block">{tn}</span>
          <span className="text-slate-400 dark:text-slate-500">TN</span>
        </div>
        <div className="bg-rose-100 dark:bg-rose-900/30 rounded-xl p-3 text-center">
          <span className="font-black text-rose-600 text-xl block">{fp}</span>
          <span className="text-rose-400">FP</span>
        </div>
        <div className="font-semibold text-slate-500 dark:text-slate-400 flex items-center pr-1">Real: Sí</div>
        <div className="bg-rose-100 dark:bg-rose-900/30 rounded-xl p-3 text-center">
          <span className="font-black text-rose-600 text-xl block">{fn}</span>
          <span className="text-rose-400">FN</span>
        </div>
        <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-xl p-3 text-center">
          <span className="font-black text-emerald-600 text-xl block">{tp}</span>
          <span className="text-emerald-400">TP</span>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-400 dark:text-slate-500 space-y-0.5">
        <p><span className="font-semibold text-slate-600 dark:text-slate-300">TN</span> = predicho No, real No (correcto)</p>
        <p><span className="font-semibold text-rose-500">FP</span> = predicho Sí, real No (falsa alarma)</p>
        <p><span className="font-semibold text-rose-500">FN</span> = predicho No, real Sí (error grave)</p>
        <p><span className="font-semibold text-emerald-600">TP</span> = predicho Sí, real Sí (correcto)</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/70 text-sm mb-6">
            Aplicaciones de Analítica de Negocios 2 · Machine Learning
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            🚢 Predicción de Supervivencia
            <br />
            <span className="text-indigo-300">en el Titanic</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-8">
            Documentación interactiva del desarrollo de tres modelos de clasificación en Python:
            árbol de decisión, random forest y regresión logística aplicados a datos históricos del
            hundimiento del RMS Titanic.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { v: '891', l: 'Pasajeros', sub: 'en el dataset' },
              { v: '38.4%', l: 'Sobrevivieron', sub: '342 pasajeros' },
              { v: '3', l: 'Modelos ML', sub: 'DT · RF · LR' },
              { v: '76.07%', l: 'Mejor accuracy', sub: 'Random Forest' },
            ].map(({ v, l, sub }) => (
              <div key={l} className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-black text-white">{v}</p>
                <p className="text-sm font-semibold text-indigo-200">{l}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            ))}
          </div>
          <a
            href="/model/caso-titanic.ipynb"
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-colors"
          >
            📓 Descargar notebook (.ipynb)
          </a>
        </div>
      </section>

      {/* ── Nav ── */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-3 text-sm">
            {[
              ['#dataset', 'Dataset'],
              ['#eda', 'Exploración'],
              ['#preprocesamiento', 'Preprocesamiento'],
              ['#modelos', 'Modelos'],
              ['#evaluacion', 'Evaluación'],
              ['#predictor', 'Predictor'],
              ['#conclusiones', 'Conclusiones'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white whitespace-nowrap font-medium transition-colors"
              >
                {label}
              </a>
            ))}
            <div className="ml-auto pl-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-20">

        {/* ─── 1. Dataset ─── */}
        <section>
          <SectionTitle n="1" title="El Dataset" id="dataset" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total de pasajeros', value: '891', sub: 'registros en train.csv', light: 'border-slate-200 bg-white', dark: 'dark:border-slate-700 dark:bg-slate-800' },
              { label: 'Sobrevivieron', value: '342', sub: '38.4% del total', light: 'border-emerald-200 bg-emerald-50', dark: 'dark:border-emerald-800 dark:bg-emerald-900/20' },
              { label: 'No sobrevivieron', value: '549', sub: '61.6% del total', light: 'border-rose-200 bg-rose-50', dark: 'dark:border-rose-800 dark:bg-rose-900/20' },
              { label: 'Edad promedio', value: '29.7', sub: 'años (mín 0.4 · máx 80)', light: 'border-indigo-200 bg-indigo-50', dark: 'dark:border-indigo-800 dark:bg-indigo-900/20' },
            ].map(({ label, value, sub, light, dark }) => (
              <div key={label} className={`rounded-2xl p-5 border ${light} ${dark}`}>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">{label}</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{value}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <p className="font-bold text-slate-700 dark:text-slate-200">Variables del dataset (12 columnas)</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Verde = variable usada en el modelo · Tachado = eliminada en preprocesamiento
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left px-5 py-3 text-slate-500 dark:text-slate-400 font-semibold">Variable</th>
                    <th className="text-left px-5 py-3 text-slate-500 dark:text-slate-400 font-semibold">Tipo</th>
                    <th className="text-left px-5 py-3 text-slate-500 dark:text-slate-400 font-semibold">Nulos</th>
                    <th className="text-left px-5 py-3 text-slate-500 dark:text-slate-400 font-semibold">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {COLUMNS.map((col) => (
                    <tr
                      key={col.name}
                      className={`border-b border-slate-50 dark:border-slate-700/50 ${
                        col.keep
                          ? 'bg-white dark:bg-slate-800'
                          : 'bg-slate-50/50 dark:bg-slate-800/50'
                      }`}
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`font-mono font-semibold text-xs px-2 py-0.5 rounded ${
                            col.keep
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 line-through'
                          }`}
                        >
                          {col.name}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{col.type}</td>
                      <td className="px-5 py-3">
                        {col.nulls > 0 ? (
                          <span className={`text-xs font-semibold ${col.nulls > 200 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {col.nulls}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-xs">{col.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <CodeBlock
            code={`df = pd.read_csv('train.csv', delimiter=',')
df.info()
# → RangeIndex: 891 entries, 0 to 890
# → Nulls: Age=177 (19.87%), Cabin=687 (77.10%), Embarked=2

print(f"Supervivientes: {df['Survived'].sum()} ({df['Survived'].mean()*100:.1f}%)")
# → Supervivientes: 342 (38.4%)`}
          />
        </section>

        {/* ─── 2. EDA ─── */}
        <section>
          <SectionTitle n="2" title="Exploración de Datos" id="eda" />
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Antes de modelar, se analizó la distribución de las variables y su relación con{' '}
            <code className="bg-slate-100 dark:bg-slate-700 dark:text-slate-200 px-1 py-0.5 rounded text-sm font-mono">Survived</code>.
            Estas son las observaciones más relevantes:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {EDA_INSIGHTS.map(({ icon, title, body, light, dark }) => (
              <div key={title} className={`rounded-2xl border p-5 ${light} ${dark}`}>
                <span className="text-2xl mb-2 block">{icon}</span>
                <p className="font-bold text-slate-800 dark:text-white mb-2">{title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-4">
              Tasa de supervivencia por género y clase
            </p>
            <div className="space-y-3">
              {[
                { label: 'Mujeres (general)', pct: 74, color: 'bg-rose-400' },
                { label: 'Mujeres · 1ª clase', pct: 97, color: 'bg-rose-500' },
                { label: 'Mujeres · 3ª clase', pct: 50, color: 'bg-rose-300' },
                { label: 'Hombres (general)', pct: 19, color: 'bg-blue-400' },
                { label: 'Hombres · 1ª clase', pct: 37, color: 'bg-blue-500' },
                { label: 'Hombres · 3ª clase', pct: 14, color: 'bg-blue-300' },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-300 w-44 shrink-0">{label}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} flex items-center justify-end pr-2`}
                      style={{ width: `${pct}%` }}
                    >
                      <span className="text-xs font-bold text-white">{pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 3. Preprocesamiento ─── */}
        <section>
          <SectionTitle n="3" title="Preprocesamiento de Datos" id="preprocesamiento" />

          <p className="text-slate-600 dark:text-slate-300 mb-5">
            Antes de entrenar los modelos, los datos brutos pasan por un pipeline de siete etapas:
          </p>
          <div className="flex flex-wrap gap-3 mb-8 items-start">
            {PIPELINE_STEPS.map(({ n, label, desc, color }, i) => (
              <div key={n} className="flex items-center gap-2">
                <div
                  className={`${color} text-white rounded-xl px-4 py-3 text-sm font-semibold min-w-[120px] text-center shadow-sm`}
                >
                  <span className="block text-xs opacity-70 mb-0.5">Paso {n}</span>
                  {label}
                  <span className="block text-xs opacity-70 mt-0.5">{desc}</span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-lg">→</span>
                )}
              </div>
            ))}
          </div>

          {/* Feature Engineering */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm mb-5">
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-3">Ingeniería de Características</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Se crearon tres nuevas variables que aportan información relevante adicional:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                { name: 'FamilySize', formula: 'SibSp + Parch + 1', desc: 'Tamaño del grupo familiar a bordo. Indica si el pasajero viajaba solo o en familia.' },
                { name: 'IsAlone', formula: 'FamilySize == 1', desc: 'Indicador binario: 1 si viajaba solo, 0 si tenía familia. Los que viajan solos tienden a sobrevivir menos.' },
                { name: 'Title', formula: 'Extraído de Name', desc: 'Título social (Mr, Mrs, Miss, Master, Rare). Captura género, edad y clase social en una sola variable.' },
              ].map(({ name, formula, desc }) => (
                <div key={name} className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4">
                  <p className="font-mono font-bold text-indigo-700 dark:text-indigo-300 mb-1">{name}</p>
                  <p className="text-xs font-mono text-indigo-500 dark:text-indigo-400 mb-2">{formula}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{desc}</p>
                </div>
              ))}
            </div>
            <CodeBlock
              code={`df['FamilySize'] = df['SibSp'] + df['Parch'] + 1
df['IsAlone'] = (df['FamilySize'] == 1).astype(int)
df['Title'] = df['Name'].str.extract(r' ([A-Za-z]+)\\.', expand=False)

# Agrupar títulos raros
rare_titles = ['Lady', 'Countess', 'Capt', 'Col', 'Don', 'Dr', ...]
df['Title'] = df['Title'].replace(rare_titles, 'Rare')
df['Title'] = df['Title'].replace({'Mlle': 'Miss', 'Ms': 'Miss', 'Mme': 'Mrs'})`}
            />
          </div>

          {/* Missing values */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm mb-5">
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-3">Manejo de Valores Nulos</p>
            <div className="space-y-3 mb-4">
              {[
                { col: 'Age', strategy: 'Mediana agrupada por Title', why: 'Preserva el perfil social del pasajero: Mr → 30 años, Master → 3.5 años, etc.', type: 'impute' },
                { col: 'Embarked', strategy: 'Moda (valor más frecuente)', why: 'Solo 2 valores faltantes. La moda es "S" (Southampton).', type: 'impute' },
                { col: 'Cabin', strategy: 'Columna eliminada', why: '77.10% de nulos. Sin suficiente información para imputar con validez.', type: 'drop' },
              ].map(({ col, strategy, why, type }) => (
                <div key={col} className="flex gap-3">
                  <span className={`shrink-0 font-mono font-bold text-sm px-2 py-0.5 rounded h-fit ${
                    type === 'drop'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  }`}>
                    {col}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{strategy}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{why}</p>
                  </div>
                </div>
              ))}
            </div>
            <CodeBlock
              code={`# Age: mediana agrupada por título social
age_median_by_title = df.groupby('Title')['Age'].median()
# → Master: 3.5  Miss: 21.0  Mr: 30.0  Mrs: 35.0  Rare: 48.5

df['Age'] = df.apply(
    lambda row: age_median_by_title[row['Title']] if pd.isnull(row['Age']) else row['Age'],
    axis=1
)
df['Embarked'] = df['Embarked'].fillna(df['Embarked'].mode()[0])`}
            />
          </div>

          {/* Data funnel */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-4">Reducción del dataset tras limpieza</p>
            <div className="flex flex-col items-center gap-1">
              {[
                { n: '891', label: 'Registros originales', color: 'bg-slate-600', w: 'w-full' },
                { n: '', label: '↓ Eliminar duplicados (167 filas duplicadas)', color: '', w: '' },
                { n: '778', label: 'Tras deduplicación', color: 'bg-indigo-600', w: 'w-[87%]' },
                { n: '', label: '↓ Eliminar outliers IQR (Age, Fare, FamilySize)', color: '', w: '' },
                { n: '583', label: 'Dataset limpio final', color: 'bg-emerald-600', w: 'w-[65%]' },
                { n: '', label: '↓ División 80% entrenamiento / 20% prueba', color: '', w: '' },
                { n: '466 | 117', label: 'Entrenamiento | Prueba', color: 'bg-violet-600', w: 'w-[65%]' },
              ].map(({ n, label, color, w }, i) =>
                n ? (
                  <div key={i} className={`${w} ${color} text-white rounded-xl px-5 py-3 flex items-center justify-between`}>
                    <span className="font-black text-lg">{n}</span>
                    <span className="text-sm opacity-80">{label}</span>
                  </div>
                ) : (
                  <p key={i} className="text-xs text-slate-400 dark:text-slate-500 italic py-1">{label}</p>
                )
              )}
            </div>
          </div>
        </section>

        {/* ─── 4. Modelos ─── */}
        <section>
          <SectionTitle n="4" title="Modelos de Machine Learning" id="modelos" />
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Se entrenaron tres clasificadores con las clases de entrenamiento balanceadas mediante
            oversampling (resample). Los modelos son evaluados sobre el conjunto de prueba de 117 registros.
          </p>

          <div className="space-y-6">
            {MODELS.map((m) => (
              <div key={m.name} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className={`${m.headerColor} px-6 py-4 text-white flex items-center justify-between`}>
                  <div>
                    <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">{m.badge}</span>
                    <h3 className="text-xl font-black">{m.name}</h3>
                  </div>
                  {m.isBest && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">⭐ Mejor modelo</span>
                  )}
                </div>
                <div className="p-6">
                  <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{m.desc}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Hiperparámetros</p>
                      <p className="font-mono text-sm text-slate-700 dark:text-slate-200">{m.params}</p>
                      {m.criterion && (
                        <p className="font-mono text-sm text-slate-700 dark:text-slate-200">criterion={m.criterion}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Train Acc', value: `${m.trainAcc}%`, color: 'text-slate-700 dark:text-slate-200' },
                        { label: 'Test Acc', value: `${m.testAcc}%`, color: 'text-indigo-700 dark:text-indigo-300' },
                        { label: 'F1 Score', value: m.f1.toFixed(4), color: 'text-violet-700 dark:text-violet-300' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-center">
                          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</p>
                          <p className={`font-bold text-sm ${color}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">✓ Ventajas</p>
                      <ul className="space-y-1">
                        {m.pros.map((p) => (
                          <li key={p} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                            <span className="text-emerald-500 shrink-0">+</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-2">✗ Desventajas</p>
                      <ul className="space-y-1">
                        {m.cons.map((c) => (
                          <li key={c} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                            <span className="text-rose-400 shrink-0">−</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <CodeBlock code={m.codeLine} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 5. Evaluación ─── */}
        <section>
          <SectionTitle n="5" title="Evaluación de Modelos" id="evaluacion" />

          {/* Comparison table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <p className="font-bold text-slate-700 dark:text-slate-200">Tabla comparativa de métricas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                    <th className="text-left px-5 py-3 text-slate-500 dark:text-slate-400 font-semibold">Modelo</th>
                    <th className="text-center px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">Train Acc</th>
                    <th className="text-center px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">Test Acc</th>
                    <th className="text-center px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">F1 Score</th>
                    <th className="text-center px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">Precision</th>
                    <th className="text-center px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">Recall</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr
                      key={row.model}
                      className={`border-b border-slate-50 dark:border-slate-700/50 ${
                        row.best ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold mr-2 ${row.badge}`}>
                          {row.model.includes('Árbol') ? 'DT' : row.model.includes('Forest') ? 'RF' : 'LR'}
                        </span>
                        <span className="text-slate-700 dark:text-slate-200">{row.model}</span>
                        {row.best && (
                          <span className="ml-2 text-xs text-violet-600 dark:text-violet-400 font-semibold">⭐ mejor</span>
                        )}
                      </td>
                      <td className="text-center px-4 py-4 text-slate-700 dark:text-slate-200">{row.trainAcc}%</td>
                      <td className={`text-center px-4 py-4 font-bold ${row.best ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}`}>
                        {row.testAcc}%
                      </td>
                      <td className="text-center px-4 py-4 text-slate-700 dark:text-slate-200">{row.f1}</td>
                      <td className="text-center px-4 py-4 text-slate-700 dark:text-slate-200">{row.precision}</td>
                      <td className="text-center px-4 py-4 text-slate-700 dark:text-slate-200">{row.recall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confusion matrices */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Matrices de Confusión</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Las matrices muestran cuántos pasajeros se clasificaron correctamente (TN, TP) o
              incorrectamente (FP, FN) en el conjunto de prueba de 117 registros.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CONFUSION_MATRICES.map((cm) => (
                <ConfusionMatrix key={cm.name} name={cm.name} matrix={cm.matrix} />
              ))}
            </div>
          </div>

          {/* Feature Importance */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Importancia de Variables</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Variables con mayor importancia son las que mejor separan las clases en el ensemble.
            </p>
            <div className="space-y-3">
              {FEATURE_IMPORTANCE.map(({ feature, dt, rf }) => (
                <div key={feature} className="grid grid-cols-[80px_1fr] gap-3 items-center">
                  <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 text-right">
                    {feature}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${dt}%` }} />
                      </div>
                      <span className="text-xs text-indigo-600 dark:text-indigo-300 w-8 text-right">{dt}%</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 w-4">DT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${rf}%` }} />
                      </div>
                      <span className="text-xs text-violet-600 dark:text-violet-300 w-8 text-right">{rf}%</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 w-4">RF</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>
                <span className="inline-block w-3 h-3 bg-indigo-400 rounded-sm mr-1 align-middle" />
                Árbol de Decisión
              </span>
              <span>
                <span className="inline-block w-3 h-3 bg-violet-500 rounded-sm mr-1 align-middle" />
                Random Forest
              </span>
            </div>
          </div>
        </section>

        {/* ─── 6. Predictor ─── */}
        <section>
          <SectionTitle n="6" title="Predictor Interactivo" id="predictor" />
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Ingresa el perfil de un pasajero y observa la predicción en tiempo real de los tres
            modelos entrenados. El simulador aproxima el comportamiento del Random Forest entrenado,
            derivando automáticamente las variables de ingeniería de características.
          </p>
          <PredictionSimulator />
        </section>

        {/* ─── 7. Conclusiones ─── */}
        <section>
          <SectionTitle n="7" title="Conclusiones" id="conclusiones" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CONCLUSIONS.map(({ icon, title, body }) => (
              <div key={title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <span className="text-2xl mb-2 block">{icon}</span>
                <p className="font-bold text-slate-800 dark:text-white mb-2">{title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 dark:bg-black text-slate-400 py-10 px-6 mt-16">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div>
            <p className="font-semibold text-white">Caso Titanic — Documentación Interactiva</p>
            <p>Aplicaciones de Analítica de Negocios 2</p>
          </div>
          <div className="text-right text-xs space-y-1">
            <p>pandas · numpy · scikit-learn · seaborn</p>
            <p>DecisionTree · RandomForest · LogisticRegression</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
