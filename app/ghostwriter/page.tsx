'use client';
import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function GhostwriterContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [hook, setHook] = useState('');
  const [outline, setOutline] = useState('');
  const [postType, setPostType] = useState('');
  const [idea, setIdea] = useState('');
  const [language, setLanguage] = useState('da');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [previousPosts, setPreviousPosts] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [fromHook, setFromHook] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('ghostwriter_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setIdea(parsed.idea || '');
      setLanguage(parsed.language || 'da');
      setTone(parsed.tone || 'professional');
      setTargetAudience(parsed.targetAudience || '');
      setPreviousPosts(parsed.previousPosts || '');
      if (parsed.posts) setPosts(parsed.posts);
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    const state = { idea, language, tone, targetAudience, previousPosts, posts };
    localStorage.setItem('ghostwriter_state', JSON.stringify(state));
  }, [idea, language, tone, targetAudience, previousPosts, posts]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
        setUserEmail(user.email || '');
      }
    });

    // Check if coming from Hook Generator
    if (searchParams.get('fromHook') === 'true') {
      const savedHook = localStorage.getItem('ghostwriter_hook');
      const savedOutline = localStorage.getItem('ghostwriter_outline');
      const savedPostType = localStorage.getItem('ghostwriter_postType');
      
      if (savedHook) {
        setHook(savedHook);
        setFromHook(true);
      }
      if (savedOutline) setOutline(savedOutline);
      if (savedPostType) setPostType(savedPostType);
      
      localStorage.removeItem('ghostwriter_hook');
      localStorage.removeItem('ghostwriter_outline');
      localStorage.removeItem('ghostwriter_postType');
    }
  }, [router, searchParams]);

  const handleLogout = async () => {
    localStorage.removeItem('hooks_state');
    localStorage.removeItem('ghostwriter_state');
    localStorage.removeItem('comments_state');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const generatePosts = async () => {
    if (!hook.trim() && !idea.trim()) {
      alert('Skriv venligst en hook eller idé først!');
      return;
    }

    setLoading(true);
    setStatus('✍️ Skriver dine posts...');
    setPosts([]);

    try {
      const response = await fetch('/api/generate/ghostwriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          language,
          tone,
          targetAudience,
          hook,
          outline,
          postType,
          idea,
          previousPosts,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('');
        setPosts(data.posts);
      } else {
        setStatus('');
        alert(data.error || 'Noget gik galt');
      }
    } catch (error) {
      setStatus('');
      alert('Fejl ved generering');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Kopieret til clipboard!');
  };

  const clearHookData = () => {
    setHook('');
    setOutline('');
    setPostType('');
    setFromHook(false);
  };

  const clearForm = () => {
    setHook('');
    setOutline('');
    setPostType('');
    setIdea('');
    setTargetAudience('');
    setPreviousPosts('');
    setPosts([]);
    setFromHook(false);
    localStorage.removeItem('ghostwriter_state');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP MENU */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => router.push('/dashboard')}
          >
            <span className="text-3xl">🦈</span>
            <h1 className="text-xl md:text-2xl font-bold text-blue-600">SharkIN</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm hidden md:block">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              Log ud
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl md:text-3xl font-bold">✍️ Ghostwriter Workspace</h1>
          <button
            onClick={clearForm}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Ryd alt
          </button>
        </div>
        <p className="text-gray-600 mb-8">Skriv kom
