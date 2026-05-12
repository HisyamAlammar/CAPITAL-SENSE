import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { code } = await request.json();
        const betaCode = process.env.ACCESS_CODE;
        const adminCode = process.env.ADMIN_ACCESS_CODE;

        if (!betaCode || !adminCode) {
            return NextResponse.json({ error: 'Auth environment is not configured.' }, { status: 500 });
        }

        const role = code === adminCode ? 'admin' : code === betaCode ? 'user' : null;
        if (!role) {
            return NextResponse.json({ error: 'Invalid access code.' }, { status: 401 });
        }

        const response = NextResponse.json({ ok: true, role });
        response.cookies.set('cs_session', role, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24,
        });

        return response;
    } catch {
        return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
}
