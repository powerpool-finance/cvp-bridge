// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "../CvpBridgeLocker.sol";

contract CvpBridgeLockerMock is CvpBridgeLocker {
  uint256 public immutable currentChainId;

  constructor(IDeBridgeGate _deBridgeGate, IERC20 _cvp, uint256 _currentChainId) CvpBridgeLocker(_deBridgeGate, _cvp) {
    currentChainId = _currentChainId;
  }

  function getChainId() public override view returns (uint256 cid) {
    return currentChainId;
  }
}
