"""This module delegates actions, performs tests and realizes payouts."""
import os
import pathlib
import time

from actions import get_contract_data, call_payout_contract, change_submission_state
from tester import test_submission
from eth_account import Account
from eth_account.signers.local import LocalAccount
from structlog import get_logger
from utils import Submission, Status
from zksync2.module.module_builder import ZkSyncBuilder

log = get_logger(__name__)

class SubmissionsManager:
  def __init__(self) -> None:
    self._dir = pathlib.Path(__file__).parent.resolve()

    private_key = os.environ.get("PRIVATE_KEY")
    assert private_key is not None
    self.account: LocalAccount = Account.from_key(private_key)
    self.zkweb3 = ZkSyncBuilder.build("https://zksync2-testnet.zksync.dev")
    self.contract_json_path = self._dir.parent.parent / "artifacts-zk" / "contracts" / "TutorialSubmission.sol" / "TutorialSubmission.json"
    self.submissions_manager_contract = "0x7220a5759FE3AB031632C718bF51D735820889Ee"
    self.payout_contract_address = "0x..." # TODO: Add payout contract address here

  def get_submissions(self) -> list[Submission]:
    sumbissions_contract = self.zkweb3.to_checksum_address(self.submissions_manager_contract)
    data = get_contract_data(self.zkweb3, self.contract_json_path, sumbissions_contract)
    submissions = [Submission(*submission) for submission in data]
    return submissions
  
  def _update_submission_status(self, submission: Submission, new_status: str) -> None:
    tx_hash = change_submission_state(
        self.zkweb3,
        self.account,
        self.contract_json_path,
        self.submissions_manager_contract,
        submission.poap_nft_id,
        submission.tutorial_name,
        new_status
    )
    log.info(f"{submission} updated to status {new_status} with transaction hash {tx_hash}")
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
    submissions = self.get_submissions()
    testable_submissions = [submission for submission in submissions if submission.status == Status.PENDING.value]
    for submission in testable_submissions:
      log.info(f"Testing {submission}...")
      test_result = test_submission(submission, self.zkweb3, self.contract_json_path)
      new_submission_status = Status.VALID.value if test_result else Status.INVALID.value
      self.update_submission_status(submission, new_submission_status)

  def delegate_payout(self, submission: Submission) -> None:
    log.info(f"Delegating payout for {submission}...")
    call_payout_contract(
      self.zkweb3,
      self.account,
      self.contract_json_path,
      self.payout_contract_address,
      submission.poap_nft_id,
      submission.tutorial_name
    )

  def pay_valid_submissions(self) -> None:
    submissions = self.get_submissions()
    valid_submissions = [submission for submission in submissions if submission.status == Status.VALID.value]
    for submission in valid_submissions:
      try:
        self.delegate_payout(submission)
        self.update_submission_status(submission, Status.PAID.value)
      except Exception as e:
        log.error(f"Failed to send payout for {submission}: {e}")

  def run(self) -> None:
    self.test_pending_submissions()
    self.pay_valid_submissions()


if __name__ == "__main__":
  pass
