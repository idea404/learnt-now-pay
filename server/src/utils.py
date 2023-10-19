import json
import os
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from dotenv import load_dotenv

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

def get_private_key(rpc_url):
  if rpc_url == "https://zksync2-testnet.zksync.dev":
    private_key = os.getenv("WALLET_PRIVATE_KEY_TESTNET")
  elif rpc_url == "http://127.0.0.1:8011":
    private_key = os.getenv("WALLET_PRIVATE_KEY_LOCALNET")
  else:
    private_key =   os.getenv("PRIVATE_KEY")
  assert private_key is not None, "PRIVATE_KEY environment variable not set"
  return private_key
