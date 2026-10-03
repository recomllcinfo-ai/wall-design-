import type { GasOption, Network, NetworkId, NFT } from '../types/wallet';

export const NETWORKS: Record<NetworkId, Network> = {
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
    rpcUrl: 'https://bitcoin-mainnet.g.allthatnode.com',
    explorerUrl: 'https://mempool.space',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
    color: '#F7931A',
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    color: '#627EEA',
  },
  bnb: {
    id: 'bnb',
    name: 'BNB Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
    color: '#F3BA2F',
  },
  base: {
    id: 'base',
    name: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    icon: 'https://raw.githubusercontent.com/base-org/brand-kit/main/logo/in-product/Base_Network_Logo.svg',
    color: '#0052FF',
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    color: '#28A0F0',
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    nativeCurrency: { name: 'POL', symbol: 'MATIC', decimals: 18 },
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    color: '#8247E5',
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    color: '#14F195',
  },
  optimism: {
    id: 'optimism',
    name: 'OP Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    color: '#FF0420',
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche C-Chain',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
    color: '#E84142',
  },
  cosmos: {
    id: 'cosmos',
    name: 'Cosmos Hub',
    nativeCurrency: { name: 'ATOM', symbol: 'ATOM', decimals: 6 },
    rpcUrl: 'https://rpc.cosmos.network',
    explorerUrl: 'https://mintscan.io/cosmos',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cosmos/info/logo.png',
    color: '#2E3148',
  },
};

// All supported assets — starting balances are ALWAYS zero for new wallets
// This list defines the token registry the wallet supports
export const SUPPORTED_TOKENS = [
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
    networkId: 'bitcoin' as NetworkId,
    coingeckoId: 'bitcoin',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'ethereum',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  },
  {
    id: 'bnb',
    symbol: 'BNB',
    name: 'BNB',
    decimals: 18,
    networkId: 'bnb' as NetworkId,
    coingeckoId: 'binancecoin',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    networkId: 'solana' as NetworkId,
    coingeckoId: 'solana',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  },
  {
    id: 'xrp',
    symbol: 'XRP',
    name: 'XRP',
    decimals: 6,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'ripple',
    contractAddress: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/xrp/info/logo.png',
  },
  {
    id: 'ada',
    symbol: 'ADA',
    name: 'Cardano',
    decimals: 6,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'cardano',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png',
  },
  {
    id: 'doge',
    symbol: 'DOGE',
    name: 'Dogecoin',
    decimals: 8,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'dogecoin',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png',
  },
  {
    id: 'avax',
    symbol: 'AVAX',
    name: 'Avalanche',
    decimals: 18,
    networkId: 'avalanche' as NetworkId,
    coingeckoId: 'avalanche-2',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
  },
  {
    id: 'dot',
    symbol: 'DOT',
    name: 'Polkadot',
    decimals: 10,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'polkadot',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polkadot/info/logo.png',
  },
  {
    id: 'link',
    symbol: 'LINK',
    name: 'Chainlink',
    decimals: 18,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'chainlink',
    contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
  },
  {
    id: 'uni',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'uniswap',
    contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
  },
  {
    id: 'matic',
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    networkId: 'polygon' as NetworkId,
    coingeckoId: 'matic-network',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  },
  {
    id: 'atom',
    symbol: 'ATOM',
    name: 'Cosmos',
    decimals: 6,
    networkId: 'cosmos' as NetworkId,
    coingeckoId: 'cosmos',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cosmos/info/logo.png',
  },
  {
    id: 'ltc',
    symbol: 'LTC',
    name: 'Litecoin',
    decimals: 8,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'litecoin',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/litecoin/info/logo.png',
  },
  {
    id: 'arb',
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
    networkId: 'arbitrum' as NetworkId,
    coingeckoId: 'arbitrum',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  },
  {
    id: 'op',
    symbol: 'OP',
    name: 'Optimism',
    decimals: 18,
    networkId: 'optimism' as NetworkId,
    coingeckoId: 'optimism',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
  },
  {
    id: 'inj',
    symbol: 'INJ',
    name: 'Injective',
    decimals: 18,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'injective-protocol',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/injective/info/logo.png',
  },
  {
    id: 'apt',
    symbol: 'APT',
    name: 'Aptos',
    decimals: 8,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'aptos',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png',
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'tether',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    networkId: 'ethereum' as NetworkId,
    coingeckoId: 'usd-coin',
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
];

