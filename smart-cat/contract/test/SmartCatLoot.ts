/* eslint-disable indent */
import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { SmartCatLoot, SmartCatLootPool, SmartCatMintFeePool, SmartCatNFT, SmartCatProxy, WrappedEthereumTest } from '../typechain-types';
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const axios = require('axios');
// const csv = require('csv-parser');
const nock = require('nock');
// const { Readable } = require('stream');
const fs = require('fs');

async function signForMint(signer: any, sender: string) {
	let msgSenderArray = ethers.getBytes(sender);

	let prefixArray = ethers.toUtf8Bytes('Stage 1 allowed for ');

	var toSign = new Uint8Array([...prefixArray, ...msgSenderArray]);
	let hashed = ethers.keccak256(toSign);
	return await signer.signMessage(ethers.getBytes(hashed));
}

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

async function signWalletsArray(wallets: string[], signer: any){
	const signed:string[][] = [];

	wallets = wallets.map((wallet) => {
		wallet = wallet.replace(/^"+|"+$/g, '');
		return wallet;
	})

	await Promise.all(
		wallets.map(async (walletAddress:string) => {
			if (ethereumAddressRegex.test(walletAddress)){
				const signature = await signForMint(signer, walletAddress)
				signed.push([walletAddress, signature])
			}
		}));
	return signed;
}

function signedwalletsToCsv(signedWallets:string[][]): string{
	let csv = "WalletAddress,Signature\r\n"
	signedWallets.forEach((item:string[]) =>{
		csv += `"${item[0]}","${item[1]}"\r\n`
	})
	return csv;
}

