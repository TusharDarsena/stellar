import React from 'react';
import { Event, stroopsToXlm, formatEventDate } from '../types';
import { Button } from '../components/ui/Button';

interface EventDetailPageProps {
  eventId: string;
  onBack: () => void;
  onPurchase: (eventId: string) => void;
}

// Hardcoded mock to match the design for now
const MOCK_EVENT: Event = {
  eventId: 'evt_3',
  organizer: 'Stellar Events Group',
  name: 'Galactic Neo-Jazz Festival',
  dateUnix: 1726340400, // September 14, 2024
  capacity: 500,
  pricePerTicket: 1450000000, // 145 XLM
  currentSupply: 88, // 412 left means 88 minted out of 500
  status: 'Active',
  venue: 'The Zenith Atrium',
  city: 'Neo Tokyo',
  imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
};

export function EventDetailPage({ eventId, onBack, onPurchase }: EventDetailPageProps) {
  // In a real app, fetch event by eventId. For now, use mock.
  const event = MOCK_EVENT;
  const ticketsLeft = event.capacity - event.currentSupply;
  const soldPercentage = Math.round((event.currentSupply / event.capacity) * 100);

  return (
    <div className="bg-[#0E1113] min-h-screen">
      {/* Sticky Header */}
      <header className="fixed top-0 w-full z-50 bg-[#15181C]/85 backdrop-blur-md border-b border-[#272C33]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-[#272C33] rounded-full transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[#e6e0ee]">arrow_back</span>
            </button>
            <h2 className="text-xl font-semibold text-[#e6e0ee] truncate max-w-[200px] md:max-w-none">
              {event.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#272C33] rounded-full transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[#e6e0ee]">share</span>
            </button>
            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#36333e] rounded-lg text-sm font-semibold text-[#c9c4d8] hover:text-[#e6e0ee] transition-colors">
              <span className="material-symbols-outlined text-sm">favorite</span>
              Save
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="w-full aspect-video md:aspect-[21/9] overflow-hidden md:rounded-xl md:mt-6 md:px-8">
          <img 
            src={event.imageUrl} 
            alt={event.name}
            className="w-full h-full object-cover" 
          />
        </div>

        <div className="px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Content */}
          <div className="lg:col-span-8 space-y-10">
            <section>
              <h1 className="text-4xl md:text-5xl font-bold text-[#e6e0ee] mb-4 tracking-tight">{event.name}</h1>
              <div className="flex items-center gap-2 py-2 px-3 bg-[#1c1a24] rounded-lg w-fit border border-[#272C33]">
                <span className="material-symbols-outlined text-[#cabeff] text-sm">key</span>
                <span className="font-mono text-[#c9c4d8] text-xs truncate max-w-[150px] md:max-w-none">
                  GD3V...4Z7Q (Stellar Ecosystem Foundation)
                </span>
              </div>
            </section>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-4 rounded-xl border border-[#272C33] bg-[#15181C]">
                <div className="p-2 bg-[#201e28] rounded-lg">
                  <span className="material-symbols-outlined text-[#cabeff]">calendar_today</span>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-[#938ea1]">Date</p>
                  <p className="text-base text-[#e6e0ee]">{formatEventDate(event.dateUnix)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-xl border border-[#272C33] bg-[#15181C]">
                <div className="p-2 bg-[#201e28] rounded-lg">
                  <span className="material-symbols-outlined text-[#cabeff]">schedule</span>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-[#938ea1]">Time</p>
                  <p className="text-base text-[#e6e0ee]">19:00 - 02:00 GMT</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-xl border border-[#272C33] bg-[#15181C]">
                <div className="p-2 bg-[#201e28] rounded-lg">
                  <span className="material-symbols-outlined text-[#cabeff]">location_on</span>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-[#938ea1]">Location</p>
                  <p className="text-base text-[#e6e0ee]">{event.venue}, {event.city}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-xl border border-[#272C33] bg-[#15181C]">
                <div className="p-2 bg-[#201e28] rounded-lg">
                  <span className="material-symbols-outlined text-[#cabeff]">group</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-semibold tracking-wider uppercase text-[#938ea1]">Availability</p>
                    <p className="text-xs font-semibold tracking-wider uppercase text-[#cabeff]">{soldPercentage}% Sold</p>
                  </div>
                  <div className="w-full h-1.5 bg-[#36333e] rounded-full overflow-hidden">
                    <div className="bg-[#cabeff] h-full" style={{ width: `${soldPercentage}%` }}></div>
                  </div>
                  <p className="text-[10px] text-[#484555] mt-1">{ticketsLeft} / {event.capacity} Tickets Remaining</p>
                </div>
              </div>
            </div>

            <section>
              <h3 className="text-2xl font-semibold text-[#e6e0ee] mb-4">About the Event</h3>
              <div className="text-base text-[#c9c4d8] space-y-4 leading-relaxed">
                <p>Experience the convergence of celestial rhythms and digital art. The Galactic Neo-Jazz Festival brings together the most innovative musicians from across the quadrant for a one-night-only immersive experience.</p>
                <p>Each ticket is a unique NFT minted on the Stellar network, granting not only entry but also a permanent digital memento of the performance. VIP pass holders will receive exclusive access to the 'Orbital Lounge' and a limited edition generative art drop from the artist collective.</p>
                <p>Doors open at 18:30 for the holographic pre-show. Zero-gravity cocktails and light-synth refreshments will be served throughout the evening.</p>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Checkout */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-[#15181C] border border-[#272C33] p-6 rounded-xl shadow-2xl">
              <div className="mb-6">
                <p className="text-xs font-semibold tracking-wider uppercase text-[#484555] mb-1">Floor Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[32px] font-semibold text-[#e6e0ee] tracking-tight">{stroopsToXlm(event.pricePerTicket)}</span>
                  <span className="text-2xl font-semibold text-[#cabeff]">XLM</span>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-[#272C33]">
                  <span className="text-sm text-[#c9c4d8]">General Admission</span>
                  <span className="font-mono text-sm text-[#e6e0ee]">Available</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#272C33]">
                  <span className="text-sm text-[#c9c4d8]">Blockchain Fee</span>
                  <span className="font-mono text-sm text-[#e6e0ee]">0.00001 XLM</span>
                </div>
              </div>
              
              <Button 
                onClick={() => onPurchase(event.eventId)}
                className="w-full py-4 text-lg"
              >
                <span className="material-symbols-outlined mr-2">confirmation_number</span>
                Buy Ticket
              </Button>
              
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#272C33] pt-6">
                <div className="flex flex-col items-center text-center gap-1">
                  <span className="material-symbols-outlined text-[#484555] text-xl">shield</span>
                  <span className="text-[10px] text-[#938ea1] uppercase font-bold">Secure</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <span className="material-symbols-outlined text-[#484555] text-xl">bolt</span>
                  <span className="text-[10px] text-[#938ea1] uppercase font-bold">Instant</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <span className="material-symbols-outlined text-[#484555] text-xl">sync</span>
                  <span className="text-[10px] text-[#938ea1] uppercase font-bold">Verified</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-[#1c1a24] border border-[#272C33] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#947dff] flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" 
                  alt="Organizer" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <p className="text-[10px] text-[#938ea1] uppercase font-bold">Organizer</p>
                <p className="text-sm text-[#e6e0ee] font-medium">{event.organizer}</p>
              </div>
              <button className="ml-auto text-[#cabeff] text-sm font-bold hover:underline">
                Follow
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
