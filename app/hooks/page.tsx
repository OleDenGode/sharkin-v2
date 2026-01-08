'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Hook {
  id: string;
  text: string;
  length: string;
  strategy: string;
  reason: string;
  postType: string;
  outline: string[];
}

interface Analysis {
  postType: string;
  coreInsight: string;
  intendedOutcome: string;
  toneGuidance: string;
}

interface HookResult {
  analysis: Analysis;
  hooks: Hook[];
}

export default function HooksPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [bulletPoints, setBulletPoints] = useState('');
  const [language, setLanguage] = useState('da');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [purpose, setPurpose] = useState('');
  const [result, setResult] = useState<HookResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [expandedHook, setExpandedHook] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedState = localStorage.getItem('hooks_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setBulletPoints(parsed.bulletPoints || '');
      setLanguage(parsed.language || 'da');
      setTone(parsed.tone || 'professional');
      setTargetAudience(parsed.targetAudience || '');
      setPurpose(parsed.purpose || '');
      if (parsed.result) setResult(parsed.result);
    }
  }, []);

  useEffect(() => {
    const state = { bulletPoints, language, tone, targetAudience, purpose, result };
    localStorage.setItem('hooks_state', JSON.stringify(state));
  }, [bulletPoints, language, tone, targetAudience, purpose, result]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
        setUserEmail(user.email || '');
      }
    });
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem('hooks_state');
    localStorage.removeItem('ghostwriter_state');
    localStorage.removeItem('comments_state');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const generateHooks = async () => {
    if (!bulletPoints.trim()) {
      alert('Skriv venligst din kernidé først!');
      return;
    }
    setLoading(true);
    setStatus('🔍 Analyserer din kernidé...');
    setResult(null);
    try {
      const response = await fetch('/api/generate/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, language, tone, targetAudience, purpose, bulletPoints }),
      });
      setStatus('🪝 Genererer hooks og outlines...');
      const data = await response.json();
      if (response.ok) {
        setStatus('');
        setResult(data);
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
    alert('Kopieret!');
  };

  const sendToGhostwriter = (hook: Hook) => {
    const outlineText = hook.outline.join('\n');
    localStorage.setItem('ghostwriter_hook', hook.text);
    localStorage.setItem('ghostwriter_outline', outlineText);
    localStorage.setItem('ghostwriter_postType', hook.postType);
    router.push('/ghostwriter?fromHook=true');
  };

  const toggleExpand = (hookId: string) => {
    setExpandedHook(expandedHook === hookId ? null : hookId);
  };

  const clearForm = () => {
    setBulletPoints('');
    setTargetAudience('');
    setPurpose('');
    setResult(null);
    localStorage.removeItem('hooks_state');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <span className="text-3xl">🦈</span>
            <h1 className="text-xl md:text-2xl font-bold text-blue-600">SharkIN</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm hidden md:block">{userEmail}</span>
            <button onClick={handleLogout} className="text-gray-600
