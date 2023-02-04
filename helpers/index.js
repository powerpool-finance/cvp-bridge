const BigNumber = require('bignumber.js')

module.exports = (web3, ethers) => {
  const {toBN, toWei, fromWei} = web3.utils;

  function nToBN(num) {
    return toBN(num.toString(10));
  }

  function ether(num) {
    return toWei(num.toString(10), 'ether');
  }

  async function impersonateAccount(adminAddress) {
    await ethers.provider.getSigner().sendTransaction({
      to: adminAddress,
      value: '0x' + new BigNumber(ether('1')).toString(16)
    })

    await ethers.provider.send('hardhat_impersonateAccount', [adminAddress]);
  }

  const h = {
    maxUint: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    ether,
    fromEther(wei) {
      return parseFloat(fromWei(wei.toString(10), 'ether'));
    },
    addBN(bn1, bn2) {
      return nToBN(bn1).add(nToBN(bn2)).toString();
    },
    subBN(bn1, bn2) {
      return nToBN(bn1).sub(nToBN(bn2));
    },
    mulBN(bn1, bn2) {
      return nToBN(bn1).mul(nToBN(bn2)).toString();
    },
    divBN(bn1, bn2) {
      return nToBN(bn1).div(nToBN(bn2)).toString();
    },
    mulScalarBN(bn1, bn2) {
      return nToBN(bn1).mul(nToBN(bn2)).div(nToBN(ether(1))).toString();
    },
    divScalarBN(bn1, bn2) {
      return nToBN(bn1).mul(nToBN(ether(1))).div(nToBN(bn2)).toString();
    },
    async callContract(contract, method, args = [], type = null) {
      // console.log(method, args);
      let result = await contract.contract.methods[method].apply(contract.contract, args).call();
      if (type === 'array') {
        result = [].concat(result);
      }
      return result;
    },
    async ethUsed(receipt) {
      const tx = await web3.eth.getTransaction(receipt.transactionHash);
      return h.fromEther(h.mulBN(receipt.gasUsed, tx.gasPrice));
    },
    impersonateAccount,
    async forkContractUpgrade(ethers, adminAddress, proxyAdminAddress, proxyAddress, implAddress) {
      const iface = new ethers.utils.Interface(['function upgrade(address proxy, address impl)']);

      await impersonateAccount(ethers, adminAddress);

      await ethers.provider.getSigner(adminAddress).sendTransaction({
        to: proxyAdminAddress,
        data: iface.encodeFunctionData('upgrade', [proxyAddress, implAddress])
      })
    }
  };

  return h;
};
