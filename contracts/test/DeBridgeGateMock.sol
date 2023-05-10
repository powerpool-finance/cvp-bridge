// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "../CvpBridgeLocker.sol";

contract DeBridgeGateMock {
  mapping(address => uint256) submissionChainIdFromByAddress;
  mapping(address => address) sourceChainsContractsByAddress;

  function setChainIdAndContractForMsgSender(address _msgSender, uint256 _chainId, address _contractAddress) public {
    submissionChainIdFromByAddress[_msgSender] = _chainId;
    sourceChainsContractsByAddress[_msgSender] = _contractAddress;
  }

  function callProxy() external returns(address) {
    return address(this);
  }

  function globalFixedNativeFee() external view returns (uint256) {
    return 0.1 ether;
  }

  function globalTransferFeeBps() external view returns (uint256) {
    return 0;
  }

  function submissionChainIdFrom() external view returns (uint256) {
    return submissionChainIdFromByAddress[msg.sender];
  }

  function submissionNativeSender() external view returns (bytes memory) {
    return abi.encodePacked(sourceChainsContractsByAddress[msg.sender]);
  }

  function send(
    address _tokenAddress,
    uint256 _amount,
    uint256 _chainIdTo,
    bytes memory _receiver,
    bytes memory _permitEnvelope,
    bool _useAssetFee,
    uint32 _referralCode,
    bytes calldata _autoParams
  ) external payable returns (bytes32 submissionId) {
//    address _receiverBridge = abi.decode(_receiver, (address));
    return 0;
  }

  function sendMessage(
    uint256 _dstChainId,
    bytes memory _targetContractAddress,
    bytes memory _targetContractCalldata,
    uint256 _flags,
    uint32 _referralCode
  ) external payable returns (bytes32 submissionId) {
    //    address _receiverBridge = abi.decode(_receiver, (address));
    return 0;
  }

  function callUnlock(address _contractAddress, uint256 _fromChainID, uint256 _amount, address _recipient) public {
    CvpBridgeLocker(_contractAddress).unlock(_fromChainID, _amount, _recipient);
  }
}
