const Web3 = require('web3');
const config = require('../config.json');
const token1MetaData = require("../build/contracts/Token1.json");
const token2MetaData = require("../build/contracts/Token2.json");
const interopMetaData = require("../build/contracts/Interoperability.json");

const web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${config.host}:${config.port}`));

const token1 = new web3.eth.Contract(token1MetaData.abi, config.token1Address);
const token2 = new web3.eth.Contract(token2MetaData.abi, config.token2Address);
const interop = new web3.eth.Contract(interopMetaData.abi, config.interopAddress);

const initialUser1Balance = 1000;
const initialInteropToken2Balance = 10000;
const tokenInteropTransferValue = 200;

function sendToken1(toAddress, tokenAmount) {
    return token1.methods.transfer(toAddress, tokenAmount).send({
        from: config.owner
    });
}

function sendToken2(toAddress, tokenAmount) {
    return token2.methods.transfer(toAddress, tokenAmount).send({
        from: config.owner
    });
}

function checkToken1Balance(address) {
    return token1.methods.balanceOf(address).call();
}

function checkToken2Balance(address) {
    return token2.methods.balanceOf(address).call();
}

function approveToken1(user, spender, tokenAmount) {
    return token1.methods.approve(spender, tokenAmount).send({
        from: user
    });
}

async function checkResults() {
    const user1Token1 = await checkToken1Balance(config.user1);
    const user2Token2 = await checkToken2Balance(config.user2);
    const interopToken1 = await checkToken1Balance(config.interopAddress);
    const interopToken2 = await checkToken2Balance(config.interopAddress);
    console.log("user1Token1: "+ user1Token1)
    console.log("user2Token2: "+ user2Token2)
    console.log("interopToken1: "+ interopToken1)
    console.log("interopToken2: "+ interopToken2)
}

sendToken1(config.user1, initialUser1Balance).then(() => {
    sendToken2(config.interopAddress, initialInteropToken2Balance).then(() => {
        approveToken1(config.user1, config.interopAddress, tokenInteropTransferValue).then(() => {
            console.log("approved Tokens")
            interop.methods.interoperableTransfer(config.user2, tokenInteropTransferValue).send({
                from: config.user1,
                gas: 99999999
            })
        })
    })
});


setTimeout(checkResults, 3000);