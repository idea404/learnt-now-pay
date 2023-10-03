"""This module contains functions that interact with the submissions manager contract on zkSync2 testnet."""
from pathlib import Path
from web3 import Web3
from eth_typing import ChecksumAddress
from eth_account.signers.local import LocalAccount
from utils import get_abi_from_standard_json

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