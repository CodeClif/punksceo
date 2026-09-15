require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: {
    version: "0.8.11",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      }
    }
  },
  mocha: {
    timeout: 30000
  },
  defaultNetwork: "hardhat"
};
