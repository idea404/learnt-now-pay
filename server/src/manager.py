"""This module delegates actions, performs tests and realizes payouts."""
import os
import pathlib

from actions import get_contract_data
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

  def get_submissions(self) -> list[Submission]:
    sumbissions_contract = self.zkweb3.to_checksum_address(self.submissions_manager_contract)
    data = get_contract_data(self.zkweb3, self.contract_json_path, sumbissions_contract)
    submissions = [Submission(*submission) for submission in data]
    return submissions
  
  def update_submission_status(self, submission: Submission, new_status: str) -> None:
    raise NotImplementedError

  def test_pending_submissions(self) -> None:
    submissions = self.get_submissions()
    testable_submissions = [submission for submission in submissions if submission.status == Status.PENDING.value]
    for submission in testable_submissions:
      log.info(f"Testing submission with ID {submission.poap_nft_id}...")
      test_result = test_submission(submission, self.zkweb3, self.contract_json_path)
      new_submission_status = Status.VALID.value if test_result else Status.INVALID.value
      self.update_submission_status(submission, new_submission_status)

  def get_payout_destination_address(self, poap_nft_id: int) -> str:
    raise NotImplementedError
  
  def send_payout(self, submission: Submission, payout_address: str) -> None:
    raise NotImplementedError

  def pay_valid_submissions(self) -> None:
    submissions = self.get_submissions()
    valid_submissions = [submission for submission in submissions if submission.status == Status.VALID.value]
    for submission in valid_submissions:
      log.info(f"Sending payout for POAP NFT ID {submission.poap_nft_id}...")
      payout_address = self.get_payout_destination_address(submission.poap_nft_id)
      self.send_payout(submission, payout_address)
      self.update_submission_status(submission, Status.PAID.value)

  def run(self) -> None:
    self.test_pending_submissions()
    self.pay_valid_submissions()


if __name__ == "__main__":
  pass