describe('SmartCatLoot', function () {
	let lootNFT: SmartCatLoot;
	let lootPool: SmartCatLootPool;
	let mintFeePool: SmartCatMintFeePool;
	let wETH: WrappedEthereumTest;
	let smartCatProxy: SmartCatProxy;
	let catNFT: SmartCatNFT;
	let account2: HardhatEthersSigner;
	let ownerAccount: HardhatEthersSigner;
	let purchaserAccount: HardhatEthersSigner;
	let supplementalAccount: HardhatEthersSigner;
	let owner: HardhatEthersSigner;
	let mintedTotal = 5;
	let mintPrice: bigint;// = ethers.parseUnits("0.1", 'ether');
	let feesTotal = ethers.parseUnits("100", 'ether');
	let expectedMintPoolA: bigint;
	let maticFeeDeposit = ethers.parseUnits("100", 'ether');
	let mintWallets: HardhatEthersSigner[] = [];
	let baseURI = 'https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat/loot-meta/';
	let signedWallets:string[][] = []

	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployInitialFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount, otherAccount2, supps] = await ethers.getSigners()

		const nft = await ethers.deployContract('SmartCatNFT');
		await nft.waitForDeployment();

		const SmartCatProxy = await ethers.getContractFactory('SmartCatProxyV3')
		const smartCat = await upgrades.deployProxy(SmartCatProxy, [
			await nft.getAddress(),
		]);
		await smartCat.waitForDeployment();

		const WrappedEthereumTest = await ethers.getContractFactory("WrappedEthereumTest");
		const _wETH = await WrappedEthereumTest.deploy(owner.address);
		await _wETH.waitForDeployment();



		const SmartCatLoot = await ethers.getContractFactory('SmartCatLoot');
		const _lootNFT = await upgrades.deployProxy(SmartCatLoot, [owner.address, _wETH.target, nft.target, smartCat.target]);
		await _lootNFT.waitForDeployment();

		const SmartCatLootPool = await ethers.getContractFactory('SmartCatLootPool');
		const _lootPool = await upgrades.deployProxy(SmartCatLootPool, [
			owner.address,
			_wETH.target,
			_lootNFT.target
		]);

		const SmartCatMintFeePool = await ethers.getContractFactory('SmartCatMintFeePool');
		const _mintFeePool = await upgrades.deployProxy(SmartCatMintFeePool, [
			owner.address,
			_wETH.target,
			_lootPool.target
		]);

		await _lootNFT.setSmartCatMintFeePool(_mintFeePool.target);
		await _lootPool.setSmartCatMintFeePool(_mintFeePool.target);

		await _lootNFT.setSmartCatLootPool(_lootPool.target);


		await _lootNFT.setBaseURI(baseURI);
		// console.log(`SmartCat NFT contract deployed: ${nft.target}`);
		// console.log(`SmartCat Proxy contract deployed: ${smartCat.target}`);
		// console.log(`WETH contract deployed: ${_wETH.target}`);
		// console.log(`SmartCatLoot deployed: ${_lootNFT.target}`);

		return { owner, otherAccount, otherAccount2, nft, smartCat, _wETH, _lootNFT, _lootPool, supps }
	}

	async function deployInitialFixtureAndMintings() {
		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount, otherAccount2, supps] = await ethers.getSigners()

		const nft = await ethers.deployContract('SmartCatNFT');
		await nft.waitForDeployment();

		const SmartCatProxy = await ethers.getContractFactory('SmartCatProxyV3')
		const smartCat = await upgrades.deployProxy(SmartCatProxy, [
			await nft.getAddress(),
		]);
		await smartCat.waitForDeployment();

		// supplementalAccount = supps;

		const WrappedEthereumTest = await ethers.getContractFactory(
			'WrappedEthereumTest'
		);
		const wETH = await WrappedEthereumTest.deploy(owner.address);
		await wETH.waitForDeployment();

		const SmartCatLoot = await ethers.getContractFactory('SmartCatLoot');
		const lootNFT = await upgrades.deployProxy(SmartCatLoot, [
			owner.address,
			wETH.target,
			nft.target,
			smartCat.target,
		]);

		await lootNFT.waitForDeployment();

		const SmartCatLootPool = await ethers.getContractFactory('SmartCatLootPool');
		const lootPool = await upgrades.deployProxy(SmartCatLootPool, [
			owner.address,
			wETH.target,
			lootNFT.target
		]);

		await lootNFT.setSmartCatLootPool(lootPool.target);

		const SmartCatMintFeePool = await ethers.getContractFactory('SmartCatMintFeePool');
		const mintFeePool = await upgrades.deployProxy(SmartCatMintFeePool, [
			owner.address,
			wETH.target,
			lootPool.target
		]);

		await lootNFT.setSmartCatMintFeePool(mintFeePool.target);
		await lootPool.setSmartCatMintFeePool(mintFeePool.target);

		mintPrice = await lootNFT.getMintPrice();

		// Attempt to buy
		await wETH.mint(
			otherAccount.address,
			ethers.parseUnits('10000', 'ether')
		);
		await wETH
			.connect(otherAccount)
			.approve(lootNFT, ethers.parseUnits('1000', 'ether'));

		return {
			owner,
			otherAccount,
			otherAccount2,
			nft,
			smartCat,
			wETH,
			lootNFT,
			lootPool,
			mintFeePool
		}
	}

	async function 	dumpPoolStats() {

		// Uncomment this to dump current status of pools, helps a lot with diagnosing and understanding what's going on

		/*const {burnShareWETH, burnShareMatic} = await lootNFT.expectedBurnValue();
		console.log(`burn: ${burnShareWETH} matic: ${burnShareMatic}`);

		const {mintShareWeth, poolAContribution} = await lootNFT.calculateBurnValues();
		console.log(`fromMint: ${mintShareWeth} poolA: ${poolAContribution}`);

		const supply = await lootNFT.totalSupply();
		console.log(`supply: ${supply}`);

		const poolCalc = await lootPool.calcTransactionVolume();
		const conv = ethers.formatEther(poolCalc);

		console.log(`Royalty Pool: ${conv}`);

		const poolATaken = await lootPool.poolATaken();
		const conv2 = ethers.formatEther(poolATaken);

		console.log(`Pool A Taken: ${conv2}`);

		let avail = (poolCalc * 50n / 100n) - poolATaken;
		const conv3 = ethers.formatEther(avail);

		console.log(`Pool A Remains: ${conv3}`);

		let poolB = await lootPool.calculatePoolB();
		let poolBFixed = ethers.formatEther(poolB);

		console.log(`Pool B WETH: ${poolBFixed}`);

		let poolBMaticFixed = ethers.formatEther(await lootPool.getPoolBMatic());
		let stlPoolMatic = ethers.formatEther(await lootPool.getSTLPoolMatic());

		console.log(`Pool B Matic: ${poolBMaticFixed} STL Pool Matic: ${stlPoolMatic}`);*/
	}

	describe('Deploy', function () {
		it('tokenURI', async function () {
			const { owner, otherAccount, otherAccount2, nft, smartCat, wETH, lootNFT, lootPool } =
				await loadFixture(deployInitialFixtureAndMintings);

			await nft.safeMint(owner.address, 1, 'token.json');
			await nft.safeMint(otherAccount.address, 2, 'token.json');

			// activate cat
			await smartCat.connect(otherAccount).feedCat(2);
			await lootNFT.updateStartTime(Math.round(Date.now() / 1000) - 1000);

			await lootNFT.connect(owner).setVerifier(otherAccount.address);
			let signature = signForMint(otherAccount, otherAccount.address);
			await lootNFT.connect(otherAccount).buy(2, signature);

			let baseURI = 'https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat/loot-meta/';

			await lootNFT.setBaseURI(baseURI);

			expect(await lootNFT.tokenURI(0)).to.eq(baseURI + '0.json');
			expect(await lootNFT.contractURI()).to.eq(baseURI + 'contract.json');
		});

		it('buy, signature stage 1', async function () {
			const { owner, otherAccount, otherAccount2, nft, smartCat, wETH, lootNFT, lootPool } = await loadFixture(deployInitialFixtureAndMintings);

			await nft.safeMint(otherAccount.address, 1, 'token.json');

			// activate cat
			await smartCat.connect(otherAccount).feedCat(1);
			await lootNFT.updateStartTime(Math.round(Date.now() / 1000) + 1000);
			await expect(lootNFT.connect(otherAccount).buy(1, ethers.ZeroHash)).to.be.revertedWithCustomError(lootNFT, 'MintingNotStarted');

			await lootNFT.updateStartTime(Math.round(Date.now() / 1000) - 1000);
			await expect(lootNFT.connect(otherAccount).buy(1, ethers.ZeroHash)).to.be.revertedWithCustomError(lootNFT, 'InvalidSignature');

			let signature = signForMint(otherAccount, otherAccount.address);
			await expect(lootNFT.connect(otherAccount).buy(1, signature)).to.be.revertedWithCustomError(lootNFT, 'WrongSigner');

			signature = signForMint(owner, otherAccount.address);
			await expect(lootNFT.connect(otherAccount).buy(1, signature)).to.be.revertedWithCustomError(lootNFT, 'WrongSigner');

			await lootNFT.connect(owner).setVerifier(otherAccount.address);
			signature = signForMint(otherAccount, otherAccount.address);
			expect(await lootNFT.connect(otherAccount).canBuy(1, signature)).to.eq(true);
			await lootNFT.connect(otherAccount).buy(1, signature);

			//test the 'canBuy' function
			await expect(lootNFT.connect(otherAccount).canBuy(1, ethers.ZeroHash)).to.be.revertedWithCustomError(lootNFT, 'InvalidSignature');
			await expect(lootNFT.connect(otherAccount).canBuy(1, signature)).to.be.revertedWithCustomError(lootNFT, 'OnlyOneToyMintAllowed');

			//Test the negative 'canBuy' calls. Positive is above and also at the open mint
			let signature2 = signForMint(otherAccount, otherAccount2.address);
			await expect(lootNFT.connect(otherAccount2).canBuy(3, ethers.ZeroHash)).to.be.revertedWithCustomError(lootNFT, 'InvalidSignature');
			await expect(lootNFT.connect(otherAccount2).canBuy(3, signature2)).to.be.revertedWithCustomError(lootNFT, 'ERC721NonexistentToken');

			await nft.safeMint(otherAccount2.address, 3, 'token.json');

			await expect(lootNFT.connect(otherAccount2).canBuy(3, signature2)).to.be.revertedWithCustomError(lootNFT, 'SmartCatMustBeAdoptedToMint');
			//await expect();
		});

		// no need to use CSV libs, because its very simple format: 1-2 columns of data
		it('generate signature list CSV for stage 1', async function () {
			const { owner, otherAccount, otherAccount2, nft, smartCat, wETH, lootNFT, lootPool } = await loadFixture(deployInitialFixtureAndMintings);

			const walletList = fs.readFileSync(__dirname + '/../data/cat_list.csv', 'utf8');
			// Mock http server to read wallet list from fake URI
			//nock("https://your.api.url").get("/cat_list.csv").reply(200, csv_content);
			try {
				// read single column CSV with list of walletAddresses
				//const walletList = await axios.get('https://your.api.url/cat_list.csv');

				// sign every walletAddress in the list, skip header
				signedWallets = await signWalletsArray(walletList.split(/\s+/), otherAccount);

				// format data as CSV
				let csv = await signedwalletsToCsv(signedWallets)

				// save CSV to file
				fs.writeFileSync(__dirname + '/../data/signed_list.csv', csv);

				const jsonObject = signedWallets.reduce<Object>((prev, current, index, value) => {
					prev[current[0]] = current[1];
					return prev;
				}, {});

				fs.writeFileSync(__dirname + '/../data/signed_list.json', JSON.stringify(jsonObject, undefined, "\t"));

			} catch(error) {
				console.error(error);
			};

		});

		it('buy, stage 2', async function () {
			const { owner, otherAccount, otherAccount2, nft, smartCat, wETH, lootNFT, lootPool } = await loadFixture(deployInitialFixtureAndMintings);

			await nft.safeMint(otherAccount.address, 1, 'token.json');

			// activate cat
			await smartCat.connect(otherAccount).feedCat(1);

			await lootNFT.updateStartTime(Math.round(Date.now() / 1000) - 24 * 60 * 60 - 1000);
			await expect(lootNFT.connect(otherAccount).buy(1, '0x')).to.emit(lootNFT, 'Transfer');
		});

		it('mint', async function () {
			const { owner, otherAccount, otherAccount2, nft, smartCat, _wETH, _lootNFT, _lootPool, supps } = await loadFixture(
				deployInitialFixture
			);
			purchaserAccount = otherAccount2;
			account2 = otherAccount;
			smartCatProxy = smartCat;
			ownerAccount = owner;
			catNFT = nft;
			wETH = _wETH;
			lootNFT = _lootNFT;
			lootPool = _lootPool;
			supplementalAccount = supps;

			for(let i=0; i < mintedTotal+1; i++) {
				let wallet = ethers.Wallet.createRandom().connect(owner.provider);
				await owner.sendTransaction({to: wallet.address, value: ethers.parseUnits("1", 'ether')});
				mintWallets[i] = wallet;
				await nft.safeMint(wallet.address, i, "token.json");

				await wETH.mint(wallet.address, ethers.parseUnits("10000", 'ether'));
				await wETH.connect(wallet).approve(lootNFT, ethers.parseUnits("1000", 'ether'));

				// activate cat
				await smartCat.connect(wallet).feedCat(i);
			}

			// await catNFT.safeMint(owner.address, 1, "token.json");
			// await catNFT.safeMint(account2.address, 2, "token.json");
			// await catNFT.safeMint(supplementalAccount.address, 3, "token.json");
			expect(await catNFT.ownerOf(0)).to.equal(mintWallets[0].address);

			const bal = await wETH.balanceOf(mintWallets[0].address);
			expect(await wETH.balanceOf(mintWallets[0])).to.eq(ethers.parseUnits("10000", 'ether'))

			await lootNFT.updateStartTime(Math.round(Date.now() / 1000) - 1000)

			// Attempt to buy
			await lootNFT.connect(owner).setVerifier(otherAccount.address);
			let signature = await signForMint(account2, mintWallets[0].address);
			await lootNFT.connect(mintWallets[0]).buy(0, signature);

			let bb = await wETH.balanceOf(lootNFT.target);
			console.log("Value before burn: " + ethers.formatEther(bb));

			await dumpPoolStats();

			// check owned
			expect(await lootNFT.ownerOf(0)).to.equal(mintWallets[0].address);
			expect(await lootNFT.totalSupply()).to.equal(1);

			await lootNFT.connect(owner).setMaxTokens(5);

			// 1. Check poolA, poolB and STL pool
			// TODO we dont use poolB, need to specify required value of calculatePoolA
			// for single and multiple buys
			expect(await lootNFT.calculatePoolA()).to.equal(mintPrice * 95n / 100n);
			expect(await lootPool.calculatePoolB()).to.equal(mintPrice / 100n);

			for (let i = 1; i < mintedTotal; i++) {
				let signature = await signForMint(otherAccount, mintWallets[i].address);
				await lootNFT.connect(mintWallets[i]).buy(i, signature);
			}

			// 3. Check poolA, B and STL
			expect(await lootNFT.calculatePoolA()).to.equal(mintPrice * BigInt(mintedTotal) * 95n / 100n);
			expect(await lootPool.calculatePoolB()).to.equal(mintPrice * BigInt(mintedTotal) / 100n);

			// total WETH in contract
			expect(await wETH.balanceOf(lootNFT.target)).to.equal(mintPrice * BigInt(mintedTotal) * 95n / 100n);

			await dumpPoolStats();
		});

		it('full mint', async function () {

			const lootPurchaser = lootNFT.connect(account2);

			// mintedTotal = 5;
			// // 4. purchase full amount (50)
			// for (let i = 5; i < mintedTotal; i++) {
			// 	await lootNFT.connect(mintWallets[i]).buy(i);
			// }

			await dumpPoolStats();

			expect(await lootNFT.calculatePoolA()).to.equal(mintPrice * BigInt(mintedTotal) * 95n / 100n);
			expect(await lootPool.calculatePoolB()).to.equal(mintPrice * BigInt(mintedTotal) / 100n);

			// attempt to purchase one more (go above max limit)
			let signature = await signForMint(account2, mintWallets[mintedTotal].address);
			await expect(lootNFT.connect(mintWallets[mintedTotal]).buy(mintedTotal, signature)).to.be.revertedWithCustomError(
				lootPurchaser,
				'MintLimitReached',
			);

			// 5. Simulate a lot of purchases, drop native currency and WETH:
			await wETH.connect(ownerAccount).mint(purchaserAccount.address, ethers.parseUnits("1999", 'ether'));
			await wETH.connect(purchaserAccount).transfer(lootPool.target, feesTotal); //at 10% royalty rate we expect 100Eth for 10000 transfers at average 0.1

			// console.log("Full Balance after minting and 10000 transfers: " + ethers.formatEther(await wETH.balanceOf(lootNFT.target)));
			expect(await wETH.balanceOf(lootPool.target)).to.equal(feesTotal);

			expect(await lootNFT.calculatePoolA()).to.equal(mintPrice * BigInt(mintedTotal) * 95n / 100n + feesTotal * 5n / 10n);
			expect(await lootPool.calculatePoolB()).to.equal(mintPrice * BigInt(mintedTotal) / 100n + feesTotal / 10n);

		});

		it('only 1 toy per wallet allowed', async function () {
			let signature = await signForMint(account2, mintWallets[0].address);
			await expect(lootNFT.connect(mintWallets[0]).buy(0, signature)).to.be.revertedWithCustomError(lootNFT, 'OnlyOneToyMintAllowed');
			await expect(lootNFT.connect(mintWallets[0]).canBuy(0, signature)).to.be.revertedWithCustomError(lootNFT, 'OnlyOneToyMintAllowed');
		});

		it('only 1 toy per cat allowed', async function () {
			await catNFT
				.connect(mintWallets[mintedTotal - 1])
				.transferFrom(mintWallets[mintedTotal - 1].address, mintWallets[mintedTotal].address, mintedTotal - 1);
			let signature = await signForMint(account2, mintWallets[mintedTotal].address);
			await expect(lootNFT.connect(mintWallets[mintedTotal]).canBuy(mintedTotal - 1, signature)).to.be.revertedWithCustomError(
				lootNFT,
				'OnlyOneToyMintPerCatAllowed',
			);
			await expect(lootNFT.connect(mintWallets[mintedTotal]).buy(mintedTotal - 1, signature)).to.be.revertedWithCustomError(
				lootNFT,
				'OnlyOneToyMintPerCatAllowed',
			);
		});

		it('check Royalty', async function () {
			// TODO support interface
			// ERC721OptimizedEnumerableUpgradeable
			// ERC721URIStorageUpgradeable
			// DerivedERC2981Royalty
			// ERC5169
		})

		it('ERC5169', async function () {
			// TODO
		})

		it('check Royalty', async function () {

			expect(await lootNFT.supportsInterface("0x2a55205a")).to.eq(true);
			expect(await lootNFT.supportsInterface("0x2a55205b")).to.eq(false);

			//expecting royalty to be 10%

			var spendAmount = 332000;

			expect(await lootNFT.royaltyInfo(1, spendAmount)).to.deep.equal([lootPool.target, spendAmount * 10 / 100])
		});

		it('check STL pools', async function () {

			// 6. check the pools

			// what's in the STL pool?
			const stlAmount = mintPrice * BigInt(mintedTotal) * 4n / 100n + feesTotal * 40n / 100n;
			expect(await lootPool.calculateSTLPool()).to.equal(stlAmount);

			//owner account bal
			expect(await wETH.balanceOf(ownerAccount.address)).to.eq(0);

			// 8. Withdraw STL pool
			// withdraw
			await lootPool.connect(ownerAccount).withdrawSTL();
			expect(await wETH.balanceOf(ownerAccount.address)).to.equal(stlAmount);
			expect(await lootPool.calculateSTLPool()).to.equal(0); //should be drained
		});

		it('Test Play mechanic', async function () {

			// play with a toy
			//start with negative tests
			//TODO: Can't get negative tests to work due to custom errors being used.

			// Loot#51 doesnt exist
			await expect(lootNFT.connect(mintWallets[0]).play(mintedTotal+1, 2)).to.revertedWithCustomError(
				lootNFT,
				'ERC721NonexistentToken' // ?
			).withArgs(mintedTotal+1);

			// Loot#4 owned by other
			await expect(lootNFT.connect(mintWallets[0]).play(4, 0)).to.be.revertedWithCustomError(
				lootNFT,
				'NeedToOwnTheToy'
			).withArgs(4);

			// SmartCat#4 doesnt exist
			await expect(lootNFT.connect(mintWallets[0]).play(0, mintedTotal+1)).to.be.revertedWithCustomError(
				lootNFT,
				'ERC721NonexistentToken'
			).withArgs(mintedTotal+1);

			await expect(lootNFT.connect(mintWallets[0]).play(0, 1)).to.be.revertedWithCustomError(
				lootNFT,
				'OnlyForSmartCatHolders'
			);

			await lootNFT.connect(mintWallets[0]).play(0, 0);
			await expect(lootNFT.connect(mintWallets[0]).play(0, 0)).to.be.revertedWithCustomError(
				lootNFT,
				'CatAlreadyPlayedWithToy' //'ERC721NonexistentToken(2)'
			)

			// read points
			let pointsPerPlay = await lootNFT.pointsPerPlay();
			expect(await lootNFT.pointsBalance(0)).to.eq(pointsPerPlay);

			// transfer
			await lootNFT.connect(mintWallets[0]).transferFrom(mintWallets[0].address, mintWallets[1].address, 0);

			// play
			await lootNFT.connect(mintWallets[1]).play(0, 1);

			expect(await lootNFT.pointsBalance(0)).to.eq(pointsPerPlay * 2n);

		});

		it('check burn 1', async function () {

			await dumpPoolStats();

			let wethReward100EthRoyalty = mintPrice * 95n / 100n + feesTotal * 50n / 100n / BigInt(mintedTotal);
			expectedMintPoolA = (feesTotal * 50n / 100n) / BigInt(mintedTotal);

			expect(await lootNFT.expectedBurnValue()).to.deep.equal([wethReward100EthRoyalty, 0]);

			await lootNFT.connect(mintWallets[1]).transferFrom(mintWallets[1].address, account2.address, 0);

			expect(await lootNFT.ownerOf(0)).to.eq(account2.address);

			await lootNFT.connect(account2).burn(0);

			expect(await wETH.balanceOf(account2.address)).to.eq(wethReward100EthRoyalty);

			await dumpPoolStats();
		});


		it('check burn 2 toys', async function () {

			await dumpPoolStats();

			let wethReward100EthRoyalty = mintPrice * 95n / 100n + feesTotal * 50n / 100n / BigInt(mintedTotal);
			expect(await lootNFT.expectedBurnValue()).to.deep.equal([wethReward100EthRoyalty, 0])

			let beforeBurn = await wETH.balanceOf(account2.address);

			for (let i = 1; i <= 2; i++) {

				await lootNFT.connect(mintWallets[i]).transferFrom(mintWallets[i].address, account2.address, i);
				await lootNFT.connect(account2).burn(i);
			}
			expect(await wETH.balanceOf(account2.address)).to.eq(wethReward100EthRoyalty * 2n + beforeBurn);

			await dumpPoolStats();
		});


		it('take pool B', async function () {

			await dumpPoolStats();

			//attempt with wrong account
			await expect(lootPool.connect(account2).withdrawPoolB()).to.revertedWithCustomError(
				lootNFT,
				'OwnableUnauthorizedAccount'
			);

			const balBefore = await wETH.balanceOf(ownerAccount.address);
			await lootPool.connect(ownerAccount).withdrawPoolB();
			const balAfter = await wETH.balanceOf(ownerAccount.address);

			//console.log("Before: " + ethers.formatEther(balBefore) + " After: " + ethers.formatEther(balAfter));

			await dumpPoolStats();
		});

		it('Deposit and burn again', async function () {

			await dumpPoolStats();
			// previous poolA contribution from royalty
			let previousContribution = (feesTotal * 50n / 100n) / BigInt(mintedTotal); // we minted 50 tokens

			// Simulate more transactions happening: another 10,000 to give us another 100 WETH in the pool
			await wETH.connect(purchaserAccount).transfer(lootPool.target, ethers.parseUnits("100", 'ether'));
			feesTotal += ethers.parseUnits("100", 'ether');

			await dumpPoolStats();

			// Recalc expected pool A from royalties
			let royaltyPoolA = (feesTotal * 50n / 100n - 3n * previousContribution);

			// Recalc expected pool A from minting
			let poolAfromMint = (mintPrice * 95n / 100n);

			let currentSupply = await lootNFT.totalSupply();

			let perUnitBurn = poolAfromMint + royaltyPoolA / currentSupply;

			//expected burn reward
			expect(await lootNFT.expectedBurnValue()).to.deep.eq([perUnitBurn, 0])

			let beforeBurn = await wETH.balanceOf(account2.address);

			for (let i = 3; i < 4; i++) {
				await lootNFT.connect(mintWallets[i]).transferFrom(mintWallets[i].address, account2.address, i);
				await lootNFT.connect(account2).burn(i);
			}

			expect(await wETH.balanceOf(account2.address)).to.eq(perUnitBurn * 1n + beforeBurn);

			await dumpPoolStats();

		});

		it('Deposit Matic and burn', async function () {

			// Simulate more transactions happening: another 10,000 to give us 100 ETH in the pool
			await account2.sendTransaction({
				to: lootPool.target,
				value: maticFeeDeposit
			});

			//expected burn reward
			const { burnShareWETH, burnShareMatic } = await lootNFT.expectedBurnValue();

			await dumpPoolStats();

			let balBefore = await ethers.provider.getBalance(account2.address);

			const supply = await lootNFT.totalSupply();

			let calcExpectedReward = (maticFeeDeposit * 50n / 100n) / supply;

			expect(calcExpectedReward).to.equal(burnShareMatic);

			//burn
			await lootNFT.connect(mintWallets[4]).transferFrom(mintWallets[4].address, account2.address, 4);
			await lootNFT.connect(account2).burn(4);

			let balAfter = await ethers.provider.getBalance(account2.address);

			let balDiff = balAfter - balBefore;

			let calcDiff = burnShareMatic - balDiff;

			//expect difference to be small (accounting for gas)
			expect(calcDiff).to.lessThan(ethers.parseUnits("0.01", 'ether'));

		});

		it('check STL & B pools', async function () {

			let balBefore = await ethers.provider.getBalance(ownerAccount.address);

			//attempt with wrong account
			const supPool = lootPool.connect(account2);
			await expect(supPool.withdrawSTL()).to.revertedWithCustomError(
				lootNFT,
				'OwnableUnauthorizedAccount'
			);

			const pool = lootPool.connect(ownerAccount);

			await pool.withdrawPoolB();
			let balAfter1 = await ethers.provider.getBalance(ownerAccount.address);
			await pool.withdrawSTL();
			let balAfter2 = await ethers.provider.getBalance(ownerAccount.address);

			let poolBDiff = balAfter1 - balBefore;
			let stlDiff = balAfter2 - balAfter1;

			//calculate expected
			let expectedPoolB = maticFeeDeposit * 10n / 100n;
			let expectedSTLPoolMatic = maticFeeDeposit * 40n / 100n;

			//console.log("Contribution from Pool B: " + ethers.formatEther(poolBDiff) + " Contribution from STL Pool: " + ethers.formatEther(stlDiff));

			expect(expectedPoolB - poolBDiff).to.lessThan(ethers.parseUnits("0.01", 'ether')); // Allow for gas
			expect(expectedSTLPoolMatic - stlDiff).to.lessThan(ethers.parseUnits("0.01", 'ether')); // Allow for gas
		});

		it('Check that burn value does not decrease, drain all tokens', async function () {

			// await dumpPoolStats();

			const { owner, otherAccount, otherAccount2, nft, smartCat, _wETH, _lootNFT, _lootPool, supps } = await loadFixture(
				deployInitialFixture
			);

			await lootNFT.updateStartTime(Math.round(Date.now() / 1000) - 1000)

			const w = []
			const tokensToTest = 5;

			await lootNFT.connect(owner).setVerifier(otherAccount.address);

			for (let i = 0; i < tokensToTest; i++) {
				let wallet = ethers.Wallet.createRandom().connect(owner.provider);
				await owner.sendTransaction({to: wallet.address, value: ethers.parseUnits("1", 'ether')});
				w[i] = wallet;
				await nft.safeMint(wallet.address, i, "token.json");

				await _wETH.mint(wallet.address, ethers.parseUnits("10000", 'ether'));
				await _wETH.connect(wallet).approve(lootNFT, ethers.parseUnits("1000", 'ether'));

				// activate cat
				await smartCat.connect(wallet).feedCat(i);
				let signature = await signForMint(otherAccount, wallet.address);
				await _lootNFT.connect(wallet).buy(i, signature);
			}
			await _wETH.connect(owner).mint(_lootPool.target, feesTotal);

			const [burnShareWETH, burnShareMatic] = await _lootNFT.expectedBurnValue();

			for (let i = 0; i < tokensToTest-1; i++) {
				await _lootNFT.connect(w[i]).burn(i);
			}

			const [burnShareWETH2, burnShareMatic2] = await _lootNFT.expectedBurnValue();

			//allow for tolerances
			let diffWETHBurn = burnShareWETH - burnShareWETH2;
			let diffMaticBurn = burnShareMatic - burnShareMatic2;

			//how do you get magnitude of bigint?
			if (diffWETHBurn < 0) {
				diffWETHBurn *= -1n;
			}

			if (diffMaticBurn < 0) {
				diffMaticBurn *= -1n;
			}

			expect(diffWETHBurn).to.lessThan(10); //check value is within 10 wei of what it should be (rounding issues!)
			expect(diffMaticBurn).to.lessThan(10);

			// burn final token
			await _lootNFT.connect(w[tokensToTest-1]).burn(tokensToTest-1);

			await dumpPoolStats();

			const txVolume = await _lootPool.calcTransactionVolume();
			const poolATaken = await _lootPool.poolATaken();

			let avail = (txVolume * 50n / 100n) - poolATaken; //Pool A share of the txVolume, minus remaining pool A

			expect(avail).to.equal(0); //Pool A should be completely empty

			expect(await _lootNFT.expectedBurnValue()).to.deep.equal([0,0]);

			expect(await _lootPool.getPoolAMatic()).to.equal(0);
		});

	})
})

