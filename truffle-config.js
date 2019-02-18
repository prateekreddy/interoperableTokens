var WalletProvider = require("truffle-hdwallet-provider");

var wallet = require('ethereumjs-wallet').fromPrivateKey(new Buffer("4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d", 'hex'));
var mnemonic = "myth like bonus scare over problem client lizard pioneer submit female collect";
module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    ropsten: {
      provider: () => { return new WalletProvider(mnemonic,"https://ropsten.infura.io");},
      gas: "4600000",
      network_id: "*"
    }
  }
};