const fs = require('fs');

const { expectRevert, time } = require('@openzeppelin/test-helpers');
const assert = require('chai').assert;
const CvpMock = artifacts.require('CvpMock');
const CvpBridgeLocker = artifacts.require('CvpBridgeLocker');
const DeBridgeGateMock = artifacts.require('DeBridgeGateMock');

CvpBridgeLocker.numberFormat = 'String';
DeBridgeGateMock.numberFormat = 'String';

const { web3 } = CvpBridgeLocker;
const { toBN } = web3.utils;

function ether(val) {
  return web3.utils.toWei(val.toString(), 'ether');
}

async function getTimestamp(shift = 0) {
  const currentTimestamp = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp;
  return currentTimestamp + shift;
}

function subBN(bn1, bn2) {
  return toBN(bn1.toString(10))
    .sub(toBN(bn2.toString(10)))
    .toString(10);
}
function addBN(bn1, bn2) {
  return toBN(bn1.toString(10))
    .add(toBN(bn2.toString(10)))
    .toString(10);
}
function divScalarBN(bn1, bn2) {
  return toBN(bn1.toString(10))
    .mul(toBN(ether('1').toString(10)))
    .div(toBN(bn2.toString(10)))
    .toString(10);
}

function isBNHigher(bn1, bn2) {
  return toBN(bn1.toString(10)).gt(toBN(bn2.toString(10)));
}

function assertEqualWithAccuracy(bn1, bn2, accuracyPercentWei, message = '') {
  bn1 = toBN(bn1.toString(10));
  bn2 = toBN(bn2.toString(10));
  const bn1GreaterThenBn2 = bn1.gt(bn2);
  let diff = bn1GreaterThenBn2 ? bn1.sub(bn2) : bn2.sub(bn1);
  let diffPercent = divScalarBN(diff, bn1);
  assert.equal(toBN(diffPercent).lte(toBN(accuracyPercentWei)), true, message);
}

describe('CvpBridgeLocker', () => {
  const h = require('../helpers')(web3);

  let minter, bob, alice, feeReceiver, permanentVotingPower;
  before(async function () {
    [minter, bob, alice, feeReceiver, permanentVotingPower] = await web3.eth.getAccounts();
  });

  beforeEach(async () => {
    this.cvp = await CvpMock.new({ from: minter });
    this.deBridgeGate = await DeBridgeGateMock.new({ from: minter });
    this.cvpBridgeChain1 = await CvpBridgeLocker.new(this.deBridgeGate.address, this.cvp.address, 1, { from: minter });
    this.cvpBridgeChain2 = await CvpBridgeLocker.new(this.deBridgeGate.address, this.cvp.address, 2, { from: minter });
    await this.deBridgeGate.setChainIdAndContractForMsgSender(this.cvpBridgeChain1.address, 2, this.cvpBridgeChain2.address);
    await this.deBridgeGate.setChainIdAndContractForMsgSender(this.cvpBridgeChain2.address, 1, this.cvpBridgeChain1.address);
  });

  describe('sendToChain and unlock', () => {
    beforeEach(async () => {
      await this.cvp.transfer(bob, ether(100));
      await this.cvp.transfer(this.cvpBridgeChain2.address, ether(100));

      await this.cvpBridgeChain1.setDestinationChainContract(2, this.cvpBridgeChain2.address);
      await this.cvpBridgeChain2.setSourceChainContract(1, this.cvpBridgeChain1.address);
    });

    it('sendToChain', async () => {
      await this.cvp.approve(this.cvpBridgeChain1.address, ether(100), {from: bob});
      await expectRevert(this.cvpBridgeChain1.sendToChain(2, ether(100), alice, {from: bob}), "Limit reached");
      await this.cvpBridgeChain1.setChainLimitPerDay(2, ether(100));
      await this.cvpBridgeChain1.sendToChain(2, ether(100), alice, {from: bob, value: ether(0.1)});

      assert.equal(await this.cvp.balanceOf(alice), '0');

      await expectRevert(this.deBridgeGate.callUnlock(this.cvpBridgeChain2.address, 1, ether(100), alice), "Limit reached");
      await this.cvpBridgeChain2.setChainLimitPerDay(1, ether(100));
      await this.deBridgeGate.callUnlock(this.cvpBridgeChain2.address, 1, ether(100), alice);

      assert.equal(await this.cvp.balanceOf(alice), ether(100));
    });
  });
});
