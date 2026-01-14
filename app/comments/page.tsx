'use client';

import { useState } from 'react';

export default function CommentsPage() {
  const [postText, setPostText] = useState('');

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 sticky top-0 z-50 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-950 rounded-lg"></div>
            <div>
              <h1 className="text-xl font-light text-slate-950">Comment Copilot</h1>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">Luxury Edition</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16">
        <div className="mb-20">
          <h2 className="text-4xl font-light text-slate-950 mb-2">Din LinkedIn Post</h2>
          <p className="text-base text-slate-500 font-light mb-8">Indsæt posten du ønsker kommentarer til</p>

          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Paste LinkedIn post her..."
              className="w-full h-40 bg-white text-slate-950 text-lg font-light resize-none focus:outline-none border-b border-slate-200 pb-6"
            />

            <div className="grid grid-cols-3 gap-8 mt-8 pt-8 border-t border-slate-200">
              <div>
                <lab
