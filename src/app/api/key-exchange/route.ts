import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher-server';

/**
 * Key Exchange API
 * 
 * Facilitates secure key exchange between users using Pusher channels.
 * When user A wants to chat with user B:
 * 1. User A sends their public key to this endpoint
 * 2. Server broadcasts it to user B via Pusher
 * 3. User B receives it and responds with their public key
 * 4. Both users can now derive a shared secret
 */

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId, publicKey, isResponse } = await request.json();

    if (!targetUserId || !publicKey) {
      return NextResponse.json(
        { error: 'Target user ID and public key are required' },
        { status: 400 }
      );
    }

    const pusher = getPusherServer();
    const eventName = isResponse ? 'key-exchange-response' : 'key-exchange-request';

    // Send the public key to the target user
    await pusher.trigger(`user-${targetUserId}`, eventName, {
      fromUserId: session.user.id,
      fromUserName: session.user.name,
      publicKey,
    });

    return NextResponse.json({ 
      success: true,
      message: isResponse ? 'Key exchange response sent' : 'Key exchange request sent'
    });
  } catch (error) {
    console.error('Key exchange error:', error);
    return NextResponse.json(
      { error: 'Failed to exchange keys' },
      { status: 500 }
    );
  }
}
