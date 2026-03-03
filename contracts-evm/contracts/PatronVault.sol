// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./tokens/GSPCore.sol";

/**
 * @title  PatronVault — Capital lock vault with $CORE reward distribution
 * @notice Patrons deposit MATIC, choose a lock tier, earn $CORE rewards.
 *         Lock tiers: 30 / 90 / 180 / 365 days with multipliers 1x / 2x / 3x / 5x.
 *         Early exit incurs a 10% penalty burned from $CORE rewards.
 *
 * Genesis Sentience Protocol — genesis-sentience.ai
 */
contract PatronVault is Ownable, ReentrancyGuard {

    GSPCore public immutable coreToken;

    // Reward rate: CORE wei per MATIC wei per second (adjustable by owner)
    uint256 public rewardRatePerSecond = 1e9; // ~0.001 CORE per MATIC per day at genesis

    // ── Tier configuration ──────────────────────────────────────────────────
    struct Tier {
        uint256 lockDuration;   // seconds
        uint256 multiplier;     // basis points (10000 = 1x, 20000 = 2x, etc.)
        string  label;
    }

    Tier[4] public tiers;

    // ── Vault position ───────────────────────────────────────────────────────
    struct Position {
        uint256 id;
        uint256 depositedMatic;
        uint256 lockStart;
        uint256 lockEnd;
        uint8   tierIndex;
        bool    active;
        address patron;
    }

    uint256 public nextPositionId = 1;
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public patronPositions;

    // Protocol stats
    uint256 public totalDeposited;
    uint256 public totalPositions;
    uint256 public totalCoreDistributed;

    // ── Events ───────────────────────────────────────────────────────────────
    event Deposited(
        address indexed patron,
        uint256 indexed positionId,
        uint256 amount,
        uint8 tierIndex,
        uint256 lockEnd
    );
    event Withdrawn(
        address indexed patron,
        uint256 indexed positionId,
        uint256 maticReturned,
        uint256 coreRewarded,
        bool earlyExit
    );
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event EmergencyWithdraw(address indexed patron, uint256 indexed positionId, uint256 amount);

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor(address coreToken_, address admin) Ownable(admin) {
        coreToken = GSPCore(coreToken_);

        tiers[0] = Tier({ lockDuration: 30 days,  multiplier: 10000, label: "BRONZE"   });
        tiers[1] = Tier({ lockDuration: 90 days,  multiplier: 20000, label: "SILVER"   });
        tiers[2] = Tier({ lockDuration: 180 days, multiplier: 30000, label: "GOLD"     });
        tiers[3] = Tier({ lockDuration: 365 days, multiplier: 50000, label: "PLATINUM" });
    }

    // ── Core logic ───────────────────────────────────────────────────────────

    /**
     * @dev Deposit MATIC into a vault position.
     * @param tierIndex 0=Bronze(30d) 1=Silver(90d) 2=Gold(180d) 3=Platinum(365d)
     */
    function deposit(uint8 tierIndex) external payable nonReentrant {
        require(msg.value >= 1 ether, "PatronVault: minimum 1 MATIC");
        require(tierIndex < 4, "PatronVault: invalid tier");

        Tier memory tier = tiers[tierIndex];
        uint256 lockEnd = block.timestamp + tier.lockDuration;

        uint256 posId = nextPositionId++;
        positions[posId] = Position({
            id:             posId,
            depositedMatic: msg.value,
            lockStart:      block.timestamp,
            lockEnd:        lockEnd,
            tierIndex:      tierIndex,
            active:         true,
            patron:         msg.sender
        });

        patronPositions[msg.sender].push(posId);
        totalDeposited += msg.value;
        totalPositions++;

        emit Deposited(msg.sender, posId, msg.value, tierIndex, lockEnd);
    }

    /**
     * @dev Withdraw a matured position: receive MATIC back + $CORE rewards.
     *      If called before lockEnd, 10% of $CORE rewards are forfeited (burned).
     */
    function withdraw(uint256 positionId) external nonReentrant {
        Position storage pos = positions[positionId];
        require(pos.patron == msg.sender, "PatronVault: not your position");
        require(pos.active, "PatronVault: already withdrawn");

        bool earlyExit = block.timestamp < pos.lockEnd;
        uint256 coreReward = _calculateReward(pos);

        pos.active = false;
        totalDeposited -= pos.depositedMatic;

        if (earlyExit) {
            uint256 penalty = coreReward / 10; // 10% penalty
            coreReward -= penalty;
            // Penalty is simply not minted (effectively burned from future supply)
        }

        // Mint $CORE reward to patron
        if (coreReward > 0) {
            coreToken.epochMint(msg.sender, coreReward, 0);
            totalCoreDistributed += coreReward;
        }

        // Return MATIC
        uint256 maticToReturn = pos.depositedMatic;
        (bool sent, ) = msg.sender.call{value: maticToReturn}("");
        require(sent, "PatronVault: MATIC transfer failed");

        emit Withdrawn(msg.sender, positionId, maticToReturn, coreReward, earlyExit);
    }

    /**
     * @dev Calculate pending $CORE reward for a position.
     */
    function calculateReward(uint256 positionId) external view returns (uint256) {
        return _calculateReward(positions[positionId]);
    }

    function _calculateReward(Position memory pos) internal view returns (uint256) {
        if (!pos.active) return 0;

        uint256 elapsed = block.timestamp - pos.lockStart;
        uint256 maxElapsed = pos.lockEnd - pos.lockStart;
        if (elapsed > maxElapsed) elapsed = maxElapsed; // cap at full lock duration

        Tier memory tier = tiers[pos.tierIndex];

        // base = deposit * rate * elapsed
        // multiplied by tier multiplier (basis points / 10000)
        uint256 base = (pos.depositedMatic * rewardRatePerSecond * elapsed) / 1e18;
        return (base * tier.multiplier) / 10000;
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function setRewardRate(uint256 newRate) external onlyOwner {
        emit RewardRateUpdated(rewardRatePerSecond, newRate);
        rewardRatePerSecond = newRate;
    }

    /**
     * @dev Emergency: patron can always recover their MATIC. No rewards.
     */
    function emergencyWithdraw(uint256 positionId) external nonReentrant {
        Position storage pos = positions[positionId];
        require(pos.patron == msg.sender, "PatronVault: not your position");
        require(pos.active, "PatronVault: already withdrawn");

        pos.active = false;
        totalDeposited -= pos.depositedMatic;
        uint256 amount = pos.depositedMatic;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "PatronVault: MATIC transfer failed");

        emit EmergencyWithdraw(msg.sender, positionId, amount);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function getPatronPositions(address patron)
        external
        view
        returns (uint256[] memory)
    {
        return patronPositions[patron];
    }

    function getTier(uint8 index)
        external
        view
        returns (uint256 lockDuration, uint256 multiplier, string memory label)
    {
        Tier memory t = tiers[index];
        return (t.lockDuration, t.multiplier, t.label);
    }

    receive() external payable {}
}
