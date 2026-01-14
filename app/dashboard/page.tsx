'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, PenTool, MessageCircle, Library, 
  TrendingUp, Star, ArrowRight, Zap
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ToolCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  badge?: string;
}

const tools: ToolCard[] = [
  {
    title: 'Hook & Intro Studio',
    description: 'Generer 5 AI-scorede hooks med engagement predictions og outlines',
    icon: Sparkles,
    href: '/hooks',
    gradient: 'from-teal-500 to-cyan-500',
    badge: 'NY: Scoring'
  },
  {
    title: 'Ghostwriter Workspace',
    description: 'Skriv komplette LinkedIn posts baseret på dine hooks og idéer',
    icon: PenTool,
    href: '/ghostwriter',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    title: 'Comment Copilot',
    description: 'Få 3 strategiske kommentarer til enhver LinkedIn post',
    icon: MessageCircle,
    href: '/comments',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    title: 'Inspiration Library',
    description: 'Udforsk højtperformende hooks sorteret efter kategori og score',
    icon: Library,
    href: '/inspiration',
    gradient: 'from-emerald-500 to-teal-500',
    badge: 'NY'
  }
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ hooks: 0, posts: 0, comments: 0 });
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        loadStats(user.id);
      }
    });
  }, [router]);

  const loadStats = async (userId: string) => {
    // Load user stats from database
    const [hooksRes, postsRes, commentsRes] = await Promise.all([
      supabase.from('generated_hooks').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('generated_posts').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('generated_comments').select('id', { count: 'exact' }).eq('user_id', userId)
    ]);
    
    setStats({
      hooks: hooksRes.count || 0,
      posts: postsRes.count || 0,
      comments: commentsRes.count || 0
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🦈</span>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              SharkIN
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden md:block">{user.email}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
              Log ud
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Velkommen tilbage! 👋
          </h1>
          <p className="text-slate-400">
            Hvad vil du skabe i dag?
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-slate-400 text-sm">Hooks genereret</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.hooks}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <PenTool className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400 text-sm">Posts skrevet</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.posts}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400 text-sm">Kommentarer</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.comments}</p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.href}
                onClick={() => router.push(tool.href)}
                className="group relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 text-left hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-teal-500/5"
              >
                {tool.badge && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 bg-teal-500/20 text-teal-400 text-xs font-medium rounded-full border border-teal-500/30">
                    {tool.badge}
                  </span>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-teal-400 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {tool.description}
                </p>
                <div className="flex items-center gap-1 text-teal-400 text-sm font-medium">
                  Start nu
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Tips */}
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Pro Tips</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <p className="text-white font-medium mb-1">🎯 Brug Scoring</p>
              <p className="text-slate-400 text-sm">Vælg hooks med score 8+ for bedst engagement</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <p className="text-white font-medium mb-1">📚 Udforsk Inspiration</p>
              <p className="text-slate-400 text-sm">Find hooks der virker i din branche</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <p className="text-white font-medium mb-1">💬 Engager Smart</p>
              <p className="text-slate-400 text-sm">Brug Comment Copilot til strategisk networking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