const BIP39_WORDS = [
  'abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse',
  'access','accident','account','accuse','achieve','acid','acoustic','acquire','across','act',
  'action','actor','actress','actual','adapt','add','addict','address','adjust','admit',
  'adult','advance','advice','aerobic','affair','afford','afraid','again','age','agent',
  'agree','ahead','aim','air','airport','aisle','alarm','album','alcohol','alert',
  'alien','all','alley','allow','almost','alone','alpha','already','also','alter',
  'always','amateur','amazing','among','amount','amused','analyst','anchor','ancient','anger',
  'angle','angry','animal','ankle','announce','annual','another','answer','antenna','antique',
  'anxiety','any','apart','apology','appear','apple','approve','april','arch','arctic',
  'area','arena','argue','arm','armed','armor','army','around','arrange','arrest',
  'arrive','arrow','art','artefact','artist','artwork','ask','aspect','assault','asset',
  'assist','assume','asthma','athlete','atom','attack','attend','attitude','attract','auction',
  'audit','august','aunt','author','auto','autumn','average','avocado','avoid','awake',
  'aware','away','awesome','awful','awkward','axis','baby','bachelor','bacon','badge',
  'bag','balance','balcony','ball','bamboo','banana','banner','bar','barely','bargain',
  'barrel','base','basic','basket','battle','beach','bean','beauty','because','become',
  'beef','before','begin','behave','behind','believe','below','belt','bench','benefit',
  'best','betray','better','between','beyond','bicycle','bid','bike','bind','biology',
  'bird','birth','bitter','black','blade','blame','blanket','blast','bleak','bless',
  'blind','blood','blossom','blouse','blue','blur','blush','board','boat','body',
  'boil','bomb','bone','bonus','book','boost','border','boring','borrow','boss',
  'bottom','bounce','box','boy','bracket','brain','brand','brass','brave','bread',
  'breeze','brick','bridge','brief','bright','bring','brisk','broccoli','broken','bronze',
  'brother','brown','brush','bubble','buddy','budget','buffalo','build','bulb','bulk',
  'bullet','bundle','bunker','burden','burger','burst','bus','business','busy','butter',
  'buyer','buzz','cabbage','cabin','cable','cactus','cage','cake','call','calm',
  'camera','camp','can','canal','cancel','candy','cannon','canoe','canvas','canyon',
  'capable','capital','captain','car','carbon','card','cargo','carpet','carry','cart',
  'case','cash','casino','castle','casual','cat','catalog','catch','category','cattle',
  'caught','cause','caution','cave','ceiling','celery','cement','census','century','cereal',
  'certain','chair','chalk','champion','change','chaos','chapter','charge','chase','chat',
  'cheap','check','cheese','chef','cherry','chest','chicken','chief','child','chimney',
  'choice','choose','chronic','chuckle','chunk','churn','cigar','cinnamon','circle','citizen',
  'city','civil','claim','clap','clarify','claw','clay','clean','clerk','clever',
  'click','client','cliff','climb','clinic','clip','clock','clog','close','cloth',
  'cloud','clown','club','clump','cluster','clutch','coach','coast','coconut','code',
  'coffee','coil','coin','collect','color','column','combine','come','comfort','comic',
  'common','company','concert','conduct','confirm','congress','connect','consider','control','convince',
  'cook','cool','copper','copy','coral','core','corn','correct','cost','cotton',
  'couch','country','couple','course','cousin','cover','coyote','crack','cradle','craft',
  'cram','crane','crash','crater','crawl','crazy','cream','credit','creek','crew',
  'cricket','crime','crisp','critic','crop','cross','crouch','crowd','crucial','cruel',
  'cruise','crumble','crunch','crush','cry','crystal','cube','culture','cup','cupboard',
  'curious','current','curtain','curve','cushion','custom','cute','cycle',
];

