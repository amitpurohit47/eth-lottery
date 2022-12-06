const Web3 = require("web3");
const HDWalletProvider = require("truffle-hdwallet-provider");
const { interface, bytecode } = require("./compile");
const dotenv = require("dotenv");
dotenv.config();

const provider = new HDWalletProvider(
  process.env.ACCOUNT_MNEMONIC,
  process.env.INFURA_ENDPOINT
);

const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log("Attempting to deploy contract from account ", accounts[0]);

  const res = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: "0x" + bytecode })
    .send({ from: accounts[0] });

  console.log("Contract deployed at address ", res.options.address);
};

deploy();
