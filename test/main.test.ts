import { expect } from "chai";
import { Wallet, Provider, Contract } from "zksync-web3";
import * as hre from "hardhat";
import * as ethers from "ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { zkSyncNetwork } from "../hardhat.config";

const RICH_WALLET_PK_1 = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
const RICH_WALLET_PK_2 = "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3";

describe("TutorialSubmission", function () {
  let tutorialContract: Contract;
  let ownerWallet: Wallet;
  let userWallet: Wallet;

  before(async function () {
    // deploy the contract
    const provider = new Provider(zkSyncNetwork.url);
    ownerWallet = new Wallet(RICH_WALLET_PK_1, provider);
    userWallet = new Wallet(RICH_WALLET_PK_2, provider);
    const deployer = new Deployer(hre, ownerWallet);
    const artifact = await deployer.loadArtifact("TutorialSubmission");
    tutorialContract = await deployer.deploy(artifact, []);
  });

  it("Should get default empty array of submissions", async function () {
    let expected: any = [];
    const first = await tutorialContract.viewSubmissions();
    expect(first).to.deep.equal(expected);
  });

  it("Should have user create new submission, add it and return new array", async function () {
    const submission = {
      poapNftId: 1,
      deployedTestnetAddress: "0x0000000000",
      tutorialName: "Tutorial 1",
    };
    const userTutorialContract = new Contract(tutorialContract.address, tutorialContract.interface, userWallet);
    const addSubmissionTx = await userTutorialContract.submitTutorial(submission.poapNftId, submission.deployedTestnetAddress, submission.tutorialName);
    await addSubmissionTx.wait();
    let expected = [{ ...submission, status: "PENDING" }];
    const secondRaw = await tutorialContract.viewSubmissions();
    const second = secondRaw.map(convertToSubmissionObject);
    expect(second).to.deep.equal(expected);
  });

  it("Should update existing submission and return new array", async function () {
    const submission = {
      poapNftId: 1,
      deployedTestnetAddress: "0x0000000000",
      tutorialName: "Tutorial 1",
      status: "APPROVED",
    };
    const setStatusTx = await tutorialContract.updateSubmissionStatus(submission.poapNftId, submission.tutorialName, submission.status);
    // wait until the transaction is mined
    await setStatusTx.wait();
    let expected = [{ ...submission }];
    const secondRaw = await tutorialContract.viewSubmissions();
    const second = secondRaw.map(convertToSubmissionObject);
    expect(second).to.deep.equal(expected);
  });

  it("Should fail when user tries to update a submission", async function () {
    const submission = {
      poapNftId: 1,
      deployedTestnetAddress: "0x0000000000",
      tutorialName: "Tutorial 1",
      status: "APPROVED",
    };
    const userTutorialContract = new Contract(tutorialContract.address, tutorialContract.interface, userWallet);
    try {
      const setStatusTx = await userTutorialContract.updateSubmissionStatus(submission.poapNftId, submission.tutorialName, submission.status);
      await setStatusTx.wait();
      expect.fail("Expected updateSubmissionStatus to revert, but it didn't");
    } catch (error) {
      expect(error.message).to.include("execution reverted: Not authorized to call this function");
    }
  });

  it("Should fail when user tries to add a submission with the same poapNftId and tutorialName", async function () {
    const submission = {
      poapNftId: 1,
      deployedTestnetAddress: "0x0000000000",
      tutorialName: "Tutorial 1",
    };
    const userTutorialContract = new Contract(tutorialContract.address, tutorialContract.interface, userWallet);
    try {
      const addSubmissionTx = await userTutorialContract.submitTutorial(submission.poapNftId, submission.deployedTestnetAddress, submission.tutorialName);
      await addSubmissionTx.wait();
      expect.fail("Expected submitTutorial to revert, but it didn't");
    } catch (error) {
      expect(error.message).to.include("execution reverted: Tutorial already submitted");
    }
  });
});

function convertToSubmissionObject(arr: any[]): any {
  return {
    poapNftId: arr[0].toNumber(), // Convert BigNumber to number
    deployedTestnetAddress: arr[1],
    tutorialName: arr[2],
    status: arr[3],
  };
}

