const { expect } = require("chai");
const { utils } = require("ethers");
const { network } = require("hardhat");

describe("Cig deployed-v2 defensive auction regression", function () {
  const peth = utils.parseEther;
  const EPOCH_BLOCKS = 10;
  const AUCTION_BLOCKS = 5;
  const CEO_PRICE = peth("50000");
  const MIN_TAX = peth("50");

  let ceo, buyer;
  let cig, nft;

  beforeEach(async function () {
    [ceo, buyer] = await ethers.getSigners();

    const Router = await ethers.getContractFactory("V2RouterMock");
    const router = await Router.deploy();
    await router.deployed();

    const PunkMock = await ethers.getContractFactory("PunkMock");
    const punks = await PunkMock.deploy(ceo.address);
    await punks.deployed();

    const NFT = await ethers.getContractFactory("NonFungibleCEO");
    nft = await NFT.deploy("ipfs://audit/");
    await nft.deployed();

    const Harness = await ethers.getContractFactory("CigAuditHarness");
    cig = await Harness.deploy(
      peth("5"),
      punks.address,
      EPOCH_BLOCKS,
      AUCTION_BLOCKS,
      CEO_PRICE,
      utils.formatBytes32String("audit"),
      nft.address,
      router.address,
      ethers.constants.AddressZero,
      0,
      ethers.constants.AddressZero
    );
    await cig.deployed();

    await nft.setCigToken(cig.address);
    await cig.mintForTest(buyer.address, peth("100000"));
    await cig.seedCEO(ceo.address, CEO_PRICE, MIN_TAX, 4513);
  });

  async function mineBlocks(count) {
    for (let i = 0; i < count; i++) {
      await network.provider.send("evm_mine");
    }
  }

  it("documents same-transaction default detection and auction-price calculation", async function () {
    // The minimum tax covers one 10-block epoch in this fixture.
    // Mine 10 blocks; the buyCEO transaction itself is the 11th elapsed block.
    await mineBlocks(EPOCH_BLOCKS);

    const expectedDefaultReward = peth("5");
    const expectedImmediatePrice = peth("40000");

    await expect(
      cig.connect(buyer).buyCEO(
        peth("50001"),
        peth("1000"),
        peth("1"),
        4513,
        utils.formatBytes32String("new ceo")
      )
    )
      .to.emit(cig, "CEODefaulted")
      .withArgs(buyer.address, expectedDefaultReward)
      .and.to.emit(cig, "RevenueBurned")
      .withArgs(buyer.address, expectedImmediatePrice);

    expect(await cig.The_CEO()).to.equal(buyer.address);
    expect(await cig.CEO_state()).to.equal(1);
    expect(await nft.ownerOf(0)).to.equal(buyer.address);
  });
});
