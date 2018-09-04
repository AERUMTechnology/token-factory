pragma solidity 0.4.24;

import "../ERC223.sol";

contract TestContractReceiver is ContractReceiver {

    event Created();
    event Called(address from, uint value, bytes data);

    constructor() public {
        emit Created();
    }

    function tokenFallback(address from, uint value, bytes data) public {
        emit Called(from, value, data);
    }

}
