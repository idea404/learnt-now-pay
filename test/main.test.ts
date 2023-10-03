import { expect } from "chai";
import { Wallet, Provider, Contract } from "zksync-web3";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { zkSyncTestnet } from "../hardhat.config";

const RICH_WALLET_PK_1 = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
const RICH_WALLET_PK_2 = "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3";

describe("TutorialSubmission", function () {
  let tutorialContract: Contract;
  let ownerWallet: Wallet;
  let userWallet: Wallet;

  before(async function () {
    // deploy the contract
    const provider = new Provider(zkSyncTestnet.url);
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
