// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Cvp is ERC20 {
  constructor() ERC20("CVP", "CVP") {
    _mint(msg.sender, 100000000 ether);
  }
}
