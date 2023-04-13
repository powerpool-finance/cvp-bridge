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

  constructor(IDeBridgeGate _deBridgeGate, IERC20 _cvp, uint256 _currentChainId) Ownable() {
    deBridgeGate = _deBridgeGate;
    cvp = _cvp;
    currentChainId = _currentChainId;
  }

  /**
    @title Send CVP Tokens to another blockchain
    @dev Sends CVP tokens to the specified recipient on the specified chain.
    @param _toChainID ID of the destination chain.
    @param _amount Amount of CVP tokens to be sent.
    @param _recipient Address of the recipient on the destination chain.
  */
  function sendToChain(uint256 _toChainID, uint256 _amount, address _recipient) external payable {
    require(destinationChainContracts[_toChainID] != address(0), "Chain contract address not specified");
    _checkChainLimits(_toChainID, _amount);

    cvp.safeTransferFrom(msg.sender, address(this), _amount);

    bytes memory dstTxCall = _encodeUnlockCommand(_amount, _recipient);
    _send(dstTxCall, _toChainID);
  }

  /**
    @title Unlock CVP Tokens received from another blockchain
    @dev Unlocks CVP tokens received from the specified chain and sends them to the specified recipient.
    @param _fromChainID ID of the source chain.
    @param _amount Amount of CVP tokens to be unlocked.
    @param _recipient Address of the recipient of the unlocked CVP tokens.
  */
  function unlock(uint256 _fromChainID, uint256 _amount, address _recipient) external {
    require(sourceChainsContracts[_fromChainID] != address(0), "Chain contract address not specified");
    _onlyCrossChain(_fromChainID);
    _checkChainLimits(_fromChainID, _amount);

    cvp.safeTransfer(_recipient, _amount);
  }

  /**
    @title Check chain limits for cross-chain transfers
    @dev Checks if the specified amount of tokens can be transferred to the specified chain based on the daily limit set for the chain.
    @param _chainID ID of the chain being checked for the transfer limit.
    @param _amount Amount of tokens to be transferred.
  */
  function _checkChainLimits(uint256 _chainID, uint256 _amount) internal {
    uint256 curEpoch = block.timestamp / 1 days;
    transfersPerDay[_chainID][curEpoch] += _amount;

    require(chainLimitPerDay[_chainID] >= transfersPerDay[_chainID][curEpoch], "Limit reached");
  }

  /**
    @title Check if function is called by a valid cross-chain contract
    @dev Checks if the function is being called by a valid cross-chain contract for the specified source chain.
    @param _fromChainID ID of the source chain.
  */
  function _onlyCrossChain(uint256 _fromChainID) internal {
    ICallProxy callProxy = ICallProxy(deBridgeGate.callProxy());

    // caller is CallProxy?
    require(address(callProxy) == msg.sender, "Not callProxy");

    uint256 chainIdFrom = callProxy.submissionChainIdFrom();
    require(chainIdFrom == _fromChainID, "Chain id does not match");
    bytes memory nativeSender = callProxy.submissionNativeSender();
    require(keccak256(abi.encodePacked(sourceChainsContracts[chainIdFrom])) == keccak256(nativeSender), "Not valid sender");
  }

  /**
    @title Encode the unlock command for cross-chain transfer
    @dev Encodes the unlock command with the specified amount and recipient address for the current chain ID.
    @param _amount Amount of tokens to be unlocked.
    @param _recipient Address of the recipient of the unlocked tokens.
    @return The encoded unlock command.
  */
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

  /**
    @title Send the transaction to the specified chain
    @dev Sends the transaction to the specified chain using the deBridgeGate.
    @param _dstTransactionCall The encoded transaction to be sent to the destination chain.
    @param _toChainId The ID of the destination chain.
  */
  function _send(bytes memory _dstTransactionCall, uint256 _toChainId) internal {
    //
    // sanity checks
    //
    uint256 protocolFee = deBridgeGate.globalFixedNativeFee();
    require(
      msg.value >= protocolFee,
      "fees not covered by the msg.value"
    );

    uint assetFeeBps = deBridgeGate.globalTransferFeeBps();
    uint amountToBridge = 0;
    //
    // start configuring a message
    //
    IDeBridgeGate.SubmissionAutoParamsTo memory autoParams;

    autoParams.executionFee = 0;

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

    deBridgeGate.send{value : msg.value}(
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

  /**
    @title Allows the owner to set the address of the DeBridgeGate contract.
    @param _deBridgeGate Address of the new DeBridgeGate contract.
  */
  function setDeBridgeGate(IDeBridgeGate _deBridgeGate) external onlyOwner {
    deBridgeGate = _deBridgeGate;
  }

  /**
    @dev Allows the owner to set the address of the destination chain contract for a given chain ID.
    @param _chainId uint256 ID of the chain to set the destination chain contract for.
    @param _contract address Address of the destination chain contract to set.
  */
  function setDestinationChainContract(uint256 _chainId, address _contract) external onlyOwner {
    destinationChainContracts[_chainId] = _contract;
  }

  /**
    @dev Allows the owner to set the address of the source chain contract for a given chain ID.
    @param _chainId uint256 ID of the chain to set the source chain contract for.
    @param _contract address Address of the source chain contract to set.
  */
  function setSourceChainContract(uint256 _chainId, address _contract) external onlyOwner {
    sourceChainsContracts[_chainId] = _contract;
  }

  /**
    @dev Allows the owner to set the maximum transfer limit per day for a specific chain.
    @param _chainId uint256 ID of the chain for which the limit needs to be set.
    @param _amount uint256 Maximum amount that can be transferred per day.
  */
  function setChainLimitPerDay(uint256 _chainId, uint256 _amount) external onlyOwner {
    chainLimitPerDay[_chainId] = _amount;
  }

  /**
    @dev Transfers _amount tokens of _token to the _newBridge address for migration purposes.
    @param _token address of the token to be migrated.
    @param _newBridge address of the new bridge where the tokens will be migrated.
    @param _amount amount of tokens to be migrated.
  */
  function migrate(address _token, address _newBridge, uint256 _amount) external onlyOwner {
    IERC20(_token).safeTransfer(_newBridge, _amount);
  }
}
