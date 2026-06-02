import { spawn } from 'node:child_process';

type ModelId = 'dt' | 'rf' | 'lr';

const MODEL_IDS = new Set<ModelId>(['dt', 'rf', 'lr']);

export const runtime = 'nodejs';

async function proxyToPythonFunction(request: Request, model: ModelId) {
  const target = new URL(`/api/python/predict-csv/${model}`, request.url);
  const response = await fetch(target, {
    method: 'POST',
    body: await request.formData(),
  });

  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/json' },
  });
}

async function runLocalPython(model: ModelId, file: File) {
  const child = spawn('python3', ['api/_local_predict_csv.py', '--model', model, '--filename', file.name], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const stdout = new Promise<Buffer>((resolve) => {
    const chunks: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.stdout.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const stderr = new Promise<Buffer>((resolve) => {
    const chunks: Buffer[] = [];
    child.stderr.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on('end', () => resolve(Buffer.concat(chunks)));
  });

  child.stdin.end(Buffer.from(await file.arrayBuffer()));

  const [stdoutBuffer, stderrBuffer, exitCode] = await Promise.all([
    stdout,
    stderr,
    new Promise<number | null>((resolve) => child.on('close', resolve)),
  ]);

  const rawOutput = stdoutBuffer.toString('utf-8').trim();
  const status = exitCode === 0 ? 200 : 400;

  if (rawOutput) {
    return new Response(rawOutput, {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return Response.json(
    { error: stderrBuffer.toString('utf-8').trim() || 'No se pudo ejecutar Python localmente.' },
    { status: 500 }
  );
}

export async function POST(request: Request, ctx: RouteContext<'/api/predict-csv/[model]'>) {
  const { model } = await ctx.params;
  if (!MODEL_IDS.has(model as ModelId)) {
    return Response.json({ error: 'Modelo no válido.' }, { status: 404 });
  }

  if (process.env.VERCEL === '1') {
    return proxyToPythonFunction(request, model as ModelId);
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: "No se encontró el campo de archivo 'file'." }, { status: 400 });
  }

  return runLocalPython(model as ModelId, file);
}
