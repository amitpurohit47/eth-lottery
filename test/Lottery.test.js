const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require("../compile");

let accounts;
let lottery;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery Contract", () => {
  it("deploys a contract", () => {
    assert.ok(lottery.options.address);
  });

  it("allows one account to enter", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.002", "ether"),
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(players[0], accounts[0]);
    assert.equal(1, players.length);
  });

  it("allows multiple accounts to enter", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.002", "ether"),
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei("0.002", "ether"),
    });

    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei("0.002", "ether"),
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(players[0], accounts[0]);
    assert.equal(players[1], accounts[1]);
    assert.equal(players[2], accounts[2]);
    assert.equal(3, players.length);
  });

  it("requires minimum amount of ether to enter", async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: "0",
      });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("pickWinner called only by manager", async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1],
      });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("send money to winner and resets players array", async () => {
    // players enter
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });
    // get initial balance
    const initialBalance = await web3.eth.getBalance(accounts[0]);
    // manager picks winner
    await lottery.methods.pickWinner().send({
      from: accounts[0],
    });

    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });
    assert(difference > web3.utils.toWei("1.8", "ether"));
    assert.equal(0, players.length);
  });
});
