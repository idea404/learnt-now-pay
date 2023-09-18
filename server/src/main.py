import json
from pathlib import Path

from eth_typing import ChecksumAddress
from eth_account import Account
from eth_account.signers.local import LocalAccount
from web3 import Web3
from web3.contract.contract import Contract
from zksync2.module.module_builder import ZkSyncBuilder

def get_abi_from_standard_json(standard_json: Path):
    with standard_json.open(mode="r") as json_f:
        return json.load(json_f)["abi"]

def get_contract_data(zk_web3: Web3, contract_json_path: Path, contract_address: ChecksumAddress) -> list[tuple]:
    submissions_contract: Contract = zk_web3.zksync.contract(address=contract_address, abi=get_abi_from_standard_json(contract_json_path)) # type: ignore
    result: list[tuple] = submissions_contract.functions.viewSubmissions().call({})
    return result

def change_submission_state(
        zk_web3: Web3, 
        account: LocalAccount,
        contract_json_path: Path, 
        submissions_contract_address: ChecksumAddress, 
        poap_nft_id: int, 
        tutorial_name: str, 
        new_status: str
    ):
    submissions_contract: Contract = zk_web3.zksync.contract(address=submissions_contract_address, abi=get_abi_from_standard_json(contract_json_path)) # type: ignore

    tx = submissions_contract.functions.updateSubmissionStatus(poap_nft_id, tutorial_name, new_status).build_transaction({
        "from": account.address,
        "nonce": zk_web3.eth.get_transaction_count(account.address),
        "gasPrice": zk_web3.eth.gas_price,
    })

    signed_tx = account.sign_transaction(tx)
    tx_hash = zk_web3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return tx_hash

if __name__ == "__main__":
    zk_web3 = ZkSyncBuilder.build("https://zksync2-testnet.zksync.dev")
    contract_json_path = Path.cwd().parent / "artifacts-zk" / "contracts" / "TutorialSubmission.sol" / "TutorialSubmission.json"
    tutorial_submissions_contract_address = zk_web3.to_checksum_address("0x7220a5759FE3AB031632C718bF51D735820889Ee")

    data = get_contract_data(zk_web3, contract_json_path, tutorial_submissions_contract_address)
    import pprint
    pprint.pprint(data)

    print("\n\nChanging state of submission with ID 1 to 'COMPLETE'...\n\n")

    # Example usage of change_submission_state
    # Change the state of the submission with ID 1 to 'COMPLETE'
    import os
    private_key = os.environ.get("PRIVATE_KEY")
    assert private_key is not None
    account: LocalAccount = Account.from_key(private_key)
    print(account.address)
    tx_hash = change_submission_state(zk_web3, account, contract_json_path, tutorial_submissions_contract_address, 1, "Tutorial 2",'COMPLETE')
    print(tx_hash.hex())

    print("\n\nChecking new state of submission with ID 1...\n\n")

    data = get_contract_data(zk_web3, contract_json_path, tutorial_submissions_contract_address)
    import pprint
    pprint.pprint(data)
