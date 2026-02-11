import {create} from 'zustand'; // 引入zustand的create函数用于创建状态store

interface MarketSwitchState { // 定义状态接口描述store的结构（状态与方法）
    selectedMarket: string; // 当前选中的市场字符串形式
    setSelectedMarket: (market: string) => void; // 设置选中市场的回调函数，更新市场的函数，参数是新市场的值
}

export const useMarketSwitchStore = create<MarketSwitchState>((set) => ({ // 创建并且导出状态的钩子store hook，范型指定接口
    selectedMarket: 'cryptocurrency_web3', // 默认选中的市场，加密资产与web3市场，这里放value（市场选择里面的）
    setSelectedMarket: (market) => set({ selectedMarket: market }), // 更新选中市场的函数实现，调用set更新状态
}))
