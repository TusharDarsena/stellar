import { useState } from 'react';
import { AppView, WalletState, TxState } from './types';
import { LandingPage } from './pages/LandingPage';
import { AppHeader } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';
import { BrowsePage } from './pages/BrowsePage';
import { EventDetailPage } from './pages/EventDetailPage';
import { PurchasePage } from './pages/PurchasePage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { QRDisplayPage } from './pages/QRDisplayPage';
import { ScannerPage } from './pages/ScannerPage';
import { DashboardPage } from './pages/organizer/DashboardPage';
import { CreateEventPage } from './pages/organizer/CreateEventPage';
import { TxOverlay } from './components/ui/TxOverlay';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [txState, setTxState] = useState<TxState>({ status: 'idle' });
  
  // Mock state for now
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    walletType: null,
    xlmBalance: null
  });

  const handleSelectRole = (view: AppView) => {
    setCurrentView(view);
  };

  const handleConnectWallet = () => {
    setWallet({
      isConnected: true,
      publicKey: 'GD3...4L2P',
      walletType: 'freighter',
      xlmBalance: '150.50'
    });
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView('event-detail');
  };

  const handlePurchaseInit = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView('purchase');
  };

  const handlePurchaseComplete = (eventId: string, txHash: string) => {
    console.log(`Purchased ${eventId} with tx ${txHash}`);
    // Show success view or redirect to tickets
    setCurrentView('my-tickets');
  };

  const handleShowQR = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    // 'qr-display' is defined in AppView — attendee QR path
    setCurrentView('qr-display');
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onSelectRole={handleSelectRole} />;
      case 'browse':
        return <BrowsePage onEventClick={handleEventClick} />;
      case 'event-detail':
        return selectedEventId ? (
          <EventDetailPage 
            eventId={selectedEventId} 
            onBack={() => setCurrentView('browse')}
            onPurchase={handlePurchaseInit} 
          />
        ) : (
          <BrowsePage onEventClick={handleEventClick} />
        );
      case 'purchase':
        return selectedEventId ? (
          <PurchasePage 
            eventId={selectedEventId} 
            onBack={() => setCurrentView('event-detail')}
            onPurchaseComplete={handlePurchaseComplete}
            setTxState={setTxState}
          />
        ) : (
          <BrowsePage onEventClick={handleEventClick} />
        );
      case 'my-tickets':
        return (
          <MyTicketsPage
            onShowQR={handleShowQR}
            onBrowseMore={() => setCurrentView('browse')}
          />
        );
      case 'qr-display':
        return selectedTicketId ? (
          <QRDisplayPage
            ticketId={selectedTicketId}
            onBack={() => { setSelectedTicketId(null); setCurrentView('my-tickets'); }}
          />
        ) : (
          <MyTicketsPage onShowQR={handleShowQR} onBrowseMore={() => setCurrentView('browse')} />
        );
      case 'scanner':
        return <ScannerPage />;
      case 'organizer-dashboard':
        return (
          <DashboardPage
            onCreateEvent={() => setCurrentView('organizer-create')}
            onScanTickets={() => setCurrentView('scanner')}
          />
        );
      case 'organizer-create':
        return (
          <CreateEventPage
            onBack={() => setCurrentView('organizer-dashboard')}
            onSubmit={(data) => {
              // TODO: wire to Soroban create_event call
              console.log('Create event:', data);
              setCurrentView('organizer-dashboard');
            }}
          />
        );
      default:
        return <div className="text-white p-6 pt-24 pb-20 max-w-7xl mx-auto">404 - Not Found</div>;
    }
  };

  return (
    <>
      <TxOverlay txState={txState} />
      
      <AppHeader 
        currentView={currentView} 
        wallet={wallet} 
        onNavigate={setCurrentView} 
        onConnectWallet={handleConnectWallet} 
      />
      
      {renderView()}
      
      <BottomNav 
        currentView={currentView} 
        onNavigate={setCurrentView} 
      />
    </>
  );
}

export default App;
