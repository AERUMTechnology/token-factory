pragma solidity ^0.4.24;

import "./ERC223.sol";

/**
 * @title Aerum-based factory contract for ERC223 tokens.
 */
contract TokenFactory {

    event NewToken(address indexed token, string name, string symbol, uint8 decimals, uint256 totalSupply);

    /**
     * @dev Creates a ERC223 contract owner by a caller with the givem parameters.
     */
    function create(string name, string symbol, uint8 decimals, uint256 totalSupply) public returns(address) {
        ERC223Token token = new ERC223Token(name, symbol, decimals, totalSupply, msg.sender);
        token.transferOwnership(msg.sender);
        emit NewToken(address(token), name, symbol, decimals, totalSupply);
        return address(token);
    }

}
