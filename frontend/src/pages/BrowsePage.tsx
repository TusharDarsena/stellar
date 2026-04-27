import React, { useState } from 'react';
import { Event } from '../types';
import { EventCard } from '../components/events/EventCard';

import { useEvents } from '../hooks/useEvents';
const CATEGORIES = ['All', 'Music', 'Sports', 'Theater', 'Comedy', 'Festivals'];

interface BrowsePageProps {
  onEventClick: (eventId: string) => void;
}

export function BrowsePage({ onEventClick }: BrowsePageProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const { events, loading, error } = useEvents();

  return (
    <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 md:px-8 min-h-screen">
      {/* Hero Section / Title */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tighter">Explore Experiences</h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Discover exclusive NFT-backed events. Secure, verifiable, and permanent digital collectibles for every ticket.
        </p>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-6 mb-8 no-scrollbar scroll-smooth">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold transition-all ${
              activeCategory === category 
                ? 'bg-[#947dff] text-[#2a0088] shadow-[0_0_15px_rgba(148,125,255,0.2)]'
                : 'bg-[#15181C] border border-[#272C33] text-slate-400 hover:bg-[#272C33]'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-[#947dff] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          No events found. Be the first to create one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <EventCard 
              key={event.eventId} 
              event={event} 
              onClick={onEventClick}
            />
          ))}
        </div>
      )}
    </main>
  );
}
