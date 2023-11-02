"""This module delegates actions, performs tests and realizes payouts."""
import pathlib
import time

from actions import (
  call_payout_contract, 
  change_submission_state,
  get_submitted_submissions_raw
)
from eth_account import Account
from eth_account.signers.local import LocalAccount
from structlog import get_logger
from tester import test_submission
from utils import Status, Submission, get_private_key
from zksync2.module.module_builder import ZkSyncBuilder

log = get_logger(__name__)

class SubmissionsManager:
  def __init__(
      self, 
      submissions_manager_contract: str, 
      payout_contract_address: str, 
      l2_rpc_url: str = "https://zksync2-testnet.zksync.dev"
  ) -> None:
    log.info(f"Initializing SubmissionsManager with submissions manager contract {submissions_manager_contract} and payout contract address {payout_contract_address} on {l2_rpc_url}...")
    self._dir = pathlib.Path(__file__).parent.resolve()

    private_key = get_private_key(l2_rpc_url)
    self.account: LocalAccount = Account.from_key(private_key)
    self.zkweb3 = ZkSyncBuilder.build(l2_rpc_url)
    self.submissions_contract_json_path = self._dir.parent.parent / "artifacts-zk" / "contracts" / "TutorialSubmission.sol" / "TutorialSubmission.json"
    self.submitted_contract_json_path = self._dir.parent.parent / "artifacts-zk" / "contracts" / "PoapMultiplier.sol" / "PoapMultiplier.json"
    self.payout_contract_json_path = self._dir.parent.parent / "artifacts-zk" / "contracts" / "Payout.sol" / "Payout.json"
    self.submissions_manager_contract = submissions_manager_contract
    self.payout_contract_address = payout_contract_address

  def get_submissions(self) -> list[Submission]:
    sumbissions_contract = self.zkweb3.to_checksum_address(self.submissions_manager_contract)
    data = get_submitted_submissions_raw(self.zkweb3, self.submissions_contract_json_path, sumbissions_contract)
    submissions = [Submission(*submission) for submission in data]
    return submissions
  
  def _update_submission_status(self, submission: Submission, new_status: str) -> None:
    tx_hash = change_submission_state(
        self.zkweb3,
        self.account,
        self.submissions_contract_json_path,
        self.submissions_manager_contract,
        submission.poap_nft_id,
        submission.tutorial_name,
        new_status
    )
    log.info(f"{submission} updated to status {new_status} with transaction hash {tx_hash}")
    time.sleep(5)
    submissions = self.get_submissions()
    matching_submission = [submission for submission in submissions if submission.poap_nft_id == submission.poap_nft_id and submission.tutorial_name == submission.tutorial_name][0]
    assert matching_submission.status == new_status, f"Submission with ID {submission.poap_nft_id} not updated to status {new_status}"
  
  def update_submission_status(self, submission: Submission, new_status: str) -> None:
    log.info(f"Updating {submission} to status {new_status}...")
    try:
      self._update_submission_status(submission, new_status)
    except AssertionError as e:
      log.error(f"Failed to update {submission} to status {new_status}: {e}")
      log.info(f"Retrying...")
      time.sleep(5)
      try:
        self._update_submission_status(submission, new_status)
      except Exception as e:
        log.error(f"Failed to update {submission} to status {new_status}: {e}")
    except Exception as e:
      log.error(f"Failed to update {submission} to status {new_status}: {e}")

  def test_pending_submissions(self) -> None:
    log.info(f"Testing pending submissions...")
    submissions = self.get_submissions()
    log.debug(f"Found {len(submissions)} submissions...")
    testable_submissions = [submission for submission in submissions if submission.status == Status.PENDING.value]
    log.info(f"Found {len(testable_submissions)} testable submissions...")
    for submission in testable_submissions:
      log.info(f"Testing {submission}...")
      test_result = test_submission(submission, self.zkweb3, self.submitted_contract_json_path)
      new_submission_status = Status.VALID.value if test_result else Status.INVALID.value
      self.update_submission_status(submission, new_submission_status)

  def delegate_payout(self, submission: Submission) -> None:
    log.info(f"Delegating payout for {submission}...")
    hex_of_tx = call_payout_contract(
      self.zkweb3,
      self.account,
      self.payout_contract_json_path,
      self.payout_contract_address,
      submission.poap_nft_id,
      submission.tutorial_name,
    )
    log.info(f"Delegated payout for {submission} with transaction hash {hex_of_tx}")

  def pay_valid_submissions(self) -> None:
    log.info(f"Paying valid submissions...")
    submissions = self.get_submissions()
    valid_submissions = [submission for submission in submissions if submission.status == Status.VALID.value]
    log.info(f"Found {len(valid_submissions)} payable valid submissions...")
    for submission in valid_submissions:
      try:
        self.delegate_payout(submission)
        self.update_submission_status(submission, Status.PAID.value)
      except Exception as e:
        log.error(f"Failed to send payout for {submission}: {e}")

  def run(self) -> None:
    self.test_pending_submissions()
    # self.pay_valid_submissions()


if __name__ == "__main__":
  tutorials_scanner = SubmissionsManager(
    submissions_manager_contract="0x28f959283F7Fc0a9c56e9Dc70e9d77dE99442603", # TODO: Add submissions manager contract address here
    payout_contract_address="0xc9360C3De34f4E24b16D0db01BbB87F5a7Ecbc66", # TODO: Add payout contract address here
    # l2_rpc_url="http://127.0.0.1:8011"
  )
  tutorials_scanner.run()
