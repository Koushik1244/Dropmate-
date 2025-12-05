import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initializePolkadot,
  connectWallet,
  stakeForRide,
  confirmDelivery,
  disconnectPolkadot,
} from '@/lib/smartContract';

interface PolkadotContextType {
  isInitialized: boolean;
  isConnected: boolean;
  account: string | null;
  createOrderOnChain: (
    rideId: string,
    amount: number,
    customerAddress: string
  ) => Promise<{ transactionHash: string; stakedAmount: number }>;
  confirmDeliveryOnChain: (
    rideId: string,
    customerAddress: string
  ) => Promise<{ transactionHash: string }>;
  connectWalletExtension: () => Promise<string>;
}

const PolkadotContext = createContext<PolkadotContextType | undefined>(undefined);

export const PolkadotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializePolkadot();
        setIsInitialized(true);
        console.log('✅ Polkadot provider ready');
      } catch (error) {
        console.error('Polkadot init failed:', error);
      }
    };
    init();

    return () => {
      disconnectPolkadot();
    };
  }, []);

  const connectWalletExtension = async () => {
    try {
      const addr = await connectWallet();
      setAccount(addr);
      setIsConnected(true);
      return addr;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  };

  const createOrderOnChain = async (
    rideId: string,
    amount: number,
    customerAddress: string
  ) => {
    try {
      const result = await stakeForRide(rideId, amount, customerAddress);
      return {
        transactionHash: result.transactionHash,
        stakedAmount: result.stakedAmount,
      };
    } catch (error) {
      console.error('Create order failed:', error);
      throw error;
    }
  };

  const confirmDeliveryOnChain = async (rideId: string, customerAddress: string) => {
    try {
      const result = await confirmDelivery(rideId, customerAddress);
      return { transactionHash: result.transactionHash };
    } catch (error) {
      console.error('Confirm delivery failed:', error);
      throw error;
    }
  };

  return (
    <PolkadotContext.Provider
      value={{
        isInitialized,
        isConnected,
        account,
        createOrderOnChain,
        confirmDeliveryOnChain,
        connectWalletExtension,
      }}
    >
      {children}
    </PolkadotContext.Provider>
  );
};

export const usePolkadot = () => {
  const context = useContext(PolkadotContext);
  if (!context) {
    throw new Error('usePolkadot must be used within PolkadotProvider');
  }
  return context;
};
