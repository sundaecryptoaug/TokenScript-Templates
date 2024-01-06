import {loadFixture, time} from '@nomicfoundation/hardhat-toolbox/network-helpers'
import {expect} from 'chai'
import {ethers, upgrades} from 'hardhat'

describe('SmartCat', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployInitialFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount, otherAccount2] = await ethers.getSigners()

		const nft = await ethers.deployContract('SmartCatNFT')
		await nft.waitForDeployment()

		const SmartCatProxy = await ethers.getContractFactory('SmartCatProxyV3')
		const smartCat = await upgrades.deployProxy(SmartCatProxy, [
			await nft.getAddress(),
		])
		await smartCat.waitForDeployment()

		return {owner, otherAccount, otherAccount2, nft, smartCat}
	}

	async function getUpgradeFixture() {

		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount, otherAccount2] = await ethers.getSigners()

		const nft = await ethers.deployContract('SmartCatNFT')
		await nft.waitForDeployment()

		const SmartCatProxy = await ethers.getContractFactory('SmartCatProxy')
		const smartCat = await upgrades.deployProxy(SmartCatProxy, [
			await nft.getAddress(),
		])
		await smartCat.waitForDeployment()

		return {owner, otherAccount, otherAccount2, nft, smartCat}
	}

	describe('All', function () {
		it('mint', async function () {
			const {owner, otherAccount, nft, smartCat} = await loadFixture(
				deployInitialFixture
			)
			await nft.safeMint(owner.address, 1, "token.json");
			expect(await nft.ownerOf(1)).to.equal(owner.address);
		})

		it('initialize', async function () {
			const {owner, otherAccount, nft, smartCat} = await loadFixture(
				deployInitialFixture
			)
			await expect(smartCat.initialize(await nft.getAddress())).to.revertedWithCustomError(smartCat, "InvalidInitialization()")
		})

		it('owner', async function () {
			const {owner, otherAccount, nft, smartCat} = await loadFixture(
				deployInitialFixture
			)
			expect(await smartCat.owner()).to.eq(owner.address)
		})

		it('getConfig', async function () {
			const {owner, otherAccount, nft, smartCat} = await loadFixture(
				deployInitialFixture
			)
			expect(await smartCat.getConfig()).to.eql([[60n,60n,60n],[1n,1n,1n], 20n]);
		})

		it('setMaxLevel', async function () {
			const {owner, otherAccount, nft, smartCat} = await loadFixture(
				deployInitialFixture
			)
			await expect(smartCat.connect(otherAccount).setMaxLevel(20)).to.reverted;
			await expect(smartCat.connect(owner).setMaxLevel(20)).to.not.reverted;

		})

		it('testUpgrade', async function () {
			const {owner, otherAccount, nft, smartCat} = await loadFixture(
				getUpgradeFixture
			);

			const SmartCatProxyUpgradeTest = await ethers.getContractFactory("SmartCatProxyV2");
			const smartCatUpgrade = await upgrades.upgradeProxy(await smartCat.getAddress(), SmartCatProxyUpgradeTest);
			await smartCatUpgrade.waitForDeployment();

			//expect(await smartCatUpgrade.getConfig()).to.not.reverted;
			//expect(await smartCatUpgrade.upgradeTest()).to.equal(true);
		})

		it('AdoptPlayInviteAndAccept', async function () {

			const {owner, otherAccount, otherAccount2, nft, smartCat} = await loadFixture(
				deployInitialFixture
			);

			// Create test cats
			await nft.safeMint(otherAccount.address, 1, "token.json");
			await nft.safeMint(otherAccount.address, 2, "token.json");
			await nft.safeMint(otherAccount2.address, 3, "token.json");

			const addr1SmartCat = smartCat.connect(otherAccount);
			await addr1SmartCat.feedCat(1);
			await addr1SmartCat.feedCat(2);

			const addr2SmartCat = smartCat.connect(otherAccount2);
			await addr2SmartCat.feedCat(3);

			// First accept should work
			expect(await addr1SmartCat.inviteCatForPlaying(1, 3)).to.not.reverted;
			expect(await addr1SmartCat.inviteCatForPlaying(2, 3)).to.not.reverted;
			expect(await addr2SmartCat.acceptPlayDate(3, 1)).to.not.reverted;

			// Cat too tired
			// No longer enforced at the contract level
			// await expect(addr2SmartCat.acceptPlayDate(3, 2)).to.be.revertedWith("Your cat is too tired to play :-(");

			// Cat has more energy after a rest
			await time.increase(120);
			expect(await addr2SmartCat.acceptPlayDate(3, 2)).to.not.reverted;
		})

		it('TestAlreadyFed', async function () {

			const {owner, otherAccount, otherAccount2, nft, smartCat} = await loadFixture(
				deployInitialFixture
			);

			await nft.safeMint(otherAccount.address, 1, "token.json");

			const addr1SmartCat = smartCat.connect(otherAccount);
			await addr1SmartCat.feedCat(1);
			expect(await addr1SmartCat.canFeed(1)).to.equal(false);

			// Cat feed again after a break
			await time.increase(120);
			expect(await addr1SmartCat.canFeed(1)).to.equal(true);
		})

		it('TestGetAllCats', async function () {

			const {owner, otherAccount, otherAccount2, nft, smartCat} = await loadFixture(
				deployInitialFixture
			);

			await nft.safeMint(otherAccount.address, 1, "token.json");
			await nft.safeMint(otherAccount.address, 2, "token.json");
			await nft.safeMint(otherAccount2.address, 3, "token.json");
			await nft.safeMint(otherAccount2.address, 4, "token.json");

			const addr1SmartCat = smartCat.connect(otherAccount);
			await addr1SmartCat.feedCat(1);
			await addr1SmartCat.feedCat(2);

			const addr2SmartCat = smartCat.connect(otherAccount2);
			await addr2SmartCat.feedCat(3);
			await addr2SmartCat.feedCat(4);

			let cats = await addr1SmartCat.getAllCats(0, 1);

			expect(cats).to.deep.equal([[1n, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 1n, 25n]]);

			cats = await addr1SmartCat.getAllCats(0, 100);

			expect(cats.length).to.equal(4);

			cats = await addr1SmartCat.getAllCats(0, 2);

			expect(cats).to.deep.equal([
				[1n, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 1n, 25n],
				[2n, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 1n, 25n]
			]);

			cats = await addr1SmartCat.getAllCats(2, 4);

			expect(cats).to.deep.equal([
				[3n, "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 1n, 25n],
				[4n, "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 1n, 25n]
			]);

			cats = await addr1SmartCat.getAllCats(1, 2);

			expect(cats).to.deep.equal([
				[2n, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 1n, 25n],
				[3n, "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 1n, 25n]
			]);
		})
	})
})
