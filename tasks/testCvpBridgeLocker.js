require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-ethers');

task('test-cvp-bridge-locker', 'Test CVP Bridge Locker')
  .setAction(async (__, {ethers, network}) => {
    const CvpBridgeLocker = await artifacts.require('CvpBridgeLocker');
    const IERC20 = await artifacts.require('IERC20');
    IERC20.numberFormat = 'String';
    const {web3} = CvpBridgeLocker;

    const [tester] = await web3.eth.getAccounts();
    console.log('tester', tester);
    const sendOptions = {from: tester};

    const bridge = await CvpBridgeLocker.at(process.env.BRIDGE);
    const cvp = await IERC20.at(await bridge.cvp());

    console.log('network', network.name);

    const allowance = await cvp.allowance(tester, bridge.address);
    if (allowance === '0') {
      console.log('cvp approve');

    }
  });
