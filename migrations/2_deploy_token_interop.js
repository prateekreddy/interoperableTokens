const fs = require("fs");
const SafeMath = artifacts.require("./SafeMath.sol");
const Token1 = artifacts.require("./Token1.sol");
const Token2 = artifacts.require("./Token2.sol");
const Interoperability = artifacts.require("./Interoperability.sol");

const config = require("../config.json");

module.exports = function(deployer) {
    return deployer.deploy(SafeMath).then(() => {
        deployer.link(SafeMath, Token1, Token2);
        return Promise.all([deployer.deploy(Token1, 10000000000, {
            from: config.owner
        }), deployer.deploy(Token2, 10000000000)], {
            from: config.owner
        });
    }).then(() => {
        deployer.link(Token1, Interoperability);
        deployer.link(Token2, Interoperability);
        return deployer.deploy(Interoperability, config.owner, Token1.address, Token2.address, config.conversionFactor).then(() => {
            config.token1Address = Token1.address;
            config.token2Address = Token2.address;
            config.interopAddress = Interoperability.address;
            return fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
                console.log(config)
                console.log("contracts deployed and config updated");
            })
        });
    })
};