export function generateMnemonic(wordCount: 12 | 24 = 12): string[] {
  const words: string[] = [];
  const array = new Uint32Array(wordCount);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < wordCount; i++) {
    words.push(BIP39_WORDS[array[i] % BIP39_WORDS.length]);
  }
  return words;
}

export function generateRandomEvmAddress(): string {
  const bytes = new Uint8Array(20);
  window.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hex;
}

export function generateRandomSolanaAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('').slice(0, 44);
}

export function generateRandomBitcoinAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const bytes = new Uint8Array(20);
  window.crypto.getRandomValues(bytes);
  return 'bc1q' + Array.from(bytes).map(b => chars[b % chars.length]).join('').slice(0, 38);
}

export const KNOWN_ENS_REGISTRY: Record<string, string> = {
  'vitalik.eth': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  'satoshi.eth': '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
  'uniswap.eth': '0x1a9C8182C09F50C8318d769245beA52c32BE35BC',
  'hayden.eth': '0x50EC05B0094e82b7C6Ac2A9448135Fe397eB36d2',
  'alice.eth': '0x71C83709bA122423Ef18335A71F69488b0a98634',
  'bob.eth': '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
};

export function resolveEnsName(input: string): { resolvedAddress: string | null; isEns: boolean } {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.endsWith('.eth')) {
    const known = KNOWN_ENS_REGISTRY[trimmed];
    if (known) return { resolvedAddress: known, isEns: true };
    // Deterministic mock for any *.eth
    const seed = Array.from(trimmed).map(c => c.charCodeAt(0).toString(16)).join('');
    return { resolvedAddress: '0x' + seed.padEnd(40, '0').slice(0, 40), isEns: true };
  }
  return { resolvedAddress: null, isEns: false };
}

export function isValidCryptoAddress(address: string, networkId: NetworkId): boolean {
  const clean = address.trim();
  if (!clean) return false;
  if (clean.endsWith('.eth')) return true;

  // Demo mode: accept any plausible-looking identifier per network. The wallet is a
  // visual demo (Apex Vault) so we don't enforce strict mainnet format checks —
  // instead we just require a sensible minimum length and disallow obvious garbage.
  // Real validators would be much stricter; this is on purpose.
  if (networkId === 'solana') return /^[1-9A-HJ-NP-Za-km-z]{20,60}$/.test(clean);
  if (networkId === 'bitcoin') {
    // Accept bc1q…/bc1p… bech32, legacy 1… and P2SH 3… in any reasonable length,
    // plus short demo BTC addresses (>=8 chars) for the in-app account-to-account flow.
    if (/^bc1[a-z0-9]{5,90}$/i.test(clean)) return true;
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{5,40}$/.test(clean)) return true;
    return clean.length >= 8;
  }
  return /^0x[a-fA-F0-9]{8,}$/.test(clean);
}

export function estimateGasFees(ethPriceUsd: number): Record<'slow' | 'market' | 'fast', GasOption> {
  const base = 14;
  return {
    slow:   { speed: 'slow',   label: 'Slow',   gwei: +(base * 0.85).toFixed(1), estimatedSeconds: 60,  feeEth: 0.00021, feeUsd: +(0.00021 * ethPriceUsd).toFixed(2) },
    market: { speed: 'market', label: 'Market', gwei: base,                        estimatedSeconds: 15,  feeEth: 0.00035, feeUsd: +(0.00035 * ethPriceUsd).toFixed(2) },
    fast:   { speed: 'fast',   label: 'Fast',   gwei: +(base * 1.35).toFixed(1), estimatedSeconds: 5,   feeEth: 0.00055, feeUsd: +(0.00055 * ethPriceUsd).toFixed(2) },
  };
}

export const EMPTY_NFTS: NFT[] = [];
