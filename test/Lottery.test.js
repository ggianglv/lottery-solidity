const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require("../compile");

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: "1000000" });
});

describe("lottery contract", () => {
  it("deploy a contract", () => {
    assert.ok(lottery.options.address);
  });

  it("Allow account enter", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether"),
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(players[0], accounts[0]);
    assert.equal(players.length, 1);
  });

  it("Allow multiple accounts enter", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether"),
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei("0.02", "ether"),
    });

    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei("0.02", "ether"),
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(players[0], accounts[0]);
    assert.equal(players[1], accounts[1]);
    assert.equal(players[2], accounts[2]);
    assert.equal(players.length, 3);
  });

  it("Not enter account less than 0.01 ether", async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: web3.utils.toWei("0.005", "ether"),
      });

      const players = await lottery.methods.getPlayers().call({
        from: accounts[0],
      });
      assert(false)
    } catch (e) {
      assert.ok(e)
    }
  });

  it("Test pick winner function call with non admin", async () => {
    try {
      await lottery.methods.pickWinner().call({
        from: accounts[1],
      });
      assert(false)
    } catch (e) {
      assert.ok(e)
    }
  });

  it("Send money to winner and reset player array", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });
    const initialBlance = await web3.eth.getBalance(accounts[0]);
    await lottery.methods.pickWinner().send({ from: accounts[0] });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const diff = finalBalance - initialBlance

    assert(diff > web3.utils.toWei('1.8', 'ether'))
  });
});
