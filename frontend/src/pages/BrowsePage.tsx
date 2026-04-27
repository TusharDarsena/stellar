import React, { useState } from 'react';
import { Event } from '../types';
import { EventCard } from '../components/events/EventCard';

// Mock data matching the Stitch design
const MOCK_EVENTS: Event[] = [
  {
    eventId: 'evt_1',
    organizer: 'org_1',
    name: 'Neon Velocity World Tour',
    dateUnix: 1729800000, // Oct 24, 2024
    capacity: 500,
    pricePerTicket: 450000000, // 45 XLM
    currentSupply: 488,
    status: 'Active',
    venue: 'Crystal Arena',
    city: 'Tokyo',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'
  },
  {
    eventId: 'evt_2',
    organizer: 'org_2',
    name: 'Global Champions League',
    dateUnix: 1731425400, // Nov 12, 2024
    capacity: 10000,
    pricePerTicket: 1200000000, // 120 XLM
    currentSupply: 10000, // Waitlist (Sold out)
    status: 'Active',
    venue: 'Metropolis Stadium',
    city: 'London',
    imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80'
  },
  {
    eventId: 'evt_3',
    organizer: 'org_3',
    name: 'Elysium: The Opera',
    dateUnix: 1733425200, // Dec 05, 2024
    capacity: 1200,
    pricePerTicket: 855000000, // 85.50 XLM
    currentSupply: 1158,
    status: 'Active',
    venue: 'Royal Hall',
    city: 'Paris',
    imageUrl: 'https://images.unsplash.com/photo-1507676184212-d0330a156f95?w=800&q=80'
  },
  {
    eventId: 'evt_4',
    organizer: 'org_4',
    name: 'Stellar Arts Festival',
    dateUnix: 1755248400, // Aug 15, 2025
    capacity: 5000,
    pricePerTicket: 250000000, // 25 XLM
    currentSupply: 4000,
    status: 'Active',
    venue: 'Bay Area Park',
    city: 'San Francisco',
    imageUrl: 'https://images.unsplash.com/photo-1533174000255-b0728c03c5b5?w=800&q=80'
  }
];

const CATEGORIES = ['All', 'Music', 'Sports', 'Theater', 'Comedy', 'Festivals'];

interface BrowsePageProps {
  onEventClick: (eventId: string) => void;
}

export function BrowsePage({ onEventClick }: BrowsePageProps) {
  const [activeCategory, setActiveCategory] = useState('All');

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_EVENTS.map(event => (
          <EventCard 
            key={event.eventId} 
            event={event} 
            onClick={onEventClick}
          />
        ))}
      </div>
    </main>
  );
}
