pragma solidity ^0.4.17;

// Contract for creating campaigns, offloading the cost for creating a campaign to the
// user creating the campaign.
contract CampaignFactory {
    address[] deployedCampaigns;

    // Factory function for creating and deploying Campaigns
    // stores every deployed campaign address into the deployedCampaigns array
    function createCampaign(uint256 minimumContribution) public {
        address newCampaign = new Campaign(minimumContribution, msg.sender);
        deployedCampaigns.push(newCampaign);
    }

    // Get the deployed address array
    function getDeployedCampaigns() public view returns (address[]) {
        return deployedCampaigns;
    }
}

// Contract for creating a campaign, keeping track of contributions, contributors,
// and handling spending/approval of requests.
contract Campaign {
    // Struc interface for a standard Spending Request
    struct SpendingRequest {
        // Must initialize - Value types
        string description;
        uint256 value;
        address recipient;
        bool complete;
        uint256 approvalCount;
        // Do not need to initialize - Reference types
        mapping(address => bool) requestApprovals;
    }

    // Vars
    address public manager;
    mapping(address => bool) public contributors;
    uint256 public minimumContribution;
    uint256 public approversCount;
    SpendingRequest[] public spendingRequests;

    // Modifiers
    // Require that the msg sender must be the contract manager
    modifier restrictToManager() {
        require(msg.sender == manager);
        _;
    }

    // Require a msg sender is already a contributor
    modifier restrictToContributors() {
        require(contributors[msg.sender]);
        _;
    }

    // Construct the initial contract and set the minimumContribution,
    // as well as the manager
    function Campaign(uint256 minimum, address creator) public {
        manager = creator;
        minimumContribution = minimum;
    }

    // Contribute Wei to the contract
    function contribute() public payable {
        require(msg.value > minimumContribution);

        contributors[msg.sender] = true;
        approversCount++;
    }

    // Allows manager to create a spending request
    function createSpendingRequest(
        string description,
        uint256 value,
        address recipient
    ) public restrictToManager {
        SpendingRequest memory newRequest = SpendingRequest({
            description: description,
            value: value,
            recipient: recipient,
            complete: false,
            approvalCount: 0
        });

        spendingRequests.push(newRequest);
    }

    // Allows contributors to approve a spending request
    function approveRequest(uint256 requestIndex)
        public
        restrictToContributors
    {
        SpendingRequest storage request = spendingRequests[requestIndex];

        // Make sure the person calling the function hasn't voted before
        require(!request.requestApprovals[msg.sender]);

        request.requestApprovals[msg.sender] = true;
        request.approvalCount++;
    }

    // Allows the manager to finalize a request and pay out after request approval
    function finalizeRequest(uint256 requestIndex) public restrictToManager {
        SpendingRequest storage request = spendingRequests[requestIndex];

        // Ensure the request has enough approvals for it to be finalized
        // 51% must be in approval for the request to be in good standing
        require(request.approvalCount > (approversCount / 2));
        require(!request.complete);

        // Complete the transaction
        request.recipient.transfer(request.value);
        request.complete = true;
    }

    function getSummary()
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            address
        )
    {
        return (
            minimumContribution,
            this.balance,
            spendingRequests.length,
            approversCount,
            manager
        );
    }

    function getRequestsCount() public view returns (uint256) {
        return spendingRequests.length;
    }
}
