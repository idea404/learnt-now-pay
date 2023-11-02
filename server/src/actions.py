"""This module contains functions that interact with the submissions manager contract on zkSync2 testnet."""
from pathlib import Path
from web3 import Web3
from eth_account.signers.local import LocalAccount
from utils import get_abi_from_contract_json


def get_submitted_submissions_raw(
    zk_web3: Web3, 
    contract_json_path: Path, 
    contract_address: str
) -> list[tuple]:
    contract_address = zk_web3.to_checksum_address(contract_address)
    submissions_contract: Contract = zk_web3.zksync.contract(address=contract_address, abi=get_abi_from_contract_json(contract_json_path))  # type: ignore
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
    payout_contract: Contract = zk_web3.zksync.contract(address=payout_contract_address, abi=get_abi_from_contract_json(contract_json_path))  # type: ignore
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
    submissions_contract: Contract = zk_web3.zksync.contract(address=submissions_contract_address, abi=get_abi_from_contract_json(contract_json_path))  # type: ignore
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


if __name__ == "__main__":
    # config
    from zksync2.module.module_builder import ZkSyncBuilder
    l2_rpc_url = "https://zksync2-testnet.zksync.dev"
    zkw3 = ZkSyncBuilder.build(l2_rpc_url)
    import pathlib
    this_dir = pathlib.Path(__file__).parent.resolve()
    submissions_contract_json_path = this_dir.parent.parent / "artifacts-zk" / "contracts" / "TutorialSubmission.sol" / "TutorialSubmission.json"
    submissions_contract_address = "0x28f959283F7Fc0a9c56e9Dc70e9d77dE99442603"
    from eth_account import Account
    from utils import get_private_key
    private_key = get_private_key(l2_rpc_url)
    account: LocalAccount = Account.from_key(private_key)

    # print submissions on submissions contract
    res = get_submitted_submissions_raw(zkw3, submissions_contract_json_path, submissions_contract_address)
    import pprint
    pprint.pprint(res)

    # call payout contract
    # payout_contract_json_path = this_dir.parent.parent / "artifacts-zk" / "contracts" / "Payout.sol" / "Payout.json"
    # payout_contract_address = "0xc9360C3De34f4E24b16D0db01BbB87F5a7Ecbc66"
    # poap_nft_id = 1
    # tutorial_name = "PoapMultiplier"
    # try:
    #     tx_hash = call_payout_contract(
    #         zkw3,
    #         account,
    #         payout_contract_json_path,
    #         payout_contract_address,
    #         poap_nft_id,
    #         tutorial_name,
    #     )
    #     print(tx_hash)
    # except Exception as e:
    #     print(e)
