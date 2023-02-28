// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}


contract CoffeeContract {

    struct Coffee {
        uint256 timestamp;
        address buyer;
        string message;
        string name;
        uint256 amount;
    }

    event CreateCoffee (
        address indexed buyer,
        string message,
        uint256 amount
    );

    Coffee[] allCoffee;

    uint256 coffeeCount;
    address payable immutable owner;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    constructor () payable {
        owner = payable(msg.sender);
    }

    function purchaseCoffee(
        string calldata _message,
        string calldata _name,
        uint256 _amount
    ) public payable {
        require(_amount > 0, "Invalid coffee amount specified");
        
        allCoffee.push(Coffee(
            block.timestamp,
            msg.sender,
            _message,
            _name,
            _amount
        ));

        coffeeCount = coffeeCount + 1;

        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                owner,
                // _amount * 1 ether
                _amount
            ),
            "Failed to transfer cUSD tokens"
        );

        emit CreateCoffee(
            msg.sender,
            _message,
            _amount
        );
    }

    function getCoffeeCount() public view returns (uint256) {
        return coffeeCount;
    }

    function getCoffeeBuyers() public view returns (Coffee[] memory) {
        return allCoffee;
    }
}
