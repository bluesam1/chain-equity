// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ChainEquityToken
 * @dev ERC-20 token with AccessControl for role-based access management
 * @notice This contract provides the foundation for Chain Equity token functionality
 */
contract ChainEquityToken is ERC20, AccessControl {
    // Role identifiers
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");

    // Allowlist mapping
    mapping(address => bool) public allowlist;

    // Virtual split multiplier (default: 1)
    uint256 private _multiplier;

    // Custom symbol storage (overrides OpenZeppelin)
    string private _symbol;

    // Events
    event AllowlistUpdated(address indexed account, bool approved);
    event SplitExecuted(uint256 newMultiplier, uint256 blockNumber);
    event SymbolChanged(string oldSymbol, string newSymbol);

    /**
     * @dev Initializes the contract with name "Chain Equity Token" and initial symbol
     * @param initialSymbol The initial symbol for the token
     * @notice Grants DEFAULT_ADMIN_ROLE to the deployer
     */
    constructor(string memory initialSymbol) ERC20("Chain Equity Token", initialSymbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _multiplier = 1;
        _symbol = initialSymbol;
    }

    /**
     * @dev Grants a role to an account
     * @param role The role to grant
     * @param account The account to grant the role to
     * @notice Only callable by accounts with the admin role of the specified role
     */
    function grantRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes a role from an account
     * @param role The role to revoke
     * @param account The account to revoke the role from
     * @notice Only callable by accounts with the admin role of the specified role
     */
    function revokeRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Approves a wallet address for token transfers
     * @param account The address to add to the allowlist
     * @notice Only callable by accounts with APPROVER_ROLE
     * @notice Emits AllowlistUpdated event
     */
    function approveWallet(address account) public onlyRole(APPROVER_ROLE) {
        allowlist[account] = true;
        emit AllowlistUpdated(account, true);
    }

    /**
     * @dev Revokes a wallet address from token transfers
     * @param account The address to remove from the allowlist
     * @notice Only callable by accounts with APPROVER_ROLE
     * @notice Emits AllowlistUpdated event
     */
    function revokeWallet(address account) public onlyRole(APPROVER_ROLE) {
        allowlist[account] = false;
        emit AllowlistUpdated(account, false);
    }

    /**
     * @dev Overrides transfer to check allowlist restrictions and convert displayed amount to base amount
     * @param to The recipient address
     * @param value The displayed amount to transfer (will be converted to base amount internally)
     * @return bool Success status
     * @notice Both sender and recipient must be on allowlist
     * @notice The value parameter is the displayed amount (what user sees in MetaMask)
     * @notice The contract converts it to base amount internally: baseAmount = displayedAmount / multiplier
     */
    function transfer(address to, uint256 value) public override returns (bool) {
        require(allowlist[msg.sender], "Sender not allowlisted");
        require(allowlist[to], "Recipient not allowlisted");
        
        // Convert displayed amount to base amount
        // User enters displayed amount (what they see in MetaMask), we convert to base
        uint256 baseAmount = value / _multiplier;
        require(baseAmount > 0, "Amount too small after accounting for multiplier");
        
        return super.transfer(to, baseAmount);
    }

    /**
     * @dev Overrides transferFrom to check allowlist restrictions and convert displayed amount to base amount
     * @param from The sender address
     * @param to The recipient address
     * @param value The displayed amount to transfer (will be converted to base amount internally)
     * @return bool Success status
     * @notice Both sender and recipient must be on allowlist
     * @notice The value parameter is the displayed amount (what user sees in MetaMask)
     * @notice The contract converts it to base amount internally: baseAmount = displayedAmount / multiplier
     */
    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        require(allowlist[from], "Sender not allowlisted");
        require(allowlist[to], "Recipient not allowlisted");
        
        // Convert displayed amount to base amount
        // User enters displayed amount (what they see in MetaMask), we convert to base
        uint256 baseAmount = value / _multiplier;
        require(baseAmount > 0, "Amount too small after accounting for multiplier");
        
        return super.transferFrom(from, to, baseAmount);
    }

    /**
     * @dev Mints new tokens to a specified address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     * @notice Only callable by accounts with MINTER_ROLE
     * @notice Recipient must be on allowlist
     * @notice Emits Transfer event with from address as zero address
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(allowlist[to], "Recipient not allowlisted");
        _mint(to, amount);
    }

    /**
     * @dev Overrides balanceOf to apply virtual split multiplier
     * @param account The address to query balance for
     * @return uint256 The balance multiplied by the current multiplier
     * @notice Returns base balance * multiplier (virtual split)
     */
    function balanceOf(address account) public view override returns (uint256) {
        return super.balanceOf(account) * _multiplier;
    }

    /**
     * @dev Overrides totalSupply to apply virtual split multiplier
     * @return uint256 The total supply multiplied by the current multiplier
     * @notice Returns base supply * multiplier (virtual split)
     */
    function totalSupply() public view override returns (uint256) {
        return super.totalSupply() * _multiplier;
    }

    /**
     * @dev Returns the current virtual split multiplier
     * @return uint256 The current multiplier value
     * @notice Returns 1 if no splits have been executed
     */
    function multiplier() public view returns (uint256) {
        return _multiplier;
    }

    /**
     * @dev Executes a virtual split by updating the multiplier
     * @param newMultiplier The new multiplier value to apply
     * @notice Only callable by accounts with DEFAULT_ADMIN_ROLE
     * @notice Emits SplitExecuted event
     * @notice Multiplier compounds with previous splits (e.g., 2x then 3x = 6x total)
     */
    function executeSplit(uint256 newMultiplier) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMultiplier > 0, "Multiplier must be greater than 0");
        _multiplier = _multiplier * newMultiplier;
        emit SplitExecuted(_multiplier, block.number);
    }

    /**
     * @dev Overrides symbol() to return custom _symbol state variable
     * @return string The current token symbol
     * @notice Returns the custom _symbol variable instead of OpenZeppelin's default
     */
    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Changes the token symbol
     * @param newSymbol The new symbol to set
     * @notice Only callable by accounts with DEFAULT_ADMIN_ROLE
     * @notice Validates that newSymbol is non-empty
     * @notice Emits SymbolChanged event with old and new symbol
     */
    function changeSymbol(string memory newSymbol) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(newSymbol).length > 0, "Symbol cannot be empty");
        string memory oldSymbol = _symbol;
        _symbol = newSymbol;
        emit SymbolChanged(oldSymbol, newSymbol);
    }
}

