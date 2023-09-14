import json
from pathlib import Path

from web3 import Web3
from web3.contract.contract import Contract

from zksync2.module.module_builder import ZkSyncBuilder

def get_abi_from_standard_json(standard_json: Path):
    with standard_json.open(mode="r") as json_f:
        return json.load(json_f)["abi"]

def get_contract_data(zk_web3: Web3, contract_json_path: Path, contract_address) -> list[tuple]:
    submissions_contract: Contract = zk_web3.eth.contract(address=contract_address, abi=get_abi_from_standard_json(contract_json_path))
    result: list[tuple] = submissions_contract.functions.viewSubmissions().call({})

    return result

if __name__ == "__main__":
    zk_web3 = ZkSyncBuilder.build("https://zksync2-testnet.zksync.dev")
    contract_json_path = Path.cwd().parent / "artifacts-zk" / "contracts" / "TutorialSubmission.sol" / "TutorialSubmission.json"
    tutorial_submissions_contract_address = zk_web3.to_checksum_address("0x7220a5759FE3AB031632C718bF51D735820889Ee")

    data = get_contract_data(zk_web3, contract_json_path, tutorial_submissions_contract_address)
    import pprint
    pprint.pprint(data)
