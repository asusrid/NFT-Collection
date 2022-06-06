//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IWhitelist{

    // this is the only func we need, saving gas
    function whitelistedAddresses(address) external view returns (bool);
}