require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-ethers');

task('deploy-erc20-mock', 'Deploy MockERC20')
  .setAction(async (__, {ethers, network}) => {
    const Erc20Mock = await artifacts.require('Erc20Mock');
    const {web3} = Erc20Mock;

    const [deployer] = await web3.eth.getAccounts();
    console.log('deployer', deployer);
    const sendOptions = {from: deployer};

    const mock = await Erc20Mock.new(sendOptions);
    console.log('mock.address', mock.address);
  });

task('deploy-cvp', 'Deploy CVP')
  .setAction(async (__, {ethers, network}) => {
    const Cvp = await artifacts.require('Cvp');
    const {web3} = Cvp;

    const [deployer] = await web3.eth.getAccounts();
    console.log('deployer', deployer);
    const sendOptions = {from: deployer};

    const cvp = await Cvp.new(sendOptions);
    console.log('cvp.address', cvp.address);
  });

task('deploy-cvp-bridge-locker', 'Deploy CVP Bridge Locker')
  .setAction(async (__, {ethers, network}) => {
    const CvpBridgeLocker = await artifacts.require('CvpBridgeLocker');
    const {web3} = CvpBridgeLocker;

    const [deployer] = await web3.eth.getAccounts();
    console.log('deployer', deployer);
    const sendOptions = {from: deployer};

    const deBridgeAddress = '0x43dE2d77BF8027e25dBD179B491e8d64f38398aA';
    const {cvpAddress} = ({
      bnb: {
        cvpAddress: '0x5ec3adbdae549dce842e24480eb2434769e22b2e',
      },
      mainnet: {
        cvpAddress: '0x38e4adb44ef08f22f5b5b76a8f0c2d0dcbe7dca1',
      },
      base: {
        cvpAddress: '0x11b8C0BC88BEeFa5773e32931C4897EC6B44f220',
      }
    })[network.name];

    console.log('network', network.name);
    console.log('cvpAddress', cvpAddress);

    const cvpBridge = await CvpBridgeLocker.new(deBridgeAddress, cvpAddress, sendOptions);
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
    let {erc20MockAddress} = ({
      bnb: {
        // erc20MockAddress: '0xff7a036eb201a611069a9de689d245d13d3c626e'
      },
      mainnet: {
        // erc20MockAddress: '0x902f7d304CCf03e83Deb279673B9B458Ec0A3B7e'
      },
      arbitrumOne: {
        // erc20MockAddress: '0x902f7d304CCf03e83Deb279673B9B458Ec0A3B7e'
      },
      gnosis: {

      },
      base: {

      }
    })[network.name];

    console.log('network', network.name);

    if (!erc20MockAddress) {
      const erc20Mock = await Erc20Mock.new(sendOptions);
      console.log('erc20Mock', erc20Mock.address);
      erc20MockAddress = erc20Mock.address;
    }

    const cvpBridge = await CvpBridgeLocker.new(deBridgeAddress, erc20MockAddress, sendOptions);
    console.log('cvpBridge.address', cvpBridge.address);
  });

