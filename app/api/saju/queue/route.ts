import { NextResponse } from 'next/server';
import { getCurrent, getMax, getQueueLength } from '@/src/middleware/concurrency';

export async function GET() {
  return NextResponse.json({
    current: getCurrent(),
    max: getMax(),
    queue: getQueueLength(),
    available: getCurrent() < getMax(),
  });
}
