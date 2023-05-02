require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-ethers');

task('deploy-cvp-bridge-locker', 'Deploy CVP Bridge Locker')
  .setAction(async (__, {ethers, network}) => {
    const CvpBridgeLocker = await artifacts.require('CvpBridgeLocker');
    const {web3} = CvpBridgeLocker;

    const [deployer] = await web3.eth.getAccounts();
    console.log('deployer', deployer);
    const sendOptions = {from: deployer};

    const deBridgeAddress = '0x43dE2d77BF8027e25dBD179B491e8d64f38398aA';
    const {cvpAddress, chainId} = ({
      bnb: {
        cvpAddress: '0x5ec3adbdae549dce842e24480eb2434769e22b2e',
        chainId: 56
      },
      mainnet: {
        cvpAddress: '0x38e4adb44ef08f22f5b5b76a8f0c2d0dcbe7dca1',
        chainId: 1
      }
    })[network.name];

    console.log('network', network.name);
    console.log('cvpAddress', cvpAddress);
    console.log('chainId', chainId);

    const cvpBridge = await CvpBridgeLocker.new(deBridgeAddress, cvpAddress, chainId, sendOptions);
    console.log('cvpBridge.address', cvpBridge.address);
  });

task('deploy-mock-bridge-locker', 'Deploy Mock Bridge Locker')
  .setAction(async (__, {ethers, network}) => {
    const CvpBridgeLocker = await artifacts.require('CvpBridgeLocker');
    const Erc20Mock = await artifacts.require('Erc20Mock');
    const {web3} = CvpBridgeLocker;

    const [deployer] = await web3.eth.getAccounts();
    console.log('deployer', deployer);
    const sendOptions = {from: deployer};

    const deBridgeAddress = '0x43dE2d77BF8027e25dBD179B491e8d64f38398aA';
    const {chainId} = ({
      bnb: {
        chainId: 56
      },
      mainnet: {
        chainId: 1
      }
    })[network.name];

    console.log('network', network.name);
    console.log('chainId', chainId);

    const erc20Mock = await Erc20Mock.new(sendOptions);
    console.log('erc20Mock', erc20Mock.address);

    const cvpBridge = await CvpBridgeLocker.new(deBridgeAddress, erc20Mock.address, chainId, sendOptions);
    console.log('cvpBridge.address', cvpBridge.address);
  });

