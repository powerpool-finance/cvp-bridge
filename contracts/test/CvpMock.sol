// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CvpMock is ERC20 {
  constructor() ERC20("CVP", "CVP") {
    _mint(msg.sender, 1000000 ether);
  }
}
