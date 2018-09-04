pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";

/*
 * ERC223 contract interface
 */
contract ERC223 is ERC20Basic {

    function name() public view returns (string);
    function symbol() public view returns (string);
    function decimals() public view returns (uint8);

    function transfer(address to, uint256 value, bytes data) public returns (bool);
    function transfer(address to, uint256 value, bytes data, string custom_fallback) public returns (bool);

    event Transfer(address indexed from, address indexed to, uint value, bytes data);
}

/*
 * Contract that is working with ERC223 tokens
 */
contract ContractReceiver {

    function tokenFallback(address from, uint value, bytes data) public;

}

/**
 * ERC223 token: https://github.com/ethereum/EIPs/issues/223
 */
contract ERC223Token is ERC223, Ownable {

    using SafeMath for uint256;

    mapping(address => uint256) balances;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    constructor(string _name, string _symbol, uint8 _decimals, uint256 _totalSupply, address holder) public {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply * (10 ** uint256(decimals));
        balances[holder] = totalSupply;
    }

    /**
    * @dev Function to access name of token
    */
    function name() public view returns (string) {
        return name;
    }

    /**
    * @dev Function to access symbol of token
    */
    function symbol() public view returns (string) {
        return symbol;
    }

    /**
    * @dev Function to access decimals of token
    */
    function decimals() public view returns (uint8) {
        return decimals;
    }

    /**
    * @dev Function to access total supply of tokens
    */
    function totalSupply() public view returns (uint256) {
        return totalSupply;
    }

    /**
    * @dev Gets the balance of the specified address.
    * @param owner The address to query the the balance of.
    * @return An uint256 representing the amount owned by the passed address.
    */
    function balanceOf(address owner) public view returns (uint256) {
        return balances[owner];
    }

    /**
    * @dev Function that is called when a user or another contract wants to transfer funds.
    */
    function transfer(address _to, uint _value, bytes _data, string _custom_fallback) public returns (bool success) {
        if (isContract(_to)) {
            require(balanceOf(msg.sender) >= _value, "You must have sufficent balance to perform this operation");
            balances[msg.sender] = balanceOf(msg.sender).sub(_value);
            balances[_to] = balanceOf(_to).add(_value);
            assert(_to.call.value(0)(bytes4(keccak256(abi.encodePacked(_custom_fallback))), msg.sender, _value, _data));
            if (_data.length == 0) emit Transfer(msg.sender, _to, _value);
            else emit Transfer(msg.sender, _to, _value, _data);
            return true;
        } else {
            return transferToAddress(_to, _value, _data);
        }
    }

    /**
    * @dev Function that is called when a user or another contract wants to transfer funds .
    */
    function transfer(address _to, uint _value, bytes _data) public returns (bool success) {
        if (isContract(_to)) {
            return transferToContract(_to, _value, _data);
        } else {
            return transferToAddress(_to, _value, _data);
        }
    }

    /**
    * @dev Standard function transfer similar to ERC20 transfer with no _data
    */
    function transfer(address _to, uint _value) public returns (bool success) {
        //standard function transfer similar to ERC20 transfer with no _data
        //added due to backwards compatibility reasons
        bytes memory empty;
        if(isContract(_to)) {
            return transferToContract(_to, _value, empty);
        }
        else {
            return transferToAddress(_to, _value, empty);
        }
    }

    /**
    * @dev Assemble the given address bytecode. If bytecode exists then the _addr is a contract.
    */
    function isContract(address _addr) private view returns (bool is_contract) {
        uint length;
        assembly {
            //retrieve the size of the code on target address, this needs assembly
            length := extcodesize(_addr)
        }
        return (length > 0);
    }

    /**
    * @dev Function that is called when transaction target is an address
    */
    function transferToAddress(address _to, uint _value, bytes _data) private returns (bool success) {
        require(balanceOf(msg.sender) >= _value, "You must have sufficient balance to perform this operation");
        balances[msg.sender] = balanceOf(msg.sender).sub(_value);
        balances[_to] = balanceOf(_to).add(_value);
        if (_data.length == 0) emit Transfer(msg.sender, _to, _value);
        else emit Transfer(msg.sender, _to, _value, _data);
        return true;
    }

    /**
    * @dev Function that is called when transaction target is a contract
    */
    function transferToContract(address _to, uint _value, bytes _data) private returns (bool success) {
        require(balanceOf(msg.sender) >= _value, "You must have sufficient balance to perform this operation");
        balances[msg.sender] = balanceOf(msg.sender).sub(_value);
        balances[_to] = balanceOf(_to).add(_value);
        ContractReceiver receiver = ContractReceiver(_to);
        receiver.tokenFallback(msg.sender, _value, _data);
        if (_data.length == 0) emit Transfer(msg.sender, _to, _value);
        else emit Transfer(msg.sender, _to, _value, _data);
        return true;
    }

}
