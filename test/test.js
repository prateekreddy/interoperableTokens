const Web3 = require('web3');
const config = require('../config.json');
const token1MetaData = require("../build/contracts/Token1.json");
const token2MetaData = require("../build/contracts/Token2.json");
const interopMetaData = require("../build/contracts/Interoperability.json");
const EthereumTx = require('ethereumjs-tx')
console.log(`connecting to ${config.host}`);
const web3 = new Web3(new Web3.providers.WebsocketProvider(`${config.host}`));

const token1 = new web3.eth.Contract(token1MetaData.abi, config.token1Address);
const token2 = new web3.eth.Contract(token2MetaData.abi, config.token2Address);
const interop = new web3.eth.Contract(interopMetaData.abi, config.interopAddress);

const initialUser1Balance = 1000;
const initialInteropToken2Balance = 10000;
const tokenInteropTransferValue = 200;

async function createRawTx(userPrivKey, userAddress, contractAddress, callData) {
    const privateKey = Buffer.from(userPrivKey.replace('0x', ''), 'hex');
    console.log("getting tx count for "+userAddress);
    let nonce = await web3.eth.getTransactionCount(userAddress);
    console.log(web3.utils.toHex(nonce));
    const txParams = {
        nonce: web3.utils.toHex(nonce),
        gasPrice: '0x09', 
        gasLimit: '0x271000',
        to: contractAddress, 
        value: '0x00', 
        data: callData,
        // EIP 155 chainId - mainnet: 1, ropsten: 3
        chainId: 3
    }

    const tx = new EthereumTx(txParams)
    tx.sign(privateKey)
    const serializedTx = tx.serialize()
    console.log(serializedTx);
    return serializedTx;
}

async function sendToken1(toAddress, tokenAmount) {
    // return token1.methods.transfer(toAddress, tokenAmount).send({
    //     from: config.owner
    // });
    const callData = token1.methods.transfer(toAddress, tokenAmount).encodeABI();
    const rawTx = await createRawTx(config.ownerPrivKey, config.owner, config.token1Address, callData);

    console.log("0x"+rawTx.toString('hex'));
    console.log("sending token1 to some address");
    return web3.eth.sendSignedTransaction("0x"+rawTx.toString('hex'));
}

async function sendToken2(toAddress, tokenAmount) {
    const callData = token2.methods.transfer(toAddress, tokenAmount).encodeABI();
    const rawTx = await createRawTx(config.ownerPrivKey, config.owner, config.token2Address, callData);

    console.log("0x"+rawTx.toString('hex'));
    return web3.eth.sendSignedTransaction("0x"+rawTx.toString('hex'));
}

function checkToken1Balance(address) {
    return token1.methods.balanceOf(address).call();
}

function checkToken2Balance(address) {
    return token2.methods.balanceOf(address).call();
}

async function approveToken1(user, userPrivKey, spender, tokenAmount) {
    const callData = token1.methods.approve(spender, tokenAmount).encodeABI();
    const rawTx = await createRawTx(userPrivKey, user, config.token1Address, callData);

    console.log("0x"+rawTx.toString('hex'));
    return web3.eth.sendSignedTransaction("0x"+rawTx.toString('hex'));
    // return token1.methods.approve(spender, tokenAmount).send({
    //     from: user
    // });
}

async function interoperableTransfer(user, userPrivKey, toAddress, value) {
    const callData = interop.methods.interoperableTransfer(toAddress, value).encodeABI();
    const rawTx = await createRawTx(userPrivKey, user, config.interopAddress, callData);

    console.log("0x"+rawTx.toString('hex'));
    return web3.eth.sendSignedTransaction("0x"+rawTx.toString('hex'));
}

async function withdraw(withdrawer, withdrawerPrivKey, toAddress, value) {
    const callData = interop.methods.withdrawTST2(toAddress, value).encodeABI();
    const rawTx = await createRawTx(withdrawerPrivKey, withdrawer, config.interopAddress, callData);

    console.log("0x"+rawTx.toString('hex'));
    return web3.eth.sendSignedTransaction("0x"+rawTx.toString('hex'));
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
    return;
}

sendToken1(config.user1, initialUser1Balance).then(() => {
    console.log("sent tokens to user 1");
    sendToken2(config.interopAddress, initialInteropToken2Balance).then(() => {
        console.log("Added liquidity to interoperability contract");
        approveToken1(config.user1, config.user1PrivKey, config.interopAddress, tokenInteropTransferValue).then(() => {
            console.log("approved Tokens")
            return interoperableTransfer(config.user1, config.user1PrivKey, config.user2, tokenInteropTransferValue)
            // interop.methods.interoperableTransfer(config.user2, tokenInteropTransferValue).send({
            //     from: config.user1,
            //     gas: 99999999
            // }).then(console.log);
        }).then(() => {
            checkResults().then(() => {
                withdraw(config.owner, config.ownerPrivKey, config.owner, 200).then(console.log);
            })
        });
    })
});