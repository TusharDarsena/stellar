import { AppView, WalletState } from '../../types';

interface AppHeaderProps {
  currentView: AppView;
  wallet: WalletState;
  onNavigate: (view: AppView) => void;
  onConnectWallet: () => void;
  onDisconnect: () => void;
}

export function AppHeader({ currentView, wallet, onNavigate, onConnectWallet, onDisconnect }: AppHeaderProps) {
  // Views that should show a back button instead of main nav
  const isSubPage = ['event-detail', 'purchase', 'qr-display', 'scanner', 'organizer-create'].includes(currentView);

  const getPageTitle = () => {
    switch (currentView) {
      case 'event-detail': return 'Event Details';
      case 'purchase': return 'Buy Tickets';
      case 'qr-display': return 'Your Ticket';
      case 'scanner': return 'Scan Tickets';
      case 'organizer-create': return 'Create Event';
      default: return '';
    }
  };

  const handleBack = () => {
    if (currentView === 'event-detail') onNavigate('browse');
    if (currentView === 'purchase') onNavigate('event-detail');
    if (currentView === 'qr-display') onNavigate('my-tickets');
    if (currentView === 'scanner') onNavigate('organizer-dashboard');
    if (currentView === 'organizer-create') onNavigate('organizer-dashboard');
  };

  // Don't show header on landing page (it has its own centered UI)
  if (currentView === 'landing') return null;

  return (
    <header className="fixed top-0 w-full z-50 border-b border-[#272C33] bg-[#15181C]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4 md:gap-6">
          {isSubPage ? (
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-[#272C33] rounded-full transition-colors flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="text-lg font-bold text-slate-50 tracking-tight truncate max-w-[150px] md:max-w-none">
                {getPageTitle()}
              </h1>
            </div>
          ) : (
            <>
              <span
                className="text-xl font-bold text-slate-50 tracking-tighter font-inter cursor-pointer"
                onClick={() => onNavigate('browse')}
              >
                StellarTickets
              </span>
              <div className="hidden md:flex items-center gap-4 h-16">
                <button
                  onClick={() => onNavigate('browse')}
                  className={`font-label-md text-sm transition-all h-full flex items-center px-2 border-b-2 ${currentView === 'browse'
                      ? 'text-[#7C5CFF] border-[#7C5CFF]'
                      : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className={`font-label-md text-sm transition-all h-full flex items-center px-2 border-b-2 ${currentView === 'marketplace'
                      ? 'text-[#7C5CFF] border-[#7C5CFF]'
                      : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                >
                  Marketplace
                </button>
                <button
                  onClick={() => onNavigate('my-tickets')}
                  className={`font-label-md text-sm transition-all h-full flex items-center px-2 border-b-2 ${currentView === 'my-tickets'
                      ? 'text-[#7C5CFF] border-[#7C5CFF]'
                      : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                >
                  My Tickets
                </button>
                {wallet.isConnected && wallet.walletType === 'freighter' && (
                  <button
                    onClick={() => onNavigate('organizer-dashboard')}
                    className={`font-label-md text-sm transition-all h-full flex items-center px-2 border-b-2 ${currentView.startsWith('organizer') || currentView === 'scanner'
                        ? 'text-[#7C5CFF] border-[#7C5CFF]'
                        : 'text-slate-400 border-transparent hover:text-white'
                      }`}
                  >
                    Manage
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {wallet.isConnected ? (
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline-block text-xs font-mono text-[#7C5CFF] bg-[#7C5CFF]/10 px-2 py-1 rounded">
                {wallet.publicKey?.substring(0, 6)}...{wallet.publicKey?.substring(wallet.publicKey.length - 4)}
              </span>
              <button
                onClick={onDisconnect}
                className="flex items-center gap-2 bg-[#272C33] text-slate-300 px-4 py-2 rounded-lg font-label-md hover:bg-[#36333e] active:scale-95 transition-all text-sm"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-2 bg-[#7C5CFF] text-[#EAEFF4] px-4 py-2 rounded-lg font-label-md hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}