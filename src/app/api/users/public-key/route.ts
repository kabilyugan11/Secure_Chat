import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateUserPublicKey } from '@/lib/users';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicKey } = await request.json();

    if (!publicKey) {
      return NextResponse.json(
        { error: 'Public key is required' },
        { status: 400 }
      );
    }

    const user = await updateUserPublicKey(
      session.user.id,
      JSON.stringify(publicKey)
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Public key updated successfully' });
  } catch (error) {
    console.error('Error updating public key:', error);
    return NextResponse.json(
      { error: 'Failed to update public key' },
      { status: 500 }
    );
  }
}
