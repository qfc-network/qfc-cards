// QFC Chain Integration for AI Cards — uses @qfc/chain-sdk
import {
  connectWallet,
  connectWithKey,
  getWalletState,
  getChainInfo,
  getContract,
  sendTx,
  initChainUI,
  type WalletState,
} from "@qfc/chain-sdk";

const CONTRACT_ADDRESS = "0x92a8Ca9C516f9Fd835E87b5b7357B279a41b422d";
const ABI = [
  "function mintCard() external returns (uint256)",
  "function recordBattle(address winner, address loser, uint256 winnerScore) external",
  "function getCard(uint256 tokenId) external view returns (string name, uint8 element, uint8 attack, uint8 defense, uint8 cost)",
  "function balanceOf(address) external view returns (uint256)",
  "function wins(address) external view returns (uint256)",
  "function losses(address) external view returns (uint256)",
  "event CardMinted(address indexed to, uint256 indexed tokenId, string name, uint8 element, uint8 attack, uint8 defense, uint8 cost)",
  "event BattleResult(address indexed winner, address indexed loser, uint256 winnerScore)",
];

export async function mintCardOnChain() {
  const contract = await getContract(CONTRACT_ADDRESS, ABI);
  return sendTx(() => contract.mintCard());
}

export async function recordBattleOnChain(winner: string, loser: string, score: number) {
  const contract = await getContract(CONTRACT_ADDRESS, ABI);
  return sendTx(() => contract.recordBattle(winner, loser, score));
}

export { connectWallet, connectWithKey, getWalletState, getChainInfo, initChainUI, CONTRACT_ADDRESS, ABI };
export type { WalletState };
