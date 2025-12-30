'use client';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl mb-4">🦈</div>
        <h1 className="text-5xl font-bold mb-4">SharkIN</h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered LinkedIn content creation
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
        >
          Kom i gang →
        </button>
      </div>
    </div>
  );
}
