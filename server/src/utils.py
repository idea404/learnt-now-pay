import json
import os
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from dotenv import load_dotenv
import json

load_dotenv()


class Status(Enum):
    PENDING = "PENDING"
    INVALID = "INVALID"
    VALID = "VALID"
    PAID = "PAID"


@dataclass
class Submission:
    poap_nft_id: int
    deployed_contract_address: str
    tutorial_name: str
    status: str


def get_abi_from_contract_json(standard_json: Path):
    with standard_json.open(mode="r") as json_f:
        return json.load(json_f)["abi"]
    
def get_l2_rpc_url(network):
    if network == "test":
        return "http://127.0.0.1:8011"
    if network == "localnet":
        return "http://127.0.0.1:3050"
    if network == "testnet":
        return "https://zksync2-testnet.zksync.dev"
    raise NotImplementedError(f"Network {network} not yet supported")

def get_private_key(network):
    if network == "test":
        return "7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110"
    if network == "localnet":
        return "7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110"
    if network == "testnet":
        key = os.getenv("WALLET_PRIVATE_KEY_TESTNET")
        assert key, "WALLET_PRIVATE_KEY_TESTNET not found in environment variables"
        return key
    raise NotImplementedError(f"Network {network} not yet supported")

def get_contract_address(network, contract_name):
    with open("./deploy/vars.json", "r") as f:
        data = json.load(f)
    for contract in data[network]["deployed"]:
        if contract["name"] == contract_name:
            return contract["address"]
    raise ValueError(f"Contract {contract_name} not found on network {network}")
