"""This module contains functions that interact with the submissions manager contract on zkSync2 testnet."""
from pathlib import Path
from web3 import Web3
from eth_account.signers.local import LocalAccount
from utils import get_abi_from_standard_json


def get_contract_data(
    zk_web3: Web3, 
    contract_json_path: Path, 
    contract_address: str
) -> list[tuple]:
    contract_address = zk_web3.to_checksum_address(contract_address)
    submissions_contract: Contract = zk_web3.zksync.contract(address=contract_address, abi=get_abi_from_standard_json(contract_json_path))  # type: ignore
    result: list[tuple] = submissions_contract.functions.viewSubmissions().call({})
    return result

def call_payout_contract(
    zk_web3: Web3,
    account: LocalAccount,
    contract_json_path: Path,
    payout_contract_address: str,
    poap_nft_id: int,
    tutorial_name: str,
) -> str:
    payout_contract_address = zk_web3.to_checksum_address(payout_contract_address)
    payout_contract: Contract = zk_web3.zksync.contract(address=payout_contract_address, abi=get_abi_from_standard_json(contract_json_path))  # type: ignore
    tx = payout_contract.functions.payout(
        poap_nft_id, 
        tutorial_name,
    ).build_transaction(
        {
            "from": account.address,
            "nonce": zk_web3.zksync.get_transaction_count(account.address), # type: ignore
            "gasPrice": zk_web3.zksync.gas_price, # type: ignore
        }
    )
    signed_tx = account.sign_transaction(tx)
    tx_hash = zk_web3.zksync.send_raw_transaction(signed_tx.rawTransaction) # type: ignore
    return tx_hash.hex()

def change_submission_state(
    zk_web3: Web3,
    account: LocalAccount,
    contract_json_path: Path,
    submissions_contract_address: str,
    poap_nft_id: int,
    tutorial_name: str,
    new_status: str,
) -> str:
    submissions_contract_address = zk_web3.to_checksum_address(submissions_contract_address)
    submissions_contract: Contract = zk_web3.zksync.contract(address=submissions_contract_address, abi=get_abi_from_standard_json(contract_json_path))  # type: ignore
    tx = submissions_contract.functions.updateSubmissionStatus(
        poap_nft_id, 
        tutorial_name, 
        new_status
    ).build_transaction(
        {
            "from": account.address,
            "nonce": zk_web3.zksync.get_transaction_count(account.address), # type: ignore
            "gasPrice": zk_web3.zksync.gas_price, # type: ignore
        }
    )
    signed_tx = account.sign_transaction(tx)
    tx_hash = zk_web3.zksync.send_raw_transaction(signed_tx.rawTransaction) # type: ignore
    return tx_hash.hex()
