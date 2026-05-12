import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    if (cookieStore.get('cs_session')?.value !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const adminToken = process.env.ADMIN_API_TOKEN;

    if (!apiUrl || !adminToken) {
        return NextResponse.json({ error: 'Admin API environment is not configured.' }, { status: 500 });
    }

    const response = await fetch(`${apiUrl}/api/reviews/`, {
        headers: {
            'X-Admin-Token': adminToken,
        },
        cache: 'no-store',
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
}
