require('@nomiclabs/hardhat-truffle5');
require('@nomicfoundation/hardhat-verify');
require('solidity-coverage');
require('hardhat-contract-sizer');
require('hardhat-gas-reporter');
require('./tasks/deployCvpBridgeLocker');
require('./tasks/testCvpBridgeLocker');

const fs = require('fs');
const homeDir = require('os').homedir();
const _ = require('lodash');

function getAccounts(network) {
  const path = homeDir + '/.ethereum/' + network + (process.env.TEST ? '-test' : '');
  if (!fs.existsSync(path)) {
    return [];
  }
  return [_.trim('0x' + fs.readFileSync(path, { encoding: 'utf8' }))];
}

const ethers = require('ethers');
const testAccounts = [];
for (let i = 0; i < 20; i++) {
  testAccounts.push({
    privateKey: ethers.Wallet.createRandom()._signingKey().privateKey,
    balance: '1000000000000000000000000000',
  });
}

const config = {
  analytics: {
    enabled: false,
  },
  contractSizer: {
    alphaSort: false,
    runOnCompile: true,
  },
  defaultNetwork: 'hardhat',
  gasReporter: {
    currency: 'USD',
    enabled: !!process.env.REPORT_GAS,
  },
  mocha: {
    timeout: 70000,
  },
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: testAccounts,
      allowUnlimitedContractSize: true,
      gas: 12000000,
      blockGasLimit: 12000000
    },
    ganache: {
      url: 'http://127.0.0.1:8945',
      defaultBalanceEther: 1e9,
      hardfork: 'muirGlacier',
    },
    mainnet: {
      url: 'https://eth.llamarpc.com',
      accounts: getAccounts('mainnet'),
      gasPrice: 16 * 10 ** 9,
      gasMultiplier: 1.2,
      timeout: 2000000,
    },
    gnosis: {
      // url: 'https://rpc.gnosischain.com',
      url: 'https://gnosis.publicnode.com',
      accounts: getAccounts('mainnet'),
      timeout: 2000000,
      maxPriorityFeePerGas: 1e9,
    },
    bnb: {
      url: 'https://1rpc.io/bnb',
      accounts: getAccounts('bnb'),
      gasPrice: 5 * 10 ** 9,
      gasMultiplier: 1.2,
      timeout: 2000000,
    },
    arbitrumOne: {
      url: 'https://arb-mainnet.g.alchemy.com/v2/tQFmS38OvgHiqYEqyeheRkyGPGdkBsAc',
      accounts: getAccounts('mainnet'),
      timeout: 2000000,
    },
    base: {
      url: 'https://base.meowrpc.com',
      accounts: getAccounts('mainnet'),
      timeout: 2000000,
    },
    alchemy: {
      url: 'https://eth-mainnet.alchemyapi.io/v2/YnM1ROVXRY7BGojJNg9DUlJriNqfYyr9',
      accounts: [],
      gasPrice: 100 * 10 ** 9,
      gasMultiplier: 1.2,
      timeout: 2000000,
    },
    mainnetfork: {
      url: 'http://127.0.0.1:8545/',
      // accounts: getAccounts('mainnet'),
      // gasPrice: 100 * 10 ** 9,
      // gasMultiplier: 2,
      timeout: 2000000,
    },
    local: {
      url: 'http://127.0.0.1:8545',
    },
    kovan: {
      url: 'https://kovan-eth.compound.finance',
      accounts: getAccounts('kovan'),
      gasPrice: 1000000000,
      gasMultiplier: 2,
    },
    coverage: {
      url: 'http://127.0.0.1:8555',
    },
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    coverage: './coverage',
    coverageJson: './coverage.json',
    root: './',
    sources: './contracts',
    tests: './test',
  },
  solidity: {
    settings: {
      optimizer: {
        enabled: !!process.env.ETHERSCAN_KEY || process.env.COMPILE_TARGET === 'release',
        runs: 2,
      },
    },
    version: '0.8.7',
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  etherscan: {
    apiKey: {
      sepolia: 'INAGAAXXXE2GCP41VCSGFXH6V1XB3ET1JH',
      gnosis: 'C3T8FPADMAIJU7JY79R1HJM2NQVV1W4GDY',
      xdai: 'C3T8FPADMAIJU7JY79R1HJM2NQVV1W4GDY',
      mainnet: 'GZZTYX65FNXUPIZVABYWY76FDPDHAF3GAA',
      goerli: 'GZZTYX65FNXUPIZVABYWY76FDPDHAF3GAA',
      arbitrumOne: 'NJJGJQW63YE1435MHVVCIZPDUKRNKDC1AC',
      polygon: '9KFX8DRQRVC22RMC6N3FFCTQ244NS1Y4QZ',
      base: 'E1K37MI7KAXFGS6K2NBV94PD95XQWNH5M6'
    },
    customChains: [
      {
        network: 'linea',
        chainId: 59144,
        urls: {
          apiURL: 'https://api.lineascan.build',
          browserURL: 'https://lineascan.build'
        }
      },
      // {
      //   network: 'base',
      //   chainId: 8453,
      //   urls: {
      //     apiURL: 'https://api.basescan.org',
      //     browserURL: 'https://basescan.org'
      //   }
      // }
    ]
  }
};

module.exports = config;
