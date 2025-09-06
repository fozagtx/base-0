// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MarketAPI} from "filecoin-solidity-api/contracts/v0.8/MarketAPI.sol";
import {CommonTypes} from "filecoin-solidity-api/contracts/v0.8/types/CommonTypes.sol";
import {MarketTypes} from "filecoin-solidity-api/contracts/v0.8/types/MarketTypes.sol";
import {FilAddresses} from "filecoin-solidity-api/contracts/v0.8/utils/FilAddresses.sol";
import {BigInts} from "filecoin-solidity-api/contracts/v0.8/utils/BigInts.sol";

contract FilecoinCIDStore {
    struct StoredContent {
        bytes piece_cid;        // Filecoin piece CID
        string data_cid;        // Original data CID
        uint256 price;          // Price to access in attoFIL
        address owner;          // Content owner
        string title;           // Content title
        string description;     // Content description
        uint256 piece_size;     // Size of the piece
        uint64 deal_id;         // Filecoin deal ID (0 if no deal yet)
        bool is_active;         // Whether content is active for purchase
        uint256 created_at;     // Creation timestamp
        uint256 total_earnings; // Total earnings from this content
        uint256 access_count;   // Number of times accessed
    }

    struct UserAccess {
        bool has_access;
        uint256 purchased_at;
        uint256 expires_at;     // Access expiration (365 days)
    }

    mapping(uint256 => StoredContent) public stored_content;
    mapping(uint256 => mapping(address => UserAccess)) public user_access;
    mapping(address => uint256[]) public user_owned_content;
    mapping(address => uint256[]) public user_purchased_content;
    mapping(bytes => uint256) public piece_cid_to_content; // piece CID -> content ID

    uint256 public next_content_id = 1;
    address public platform_owner;
    uint256 public platform_fee_percentage = 5; // 5% platform fee

    event ContentStored(
        uint256 indexed content_id,
        address indexed owner,
        bytes piece_cid,
        string data_cid,
        uint256 price,
        string title
    );

    event AccessPurchased(
        uint256 indexed content_id,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );

    event CIDRetrieved(
        uint256 indexed content_id,
        address indexed user,
        string data_cid
    );

    event DealActivated(
        uint256 indexed content_id,
        uint64 deal_id
    );

    constructor() {
        platform_owner = msg.sender;
    }

    modifier contentExists(uint256 _content_id) {
        require(_content_id > 0 && _content_id < next_content_id, "Content does not exist");
        _;
    }

    modifier onlyContentOwner(uint256 _content_id) {
        require(stored_content[_content_id].owner == msg.sender, "Only content owner");
        _;
    }

    modifier onlyPlatformOwner() {
        require(msg.sender == platform_owner, "Only platform owner");
        _;
    }

    function storeContent(
        bytes memory _piece_cid,
        string memory _data_cid,
        uint256 _price,
        string memory _title,
        string memory _description,
        uint256 _piece_size
    ) external returns (uint256) {
        require(_piece_cid.length > 0, "Piece CID required");
        require(bytes(_data_cid).length > 0, "Data CID required");
        require(_price > 0, "Price must be > 0");
        require(bytes(_title).length > 0, "Title required");
        require(_piece_size > 0, "Piece size must be > 0");

        uint256 content_id = next_content_id++;

        stored_content[content_id] = StoredContent({
            piece_cid: _piece_cid,
            data_cid: _data_cid,
            price: _price,
            owner: msg.sender,
            title: _title,
            description: _description,
            piece_size: _piece_size,
            deal_id: 0, // No deal initially
            is_active: true,
            created_at: block.timestamp,
            total_earnings: 0,
            access_count: 0
        });

        user_owned_content[msg.sender].push(content_id);
        piece_cid_to_content[_piece_cid] = content_id;

        emit ContentStored(content_id, msg.sender, _piece_cid, _data_cid, _price, _title);
        return content_id;
    }

    function purchaseAccess(uint256 _content_id) external payable contentExists(_content_id) {
        StoredContent storage content = stored_content[_content_id];
        require(content.is_active, "Content not active");
        require(msg.value >= content.price, "Insufficient payment");
        require(msg.sender != content.owner, "Owner cannot purchase own content");
        require(!user_access[_content_id][msg.sender].has_access, "Already has access");

        uint256 platform_fee = (msg.value * platform_fee_percentage) / 100;
        uint256 owner_payment = msg.value - platform_fee;

        // Grant access to user (1 year)
        user_access[_content_id][msg.sender] = UserAccess({
            has_access: true,
            purchased_at: block.timestamp,
            expires_at: block.timestamp + 365 days
        });

        // Update content stats
        content.total_earnings += msg.value;
        content.access_count++;

        // Add to user's purchased content
        user_purchased_content[msg.sender].push(_content_id);

        // Transfer payments
        payable(content.owner).transfer(owner_payment);
        if (platform_fee > 0) {
            payable(platform_owner).transfer(platform_fee);
        }

        emit AccessPurchased(_content_id, msg.sender, content.owner, msg.value);
    }

    function getCID(uint256 _content_id) external contentExists(_content_id) returns (string memory) {
        StoredContent storage content = stored_content[_content_id];
        require(content.is_active, "Content not active");

        // Owner can always access
        if (msg.sender == content.owner) {
            emit CIDRetrieved(_content_id, msg.sender, content.data_cid);
            return content.data_cid;
        }

        // Check if user has valid access
        UserAccess memory access = user_access[_content_id][msg.sender];
        require(access.has_access, "Purchase required to access CID");
        require(block.timestamp <= access.expires_at, "Access expired");

        emit CIDRetrieved(_content_id, msg.sender, content.data_cid);
        return content.data_cid;
    }

    function hasAccess(uint256 _content_id, address _user) external view contentExists(_content_id) returns (bool) {
        StoredContent memory content = stored_content[_content_id];

        // Owner always has access
        if (_user == content.owner) {
            return true;
        }

        UserAccess memory access = user_access[_content_id][_user];
        return access.has_access && block.timestamp <= access.expires_at;
    }

    function updateDealStatus(uint256 _content_id, uint64 _deal_id) external onlyContentOwner(_content_id) {
        require(_deal_id > 0, "Invalid deal ID");

        StoredContent storage content = stored_content[_content_id];
        content.deal_id = _deal_id;

        emit DealActivated(_content_id, _deal_id);
    }

    function checkDealActivation(uint256 _content_id) external view contentExists(_content_id) returns (bool) {
        StoredContent memory content = stored_content[_content_id];

        if (content.deal_id == 0) {
            return false; // No deal created yet
        }

        // Check deal activation status from Filecoin network
        (int256 exit_code, MarketTypes.GetDealActivationReturn memory ret) = MarketAPI
            .getDealActivation(content.deal_id);

        if (exit_code != 0) {
            return false;
        }

        // Check if deal is activated and not terminated
        return (CommonTypes.ChainEpoch.unwrap(ret.activated) > 0) &&
               (CommonTypes.ChainEpoch.unwrap(ret.terminated) == 0);
    }

    function getContentInfo(uint256 _content_id) external view contentExists(_content_id) returns (
        string memory title,
        string memory description,
        uint256 price,
        address owner,
        bool is_active,
        uint256 created_at,
        uint64 deal_id,
        uint256 piece_size,
        bool user_has_access
    ) {
        StoredContent memory content = stored_content[_content_id];
        bool has_access = (msg.sender == content.owner) ||
                         (user_access[_content_id][msg.sender].has_access &&
                          block.timestamp <= user_access[_content_id][msg.sender].expires_at);

        return (
            content.title,
            content.description,
            content.price,
            content.owner,
            content.is_active,
            content.created_at,
            content.deal_id,
            content.piece_size,
            has_access
        );
    }

    function getUserOwnedContent(address _user) external view returns (uint256[] memory) {
        return user_owned_content[_user];
    }

    function getUserPurchasedContent(address _user) external view returns (uint256[] memory) {
        return user_purchased_content[_user];
    }

    function getAllActiveContent() external view returns (uint256[] memory) {
        uint256[] memory active_content = new uint256[](next_content_id - 1);
        uint256 count = 0;

        for (uint256 i = 1; i < next_content_id; i++) {
            if (stored_content[i].is_active) {
                active_content[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = active_content[i];
        }

        return result;
    }

    function updateContentStatus(
        uint256 _content_id,
        uint256 _new_price,
        bool _is_active
    ) external contentExists(_content_id) onlyContentOwner(_content_id) {
        require(_new_price > 0, "Price must be > 0");

        StoredContent storage content = stored_content[_content_id];
        content.price = _new_price;
        content.is_active = _is_active;
    }

    function setPlatformFee(uint256 _fee_percentage) external onlyPlatformOwner {
        require(_fee_percentage <= 20, "Fee too high (max 20%)");
        platform_fee_percentage = _fee_percentage;
    }

    function withdrawPlatformFees() external onlyPlatformOwner {
        payable(platform_owner).transfer(address(this).balance);
    }

    // Add balance to Filecoin market escrow for making deals
    function addMarketBalance(uint256 _value) external onlyPlatformOwner {
        MarketAPI.addBalance(FilAddresses.fromEthAddress(address(this)), _value);
    }

    // Withdraw from Filecoin market escrow
    function withdrawMarketBalance(uint256 _value) external onlyPlatformOwner returns (uint256) {
        MarketTypes.WithdrawBalanceParams memory params = MarketTypes.WithdrawBalanceParams(
            FilAddresses.fromEthAddress(address(this)),
            BigInts.fromUint256(_value)
        );
        (int256 exit_code, CommonTypes.BigInt memory ret) = MarketAPI.withdrawBalance(params);
        require(exit_code == 0, "Withdraw failed");

        (uint256 withdrawn_amount, bool converted) = BigInts.toUint256(ret);
        require(converted, "Conversion failed");

        return withdrawn_amount;
    }

    receive() external payable {}
}
