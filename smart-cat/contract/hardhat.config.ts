import {HardhatUserConfig} from 'hardhat/config';
import '@openzeppelin/hardhat-upgrades';
import '@nomicfoundation/hardhat-toolbox';
import * as fs from 'fs';

const PRIVATE_KEY_TEST_PATH = __dirname + '/test-signing.key';
const PRIVATE_KEY_PROD_PATH = __dirname + '/prod-signing.key';

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.20',
    	settings: {
			optimizer: { enabled: true, runs: 200 },
		}
	},
	networks: {
		hardhat: {
			accounts: {
				count: 50,
				mnemonic: 'test test test test test test test test test test test junk',
				path: "m/44'/60'/0'/0",
			},
		},
		sepolia: {
			url: 'https://ethereum-sepolia.publicnode.com',
			accounts: [(fs.existsSync(PRIVATE_KEY_TEST_PATH) ? fs.readFileSync(PRIVATE_KEY_TEST_PATH).toString().trim() : '')],
		},
		polygon: {
			url: 'https://polygon-mainnet.infura.io/v3/3ca8f1ba91f84e1f97c99f6218fe3743',
			timeout: 300000,
			accounts: [(fs.existsSync(PRIVATE_KEY_PROD_PATH) ? fs.readFileSync(PRIVATE_KEY_PROD_PATH).toString().trim() : '')]
		},
		polygon_mumbai: {
			url: "https://polygon-mumbai.g.alchemy.com/v2/rVI6pOV4irVsrw20cJxc1fxK_1cSeiY0",
			timeout: 300000,
			accounts: [(fs.existsSync(PRIVATE_KEY_TEST_PATH) ? fs.readFileSync(PRIVATE_KEY_TEST_PATH).toString().trim() : '')]
		}
	},
	gasReporter: {
		enabled: true,
		currency: "USD",
		token: "MATIC",
		gasPriceApi: "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
		coinmarketcap: "4219e51a-d067-476d-9ff5-5a6f0a126f63"
	},
	etherscan: {
		//apiKey: 'BJRN2YJTX3TGDFSTRFP6TB8VUY8HJWPQCZ' // Ethereum
		apiKey: '3S2Z5PRED74I3IA74DGHR93Q31829BDBA8' // Polygon
	},
};

export default config;
