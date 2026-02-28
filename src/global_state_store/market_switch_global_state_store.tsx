import {create} from 'zustand';

interface MarketSwitchState {
    selectedMarket: string;
    setSelectedMarket: (market: string) => void;
}

export const useMarketSwitchStore = create<MarketSwitchState>((set) => ({
    selectedMarket: 'cryptocurrency_web3',
    setSelectedMarket: (market) => set({ selectedMarket: market }),
}))
