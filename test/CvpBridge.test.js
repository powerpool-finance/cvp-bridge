const { expectRevert } = require('@openzeppelin/test-helpers');
const assert = require('chai').assert;
const CvpMock = artifacts.require('CvpMock');
const CvpBridgeLocker = artifacts.require('CvpBridgeLocker');
const DeBridgeGateMock = artifacts.require('DeBridgeGateMock');

CvpBridgeLocker.numberFormat = 'String';
DeBridgeGateMock.numberFormat = 'String';

const { web3 } = CvpBridgeLocker;

function ether(val) {
  return web3.utils.toWei(val.toString(), 'ether');
}

describe('CvpBridgeLocker', () => {
  let minter, bob, alice;
  before(async function () {
    [minter, bob, alice] = await web3.eth.getAccounts();
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
      assert.equal(await this.cvpBridgeChain1.getChainId(), '1');
      assert.equal(await this.cvpBridgeChain2.getChainId(), '2');

      await expectRevert(this.cvpBridgeChain1.setInternalChainId(1, {from: bob}), 'Ownable: caller is not the owner');

      await this.cvpBridgeChain1.setInternalChainId(100, {from: minter});
      assert.equal(await this.cvpBridgeChain1.getChainId(), '100');
      await this.cvpBridgeChain1.setInternalChainId(1, {from: minter});
      assert.equal(await this.cvpBridgeChain1.getChainId(), '1');

      await this.cvp.approve(this.cvpBridgeChain1.address, ether(100), {from: bob});
      await expectRevert(this.cvpBridgeChain1.sendToChain(2, ether(100), alice, 0, {from: bob}), 'Limit reached');
      await this.cvpBridgeChain1.setChainLimitPerDay(2, ether(100));
      await this.cvpBridgeChain1.sendToChain(2, ether(100), alice, 0, {from: bob, value: ether(0.1)});

      assert.equal(await this.cvp.balanceOf(alice), '0');

      await expectRevert(this.deBridgeGate.callUnlock(this.cvpBridgeChain2.address, 1, ether(100), alice), 'Limit reached');
      await this.cvpBridgeChain2.setChainLimitPerDay(1, ether(100));
      await this.deBridgeGate.callUnlock(this.cvpBridgeChain2.address, 1, ether(100), alice);

      assert.equal(await this.cvp.balanceOf(alice), ether(100));
    });
  });
});
