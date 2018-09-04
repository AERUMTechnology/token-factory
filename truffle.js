require('dotenv').config();

const WalletProvider = require("truffle-wallet-provider");
const Wallet = require('ethereumjs-wallet');


module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 7545,
            network_id: "*" // Match any network id
        },
        aerum: {
            provider: function () {
                const aerumPrivateKey = new Buffer(process.env["AERUM_PRIVATE_KEY"], "hex");
                const aerumWallet = Wallet.fromPrivateKey(aerumPrivateKey);
                const aerumProvider = new WalletProvider(aerumWallet, "http://52.51.85.249:8545/");
                return aerumProvider;
            },
            network_id: '418313827693',
            gas: 2900000
        }
    }
};