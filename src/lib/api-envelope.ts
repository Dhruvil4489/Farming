import { NextResponse } from 'next/server';

export interface ApiSuccessMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  [key: string]: any;
}

export function apiSuccess<T>(data: T, meta?: ApiSuccessMeta, status = 200) {
  return NextResponse.json(
    {
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(
  message: string,
  code = 'bad_request',
  status = 400,
  details?: Record<string, string[]>
) {
  const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
        request_id: requestId,
      },
    },
    { status }
  );
}
