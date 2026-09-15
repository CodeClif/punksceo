// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./cig.sol";

/**
 * @dev Test-only harness for defensive regression coverage.
 *      It is never intended for deployment.
 */
contract CigAuditHarness is Cig {
    constructor(
        uint256 _cigPerBlock,
        address _punks,
        uint256 _CEO_epoch_blocks,
        uint256 _CEO_auction_blocks,
        uint256 _CEO_price,
        bytes32 _graffiti,
        address _NFT,
        address _V2ROUTER,
        address _OC,
        uint256 _migration_epochs,
        address _MASTERCHEF_V2
    ) Cig(
        _cigPerBlock,
        _punks,
        _CEO_epoch_blocks,
        _CEO_auction_blocks,
        _CEO_price,
        _graffiti,
        _NFT,
        _V2ROUTER,
        _OC,
        _migration_epochs,
        _MASTERCHEF_V2
    ) {}

    function seedCEO(
        address _ceo,
        uint256 _price,
        uint256 _taxBalance,
        uint256 _punkIndex
    ) external {
        CEO_state = 1;
        CEO_price = _price;
        CEO_tax_balance = _taxBalance;
        CEO_punk_index = _punkIndex;
        The_CEO = _ceo;
        taxBurnBlock = block.number;

        if (_taxBalance > 0) {
            _mint(address(this), _taxBalance);
        }

        _transferNFT(address(0), _ceo);
    }

    function mintForTest(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
}
