'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check, Send, ArrowRight } from 'lucide-react';

interface Comment {
  text: string;
  angle: string;
  strategy_reasoning: string;
  wordCount: number;
  toneMatch: string;
}

interface Result {
  post_analysis?: {
    core_message: string;
    detected_tone: string;
    poster_intent: string;
    engagement_opportunities: string[];
  };
  comments?: Comment[];
}

export default function CommentsPage() {
  const [postText, setPostText] = useState('');
  const [language, setLanguage] = useState('da');
  const [tone, setTone] = useState('professional');
  const [relationshipContext, setRelationshipContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const generateComments = async () => {
    if (!postText.trim()) {
      alert('Skriv den LinkedIn post først!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          postText,
          language,
          tone,
          relationshipContext,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Fejl ved generering');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Noget gik galt - check console');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(t
