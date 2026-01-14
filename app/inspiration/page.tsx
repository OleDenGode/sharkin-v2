'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Search, Filter, Heart, Copy, Check, 
  TrendingUp, Briefcase, Target, Code, Rocket, 
  Users, ChevronDown, Star, Shuffle
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface InspirationPost {
  id: string;
  hook: string;
  category: string;
  subcategory: string;
  hook_type: string;
  tone: string;
  estimated_engagement: string;
  total_score: number;
  grade: string;
  is_featured: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'Alle', icon: Sparkles },
  { id: 'leadership', label: 'Ledelse', icon: Users },
  { id: 'sales', label: 'Salg', icon: Target },
  { id: 'marketing', label: 'Marketing', icon: TrendingUp },
  { id: 'career', label: 'Karriere', icon: Briefcase },
  { id: 'tech', label: 'Tech', icon: Code },
  { id: 'entrepreneurship', label: 'Startup', icon: Rocket },
];

const HOOK_TYPES = [
  { id: 'all', label: 'Alle typer' },
  { id: 'kontrast', label: 'Kontrast' },
  { id: 'tal', label: 'Tal' },
  { id: 'indrømmelse', label: 'Indrømmelse' },
  { id: 'provokation', label: 'Provokation' },
  { id: 'spørgsmål', label: 'Spørgsmål' },
];

function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'A+': 'text-emerald-400',
    'A': 'text-emerald-400',
    'B+': 'text-teal-400',
    'B': 'text-cyan-400',
    'C+': 'text-amber-400',
    'C': 'text-amber-500',
  };
  return colors[grade] || 'text-gray-400';
}

function getGradeBg(grade: string): string {
  const colors: Record<string, string> = {
    'A+': 'bg-emerald-500/10 border-emerald-500/30',
    'A': 'bg-emerald-400/10 border-emerald-400/30',
    'B+': 'bg-teal-400/10 border-teal-400/30',
    'B': 'bg-cyan-400/10 border-cyan-400/30',
  };
  return colors[grade] || 'bg-gray-400/10 border-gray-400/30';
}

export default function InspirationPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [posts, setPosts] = useState<InspirationPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<InspirationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedHookType, setSelectedHookType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
        setUserEmail(user.email || '');
        loadPosts();
        loadFavorites(user.id);
      }
    });
  }, [router]);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inspiration_posts')
      .select('*')
      .eq('is_active', true)
      .order('total_score', { ascending: false });

    if (data) {
      setPosts(data);
      setFilteredPosts(data);
    }
    setLoading(false);
  };

  const loadFavorites = async (uid: string) => {
    const { data } = await supabase
      .from('user_favorites')
      .select('inspiration_post_id')
      .eq('user_id', uid);

    if (data) {
      setFavorites(new Set(data.map(f => f.inspiration_post_id)));
    }
  };

  useEffect(() => {
    let filtered = posts;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (selectedHookType !== 'all') {
      filtered = filtered.filter(p => p.hook_type === selectedHookType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.hook.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    setFilteredPosts(filtered);
  }, [selectedCategory, selectedHookType, searchQuery, posts]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFavorite = async (postId: string) => {
    if (!userId) return;

    if (favorites.has(postId)) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('inspiration_post_id', postId);
      
      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      await supabase
        .from('user_favorites')
        .insert({ user_id: userId, inspiration_post_id: postId });
      
      setFavorites(prev => new Set(prev).add(postId));
    }
  };

  const sendToGhostwriter = (hook: string) => {
    localStorage.setItem('ghostwriter_hook', hook);
    router.push('/ghostwriter?fromInspiration=true');
  };

  const getRandomPosts = () => {
    const shuffled = [...filteredPosts].sort(() => Math.random() - 0.5);
    setFilteredPosts(shuffled);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <span className="text-3xl">🦈</span>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              SharkIN
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden md:block">{userEmail}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
              Log ud
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl">
              <Sparkles className="w-6 h-6 text-teal-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Inspiration Library</h1>
          </div>
          <p className="text-slate-400">
            Højtperformende hooks fra succesfulde LinkedIn posts. Klik for at kopiere eller sende til Ghostwriter.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søg efter hooks..."
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-teal-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Additional filters */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Flere filtre
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={getRandomPosts}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>

            <span className="text-slate-400 text-sm">
              {filteredPosts.length} hooks
            </span>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <div className="flex flex-wrap gap-2">
                <span className="text-slate-400 text-sm mr-2">Hook type:</span>
                {HOOK_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedHookType(type.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedHookType === type.id
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Featured section */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Featured Hooks
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.filter(p => p.is_featured).slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-amber-500/30 hover:border-amber-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full border border-amber-500/30">
                      Featured
                    </span>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${getGradeBg(post.grade)} ${getGradeColor(post.grade)}`}>
                      {post.grade} • {post.total_score}
                    </div>
                  </div>
                  <p className="text-white font-medium leading-relaxed mb-4">
                    "{post.hook}"
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 capitalize">
                      {post.category} • {post.hook_type}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleFavorite(post.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          favorites.has(post.id) 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${favorites.has(post.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => copyToClipboard(post.hook, post.id)}
                        className="p-2 bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                      >
                        {copiedId === post.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All hooks grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            {selectedCategory === 'all' ? 'Alle Hooks' : CATEGORIES.find(c => c.id === selectedCategory)?.label}
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Ingen hooks fundet med de valgte filtre.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700 hover:border-slate-600 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full capitalize">
                      {post.hook_type}
                    </span>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold border ${getGradeBg(post.grade)} ${getGradeColor(post.grade)}`}>
                      {post.grade} • {post.total_score}
                    </div>
                  </div>
                  
                  <p className="text-white font-medium leading-relaxed mb-4 line-clamp-3">
                    "{post.hook}"
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 capitalize">
                      {post.category}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleFavorite(post.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          favorites.has(post.id) 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${favorites.has(post.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => copyToClipboard(post.hook, post.id)}
                        className="p-2 bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                      >
                        {copiedId === post.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => sendToGhostwriter(post.hook)}
                        className="px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Brug →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
