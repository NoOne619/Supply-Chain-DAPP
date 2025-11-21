// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Abdullah_supplychain {
    
    // Define the stages of a product
    enum ProductStatus { Manufactured, Distributed, Retailed, Sold }

    struct Product {
        uint256 id;
        string name;
        string description;
        address currentOwner;
        ProductStatus status;
        address manufacturer;
        address distributor;
        address retailer;
        address consumer;
        string[] history; // Stores the audit trail
    }

    uint256 public productCount = 0;
    mapping(uint256 => Product) public products;

    // Events to log activity on the blockchain
    event ProductRegistered(uint256 id, string name, address manufacturer);
    event ProductTransfer(uint256 id, address from, address to, ProductStatus status);

    // Security: Only the current owner can move the product
    modifier onlyOwner(uint256 _productId) {
        require(msg.sender == products[_productId].currentOwner, "Not the owner");
        _;
    }

    // 1. MANUFACTURER: Register a new product
    function registerProduct(string memory _name, string memory _description) public {
        productCount++;
        Product storage newProduct = products[productCount];
        
        newProduct.id = productCount;
        newProduct.name = _name;
        newProduct.description = _description;
        newProduct.currentOwner = msg.sender;
        newProduct.manufacturer = msg.sender;
        newProduct.status = ProductStatus.Manufactured;
        
        // Log the first history entry
        newProduct.history.push(string(abi.encodePacked("Manufactured by ", toAsciiString(msg.sender))));

        emit ProductRegistered(productCount, _name, msg.sender);
    }

    // 2. DISTRIBUTOR: Transfer ownership to a distributor
    function transferToDistributor(uint256 _productId, address _distributor) public onlyOwner(_productId) {
        require(products[_productId].status == ProductStatus.Manufactured, "Must be at Manufacturer stage");
        
        products[_productId].currentOwner = _distributor;
        products[_productId].distributor = _distributor;
        products[_productId].status = ProductStatus.Distributed;
        products[_productId].history.push(string(abi.encodePacked("Transferred to Distributor ", toAsciiString(_distributor))));
        
        emit ProductTransfer(_productId, msg.sender, _distributor, ProductStatus.Distributed);
    }

    // 3. RETAILER: Transfer ownership to a retailer
    function transferToRetailer(uint256 _productId, address _retailer) public onlyOwner(_productId) {
        require(products[_productId].status == ProductStatus.Distributed, "Must be at Distributor stage");
        
        products[_productId].currentOwner = _retailer;
        products[_productId].retailer = _retailer;
        products[_productId].status = ProductStatus.Retailed;
        products[_productId].history.push(string(abi.encodePacked("Transferred to Retailer ", toAsciiString(_retailer))));

        emit ProductTransfer(_productId, msg.sender, _retailer, ProductStatus.Retailed);
    }

    // 4. CONSUMER: Sell final product to consumer
    function sellToConsumer(uint256 _productId, address _consumer) public onlyOwner(_productId) {
        require(products[_productId].status == ProductStatus.Retailed, "Must be at Retailer stage");
        
        products[_productId].currentOwner = _consumer;
        products[_productId].consumer = _consumer;
        products[_productId].status = ProductStatus.Sold;
        products[_productId].history.push(string(abi.encodePacked("Sold to Consumer ", toAsciiString(_consumer))));

        emit ProductTransfer(_productId, msg.sender, _consumer, ProductStatus.Sold);
    }

    // Helper: Get Product Details for the React App
    function getProduct(uint256 _productId) public view returns (uint256, string memory, string memory, address, string memory) {
        string memory statusStr;
        if (products[_productId].status == ProductStatus.Manufactured) statusStr = "Manufactured";
        else if (products[_productId].status == ProductStatus.Distributed) statusStr = "In Transit";
        else if (products[_productId].status == ProductStatus.Retailed) statusStr = "At Retailer";
        else statusStr = "Sold";

        return (
            products[_productId].id,
            products[_productId].name,
            products[_productId].description,
            products[_productId].currentOwner,
            statusStr
        );
    }

    // Helper: Get the full history
    function getProductHistory(uint256 _productId) public view returns (string[] memory) {
        return products[_productId].history;
    }

    // Utility to convert address to string (for logging)
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}