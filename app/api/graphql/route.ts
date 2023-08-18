import { GRAPHQL_KEY, GRAPHQL_URL } from '@/app/constants/constants';
import { NextResponse } from 'next/server';

export async function POST(req: any) {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            "Content-Type": 'application/json',
            "x-api-key": GRAPHQL_KEY,
        }
    })
    const res = await response.json();
    return NextResponse.json({ response: res }, { status: 200 })
}
