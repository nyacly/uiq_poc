import { NextResponse } from 'next/server';

export type HealthResponse = {
  ok: true;
  ts: string;
};

export async function GET() {
  const body: HealthResponse = {
    ok: true,
    ts: new Date().toISOString(),
  };

  return NextResponse.json(body);
}
