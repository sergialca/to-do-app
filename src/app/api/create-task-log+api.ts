import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

type CreateTaskPayload = {
  user_id: string;
  title: string;
  description: string;
  due_date: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateTaskPayload;

  if (!body?.user_id || !body?.title || !body?.due_date) {
    return Response.json({ error: 'Missing required task fields.' }, { status: 400 });
  }

  const payload: CreateTaskPayload = {
    user_id: body.user_id,
    title: body.title,
    description: body.description ?? '',
    due_date: body.due_date,
  };

  const logDirectory = path.join(process.cwd(), 'logs', 'create-task');
  const logFile = path.join(logDirectory, 'create-tsk-logs.md');

  await mkdir(logDirectory, { recursive: true });
  await appendFile(logFile, `${JSON.stringify(payload, null, 2)}\n\n`, 'utf8');

  return Response.json({ ok: true, payload });
}
