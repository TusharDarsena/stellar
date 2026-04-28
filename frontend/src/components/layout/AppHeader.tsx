import { AppView, WalletState } from '../../types';

interface AppHeaderProps {
  currentView: AppView;
  wallet: WalletState;
  onNavigate: (view: AppView) => void;
  onConnectWallet: () => void;
  onDisconnect: () => void;
}

export function AppHeader({ currentView, wallet, onNavigate, onConnectWallet, onDisconnect }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
      {/* Title / Logo */}
      <h1
        className="text-xl font-bold text-white cursor-pointer"
        onClick={() => onNavigate('landing')}
      >
        Stellar Tickets
      </h1>

      <div className="flex items-center gap-4">
        {wallet.isConnected ? (
          <>
            <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
              {wallet.publicKey?.substring(0, 6)}...{wallet.publicKey?.substring(wallet.publicKey.length - 4)}
            </span>

            <button
              onClick={onDisconnect}
              className="px-3 py-1.5 text-sm font-medium text-primary border border-primary/50 rounded-md hover:bg-primary/10 transition-colors"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={onConnectWallet}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}