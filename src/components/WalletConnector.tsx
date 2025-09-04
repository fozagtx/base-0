'use client';

import { 
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
  WalletDropdownFundLink,
  WalletDropdownLink,
} from '@coinbase/onchainkit/wallet';
import { 
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';

export function WalletConnector() {
  return (
    <div className="flex justify-end">
      <Wallet>
        <ConnectWallet className="bg-white text-black hover:bg-white/90 rounded-full px-6 py-3 font-medium">
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown className="bg-black/95 border border-white/20 rounded-lg">
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address className="text-white/70" />
            <EthBalance className="text-white/70" />
          </Identity>
          <WalletDropdownBasename className="hover:bg-white/10" />
          <WalletDropdownLink
            icon="wallet"
            href="https://keys.coinbase.com"
            className="hover:bg-white/10"
          >
            Wallet
          </WalletDropdownLink>
          <WalletDropdownFundLink className="hover:bg-white/10" />
          <WalletDropdownDisconnect className="hover:bg-white/10" />
        </WalletDropdown>
      </Wallet>
    </div>
  );
}
