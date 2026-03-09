// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title QFC AI Cards — On-chain card minting & battle records
/// @notice Simplified ERC721-like (no full ERC721 to keep deploy cost low on testnet)
contract QFCCards {
    // ── Card data ──────────────────────────────────────
    struct Card {
        string name;
        uint8 element;   // 0=fire,1=water,2=earth,3=lightning,4=shadow
        uint8 attack;
        uint8 defense;
        uint8 cost;
    }

    uint256 public nextTokenId;
    mapping(uint256 => Card) public cards;
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;

    // ── Battle records ─────────────────────────────────
    struct BattleRecord {
        address winner;
        address loser;
        uint256 winnerScore;
        uint256 timestamp;
    }

    BattleRecord[] public battles;
    mapping(address => uint256) public wins;
    mapping(address => uint256) public losses;

    // ── Events ─────────────────────────────────────────
    event CardMinted(address indexed to, uint256 indexed tokenId, string name, uint8 element, uint8 attack, uint8 defense, uint8 cost);
    event BattleResult(address indexed winner, address indexed loser, uint256 winnerScore);

    // ── Predefined card pool (30 cards, matches client data) ──
    string[6] private fireNames   = ["Inferno Drake", "Blaze Wisp", "Magma Golem", "Ember Fox", "Phoenix Chick", "Flame Dancer"];
    string[6] private waterNames  = ["Tidal Serpent", "Frost Fairy", "Depth Lurker", "Coral Guardian", "Storm Whale", "Mist Walker"];
    string[6] private earthNames  = ["Stone Giant", "Root Weaver", "Crystal Beetle", "Moss Turtle", "Sand Worm", "Boulder Bear"];
    string[6] private lightNames  = ["Spark Elemental", "Thunder Hawk", "Volt Spider", "Prism Knight", "Arc Mage", "Flash Cat"];
    string[6] private shadowNames = ["Shadow Stalker", "Void Wraith", "Nightmare", "Dusk Bat", "Gloom Spider", "Phantom"];

    /// @notice Mint a random card using block hash as seed
    function mintCard() external returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        uint256 seed = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, tokenId)));

        uint8 element = uint8(seed % 5);
        uint8 nameIdx = uint8((seed >> 8) % 6);
        uint8 attack  = uint8(1 + (seed >> 16) % 8);   // 1-8
        uint8 defense = uint8(1 + (seed >> 24) % 8);   // 1-8
        uint8 cost    = uint8(1 + (seed >> 32) % 5);   // 1-5

        string memory name;
        if (element == 0) name = fireNames[nameIdx];
        else if (element == 1) name = waterNames[nameIdx];
        else if (element == 2) name = earthNames[nameIdx];
        else if (element == 3) name = lightNames[nameIdx];
        else name = shadowNames[nameIdx];

        cards[tokenId] = Card(name, element, attack, defense, cost);
        ownerOf[tokenId] = msg.sender;
        balanceOf[msg.sender]++;

        emit CardMinted(msg.sender, tokenId, name, element, attack, defense, cost);
    }

    /// @notice Record a battle result (called by server or player with proof)
    function recordBattle(address winner, address loser, uint256 winnerScore) external {
        battles.push(BattleRecord(winner, loser, winnerScore, block.timestamp));
        wins[winner]++;
        losses[loser]++;
        emit BattleResult(winner, loser, winnerScore);
    }

    /// @notice Get total battle count
    function battleCount() external view returns (uint256) {
        return battles.length;
    }

    /// @notice Get card details
    function getCard(uint256 tokenId) external view returns (string memory name, uint8 element, uint8 attack, uint8 defense, uint8 cost) {
        Card storage c = cards[tokenId];
        return (c.name, c.element, c.attack, c.defense, c.cost);
    }
}
