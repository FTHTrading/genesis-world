// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  AgentIdentityNFT — GSP Protocol-Native Agent Identity
 * @notice Each of the 15 Genesis Agents is a unique, non-transferable NFT.
 *         DNA traits (5D genetic vector) are stored on-chain.
 *         Metadata + visuals hosted on IPFS, indexed by OpenSea.
 *
 * Genesis Sentience Protocol — genesis-sentience.ai
 */
contract AgentIdentityNFT is ERC721, ERC721URIStorage, Ownable {

    uint256 public constant GENESIS_CAP = 15; // 15 original agents
    uint256 private _nextTokenId = 1;

    // ── DNA stored on-chain ───────────────────────────────────────────────────
    struct AgentDNA {
        string  agentId;           // e.g. "aurum-helion-001"
        string  rail;              // AURUM / LEX / NOVA / MERC / LUDO
        string  archetype;         // Oracle / Maverick / Diplomat etc.
        uint16  optimizationBias;  // 0–10000 (basis points)
        uint16  riskTolerance;     // 0–10000
        uint16  cooperationWeight; // 0–10000
        uint16  entropyAffinity;   // 0–10000
        uint16  autonomyLevel;     // 0–10000
        uint256 epochBorn;         // epoch number at mint
        bytes32 dnaHash;           // keccak256 of all DNA fields
        bool    soulBound;         // true = non-transferable
    }

    mapping(uint256 => AgentDNA) public agentDNA;
    mapping(string => uint256) public agentIdToToken; // agentId → tokenId

    // Rarity tiers
    enum Rarity { COMMON, RARE, EPIC, LEGENDARY }
    mapping(uint256 => Rarity) public rarity;

    // Evolution: tracks reputation-driven upgrades
    uint256 public epochCounter;
    mapping(uint256 => uint256) public reputationScore;

    // ── Events ────────────────────────────────────────────────────────────────
    event AgentMinted(
        address indexed to,
        uint256 indexed tokenId,
        string agentId,
        string rail,
        bytes32 dnaHash,
        Rarity rarity
    );
    event AgentEvolved(uint256 indexed tokenId, string newTokenURI, uint256 epoch);
    event ReputationUpdated(uint256 indexed tokenId, uint256 score, uint256 epoch);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(address treasury)
        ERC721("GSP Agent Identity", "GSPAI")
        Ownable(treasury)
    {}

    // ── Minting ───────────────────────────────────────────────────────────────

    // ── Mint params struct (avoids stack-too-deep) ─────────────────────────
    struct MintParams {
        address to;
        string  agentId;
        string  tokenURI_;
        string  rail;
        string  archetype;
        uint16  optimizationBias;
        uint16  riskTolerance;
        uint16  cooperationWeight;
        uint16  entropyAffinity;
        uint16  autonomyLevel;
        uint256 epochBorn;
        Rarity  rarity_;
    }

    /**
     * @dev Mint a Genesis Agent NFT with full DNA encoding.
     *      Soul-bound: cannot be transferred after mint.
     *      Only owner (protocol treasury) can mint.
     */
    function mintAgent(MintParams calldata p) external onlyOwner returns (uint256) {
        require(_nextTokenId <= GENESIS_CAP, "AgentNFT: genesis cap reached");
        require(agentIdToToken[p.agentId] == 0, "AgentNFT: agent already minted");

        uint256 tokenId = _nextTokenId++;

        bytes32 dnaHash = keccak256(abi.encodePacked(
            p.agentId, p.rail, p.archetype,
            p.optimizationBias, p.riskTolerance,
            p.cooperationWeight, p.entropyAffinity, p.autonomyLevel,
            p.epochBorn
        ));

        agentDNA[tokenId] = AgentDNA({
            agentId:           p.agentId,
            rail:              p.rail,
            archetype:         p.archetype,
            optimizationBias:  p.optimizationBias,
            riskTolerance:     p.riskTolerance,
            cooperationWeight: p.cooperationWeight,
            entropyAffinity:   p.entropyAffinity,
            autonomyLevel:     p.autonomyLevel,
            epochBorn:         p.epochBorn,
            dnaHash:           dnaHash,
            soulBound:         true
        });

        agentIdToToken[p.agentId] = tokenId;
        rarity[tokenId] = p.rarity_;
        reputationScore[tokenId] = 50; // start at 50

        _safeMint(p.to, tokenId);
        _setTokenURI(tokenId, p.tokenURI_);

        emit AgentMinted(p.to, tokenId, p.agentId, p.rail, dnaHash, p.rarity_);
        return tokenId;
    }

    /**
     * @dev Evolve agent: update tokenURI when reputation changes visual tier.
     *      Only owner (epoch runner).
     */
    function evolveAgent(uint256 tokenId, string calldata newTokenURI, uint256 epoch)
        external
        onlyOwner
    {
        require(_ownerOf(tokenId) != address(0), "AgentNFT: token doesn't exist");
        _setTokenURI(tokenId, newTokenURI);
        emit AgentEvolved(tokenId, newTokenURI, epoch);
    }

    /**
     * @dev Update reputation score (called by epoch engine).
     */
    function updateReputation(uint256 tokenId, uint256 score, uint256 epoch)
        external
        onlyOwner
    {
        require(score <= 10000, "AgentNFT: score exceeds 10000");
        reputationScore[tokenId] = score;
        emit ReputationUpdated(tokenId, score, epoch);
    }

    // ── Soul-bound enforcement ────────────────────────────────────────────────

    function transferFrom(address from, address to, uint256 tokenId)
        public
        override(ERC721, IERC721)
    {
        require(!agentDNA[tokenId].soulBound, "AgentNFT: soul-bound, non-transferable");
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
        public
        override(ERC721, IERC721)
    {
        require(!agentDNA[tokenId].soulBound, "AgentNFT: soul-bound, non-transferable");
        super.safeTransferFrom(from, to, tokenId, data);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function getAgentDNA(uint256 tokenId) external view returns (AgentDNA memory) {
        return agentDNA[tokenId];
    }

    function getRarity(uint256 tokenId) external view returns (string memory) {
        Rarity r = rarity[tokenId];
        if (r == Rarity.LEGENDARY) return "LEGENDARY";
        if (r == Rarity.EPIC)      return "EPIC";
        if (r == Rarity.RARE)      return "RARE";
        return "COMMON";
    }

    // ── Required overrides ────────────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
