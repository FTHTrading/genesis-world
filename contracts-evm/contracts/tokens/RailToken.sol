// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  RailToken — Rail-specific utility token
 * @notice Deployed once per rail: $AURUM, $LEX, $NOVA, $MERC, $LUDO
 *         Owner can mint (for staking rewards). Users can burn.
 *
 * Genesis Sentience Protocol — genesis-sentience.ai
 */
contract RailToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY      = 500_000_000 * 1e18; // 500M per rail
    uint256 public constant GENESIS_SUPPLY  = 100_000_000 * 1e18; // 100M at genesis

    string public rail; // e.g. "AURUM"

    event RailMint(address indexed to, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory rail_,
        address treasury
    )
        ERC20(name_, symbol_)
        Ownable(treasury)
    {
        rail = rail_;
        _mint(treasury, GENESIS_SUPPLY);
    }

    /**
     * @dev Mint additional supply (staking rewards, LP incentives). Owner only.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "RailToken: cap exceeded");
        _mint(to, amount);
        emit RailMint(to, amount);
    }
}
