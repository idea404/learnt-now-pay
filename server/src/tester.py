"""This module contains the tester for the deployed tutorial contract on zkSync2 testnet."""
from utils import Submission
from web3 import Web3
from pathlib import Path
from utils import get_abi_from_contract_json
from structlog import get_logger

log = get_logger(__name__)


def test_submission(submission: Submission, zk_web3: Web3, contract_json_path: Path) -> bool:
  contract = zk_web3.zksync.contract(address=submission.deployed_contract_address, abi=get_abi_from_contract_json(contract_json_path)) # type: ignore
  result = contract.functions.getValue(1).call()
  if result == submission.poap_nft_id:
    log.info(f"Submission valid")
    return True
  log.info(f"Submission invalid")
  return False


if __name__ == "__main__":
  submission = Submission(42, "0xEE6050F37B19661F431Ae9B9eA1a25a79c1a7E8B", "PoapMultiplier", "PENDING")
  from zksync2.module.module_builder import ZkSyncBuilder
  zkw3 = ZkSyncBuilder.build("https://zksync2-testnet.zksync.dev")
  import pathlib
  this_dir = pathlib.Path(__file__).parent.resolve()
  contract_json_path = this_dir.parent.parent / "artifacts-zk" / "contracts" / "PoapMultiplier.sol" / "PoapMultiplier.json"
  res = test_submission(submission, zkw3, contract_json_path)
  print(res)
