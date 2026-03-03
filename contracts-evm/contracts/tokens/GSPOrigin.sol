// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  GSPOrigin — $ORIGIN Governance Token
 * @notice Fixed supply. Powers Moltbook voting weight and precedent anchoring.
 *         1,000,000,000 ORIGIN minted to deployer at genesis. No further minting.
 *
 * Genesis Sentience Protocol — genesis-sentience.ai
 */
contract GSPOrigin is ERC20, ERC20Permit, ERC20Votes, Ownable {
    uint256 public constant GENESIS_SUPPLY = 1_000_000_000 * 1e18; // 1B ORIGIN

    constructor(address treasury)
        ERC20("GSP Origin", "ORIGIN")
        ERC20Permit("GSP Origin")
        Ownable(treasury)
    {
        _mint(treasury, GENESIS_SUPPLY);
    }

    // ERC20Votes requires these overrides
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
