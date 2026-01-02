'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GhostwriterPage() {
  const [userId, setUserId] = useState<string | null>(null);
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
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
      
      // Clear localStorage after loading
      localStorage.removeItem('ghostwriter_hook');
      localStorage.removeItem('ghostwriter_outline');
      localStorage.removeItem('ghostwriter_postType');
    }
  }, [router, searchParams]);

  const generatePosts = async () => {
    if (!hook.trim() && !idea.trim()) {
      alert('Skriv
