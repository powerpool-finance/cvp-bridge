// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IDeBridgeGate.sol";
import "./interfaces/Flags.sol";
import "./interfaces/ICallProxy.sol";

contract CvpBridgeLocker is Ownable {
  using SafeERC20 for IERC20;

  IDeBridgeGate public deBridgeGate;
  IERC20 public immutable cvp;
  uint256 public immutable currentChainId;

  mapping(uint256 => address) public destinationChainContracts;
  mapping(uint256 => address) public sourceChainsContracts;

  mapping(uint256 => uint256) public chainLimitPerDay;
  mapping(uint256 => mapping(uint256 => uint256)) public transfersPerDay;

  constructor(IDeBridgeGate _deBridgeGate, IERC20 _cvp, uint256 _currentChainId) public Ownable() {
    deBridgeGate = _deBridgeGate;
    cvp = _cvp;
    currentChainId = _currentChainId;
  }

  function sendToChain(uint256 _toChainID, uint256 _amount, address _recipient) external payable {
    require(destinationChainContracts[_toChainID] != address(0), "Chain contract address not specified");
    _checkChainLimits(_toChainID, _amount);

    cvp.safeTransferFrom(msg.sender, address(this), _amount);

    bytes memory dstTxCall = _encodeUnlockCommand(_amount, _recipient);
    _send(dstTxCall, _toChainID, 0);
  }

  function unlock(uint256 _fromChainID, uint256 _amount, address _recipient) external {
    require(sourceChainsContracts[_fromChainID] != address(0), "Chain contract address not specified");
    _onlyCrossChain(_fromChainID);
    _checkChainLimits(_fromChainID, _amount);

    cvp.safeTransfer(_recipient, _amount);
  }

  function _checkChainLimits(uint256 _chainID, uint256 _amount) internal {
    uint256 curEpoch = block.timestamp / 7 days;
    transfersPerDay[_chainID][curEpoch] += _amount;

    require(chainLimitPerDay[_chainID] >= transfersPerDay[_chainID][curEpoch], "Limit reached");
  }

  function _onlyCrossChain(uint256 _fromChainID) internal {
    ICallProxy callProxy = ICallProxy(deBridgeGate.callProxy());

    // caller is CallProxy?
    require(address(callProxy) == msg.sender, "Not callProxy");

    uint256 chainIdFrom = callProxy.submissionChainIdFrom();
    require(chainIdFrom == _fromChainID, "Chain id does not match");
    bytes memory nativeSender = callProxy.submissionNativeSender();
    require(keccak256(abi.encodePacked(sourceChainsContracts[chainIdFrom])) == keccak256(nativeSender), "Not valid sender");
  }

  function _encodeUnlockCommand(uint256 _amount, address _recipient)
    internal
    view
    returns (bytes memory)
  {
    return
      abi.encodeWithSelector(
        CvpBridgeLocker.unlock.selector,
        currentChainId,
        _amount,
        _recipient
      );
  }

  function _send(bytes memory _dstTransactionCall, uint256 _toChainId, uint256 _executionFee) internal {
    //
    // sanity checks
    //
    uint256 protocolFee = deBridgeGate.globalFixedNativeFee();
    require(
      msg.value >= (protocolFee + _executionFee),
      "fees not covered by the msg.value"
    );

    // we bridge as much asset as specified in the _executionFee arg
    // (i.e. bridging the minimum necessary amount to to cover the cost of execution)
    // However, deBridge cuts a small fee off the bridged asset, so
    // we must ensure that executionFee < amountToBridge
    uint assetFeeBps = deBridgeGate.globalTransferFeeBps();
    uint amountToBridge = _executionFee;
    uint amountAfterBridge = amountToBridge * (10000 - assetFeeBps) / 10000;

    //
    // start configuring a message
    //
    IDeBridgeGate.SubmissionAutoParamsTo memory autoParams;

    // use the whole amountAfterBridge as the execution fee to be paid to the executor
    autoParams.executionFee = amountAfterBridge;

    // Exposing nativeSender must be requested explicitly
    // We request it bc of CrossChainCounter's onlyCrossChainIncrementor modifier
    autoParams.flags = Flags.setFlag(
      autoParams.flags,
      Flags.PROXY_WITH_SENDER,
      true
    );

    // if something happens, we need to revert the transaction, otherwise the sender will loose assets
    autoParams.flags = Flags.setFlag(
      autoParams.flags,
      Flags.REVERT_IF_EXTERNAL_FAIL,
      true
    );

    autoParams.data = _dstTransactionCall;
    autoParams.fallbackAddress = abi.encodePacked(msg.sender);

    deBridgeGate.send{value: msg.value}(
      address(0), // _tokenAddress
      amountToBridge, // _amount
      _toChainId, // _chainIdTo
      abi.encodePacked(destinationChainContracts[_toChainId]), // _receiver
      "", // _permit
      true, // _useAssetFee
      0, // _referralCode
      abi.encode(autoParams) // _autoParams
    );
  }

  function setDeBridgeGate(IDeBridgeGate _deBridgeGate) external onlyOwner {
    deBridgeGate = _deBridgeGate;
  }

  function setDestinationChainContract(uint256 _chainId, address _contract) external onlyOwner {
    destinationChainContracts[_chainId] = _contract;
  }

  function setSourceChainContract(uint256 _chainId, address _contract) external onlyOwner {
    sourceChainsContracts[_chainId] = _contract;
  }

  function setChainLimitPerDay(uint256 _chainId, uint256 _amount) external onlyOwner {
    chainLimitPerDay[_chainId] = _amount;
  }

  function migrate(address _token, address _newBridge, uint256 _amount) external onlyOwner {
    IERC20(_token).safeTransfer(_newBridge, _amount);
  }
}
