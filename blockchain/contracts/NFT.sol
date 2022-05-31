// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract NFT is ERC721Enumerable, Ownable {

    string _baseTokenURI;
    bool public presaleStarted;

    uint256 public presaleEnded;
    uint256 public maxTokensIds = 20;
    uint256 public tokenIds;
    uint256 public _price = 0.01 ether;
    bool public _paused;

    IWhitelist whitelist;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused!");
        _;
    }


    // because of constructor of ERC721, we need to provide a name and a code ERC721("NFT Collection", "NFT_C")
    constructor(string memory baseURI, address whitelistContract) ERC721("NFT Collection", "NFT_C") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && presaleEnded < block.timestamp, "Sorry, presale ended or not started!");
        require(whitelist.whitelistedAddresses(msg.sender), "Address not registered in whitelist!");
        require(tokenIds < maxTokensIds, "Exceeded the limit!");
        require(msg.value >= _price, "Ether sent is not correct!");

        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not ended yet!");
        require(tokenIds < maxTokensIds, "Exceeded the limit!");
        require(msg.value >= _price, "Ether sent is not correct!");

        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        // solidity sintax to send ether  
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to sent ether!");
    }

    // pause your contract
    function setPause(bool val) public onlyOwner {
        _paused = val;
    }

    // called when msg.data is empty, just sending ethers 
    // external - this func will be called from outside the contract
    receive() external payable {

    }

    fallback() external payable {

    }

}