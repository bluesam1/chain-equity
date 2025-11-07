import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import type { ChainEquityToken } from "../typechain-types/src/ChainEquityToken";
import type { Lock } from "../typechain-types/Lock";

describe("ChainEquityToken", function () {
  // Fixture to deploy the contract with initial symbol
  async function deployChainEquityTokenFixture() {
    const [deployer, account1, account2] = await hre.ethers.getSigners();

    const ChainEquityTokenFactory = await hre.ethers.getContractFactory(
      "ChainEquityToken"
    );
    const token = (await ChainEquityTokenFactory.deploy(
      "CET"
    )) as unknown as ChainEquityToken;

    return { token, deployer, account1, account2 };
  }

  describe("Deployment", function () {
    it("Should deploy with correct name and symbol", async function () {
      const { token } = await loadFixture(deployChainEquityTokenFixture);

      expect(await token.name()).to.equal("Chain Equity Token");
      expect(await token.symbol()).to.equal("CET");
    });

    it("Should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
      const { token, deployer } = await loadFixture(
        deployChainEquityTokenFixture
      );

      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be
        .true;
    });

    it("Should have zero total supply initially", async function () {
      const { token } = await loadFixture(deployChainEquityTokenFixture);

      expect(await token.totalSupply()).to.equal(0n);
    });
  });

  describe("Role Management", function () {
    it("Should define MINTER_ROLE constant", async function () {
      const { token } = await loadFixture(deployChainEquityTokenFixture);

      const MINTER_ROLE = await token.MINTER_ROLE();
      expect(MINTER_ROLE).to.not.equal(0n);
    });

    it("Should define APPROVER_ROLE constant", async function () {
      const { token } = await loadFixture(deployChainEquityTokenFixture);

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      expect(APPROVER_ROLE).to.not.equal(0n);
    });

    it("Should allow admin to grant MINTER_ROLE", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      const MINTER_ROLE = await token.MINTER_ROLE();
      await token.grantRole(MINTER_ROLE, account1.address);

      expect(await token.hasRole(MINTER_ROLE, account1.address)).to.be.true;
    });

    it("Should allow admin to grant APPROVER_ROLE", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, account1.address);

      expect(await token.hasRole(APPROVER_ROLE, account1.address)).to.be.true;
    });

    it("Should allow admin to revoke MINTER_ROLE", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      const MINTER_ROLE = await token.MINTER_ROLE();
      await token.grantRole(MINTER_ROLE, account1.address);
      expect(await token.hasRole(MINTER_ROLE, account1.address)).to.be.true;

      await token.revokeRole(MINTER_ROLE, account1.address);
      expect(await token.hasRole(MINTER_ROLE, account1.address)).to.be.false;
    });

    it("Should allow admin to revoke APPROVER_ROLE", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, account1.address);
      expect(await token.hasRole(APPROVER_ROLE, account1.address)).to.be.true;

      await token.revokeRole(APPROVER_ROLE, account1.address);
      expect(await token.hasRole(APPROVER_ROLE, account1.address)).to.be.false;
    });

    it("Should revert when non-admin tries to grant role", async function () {
      const { token, account1, account2 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      const MINTER_ROLE = await token.MINTER_ROLE();
      await expect(
        token.connect(account1).grantRole(MINTER_ROLE, account2.address)
      ).to.be.reverted;
    });
  });

  describe("Basic ERC-20 Functionality", function () {
    it("Should return 0 balance for new addresses", async function () {
      const { token, account1 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      expect(await token.balanceOf(account1.address)).to.equal(0n);
    });

    it("Should return 0 total supply initially", async function () {
      const { token } = await loadFixture(deployChainEquityTokenFixture);

      expect(await token.totalSupply()).to.equal(0n);
    });

    it("Should return correct symbol", async function () {
      const { token } = await loadFixture(deployChainEquityTokenFixture);

      expect(await token.symbol()).to.equal("CET");
    });

    it("Should return correct name", async function () {
      const { token } = await loadFixture(deployChainEquityTokenFixture);

      expect(await token.name()).to.equal("Chain Equity Token");
    });
  });

  describe("Allowlist Management", function () {
    it("Should allow APPROVER_ROLE to approve wallet", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);

      await expect(token.approveWallet(account1.address))
        .to.emit(token, "AllowlistUpdated")
        .withArgs(account1.address, true);

      expect(await token.allowlist(account1.address)).to.be.true;
    });

    it("Should allow APPROVER_ROLE to revoke wallet", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);

      await token.approveWallet(account1.address);
      expect(await token.allowlist(account1.address)).to.be.true;

      await expect(token.revokeWallet(account1.address))
        .to.emit(token, "AllowlistUpdated")
        .withArgs(account1.address, false);

      expect(await token.allowlist(account1.address)).to.be.false;
    });

    it("Should revert when non-APPROVER_ROLE tries to approve wallet", async function () {
      const { token, account1, account2 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      await expect(token.connect(account1).approveWallet(account2.address)).to
        .be.reverted;
    });

    it("Should revert when non-APPROVER_ROLE tries to revoke wallet", async function () {
      const { token, deployer, account1, account2 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);
      await token.approveWallet(account2.address);

      await expect(token.connect(account1).revokeWallet(account2.address)).to.be
        .reverted;
    });

    it("Should return false for addresses not on allowlist", async function () {
      const { token, account1 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      expect(await token.allowlist(account1.address)).to.be.false;
    });

    it("Should return true for addresses on allowlist", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);
      await token.approveWallet(account1.address);

      expect(await token.allowlist(account1.address)).to.be.true;
    });
  });

  describe("Transfer Restrictions", function () {
    async function deployWithAllowlistFixture() {
      const [deployer, account1, account2, account3] =
        await hre.ethers.getSigners();

      const ChainEquityTokenFactory = await hre.ethers.getContractFactory(
        "ChainEquityToken"
      );
      const token = (await ChainEquityTokenFactory.deploy(
        "CET"
      )) as unknown as ChainEquityToken;

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);

      // Grant MINTER_ROLE to deployer for minting tokens
      const MINTER_ROLE = await token.MINTER_ROLE();
      await token.grantRole(MINTER_ROLE, deployer.address);

      return { token, deployer, account1, account2, account3 };
    }

    it("Should revert transfer when sender not allowlisted", async function () {
      const { token, deployer, account1, account2 } = await loadFixture(
        deployWithAllowlistFixture
      );

      const MINTER_ROLE = await token.MINTER_ROLE();
      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(MINTER_ROLE, deployer.address);
      await token.grantRole(APPROVER_ROLE, deployer.address);

      // Approve account1 for minting (required for mint)
      await token.approveWallet(account1.address);
      await token.mint(account1.address, 1000n);

      // Revoke account1 from allowlist to test transfer restriction
      await token.revokeWallet(account1.address);

      // Approve account2 for receiving
      await token.approveWallet(account2.address);

      await expect(
        token.connect(account1).transfer(account2.address, 100n)
      ).to.be.revertedWith("Sender not allowlisted");
    });

    it("Should revert transfer when recipient not allowlisted", async function () {
      const { token, deployer, account1, account2 } = await loadFixture(
        deployWithAllowlistFixture
      );

      const MINTER_ROLE = await token.MINTER_ROLE();
      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(MINTER_ROLE, deployer.address);
      await token.grantRole(APPROVER_ROLE, deployer.address);

      // Approve account1 for minting and sending (required for mint)
      await token.approveWallet(account1.address);
      await token.mint(account1.address, 1000n);

      await expect(
        token.connect(account1).transfer(account2.address, 100n)
      ).to.be.revertedWith("Recipient not allowlisted");
    });

    it("Should succeed transfer when both sender and recipient are allowlisted", async function () {
      const { token, deployer, account1, account2 } = await loadFixture(
        deployWithAllowlistFixture
      );

      const MINTER_ROLE = await token.MINTER_ROLE();
      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(MINTER_ROLE, deployer.address);
      await token.grantRole(APPROVER_ROLE, deployer.address);

      // Approve both accounts before minting (required for mint)
      await token.approveWallet(account1.address);
      await token.approveWallet(account2.address);
      await token.mint(account1.address, 1000n);

      await expect(token.connect(account1).transfer(account2.address, 100n)).to
        .not.be.reverted;

      expect(await token.balanceOf(account2.address)).to.equal(100n);
      expect(await token.balanceOf(account1.address)).to.equal(900n);
    });

    it("Should revert transferFrom when sender not allowlisted", async function () {
      const { token, deployer, account1, account2, account3 } =
        await loadFixture(deployWithAllowlistFixture);

      const MINTER_ROLE = await token.MINTER_ROLE();
      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(MINTER_ROLE, deployer.address);
      await token.grantRole(APPROVER_ROLE, deployer.address);

      // Approve account1 for minting (required for mint)
      await token.approveWallet(account1.address);
      await token.mint(account1.address, 1000n);

      // Revoke account1 from allowlist to test transfer restriction
      await token.revokeWallet(account1.address);

      // Approve account2 and account3 for receiving
      await token.approveWallet(account2.address);
      await token.approveWallet(account3.address);

      await token.connect(account1).approve(account2.address, 100n);

      await expect(
        token
          .connect(account2)
          .transferFrom(account1.address, account3.address, 100n)
      ).to.be.revertedWith("Sender not allowlisted");
    });

    it("Should revert transferFrom when recipient not allowlisted", async function () {
      const { token, deployer, account1, account2, account3 } =
        await loadFixture(deployWithAllowlistFixture);

      const MINTER_ROLE = await token.MINTER_ROLE();
      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(MINTER_ROLE, deployer.address);
      await token.grantRole(APPROVER_ROLE, deployer.address);

      // Approve account1 for minting (required for mint)
      await token.approveWallet(account1.address);
      await token.mint(account1.address, 1000n);

      // Approve account1 and account2 for transfers
      await token.approveWallet(account2.address);

      await token.connect(account1).approve(account2.address, 100n);

      await expect(
        token
          .connect(account2)
          .transferFrom(account1.address, account3.address, 100n)
      ).to.be.revertedWith("Recipient not allowlisted");
    });

    it("Should succeed transferFrom when both sender and recipient are allowlisted", async function () {
      const { token, deployer, account1, account2, account3 } =
        await loadFixture(deployWithAllowlistFixture);

      const MINTER_ROLE = await token.MINTER_ROLE();
      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(MINTER_ROLE, deployer.address);
      await token.grantRole(APPROVER_ROLE, deployer.address);

      // Approve all accounts before minting (required for mint)
      await token.approveWallet(account1.address);
      await token.approveWallet(account2.address);
      await token.approveWallet(account3.address);
      await token.mint(account1.address, 1000n);

      await token.connect(account1).approve(account2.address, 100n);

      await expect(
        token
          .connect(account2)
          .transferFrom(account1.address, account3.address, 100n)
      ).to.not.be.reverted;

      expect(await token.balanceOf(account3.address)).to.equal(100n);
      expect(await token.balanceOf(account1.address)).to.equal(900n);
    });
  });

  describe("Minting Functionality", function () {
    async function deployWithRolesFixture() {
      const [deployer, account1, account2] = await hre.ethers.getSigners();

      const ChainEquityTokenFactory = await hre.ethers.getContractFactory(
        "ChainEquityToken"
      );
      const token = (await ChainEquityTokenFactory.deploy(
        "CET"
      )) as unknown as ChainEquityToken;

      const MINTER_ROLE = await token.MINTER_ROLE();
      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(MINTER_ROLE, deployer.address);
      await token.grantRole(APPROVER_ROLE, deployer.address);

      return { token, deployer, account1, account2 };
    }

    it("Should increase total supply when minting", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployWithRolesFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);
      await token.approveWallet(account1.address);

      const initialSupply = await token.totalSupply();
      await token.mint(account1.address, 1000n);
      const newSupply = await token.totalSupply();

      expect(newSupply).to.equal(initialSupply + 1000n);
    });

    it("Should increase recipient balance when minting", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployWithRolesFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);
      await token.approveWallet(account1.address);

      const initialBalance = await token.balanceOf(account1.address);
      await token.mint(account1.address, 1000n);
      const newBalance = await token.balanceOf(account1.address);

      expect(newBalance).to.equal(initialBalance + 1000n);
    });

    it("Should emit Transfer event with from address as zero address", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployWithRolesFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);
      await token.approveWallet(account1.address);

      await expect(token.mint(account1.address, 1000n))
        .to.emit(token, "Transfer")
        .withArgs(hre.ethers.ZeroAddress, account1.address, 1000n);
    });

    it("Should revert when recipient is not allowlisted", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployWithRolesFixture
      );

      await expect(token.mint(account1.address, 1000n)).to.be.revertedWith(
        "Recipient not allowlisted"
      );
    });

    it("Should revert when caller does not have MINTER_ROLE", async function () {
      const { token, deployer, account1, account2 } = await loadFixture(
        deployWithRolesFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);
      await token.approveWallet(account1.address);

      await expect(token.connect(account2).mint(account1.address, 1000n)).to.be
        .reverted;
    });

    it("Should succeed when caller has MINTER_ROLE and recipient is allowlisted", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployWithRolesFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);
      await token.approveWallet(account1.address);

      await expect(token.mint(account1.address, 1000n)).to.not.be.reverted;

      expect(await token.balanceOf(account1.address)).to.equal(1000n);
      expect(await token.totalSupply()).to.equal(1000n);
    });

    it("Should accumulate correctly with multiple mints", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployWithRolesFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);
      await token.approveWallet(account1.address);

      await token.mint(account1.address, 500n);
      await token.mint(account1.address, 300n);
      await token.mint(account1.address, 200n);

      expect(await token.balanceOf(account1.address)).to.equal(1000n);
      expect(await token.totalSupply()).to.equal(1000n);
    });

    it("Should allow minting to different allowlisted addresses", async function () {
      const { token, deployer, account1, account2 } = await loadFixture(
        deployWithRolesFixture
      );

      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(APPROVER_ROLE, deployer.address);
      await token.approveWallet(account1.address);
      await token.approveWallet(account2.address);

      await token.mint(account1.address, 500n);
      await token.mint(account2.address, 300n);

      expect(await token.balanceOf(account1.address)).to.equal(500n);
      expect(await token.balanceOf(account2.address)).to.equal(300n);
      expect(await token.totalSupply()).to.equal(800n);
    });
  });

  describe("Virtual Split Functionality", function () {
    async function deployWithMintingFixture() {
      const [deployer, account1, account2] = await hre.ethers.getSigners();

      const ChainEquityTokenFactory = await hre.ethers.getContractFactory(
        "ChainEquityToken"
      );
      const token = (await ChainEquityTokenFactory.deploy(
        "CET"
      )) as unknown as ChainEquityToken;

      const MINTER_ROLE = await token.MINTER_ROLE();
      const APPROVER_ROLE = await token.APPROVER_ROLE();
      await token.grantRole(MINTER_ROLE, deployer.address);
      await token.grantRole(APPROVER_ROLE, deployer.address);

      // Approve accounts and mint tokens
      await token.approveWallet(account1.address);
      await token.approveWallet(account2.address);
      await token.mint(account1.address, 1000n);
      await token.mint(account2.address, 500n);

      return { token, deployer, account1, account2 };
    }

    it("Should return multiplied balance after split", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployWithMintingFixture
      );

      // Initial balance should be 1000 (base balance * 1)
      expect(await token.balanceOf(account1.address)).to.equal(1000n);

      // Execute 2x split
      await token.executeSplit(2n);

      // Balance should be 2000 (base balance * 2)
      expect(await token.balanceOf(account1.address)).to.equal(2000n);
    });

    it("Should return multiplied total supply after split", async function () {
      const { token, deployer } = await loadFixture(deployWithMintingFixture);

      // Initial supply should be 1500 (base supply * 1)
      expect(await token.totalSupply()).to.equal(1500n);

      // Execute 3x split
      await token.executeSplit(3n);

      // Supply should be 4500 (base supply * 3)
      expect(await token.totalSupply()).to.equal(4500n);
    });

    it("Should emit SplitExecuted event with correct values", async function () {
      const { token, deployer } = await loadFixture(deployWithMintingFixture);

      const blockNumberBefore = await hre.ethers.provider.getBlockNumber();

      await expect(token.executeSplit(2n))
        .to.emit(token, "SplitExecuted")
        .withArgs(2n, BigInt(blockNumberBefore) + 1n);
    });

    it("Should not modify base balances after split", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployWithMintingFixture
      );

      // Get base balance before split (using super.balanceOf would require internal access)
      // Instead, we verify that the multiplier is applied correctly
      const balanceBefore = await token.balanceOf(account1.address);

      // Execute split
      await token.executeSplit(2n);

      // Balance should be doubled
      const balanceAfter = await token.balanceOf(account1.address);
      expect(balanceAfter).to.equal(balanceBefore * 2n);
    });

    it("Should compound multiple splits correctly", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployWithMintingFixture
      );

      // Initial balance: 1000
      expect(await token.balanceOf(account1.address)).to.equal(1000n);

      // Execute 2x split: balance should be 2000
      await token.executeSplit(2n);
      expect(await token.balanceOf(account1.address)).to.equal(2000n);

      // Execute 3x split: balance should be 6000 (1000 * 2 * 3)
      await token.executeSplit(3n);
      expect(await token.balanceOf(account1.address)).to.equal(6000n);
    });

    it("Should allow split with multiplier = 1 (no change)", async function () {
      const { token, deployer, account1 } = await loadFixture(
        deployWithMintingFixture
      );

      const balanceBefore = await token.balanceOf(account1.address);

      // Execute split with multiplier = 1
      await token.executeSplit(1n);

      // Balance should remain the same
      const balanceAfter = await token.balanceOf(account1.address);
      expect(balanceAfter).to.equal(balanceBefore);
    });

    it("Should revert when non-admin tries to execute split", async function () {
      const { token, account1 } = await loadFixture(deployWithMintingFixture);

      await expect(token.connect(account1).executeSplit(2n)).to.be.reverted;
    });

    it("Should revert when multiplier is 0", async function () {
      const { token, deployer } = await loadFixture(deployWithMintingFixture);

      await expect(token.executeSplit(0n)).to.be.revertedWith(
        "Multiplier must be greater than 0"
      );
    });

    it("Should apply multiplier to all balances correctly", async function () {
      const { token, deployer, account1, account2 } = await loadFixture(
        deployWithMintingFixture
      );

      // Execute 2x split
      await token.executeSplit(2n);

      // Both balances should be doubled
      expect(await token.balanceOf(account1.address)).to.equal(2000n);
      expect(await token.balanceOf(account2.address)).to.equal(1000n);
      expect(await token.totalSupply()).to.equal(3000n);
    });

    // Story 4.1: Comprehensive stock split tests
    describe("Story 4.1: Stock Split Corporate Actions", function () {
      async function deployWithMultipleHoldersFixture() {
        const [deployer, account1, account2, account3] =
          await hre.ethers.getSigners();

        const ChainEquityTokenFactory = await hre.ethers.getContractFactory(
          "ChainEquityToken"
        );
        const token = (await ChainEquityTokenFactory.deploy(
          "CET"
        )) as unknown as ChainEquityToken;

        const MINTER_ROLE = await token.MINTER_ROLE();
        const APPROVER_ROLE = await token.APPROVER_ROLE();
        await token.grantRole(MINTER_ROLE, deployer.address);
        await token.grantRole(APPROVER_ROLE, deployer.address);

        // Approve accounts and mint tokens to multiple holders
        await token.approveWallet(account1.address);
        await token.approveWallet(account2.address);
        await token.approveWallet(account3.address);
        await token.mint(account1.address, 1000n);
        await token.mint(account2.address, 500n);
        await token.mint(account3.address, 250n);

        return { token, deployer, account1, account2, account3 };
      }

      it("Should execute 2-for-1 split (multiplier = 2)", async function () {
        const { token, deployer, account1, account2, account3 } =
          await loadFixture(deployWithMultipleHoldersFixture);

        // Get balances before split
        const balance1Before = await token.balanceOf(account1.address);
        const balance2Before = await token.balanceOf(account2.address);
        const balance3Before = await token.balanceOf(account3.address);
        const supplyBefore = await token.totalSupply();

        // Execute 2-for-1 split
        await token.executeSplit(2n);

        // Verify all balances multiplied by 2
        expect(await token.balanceOf(account1.address)).to.equal(
          balance1Before * 2n
        );
        expect(await token.balanceOf(account2.address)).to.equal(
          balance2Before * 2n
        );
        expect(await token.balanceOf(account3.address)).to.equal(
          balance3Before * 2n
        );
        expect(await token.totalSupply()).to.equal(supplyBefore * 2n);
      });

      it("Should execute 3-for-1 split (multiplier = 3)", async function () {
        const { token, deployer, account1, account2, account3 } =
          await loadFixture(deployWithMultipleHoldersFixture);

        // Get balances before split
        const balance1Before = await token.balanceOf(account1.address);
        const balance2Before = await token.balanceOf(account2.address);
        const balance3Before = await token.balanceOf(account3.address);
        const supplyBefore = await token.totalSupply();

        // Execute 3-for-1 split
        await token.executeSplit(3n);

        // Verify all balances multiplied by 3
        expect(await token.balanceOf(account1.address)).to.equal(
          balance1Before * 3n
        );
        expect(await token.balanceOf(account2.address)).to.equal(
          balance2Before * 3n
        );
        expect(await token.balanceOf(account3.address)).to.equal(
          balance3Before * 3n
        );
        expect(await token.totalSupply()).to.equal(supplyBefore * 3n);
      });

      it("Should execute 7-for-1 split (multiplier = 7)", async function () {
        const { token, deployer, account1, account2, account3 } =
          await loadFixture(deployWithMultipleHoldersFixture);

        // Get balances before split
        const balance1Before = await token.balanceOf(account1.address);
        const balance2Before = await token.balanceOf(account2.address);
        const balance3Before = await token.balanceOf(account3.address);
        const supplyBefore = await token.totalSupply();

        // Execute 7-for-1 split
        await token.executeSplit(7n);

        // Verify all balances multiplied by 7
        expect(await token.balanceOf(account1.address)).to.equal(
          balance1Before * 7n
        );
        expect(await token.balanceOf(account2.address)).to.equal(
          balance2Before * 7n
        );
        expect(await token.balanceOf(account3.address)).to.equal(
          balance3Before * 7n
        );
        expect(await token.totalSupply()).to.equal(supplyBefore * 7n);
      });

      it("Should execute 10-for-1 split (multiplier = 10)", async function () {
        const { token, deployer, account1, account2, account3 } =
          await loadFixture(deployWithMultipleHoldersFixture);

        // Get balances before split
        const balance1Before = await token.balanceOf(account1.address);
        const balance2Before = await token.balanceOf(account2.address);
        const balance3Before = await token.balanceOf(account3.address);
        const supplyBefore = await token.totalSupply();

        // Execute 10-for-1 split
        await token.executeSplit(10n);

        // Verify all balances multiplied by 10
        expect(await token.balanceOf(account1.address)).to.equal(
          balance1Before * 10n
        );
        expect(await token.balanceOf(account2.address)).to.equal(
          balance2Before * 10n
        );
        expect(await token.balanceOf(account3.address)).to.equal(
          balance3Before * 10n
        );
        expect(await token.totalSupply()).to.equal(supplyBefore * 10n);
      });

      it("Should maintain proportional ownership after split", async function () {
        const { token, deployer, account1, account2, account3 } =
          await loadFixture(deployWithMultipleHoldersFixture);

        // Calculate ownership percentages before split
        const supplyBefore = await token.totalSupply();
        const balance1Before = await token.balanceOf(account1.address);
        const balance2Before = await token.balanceOf(account2.address);
        const balance3Before = await token.balanceOf(account3.address);

        const percent1Before =
          (balance1Before * 1000000n) / supplyBefore; // 6 decimal precision
        const percent2Before =
          (balance2Before * 1000000n) / supplyBefore;
        const percent3Before =
          (balance3Before * 1000000n) / supplyBefore;

        // Execute 7-for-1 split
        await token.executeSplit(7n);

        // Calculate ownership percentages after split
        const supplyAfter = await token.totalSupply();
        const balance1After = await token.balanceOf(account1.address);
        const balance2After = await token.balanceOf(account2.address);
        const balance3After = await token.balanceOf(account3.address);

        const percent1After = (balance1After * 1000000n) / supplyAfter;
        const percent2After = (balance2After * 1000000n) / supplyAfter;
        const percent3After = (balance3After * 1000000n) / supplyAfter;

        // Verify percentages unchanged (within rounding tolerance)
        expect(percent1After).to.equal(percent1Before);
        expect(percent2After).to.equal(percent2Before);
        expect(percent3After).to.equal(percent3Before);
      });

      it("Should emit SplitExecuted event with correct multiplier and block number", async function () {
        const { token, deployer } = await loadFixture(
          deployWithMultipleHoldersFixture
        );

        const blockNumberBefore = await hre.ethers.provider.getBlockNumber();

        // Execute split with multiplier 7
        await expect(token.executeSplit(7n))
          .to.emit(token, "SplitExecuted")
          .withArgs(7n, BigInt(blockNumberBefore) + 1n);
      });

      it("Should only allow DEFAULT_ADMIN_ROLE to execute split", async function () {
        const { token, account1, account2 } = await loadFixture(
          deployWithMultipleHoldersFixture
        );

        // Non-admin should not be able to execute split
        await expect(token.connect(account1).executeSplit(2n)).to.be.reverted;
        await expect(token.connect(account2).executeSplit(3n)).to.be.reverted;
      });

      it("Should reject multiplier = 0", async function () {
        const { token, deployer } = await loadFixture(
          deployWithMultipleHoldersFixture
        );

        await expect(token.executeSplit(0n)).to.be.revertedWith(
          "Multiplier must be greater than 0"
        );
      });

      it("Should verify base balances unchanged after split (via multiplier logic)", async function () {
        const { token, deployer, account1 } = await loadFixture(
          deployWithMultipleHoldersFixture
        );

        // Get initial balance (base * multiplier = 1000 * 1 = 1000)
        const initialBalance = await token.balanceOf(account1.address);
        expect(initialBalance).to.equal(1000n);

        // Execute 2x split
        await token.executeSplit(2n);

        // Balance should be 2000 (base * 2)
        const balanceAfter = await token.balanceOf(account1.address);
        expect(balanceAfter).to.equal(2000n);

        // Execute another 3x split
        await token.executeSplit(3n);

        // Balance should be 6000 (base * 2 * 3 = 1000 * 6)
        const balanceAfterSecond = await token.balanceOf(account1.address);
        expect(balanceAfterSecond).to.equal(6000n);

        // This confirms base balance (1000) remains unchanged, only multiplier changes
      });
    });
  });

  describe("Mutable Symbol Functionality", function () {
    it("Should return initial symbol from constructor", async function () {
      const { token } = await loadFixture(deployChainEquityTokenFixture);

      expect(await token.symbol()).to.equal("CET");
    });

    it("Should allow admin to change symbol", async function () {
      const { token, deployer } = await loadFixture(
        deployChainEquityTokenFixture
      );

      await token.changeSymbol("NEW");

      expect(await token.symbol()).to.equal("NEW");
    });

    it("Should emit SymbolChanged event when symbol changes", async function () {
      const { token, deployer } = await loadFixture(
        deployChainEquityTokenFixture
      );

      await expect(token.changeSymbol("NEW"))
        .to.emit(token, "SymbolChanged")
        .withArgs("CET", "NEW");
    });

    it("Should allow multiple symbol changes", async function () {
      const { token, deployer } = await loadFixture(
        deployChainEquityTokenFixture
      );

      // First change
      await token.changeSymbol("NEW1");
      expect(await token.symbol()).to.equal("NEW1");

      // Second change
      await token.changeSymbol("NEW2");
      expect(await token.symbol()).to.equal("NEW2");

      // Third change
      await token.changeSymbol("NEW3");
      expect(await token.symbol()).to.equal("NEW3");
    });

    it("Should emit correct old and new values on multiple changes", async function () {
      const { token, deployer } = await loadFixture(
        deployChainEquityTokenFixture
      );

      // First change
      await expect(token.changeSymbol("NEW1"))
        .to.emit(token, "SymbolChanged")
        .withArgs("CET", "NEW1");

      // Second change
      await expect(token.changeSymbol("NEW2"))
        .to.emit(token, "SymbolChanged")
        .withArgs("NEW1", "NEW2");
    });

    it("Should revert when non-admin tries to change symbol", async function () {
      const { token, account1 } = await loadFixture(
        deployChainEquityTokenFixture
      );

      await expect(
        token.connect(account1).changeSymbol("NEW")
      ).to.be.reverted;
    });

    it("Should revert when newSymbol is empty string", async function () {
      const { token, deployer } = await loadFixture(
        deployChainEquityTokenFixture
      );

      await expect(token.changeSymbol("")).to.be.revertedWith(
        "Symbol cannot be empty"
      );
    });

    it("Should allow changing symbol to same value", async function () {
      const { token, deployer } = await loadFixture(
        deployChainEquityTokenFixture
      );

      const initialSymbol = await token.symbol();
      await token.changeSymbol(initialSymbol);

      expect(await token.symbol()).to.equal(initialSymbol);
    });

    // Story 4.2: Comprehensive symbol change tests
    describe("Story 4.2: Symbol Change Corporate Actions", function () {
      async function deployWithBalancesFixture() {
        const [deployer, account1, account2, account3] =
          await hre.ethers.getSigners();

        const ChainEquityTokenFactory = await hre.ethers.getContractFactory(
          "ChainEquityToken"
        );
        const token = (await ChainEquityTokenFactory.deploy(
          "OLD"
        )) as unknown as ChainEquityToken;

        const MINTER_ROLE = await token.MINTER_ROLE();
        const APPROVER_ROLE = await token.APPROVER_ROLE();
        await token.grantRole(MINTER_ROLE, deployer.address);
        await token.grantRole(APPROVER_ROLE, deployer.address);

        // Approve accounts and mint tokens
        await token.approveWallet(account1.address);
        await token.approveWallet(account2.address);
        await token.approveWallet(account3.address);
        await token.mint(account1.address, 1000n);
        await token.mint(account2.address, 500n);
        await token.mint(account3.address, 250n);

        return { token, deployer, account1, account2, account3 };
      }

      it("Should change symbol correctly", async function () {
        const { token, deployer } = await loadFixture(
          deployWithBalancesFixture
        );

        // Verify initial symbol
        expect(await token.symbol()).to.equal("OLD");

        // Change symbol
        await token.changeSymbol("NEW");

        // Verify new symbol
        expect(await token.symbol()).to.equal("NEW");
      });

      it("Should preserve all balances after symbol change", async function () {
        const { token, deployer, account1, account2, account3 } =
          await loadFixture(deployWithBalancesFixture);

        // Get balances before symbol change
        const balance1Before = await token.balanceOf(account1.address);
        const balance2Before = await token.balanceOf(account2.address);
        const balance3Before = await token.balanceOf(account3.address);
        const supplyBefore = await token.totalSupply();

        // Change symbol
        await token.changeSymbol("NEW");

        // Verify all balances unchanged
        expect(await token.balanceOf(account1.address)).to.equal(
          balance1Before
        );
        expect(await token.balanceOf(account2.address)).to.equal(
          balance2Before
        );
        expect(await token.balanceOf(account3.address)).to.equal(
          balance3Before
        );
        expect(await token.totalSupply()).to.equal(supplyBefore);
      });

      it("Should preserve ownership percentages after symbol change", async function () {
        const { token, deployer, account1, account2, account3 } =
          await loadFixture(deployWithBalancesFixture);

        // Calculate ownership percentages before symbol change
        const supplyBefore = await token.totalSupply();
        const balance1Before = await token.balanceOf(account1.address);
        const balance2Before = await token.balanceOf(account2.address);
        const balance3Before = await token.balanceOf(account3.address);

        const percent1Before =
          (balance1Before * 1000000n) / supplyBefore; // 6 decimal precision
        const percent2Before =
          (balance2Before * 1000000n) / supplyBefore;
        const percent3Before =
          (balance3Before * 1000000n) / supplyBefore;

        // Change symbol
        await token.changeSymbol("NEW");

        // Calculate ownership percentages after symbol change
        const supplyAfter = await token.totalSupply();
        const balance1After = await token.balanceOf(account1.address);
        const balance2After = await token.balanceOf(account2.address);
        const balance3After = await token.balanceOf(account3.address);

        const percent1After = (balance1After * 1000000n) / supplyAfter;
        const percent2After = (balance2After * 1000000n) / supplyAfter;
        const percent3After = (balance3After * 1000000n) / supplyAfter;

        // Verify percentages unchanged
        expect(percent1After).to.equal(percent1Before);
        expect(percent2After).to.equal(percent2Before);
        expect(percent3After).to.equal(percent3Before);
      });

      it("Should emit SymbolChanged event with old and new values", async function () {
        const { token, deployer } = await loadFixture(
          deployWithBalancesFixture
        );

        // Change symbol from "OLD" to "NEW"
        await expect(token.changeSymbol("NEW"))
          .to.emit(token, "SymbolChanged")
          .withArgs("OLD", "NEW");
      });

      it("Should only allow DEFAULT_ADMIN_ROLE to change symbol", async function () {
        const { token, account1, account2 } = await loadFixture(
          deployWithBalancesFixture
        );

        // Non-admin should not be able to change symbol
        await expect(
          token.connect(account1).changeSymbol("NEW")
        ).to.be.reverted;
        await expect(
          token.connect(account2).changeSymbol("NEW")
        ).to.be.reverted;
      });

      it("Should reject empty string for symbol", async function () {
        const { token, deployer } = await loadFixture(
          deployWithBalancesFixture
        );

        await expect(token.changeSymbol("")).to.be.revertedWith(
          "Symbol cannot be empty"
        );
      });

      it("Should allow multiple sequential symbol changes", async function () {
        const { token, deployer } = await loadFixture(
          deployWithBalancesFixture
        );

        // First change
        await token.changeSymbol("NEW1");
        expect(await token.symbol()).to.equal("NEW1");

        // Second change
        await token.changeSymbol("NEW2");
        expect(await token.symbol()).to.equal("NEW2");

        // Third change
        await token.changeSymbol("NEW3");
        expect(await token.symbol()).to.equal("NEW3");
      });

      it("Should emit correct old and new values on multiple changes", async function () {
        const { token, deployer } = await loadFixture(
          deployWithBalancesFixture
        );

        // First change: OLD -> NEW1
        await expect(token.changeSymbol("NEW1"))
          .to.emit(token, "SymbolChanged")
          .withArgs("OLD", "NEW1");

        // Second change: NEW1 -> NEW2
        await expect(token.changeSymbol("NEW2"))
          .to.emit(token, "SymbolChanged")
          .withArgs("NEW1", "NEW2");
      });

      it("Should preserve balances through multiple symbol changes", async function () {
        const { token, deployer, account1, account2, account3 } =
          await loadFixture(deployWithBalancesFixture);

        // Get initial balances
        const balance1Initial = await token.balanceOf(account1.address);
        const balance2Initial = await token.balanceOf(account2.address);
        const balance3Initial = await token.balanceOf(account3.address);

        // Change symbol multiple times
        await token.changeSymbol("NEW1");
        await token.changeSymbol("NEW2");
        await token.changeSymbol("NEW3");

        // Verify balances unchanged
        expect(await token.balanceOf(account1.address)).to.equal(
          balance1Initial
        );
        expect(await token.balanceOf(account2.address)).to.equal(
          balance2Initial
        );
        expect(await token.balanceOf(account3.address)).to.equal(
          balance3Initial
        );
      });
    });
  });
});
