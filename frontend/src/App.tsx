import { useState, useEffect } from 'react';
import { AppView } from './types';
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
import { useAppStore } from './store/useAppStore';
import { useWallet } from './hooks/useWallet';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { txState, wallet, _hasHydrated } = useAppStore();
  const { connectOrganizer, connectAttendee, disconnectWallet } = useWallet();

  // Auto-route connected users after a refresh
  useEffect(() => {
    if (_hasHydrated && currentView === 'landing' && wallet.isConnected) {
      if (wallet.walletType === 'freighter') {
        setCurrentView('organizer-dashboard');
      } else {
        setCurrentView('browse');
      }
    }
  }, [_hasHydrated, wallet.isConnected, wallet.walletType, currentView]);

  // Prevent rendering until Zustand restores the session
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleSelectRole = (view: AppView) => {
    setCurrentView(view);
  };

  const handleConnectWallet = async () => {
    if (currentView.startsWith('organizer') || currentView === 'scanner') {
      await connectOrganizer();
    } else {
      await connectAttendee();
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setCurrentView('landing');
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView('event-detail');
  };

  const handlePurchaseInit = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView('purchase');
  };

  const handlePurchaseComplete = (ticketId: string) => {
    console.log(`Purchased ticket ${ticketId}`);
    setCurrentView('my-tickets');
  };

  const handleShowQR = (ticketId: string) => {
    setSelectedTicketId(ticketId);
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
        return <ScannerPage onBack={() => setCurrentView('organizer-dashboard')} />;
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
            onSubmit={() => setCurrentView('organizer-dashboard')}
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
        onDisconnect={handleDisconnect}
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