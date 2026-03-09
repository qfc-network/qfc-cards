// QFC Chain Integration for AI Cards
const QFC_RPC = "https://rpc.testnet.qfc.network";
const CHAIN_ID = 9000;
const CONTRACT_ADDRESS = "0x92a8Ca9C516f9Fd835E87b5b7357B279a41b422d";

const ABI = [
  "function mintCard() external returns (uint256)",
  "function recordBattle(address winner, address loser, uint256 winnerScore) external",
  "function getCard(uint256 tokenId) external view returns (string name, uint8 element, uint8 attack, uint8 defense, uint8 cost)",
  "function balanceOf(address) external view returns (uint256)",
  "function wins(address) external view returns (uint256)",
  "function losses(address) external view returns (uint256)",
  "function nextTokenId() external view returns (uint256)",
  "event CardMinted(address indexed to, uint256 indexed tokenId, string name, uint8 element, uint8 attack, uint8 defense, uint8 cost)",
  "event BattleResult(address indexed winner, address indexed loser, uint256 winnerScore)",
];

interface WalletState {
  connected: boolean;
  address: string | null;
  balance: string | null;
  signer: any | null;
  provider: any | null;
}

let wallet: WalletState = { connected: false, address: null, balance: null, signer: null, provider: null };

export function getWalletState() { return wallet; }

export async function connectWallet(): Promise<WalletState> {
  const { ethers } = await import("ethers");
  if (typeof (window as any).ethereum !== "undefined") {
    const ethereum = (window as any).ethereum;
    await ethereum.request({ method: "eth_requestAccounts" });
    try {
      await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x2328" }] });
    } catch (e: any) {
      if (e.code === 4902) {
        await ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: "0x2328", chainName: "QFC Testnet", rpcUrls: [QFC_RPC], nativeCurrency: { name: "QFC", symbol: "QFC", decimals: 18 } }] });
      }
    }
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const balance = ethers.formatEther(await provider.getBalance(address));
    wallet = { connected: true, address, balance, signer, provider };
  }
  return wallet;
}

export async function connectWithKey(key: string): Promise<WalletState> {
  const { ethers } = await import("ethers");
  const provider = new ethers.JsonRpcProvider(QFC_RPC);
  const w = new ethers.Wallet(key, provider);
  const balance = ethers.formatEther(await provider.getBalance(w.address));
  wallet = { connected: true, address: w.address, balance, signer: w, provider };
  return wallet;
}

export async function mintCardOnChain(): Promise<{ txHash: string; success: boolean }> {
  if (!wallet.signer) throw new Error("Wallet not connected");
  const { ethers } = await import("ethers");
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet.signer);
  try {
    const tx = await contract.mintCard();
    const receipt = await tx.wait();
    return { txHash: receipt.hash, success: receipt.status === 1 };
  } catch (e: any) {
    console.error("Mint failed:", e);
    return { txHash: "", success: false };
  }
}

export async function recordBattleOnChain(winner: string, loser: string, score: number): Promise<{ txHash: string; success: boolean }> {
  if (!wallet.signer) throw new Error("Wallet not connected");
  const { ethers } = await import("ethers");
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet.signer);
  try {
    const tx = await contract.recordBattle(winner, loser, score);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, success: receipt.status === 1 };
  } catch (e: any) {
    console.error("Record battle failed:", e);
    return { txHash: "", success: false };
  }
}

export async function getChainInfo(): Promise<{ blockNumber: number; chainId: number }> {
  const { ethers } = await import("ethers");
  const provider = wallet.provider || new ethers.JsonRpcProvider(QFC_RPC);
  const blockNumber = await provider.getBlockNumber();
  return { blockNumber, chainId: CHAIN_ID };
}

export { CONTRACT_ADDRESS, ABI };
