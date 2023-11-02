"""Runs the SubmissionsManager."""


if __name__ == "__main__":
    from tester import SubmissionsTester
    from utils import get_l2_rpc_url, get_contract_address
    import os

    network = os.getenv("NODE_ENV") or "test"
    rpc_url = get_l2_rpc_url(network)

    manager = SubmissionsTester(
        submissions_manager_contract=get_contract_address(network, "TutorialSubmission"),
        payout_contract_address=get_contract_address(network, "Payout"),
        network=network
    )
    manager.run()
