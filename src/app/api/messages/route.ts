import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateRoom, addMessage, getMessages, getRoomId } from '@/lib/messages';
import { getPusherServer } from '@/lib/pusher-server';

// GET - Fetch messages for a conversation
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('otherUserId');

    if (!otherUserId) {
      return NextResponse.json(
        { error: 'Other user ID is required' },
        { status: 400 }
      );
    }

    const roomId = getRoomId(session.user.id, otherUserId);
    const messages = getMessages(roomId);

    return NextResponse.json({ messages, roomId });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, encryptedContent } = await request.json();

    if (!receiverId || !encryptedContent) {
      return NextResponse.json(
        { error: 'Receiver ID and encrypted content are required' },
        { status: 400 }
      );
    }

    // Get or create the chat room
    const room = getOrCreateRoom(session.user.id, receiverId);

    // Add the message (it's already encrypted client-side)
    const message = addMessage(
      room.id,
      session.user.id,
      session.user.name,
      receiverId,
      encryptedContent
    );

    // Broadcast via Pusher
    const pusher = getPusherServer();
    await pusher.trigger(`chat-${room.id}`, 'new-message', {
      message,
    });

    // Also notify the receiver on their personal channel
    await pusher.trigger(`user-${receiverId}`, 'message-received', {
      roomId: room.id,
      senderId: session.user.id,
      senderName: session.user.name,
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
