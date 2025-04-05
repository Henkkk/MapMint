// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MapMintEscrow
 * @dev Handles escrow of WLD tokens for MapMint projects and distributes rewards
 * to contributors based on their participation in data collection.
 */
contract MapMintEscrow is Ownable, ReentrancyGuard {
    // Token to be used for rewards (WorldCoin/WLD)
    IERC20 public wldToken;
    
    // Project status enum
    enum ProjectStatus { Active, Completed, Cancelled }
    
    // Project data structure
    struct Project {
        string id;               // Project ID (IPFS CID)
        address creator;         // Creator of the project
        uint256 totalReward;     // Total WLD locked for the project
        uint256 startTime;       // Project start timestamp
        uint256 endTime;         // Project end timestamp
        ProjectStatus status;    // Project status
        uint256 totalContributions; // Total number of contributions made
        mapping(address => uint256) contributions; // Mapping of contributor address to their contribution count
        mapping(address => bool) rewardsClaimed;   // Track if a contributor has claimed their rewards
    }
    
    // Mapping from project ID to Project data
    mapping(string => Project) public projects;
    
    // Array to store project IDs
    string[] public projectIds;
    
    // Events
    event ProjectCreated(string indexed projectId, address creator, uint256 totalReward, uint256 endTime);
    event ProjectCompleted(string indexed projectId);
    event ProjectCancelled(string indexed projectId);
    event ContributionAdded(string indexed projectId, address contributor);
    event RewardClaimed(string indexed projectId, address contributor, uint256 amount);
    
    /**
     * @dev Constructor sets the WLD token address
     * @param _wldToken Address of the WLD token contract
     */
    constructor(address _wldToken) Ownable(msg.sender) {
        wldToken = IERC20(_wldToken);
    }
    
    /**
     * @dev Creates a new project and locks the creator's WLD tokens
     * @param _projectId Project ID (IPFS CID)
     * @param _totalReward Total WLD tokens for rewards
     * @param _duration Duration of the project in seconds
     */
    function createProject(
        string memory _projectId,
        uint256 _totalReward,
        uint256 _duration
    ) external nonReentrant {
        // Ensure project ID is not empty
        require(bytes(_projectId).length > 0, "Project ID cannot be empty");
        // Ensure the project doesn't already exist
        require(projects[_projectId].creator == address(0), "Project already exists");
        // Ensure the reward amount is greater than 0
        require(_totalReward > 0, "Reward must be greater than 0");
        
        // Transfer WLD tokens from creator to this contract
        require(
            wldToken.transferFrom(msg.sender, address(this), _totalReward),
            "Token transfer failed"
        );
        
        // Create the project
        Project storage newProject = projects[_projectId];
        newProject.id = _projectId;
        newProject.creator = msg.sender;
        newProject.totalReward = _totalReward;
        newProject.startTime = block.timestamp;
        newProject.endTime = block.timestamp + _duration;
        newProject.status = ProjectStatus.Active;
        newProject.totalContributions = 0;
        
        // Add project ID to the array
        projectIds.push(_projectId);
        
        emit ProjectCreated(_projectId, msg.sender, _totalReward, newProject.endTime);
    }
    
    /**
     * @dev Mark a project as completed and allow rewards to be claimed
     * @param _projectId Project ID
     */
    function completeProject(string memory _projectId) external {
        Project storage project = projects[_projectId];
        
        // Only the project creator can complete it
        require(project.creator == msg.sender, "Only creator can complete project");
        // Project must be active
        require(project.status == ProjectStatus.Active, "Project is not active");
        
        project.status = ProjectStatus.Completed;
        
        emit ProjectCompleted(_projectId);
    }
    
    /**
     * @dev Cancel a project and return funds to the creator
     * @param _projectId Project ID
     */
    function cancelProject(string memory _projectId) external nonReentrant {
        Project storage project = projects[_projectId];
        
        // Only the project creator can cancel it
        require(project.creator == msg.sender, "Only creator can cancel project");
        // Project must be active
        require(project.status == ProjectStatus.Active, "Project is not active");
        
        // Set project status to cancelled
        project.status = ProjectStatus.Cancelled;
        
        // Return funds to creator
        require(
            wldToken.transfer(project.creator, project.totalReward),
            "Token transfer failed"
        );
        
        emit ProjectCancelled(_projectId);
    }
    
    /**
     * @dev Record a new contribution to a project
     * @param _projectId Project ID
     * @param _contributor Address of the contributor
     */
    function addContribution(string memory _projectId, address _contributor) external {
        Project storage project = projects[_projectId];
        
        // Only contract owner or project creator can add contributions
        require(
            owner() == msg.sender || project.creator == msg.sender,
            "Not authorized to add contributions"
        );
        
        // Project must be active
        require(project.status == ProjectStatus.Active, "Project is not active");
        // Project must not be expired
        require(block.timestamp < project.endTime, "Project has expired");
        
        // Increment contribution count for the contributor
        project.contributions[_contributor]++;
        // Increment total contribution count
        project.totalContributions++;
        
        emit ContributionAdded(_projectId, _contributor);
    }
    
    /**
     * @dev Claim rewards for contributions to a completed project
     * @param _projectId Project ID
     */
    function claimRewards(string memory _projectId) external nonReentrant {
        Project storage project = projects[_projectId];
        
        // Project must be completed
        require(project.status == ProjectStatus.Completed, "Project is not completed");
        // Contributor must have made contributions
        require(project.contributions[msg.sender] > 0, "No contributions made");
        // Contributor must not have already claimed rewards
        require(!project.rewardsClaimed[msg.sender], "Rewards already claimed");
        
        // Calculate reward amount based on contribution percentage
        uint256 contributionPercentage = (project.contributions[msg.sender] * 1e18) / project.totalContributions;
        uint256 rewardAmount = (project.totalReward * contributionPercentage) / 1e18;
        
        // Mark rewards as claimed
        project.rewardsClaimed[msg.sender] = true;
        
        // Transfer rewards to contributor
        require(
            wldToken.transfer(msg.sender, rewardAmount),
            "Token transfer failed"
        );
        
        emit RewardClaimed(_projectId, msg.sender, rewardAmount);
    }
    
    /**
     * @dev Get details of a project
     * @param _projectId Project ID
     * @return creator Project creator address
     * @return totalReward Total reward amount
     * @return startTime Project start time
     * @return endTime Project end time
     * @return status Project status
     * @return totalContributions Total number of contributions
     */
    function getProjectDetails(string memory _projectId) external view returns (
        address creator,
        uint256 totalReward,
        uint256 startTime,
        uint256 endTime,
        ProjectStatus status,
        uint256 totalContributions
    ) {
        Project storage project = projects[_projectId];
        return (
            project.creator,
            project.totalReward,
            project.startTime,
            project.endTime,
            project.status,
            project.totalContributions
        );
    }
    
    /**
     * @dev Get the number of contributions made by a contributor to a project
     * @param _projectId Project ID
     * @param _contributor Contributor address
     * @return Number of contributions
     */
    function getContributionCount(string memory _projectId, address _contributor) external view returns (uint256) {
        return projects[_projectId].contributions[_contributor];
    }
    
    /**
     * @dev Get the total number of projects
     * @return Number of projects
     */
    function getProjectCount() external view returns (uint256) {
        return projectIds.length;
    }
    
    /**
     * @dev Allow contract owner to update the WLD token address
     * @param _newWldToken New WLD token address
     */
    function updateWldToken(address _newWldToken) external onlyOwner {
        wldToken = IERC20(_newWldToken);
    }
} 