// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title  GSPCore — $CORE Protocol Reserve Token
 * @notice Burned on vault exits. Minted via epoch rewards.
 *         Maximum supply is capped at 100,000,000 CORE.
 *
 * Genesis Sentience Protocol — genesis-sentience.ai
 */
contract GSPCore is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18; // 100M CORE

    event EpochMint(address indexed to, uint256 amount, uint256 epoch);
    event VaultBurn(address indexed from, uint256 amount);

    constructor(address admin) ERC20("GSP Core", "CORE") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /**
     * @dev Mint $CORE as epoch reward. Only MINTER_ROLE.
     * @param to     Recipient address (patron or agent reward pool)
     * @param amount Amount in wei
     * @param epoch  Epoch number for event tracking
     */
    function epochMint(address to, uint256 amount, uint256 epoch)
        external
        onlyRole(MINTER_ROLE)
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "CORE: max supply exceeded");
        _mint(to, amount);
        emit EpochMint(to, amount, epoch);
    }

    /**
     * @dev Burn on vault exit. Called by PatronVault.
     */
    function vaultBurn(address from, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
    {
        _burn(from, amount);
        emit VaultBurn(from, amount);
    }

    /**
     * @dev Standard public burn (user-initiated).
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
    }
}
