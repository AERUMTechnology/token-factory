pragma solidity 0.4.24;

contract TestNotReceivingContract {

    event Created();
    event Called();

    constructor() public {
        emit Created();
    }

    function notATokenFallback() public {
        emit Called();
    }

}
