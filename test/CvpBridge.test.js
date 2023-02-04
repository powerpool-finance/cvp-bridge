const fs = require('fs');

const { expectRevert, time } = require('@openzeppelin/test-helpers');
const assert = require('chai').assert;
const CvpBridge = artifacts.require('CvpBridge');
const DeBridgeGateMock = artifacts.require('DeBridgeGateMock');

CvpBridge.numberFormat = 'String';
DeBridgeGateMock.numberFormat = 'String';

const { web3 } = CvpBridge;
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

describe('CvpBridge', () => {
  const h = require('../helpers')(web3);

  let minter, bob, feeManager, feeReceiver, permanentVotingPower;
  before(async function () {
    [minter, bob, feeManager, feeReceiver, permanentVotingPower] = await web3.eth.getAccounts();
  });

  beforeEach(async () => {
    // this.bFactory = await BFactory.new({ from: minter });
    // this.bActions = await BActions.new({ from: minter });
  });

  describe('Swaps with Uniswap mainnet values', () => {
    let pools, token;

    beforeEach(async () => {

    });

    it.only('swapEthToPipt should work properly', async () => {
      // const cvpBridge = await CvpBridge.new(this.weth.address);
      // await cvpBridge.sendToChain();
    });
  });
});