describe("Payout", function () {
  let payoutContract: Contract;
  let poapNFTContract: Contract;
  let ownerWallet: Wallet;
  let userWallet: Wallet;

  before(async function () {
    // deploy the Payout contract
    const provider = new Provider(zkSyncNetwork.url);
    ownerWallet = new Wallet(RICH_WALLET_PK_1, provider);
    userWallet = new Wallet(RICH_WALLET_PK_2, provider);
    const deployer = new Deployer(hre, ownerWallet);

    // Deploy the PoapNFT contract first
    const poapNFTArtifact = await deployer.loadArtifact("PoapNFT");
    poapNFTContract = await deployer.deploy(poapNFTArtifact, []);

    // Deploy the Payout contract and pass the address of the PoapNFT contract
    const payoutArtifact = await deployer.loadArtifact("Payout");
    payoutContract = await deployer.deploy(payoutArtifact, [poapNFTContract.address]);

    // Mint a POAP NFT for the user
    const mintTx = await poapNFTContract.mint(userWallet.address);
    await mintTx.wait();

    // Transfer 1 ETH to payout contract
    const transferTx = await ownerWallet.sendTransaction({
      to: payoutContract.address,
      value: ethers.utils.parseEther("1"),
    });
    await transferTx.wait();
  });

  it("Should add a new tutorial category", async function () {
    const newCategory = "New Tutorial";
    const addCategoryTx = await payoutContract.addTutorialCategory(newCategory);
    await addCategoryTx.wait();
    const status = await payoutContract.tutorialStatuses(newCategory);
    expect(status).to.equal(1); // 1 represents Active in the enum
  });

  it("Should payout to the user if user owns the POAP NFT and the tutorial category is active", async function () {
    const category = "New Tutorial";
    const userBalanceBefore = await userWallet.getBalance();
    // get the POAP NFT ID
    const poapNftId = await poapNFTContract.tokenOfOwnerByIndex(userWallet.address, 0);
    const payoutTx = await payoutContract.payout(poapNftId, category);
    await payoutTx.wait();
    const userBalanceAfter = await userWallet.getBalance();
    expect(userBalanceAfter.gt(userBalanceBefore)).to.equal(true);
  });

  it("Should fail when paying out to the same address for the same tutorial name twice", async function () {
    const category = "New Tutorial";
    // try to payout again
    try {
      const poapNftId = await poapNFTContract.tokenOfOwnerByIndex(userWallet.address, 0);
      await payoutContract.payout(poapNftId, category);
      expect.fail("Expected payout to revert due to duplicate payout, but it didn't");
    } catch (error) {
      expect(error.message).to.include("execution reverted: Payout already made for this NFT ID and tutorial combination");
    }
  });

  it("Should fail when trying to payout with an unexisting tutorial category", async function () {
    const inactiveCategory = "Inactive Tutorial";
    try {
      const poapNftId = await poapNFTContract.tokenOfOwnerByIndex(userWallet.address, 0);
      const payoutTx = await payoutContract.payout(poapNftId, inactiveCategory);
      await payoutTx.wait();
      expect.fail("Expected payout to revert due to inactive tutorial category, but it didn't");
    } catch (error) {
      expect(error.message).to.include("execution reverted: Tutorial category not found or inactive");
    }
  });

  it("Should fail when trying to payout from a non-owner account", async function () {
    const category = "New Tutorial";
    try {
      const poapNftId = await poapNFTContract.tokenOfOwnerByIndex(userWallet.address, 0);
      await payoutContract.connect(userWallet).payout(poapNftId, category);
      expect.fail("Expected payout to revert due to non-owner account, but it didn't");
    } catch (error) {
      expect(error.message).to.include("execution reverted: Only the owner can call this function");
    }
  });

  it("Should remove a tutorial category", async function () {
    const categoryToRemove = "New Tutorial";
    const removeCategoryTx = await payoutContract.removeTutorialCategory(categoryToRemove);
    await removeCategoryTx.wait();
    const status = await payoutContract.tutorialStatuses(categoryToRemove);
    expect(status).to.equal(2); // 2 represents Inactive in the enum
  });

  it("Should fail when trying to remove a tutorial category from a non-owner account", async function () {
    const categoryToRemove = "New Tutorial";
    try {
      await payoutContract.connect(userWallet).removeTutorialCategory(categoryToRemove);
      expect.fail("Expected removeTutorialCategory to revert due to non-owner account, but it didn't");
    } catch (error) {
      expect(error.message).to.include("execution reverted: Only the owner can call this function");
    }
  });

  it("Should fail when trying to payout for a removed tutorial category", async function () {
    const category = "New Tutorial";
    try {
      const poapNftId = await poapNFTContract.tokenOfOwnerByIndex(userWallet.address, 0);
      await payoutContract.payout(poapNftId, category);
      expect.fail("Expected payout to revert due to removed tutorial category, but it didn't");
    } catch (error) {
      expect(error.message).to.include("execution reverted: Tutorial category not found or inactive");
    }
  });
});
