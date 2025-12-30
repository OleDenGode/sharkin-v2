'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🦈</span>
            <h1 className="text-2xl font-bold text-blue-600">SharkIN</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900"
          >
            Log ud
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-2">Velkommen tilbage! 👋</h2>
        <p className="text-gray-600 mb-12">{user.email}</p>

        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/hooks')}
            className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition text-left"
          >
            <div className="text-4xl mb-4">🪝</div>
            <h3 className="text-xl font-bold mb-2">Hook & Intro Studio</h3>
            <p className="text-gray-600">
              Generer hooks til dine LinkedIn posts
            </p>
          </button>

          <button
            onClick={() => router.push('/ghostwriter')}
            className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition text-left"
          >
            <div className="text-4xl mb-4">✍️</div>
            <h3 className="text-xl font-bold mb-2">Ghostwriter Workspace</h3>
            <p className="text-gray-600">
              Skriv posts i din egen stil
            </p>
          </button>

          <button
            onClick={() => router.push('/comments')}
            className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition text-left"
          >
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">Comment Copilot</h3>
            <p className="text-gray-600">
              Generer smarte kommentarer
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
