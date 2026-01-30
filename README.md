# SecureChat - End-to-End Encrypted Messaging Application
## (https://chat.kabilyugan.com/)

A modern, secure chat application built with Next.js, TypeScript, and Web Crypto API featuring end-to-end encryption. Designed for deployment on Vercel.

## 🔐 Security Features

### End-to-End Encryption (E2EE)
All messages are encrypted on the client-side before being sent to the server. The server **never** sees plaintext message content.


### Key Exchange Mechanism

```
┌─────────┐                              ┌─────────┐
│  Alice  │                              │   Bob   │
└────┬────┘                              └────┬────┘
     │                                        │
     │  1. Generate ECDH Key Pair             │
     │  ◄─────────────────────────────────►   │ 1. Generate ECDH Key Pair
     │                                        │
     │  2. Send Public Key                    │
     │  ─────────────────────────────────►    │
     │                                        │
     │                          3. Send Public Key
     │  ◄─────────────────────────────────    │
     │                                        │
     │  4. Derive Shared Secret               │
     │  ◄─────────────────────────────────►   │ 4. Derive Shared Secret
     │                                        │
     │  5. Encrypt messages with AES-256-GCM  │
     │  ◄═══════════════════════════════════► │
     │                                        │
```

## 🚀 Features

- ✅ **User Authentication** - Secure login/registration with bcrypt password hashing
- ✅ **End-to-End Encryption** - Messages encrypted client-side using AES-256-GCM
- ✅ **Secure Key Exchange** - ECDH P-256 for establishing shared secrets
- ✅ **Real-time Messaging** - Pusher integration for instant message delivery
- ✅ **Modern UI** - Beautiful dark theme with Tailwind CSS
- ✅ **TypeScript** - Full type safety throughout the codebase
- ✅ **Vercel Ready** - Optimized for serverless deployment

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Real-time**: Pusher
- **Encryption**: Web Crypto API
- **Icons**: Lucide React

## 🛠️ Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- (Optional) Pusher account for real-time features

### Setup

1. **Clone and navigate to the project**
   ```bash
   cd secure-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your values:
   ```env
   # Required
   NEXTAUTH_SECRET=your-super-secret-key
   NEXTAUTH_URL=http://localhost:3000

   # Optional (for real-time features)
   PUSHER_APP_ID=your-app-id
   PUSHER_SECRET=your-secret
   NEXT_PUBLIC_PUSHER_KEY=your-key
   NEXT_PUBLIC_PUSHER_CLUSTER=us2
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   (https://chat.kabilyugan.com/)
   ```



## 📁 Project Structure

```
secure-chat/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts  # NextAuth configuration
│   │   │   │   └── register/route.ts       # User registration
│   │   │   ├── messages/route.ts           # Message CRUD
│   │   │   ├── users/
│   │   │   │   ├── route.ts                # User listing
│   │   │   │   └── public-key/route.ts     # Public key management
│   │   │   └── key-exchange/route.ts       # Key exchange endpoint
│   │   ├── login/page.tsx                  # Login page
│   │   ├── register/page.tsx               # Registration page
│   │   ├── globals.css                     # Global styles
│   │   ├── layout.tsx                      # Root layout
│   │   └── page.tsx                        # Main chat page
│   ├── components/
│   │   ├── AuthProvider.tsx                # Session provider
│   │   ├── ChatLayout.tsx                  # Main chat layout
│   │   ├── ChatWindow.tsx                  # Chat messages UI
│   │   └── UserList.tsx                    # User sidebar
│   └── lib/
│       ├── crypto.ts                       # Encryption utilities
│       ├── messages.ts                     # Message store
│       ├── pusher-client.ts                # Pusher client
│       ├── pusher-server.ts                # Pusher server
│       └── users.ts                        # User store
├── .env.example                            # Environment template
├── .env.local                              # Local environment
├── next.config.js                          # Next.js config
├── tailwind.config.js                      # Tailwind config
├── tsconfig.json                           # TypeScript config
└── package.json                            # Dependencies
```

## 🔒 How Encryption Works

### Message Flow

1. **Key Generation**: When a user logs in, an ECDH key pair is generated
2. **Key Exchange**: Before chatting, users exchange public keys via Pusher
3. **Shared Secret**: Each user derives a shared AES key using ECDH
4. **Encryption**: Messages are encrypted with AES-256-GCM before sending
5. **Transmission**: Only encrypted ciphertext travels through the server
6. **Decryption**: Recipient decrypts using the shared key

### Security Guarantees

- **Confidentiality**: Messages can only be read by sender and recipient
- **Integrity**: GCM mode provides authentication (tamper detection)
- **Forward Secrecy**: Each session can use new key pairs
- **Server Blindness**: Server only sees encrypted data

## ⚠️ Production Considerations

For a production deployment, consider:

1. **Database**: Replace in-memory stores with a proper database (PostgreSQL, MongoDB)
2. **Key Storage**: Implement secure key backup/recovery mechanisms
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Message Persistence**: Store encrypted messages in a database
5. **Group Chat**: Extend for multi-party encryption
6. **File Sharing**: Add encrypted file transfer support

## 📄 License

MIT License - feel free to use this project for learning or building your own secure applications.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with 🔐 by SecureChat Team
