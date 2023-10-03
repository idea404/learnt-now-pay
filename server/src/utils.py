import json
from dataclasses import dataclass
from enum import Enum
from pathlib import Path


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

def get_abi_from_standard_json(standard_json: Path):
    with standard_json.open(mode="r") as json_f:
        return json.load(json_f)["abi"]
