<script lang="ts">
	import context from '../lib/context';
	import {
		getTokenBoundClientInstance,
		setTokenBoundAccount,
		setChainIdName
	} from './../lib/utils';
	//import { getOwnerAddressFromResolver } from './../lib/nameResolver';
	import { ethers } from 'ethers';

	let token;
	let tba: string | undefined;
	let catName: string | undefined;
	let isCatNameAvailable: boolean | undefined;
	let isCatNameAvailablePending: boolean | undefined;
	let apiRequestStatus: 'success' | 'error' | undefined;
	let debounceTimer: number | undefined;
	let debouncePendingTimer: number | undefined;

	context.data.subscribe(async (value) => {
		if (!value.token) return;

		token = value.token;
		const tbaClient = getTokenBoundClientInstance(1);
		// @ts-ignore
		tba = await setTokenBoundAccount(tbaClient, token.contractAddress, token.tokenId);
		if (tba) catName = await getCatName(tba);
		// if the cat name is already defined, apply API request success
		// to show the Success State UI with name and id details shown.
		if (catName?.length) apiRequestStatus = 'success';
	});

	// @ts-ignore
	window.onConfirm = async () => {
		// @ts-ignore
		const challenge = `Registering your catId ${token.tokenId} name to ${catName}`;
		// @ts-ignore
		web3.personal.sign({ data: challenge }, async function (error, signature) {
			if (error) {
				alert('Something went wrong. Please try again.');
				return;
			}
			const apiStatus = await applySubNameENS(
				'http://scriptproxy.smarttokenlabs.com:8083',
				catName,
				token.tokenId,
				signature
			);

			if (apiStatus == 'pass') {
				window.close(); //TODO: Find out how to display tick
			} else {
				//throw Error("fail"); //display cross/fail
				window.close();
			}
		});
	};

	async function getCatName(tba: string) {
		const catNameRequest = await fetch(`http://scriptproxy.smarttokenlabs.com:8083/name/${tba}`);
		return catNameRequest.text();
	}

	async function applySubNameENS(
		url: string,
		catName: string | undefined,
		tokenId: string,
		signature: string
	): Promise<string> {
		try {
			const response = await fetch(`${url}/${catName}/${tokenId}/${tba}/${signature}`, {
				method: 'POST'
			});
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			apiRequestStatus = 'success';
			const responseText = response.text();
			console.log('response data', responseText);
			return responseText;
		} catch (error) {
			apiRequestStatus = 'error';
			console.error('Error during POST request:', error);
		}

		return 'fail';
	}

	// Define the ENS resolver contract address for now, will add dynamic resolution if needed
	const ensResolverAddress = '0x4dBFD41eA7639eB5FbC95e4D2Ea63369e7Be143f';

	const returnAbi = [
		{
			constant: false,
			inputs: [
				{
					name: 'sender',
					type: 'address'
				},
				{
					name: 'urls',
					type: 'string[]'
				},
				{
					name: 'callData',
					type: 'bytes'
				},
				{
					name: 'callbackFunction',
					type: 'bytes4'
				},
				{
					name: 'extraData',
					type: 'bytes'
				}
			],
			name: 'OffchainLookup',
			outputs: [],
			payable: false,
			stateMutability: 'nonpayable',
			type: 'function'
		}
	];

	const decodeAbi = [
		{
			constant: true,
			inputs: [],
			name: 'decode',
			outputs: [
				{
					name: 'address',
					type: 'bytes'
				},
				{
					name: 'time',
					type: 'uint64'
				},
				{
					name: 'sig',
					type: 'bytes'
				}
			],
			payable: false,
			stateMutability: 'view',
			type: 'function'
		}
	];

	const ensAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

	async function resolve(_name: string): Promise<string> {
		const name = _name + '.smartcat.eth';

		// @ts-ignore
		const provider = new ethers.JsonRpcProvider(window.rpcUrl, {
			// @ts-ignore
			chainId: token.chainId,
			// @ts-ignore
			name: setChainIdName(token.chainId),
			ensAddress
		});

		const namehash = ethers.namehash(name);
		const dnsEncode = ethers.dnsEncode(name);
		const funcEncode = '0x3b3b57de' + namehash.substring(2);

		const catResolver = new ethers.Contract(
			ensResolverAddress,
			['function resolve(bytes name, bytes data) view returns (bytes)'],
			provider
		);

		//call, get error
		try {
			const resolverTx = await catResolver.resolve(dnsEncode, funcEncode);
			console.log(resolverTx);
		} catch (error) {
			//break down the data
			const iface = new ethers.Interface(returnAbi);
			// @ts-ignore
			const decoded = iface.decodeFunctionData('OffchainLookup', error.data);

			//format URL:
			const callUrl = decoded.urls[0]
				.replace('{sender}', decoded.sender)
				.replace('{data}', decoded.callData);

			try {
				const response = await fetch(callUrl);

				if (response.ok) {
					const data = await response.json();

					//split up the response data
					const decode = new ethers.Interface(decodeAbi);
					const decoded = decode.decodeFunctionResult('decode', data.data);

					var truncated = decoded.address;
					if (decoded.address.length > 42) {
						truncated = '0x' + decoded.address.substring(decoded.address.length - 40);
					}

					return ethers.getAddress(truncated);
				}
			} catch (callError) {
				// nop, expected
			}
		}

		return '0x0000000000000000000000000000000000000000';
	}

	const checkCatNameAvailability = async (event: Event) => {
		// @ts-ignore
		catName = event.target.value.replace(/\s+/g, '-').replace(/-{2,}/g, '').replace(/^-+/g, '');
		isCatNameAvailablePending = undefined;
		isCatNameAvailable = undefined;
		clearTimeout(debounceTimer);
		clearTimeout(debouncePendingTimer);
		// @ts-ignore
		debouncePendingTimer = setTimeout(() => {
			isCatNameAvailablePending = true;
		}, 500);
		// @ts-ignore
		debounceTimer = setTimeout(async () => {
			if (!catName?.length) {
				isCatNameAvailablePending = undefined;
				isCatNameAvailable = undefined;
				return;
			}
			try {
				const getIsCatNameAvailable: string = await resolve(catName);
				// @ts-ignore
				console.log('getIsCatNameAvailable......', getIsCatNameAvailable);
				// @ts-ignore
				const availableResolverStr = '0x0000000000000000000000000000000000000000';
				// @ts-ignore
				isCatNameAvailable = getIsCatNameAvailable === availableResolverStr;
				isCatNameAvailablePending = false;
			} catch (error) {
				console.log('testing err.....');
				console.error('Error checking cat name availability:', error);
				isCatNameAvailable = false;
			}
		}, 1000);
	};
</script>

<div>
	<div>
		<div class="badge-container">
			<svg
				width="100%"
				height="100%"
				viewBox="0 0 947 947"
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				xmlns:xlink="http://www.w3.org/1999/xlink"
				xml:space="preserve"
				xmlns:serif="http://www.serif.com/"
				style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
				><g
					><path
						d="M881.798,335.303c0,-16.707 -13.738,-30.271 -30.66,-30.271c-252.726,89.473 -504.636,114.123 -755.776,76.446c-16.922,0 -30.66,13.565 -30.66,30.272l-0,60.544c-0,16.707 13.738,30.271 30.66,30.271c251.925,21.399 503.851,1.336 755.776,-76.446c16.922,-0 30.66,-13.565 30.66,-30.272l0,-60.544Z"
						style="fill:#7b18ff;"
					/><use
						xlink:href="#_Image1"
						x="58.746"
						y="299.535"
						width="830.129px"
						height="217.613px"
						transform="matrix(0.998952,0,0,0.998226,0,3.41061e-13)"
					/><path
						d="M172.126,508.219l-0,-115.996c-26.923,-2.541 -53.823,-6.114 -80.713,-10.745c-14.742,0 -26.711,13.565 -26.711,30.272l-0,60.544c-0,16.707 11.969,30.271 26.711,30.271c26.908,2.624 53.817,4.509 80.713,5.654Z"
						style="fill:#404040;"
					/><use
						xlink:href="#_Image2"
						x="57.975"
						y="376.169"
						width="121.424px"
						height="137.746px"
						transform="matrix(0.995278,0,0,0.998158,1.7053e-13,3.41061e-13)"
					/><circle cx="466.228" cy="637.968" r="101.86" style="fill:#fcd792;" /><use
						xlink:href="#_Image3"
						x="355.313"
						y="529.268"
						width="220.723px"
						height="220.723px"
						transform="matrix(0.998747,0,0,0.998747,0,0)"
					/><path
						d="M443.496,557.528c4.723,-10.965 17.46,-16.032 28.425,-11.309c10.965,4.724 16.032,17.461 11.309,28.426c-4.724,10.965 -17.461,16.032 -28.426,11.308c-10.965,-4.723 -16.032,-17.46 -11.308,-28.425Z"
						style="fill:#212121;"
					/><use
						xlink:href="#_Image4"
						x="441.42"
						y="544.377"
						width="45.895px"
						height="45.895px"
						transform="matrix(0.997724,-8.30773e-17,8.30773e-17,0.997724,4.26326e-14,0)"
					/><path
						d="M802.017,368.957c3.625,-8.416 13.401,-12.305 21.816,-8.68c8.415,3.626 12.304,13.401 8.679,21.816c-3.625,8.416 -13.4,12.305 -21.816,8.68c-8.415,-3.626 -12.304,-13.401 -8.679,-21.816Z"
						style="fill:#5493fb;"
					/><use
						xlink:href="#_Image5"
						x="801.96"
						y="357.142"
						width="41.709px"
						height="41.709px"
						transform="matrix(0.99308,0,0,0.99308,-8.52651e-14,-8.52651e-14)"
					/><path
						d="M740.86,384.246c3.625,-8.415 13.4,-12.305 21.816,-8.679c8.415,3.625 12.304,13.4 8.679,21.816c-3.625,8.415 -13.401,12.304 -21.816,8.679c-8.415,-3.625 -12.305,-13.401 -8.679,-21.816Z"
						style="fill:#5493fb;"
					/><use
						xlink:href="#_Image5"
						x="740.376"
						y="372.538"
						width="41.709px"
						height="41.709px"
						transform="matrix(0.99308,0,0,0.99308,0,0)"
					/><path
						d="M683.525,399.535c3.625,-8.415 13.4,-12.304 21.816,-8.679c8.415,3.625 12.304,13.401 8.679,21.816c-3.625,8.415 -13.401,12.305 -21.816,8.679c-8.415,-3.625 -12.304,-13.4 -8.679,-21.816Z"
						style="fill:#5493fb;"
					/><use
						xlink:href="#_Image5"
						x="682.642"
						y="387.934"
						width="41.709px"
						height="41.709px"
						transform="matrix(0.99308,0,0,0.99308,-8.52651e-14,0)"
					/><path
						d="M448.115,440.78c3.625,-8.415 13.401,-12.304 21.816,-8.679c8.416,3.625 12.305,13.401 8.679,21.816c-3.625,8.415 -13.4,12.305 -21.816,8.679c-8.415,-3.625 -12.304,-13.4 -8.679,-21.816Z"
						style="fill:#5493fb;"
					/><use
						xlink:href="#_Image6"
						x="446.171"
						y="430.043"
						width="40.709px"
						height="40.709px"
						transform="matrix(0.992911,0,0,0.992911,-8.52651e-14,0)"
					/><path
						d="M104.216,438.28c3.625,-8.415 13.401,-12.304 21.816,-8.679c8.416,3.625 12.305,13.4 8.68,21.816c-3.626,8.415 -13.401,12.304 -21.816,8.679c-8.416,-3.625 -12.305,-13.4 -8.68,-21.816Z"
						style="fill:#5493fb;"
					/><use
						xlink:href="#_Image7"
						x="102.016"
						y="428.905"
						width="35.834px"
						height="35.834px"
						transform="matrix(0.995398,0,0,0.995398,-2.13163e-14,0)"
					/><path
						d="M474.671,445.875c0,-6.241 -5.067,-11.309 -11.308,-11.309c-6.242,0 -11.309,5.068 -11.309,11.309l-0,117.53c-0,6.242 5.067,11.309 11.309,11.309c6.241,-0 11.308,-5.067 11.308,-11.309l0,-117.53Z"
						style="fill:#fcd792;"
					/><use
						xlink:href="#_Image8"
						x="451.635"
						y="432.486"
						width="33.617px"
						height="149.159px"
						transform="matrix(0.98875,0,0,0.994391,0,0)"
					/></g
				><g
					><g
						><path
							d="M417.609,632.696c0.159,-0.53 0.418,-0.968 0.776,-1.312c0.358,-0.345 0.749,-0.571 1.174,-0.677c0.424,-0.106 0.855,-0.079 1.292,0.08c0.438,0.159 0.816,0.477 1.134,0.955c0.106,0.132 0.206,0.291 0.298,0.477c0.093,0.186 0.14,0.358 0.14,0.517c0.053,3.792 0.033,7.578 -0.06,11.357c-0.093,3.779 -0.245,7.565 -0.458,11.357c0,0.61 -0.192,1.087 -0.576,1.432c-0.385,0.345 -0.822,0.563 -1.313,0.656c-0.491,0.093 -0.988,0.04 -1.492,-0.159c-0.504,-0.199 -0.875,-0.537 -1.114,-1.014c-0.026,-0.027 -0.039,-0.053 -0.039,-0.08l-0,0.08c-1.724,-2.838 -3.541,-5.563 -5.45,-8.175c-1.909,-2.612 -3.898,-5.204 -5.967,-7.777l0,12.053c0,0.822 -0.013,1.492 -0.04,2.009c-0.026,0.517 -0.059,0.922 -0.099,1.213c-0.04,0.292 -0.1,0.544 -0.179,0.756c-0.239,0.637 -0.603,1.061 -1.094,1.273c-0.491,0.212 -0.988,0.265 -1.492,0.159c-0.504,-0.106 -0.941,-0.371 -1.312,-0.795c-0.372,-0.425 -0.557,-0.955 -0.557,-1.591l-0,-11.099c-0,-1.114 -0.007,-2.154 -0.02,-3.122c-0.014,-0.968 -0.02,-1.784 -0.02,-2.447c-0,-0.901 -0.013,-1.797 -0.04,-2.685c-0.026,-0.888 -0.026,-1.783 0,-2.685c0,-0.451 0.113,-0.835 0.338,-1.154c0.226,-0.318 0.511,-0.563 0.855,-0.735c0.345,-0.173 0.716,-0.272 1.114,-0.299c0.398,-0.026 0.783,0.027 1.154,0.159c0.318,0.106 0.643,0.325 0.974,0.657c0.332,0.331 0.657,0.689 0.975,1.074c0.318,0.384 0.617,0.769 0.895,1.153c0.278,0.385 0.511,0.696 0.696,0.935c0.69,0.849 1.485,1.823 2.387,2.924c0.902,1.1 1.737,2.141 2.506,3.122c0.769,1.008 1.518,2.016 2.247,3.024c0.73,1.007 1.439,2.015 2.129,3.023c0.079,-2.413 0.132,-4.813 0.159,-7.2c0.026,-2.387 0.04,-4.787 0.04,-7.2l0.039,-0.239Z"
							style="fill:#fff;fill-rule:nonzero;"
						/><path
							d="M447.086,655.132c-0.08,0.583 -0.279,1.08 -0.597,1.491c-0.318,0.411 -0.683,0.696 -1.094,0.856c-0.411,0.159 -0.849,0.179 -1.313,0.059c-0.464,-0.119 -0.895,-0.431 -1.293,-0.935c-0.344,-0.424 -0.537,-0.895 -0.576,-1.412c-0.04,-0.517 -0.113,-1.027 -0.219,-1.531c-0.265,-1.459 -0.65,-2.957 -1.154,-4.495c-1.644,0.026 -3.275,0.04 -4.893,0.04c-1.617,-0 -3.235,0.013 -4.853,0.039c-0.238,0.69 -0.444,1.393 -0.616,2.109c-0.173,0.716 -0.338,1.418 -0.497,2.108c-0.133,0.53 -0.252,1.081 -0.358,1.651c-0.106,0.57 -0.345,1.067 -0.716,1.491c-0.451,0.531 -0.935,0.829 -1.452,0.895c-0.517,0.067 -0.982,-0.019 -1.393,-0.258c-0.411,-0.239 -0.742,-0.603 -0.994,-1.094c-0.252,-0.491 -0.338,-1.054 -0.259,-1.691c0.08,-0.822 0.239,-1.631 0.478,-2.426c0.238,-0.796 0.464,-1.591 0.676,-2.387c1.193,-4.561 2.731,-8.977 4.614,-13.246c0.159,-0.372 0.325,-0.73 0.498,-1.074c0.172,-0.345 0.338,-0.69 0.497,-1.035c0.185,-0.371 0.371,-0.769 0.557,-1.193c0.185,-0.424 0.404,-0.815 0.656,-1.173c0.252,-0.358 0.55,-0.663 0.895,-0.915c0.345,-0.252 0.769,-0.378 1.273,-0.378c0.663,-0 1.22,0.212 1.671,0.636c1.803,1.803 3.288,3.839 4.455,6.106c1.167,2.268 2.214,4.581 3.142,6.942c0.557,-0.027 1.101,-0.027 1.631,-0c0.531,0.026 1.008,0.265 1.432,0.716c0.372,0.371 0.591,0.769 0.657,1.193c0.066,0.424 0.026,0.835 -0.12,1.233c-0.145,0.398 -0.384,0.743 -0.716,1.034c-0.331,0.292 -0.735,0.491 -1.213,0.597c0.265,0.928 0.497,1.876 0.696,2.844c0.199,0.968 0.365,1.943 0.498,2.924l-0,0.279Zm-8.115,-10.82c-0.504,-1.194 -1.041,-2.38 -1.611,-3.561c-0.571,-1.18 -1.214,-2.3 -1.93,-3.361c-0.53,1.167 -1.027,2.327 -1.491,3.481c-0.464,1.153 -0.895,2.327 -1.293,3.52c1.246,-0.026 2.34,-0.04 3.282,-0.04c0.941,0 1.955,-0.013 3.043,-0.039Z"
							style="fill:#fff;fill-rule:nonzero;"
						/><path
							d="M478.233,655.251c-0.08,0.583 -0.292,1.081 -0.637,1.492c-0.345,0.411 -0.742,0.696 -1.193,0.855c-0.451,0.159 -0.915,0.166 -1.393,0.02c-0.477,-0.146 -0.875,-0.497 -1.193,-1.054c-0.265,-0.451 -0.418,-0.922 -0.457,-1.413c-0.04,-0.49 -0.087,-1.001 -0.14,-1.531c-0.053,-0.583 -0.112,-1.094 -0.179,-1.532c-0.066,-0.437 -0.139,-0.948 -0.218,-1.531c-0.239,-1.591 -0.504,-3.162 -0.796,-4.714c-0.292,-1.551 -0.623,-3.109 -0.994,-4.674c-0.531,1.326 -1.035,2.639 -1.512,3.938c-0.477,1.3 -0.955,2.612 -1.432,3.938c-0.371,0.982 -0.736,1.969 -1.094,2.964c-0.358,0.994 -0.776,1.956 -1.253,2.884c-0.159,0.318 -0.424,0.577 -0.796,0.776c-0.371,0.198 -0.769,0.311 -1.193,0.338c-0.424,0.026 -0.822,-0.033 -1.193,-0.179c-0.372,-0.146 -0.65,-0.391 -0.836,-0.736c-1.14,-2.201 -2.267,-4.389 -3.381,-6.564c-1.114,-2.174 -2.228,-4.362 -3.341,-6.563c-0.133,1.352 -0.252,2.711 -0.358,4.077c-0.106,1.366 -0.226,2.725 -0.358,4.077c-0.027,0.425 -0.053,0.942 -0.08,1.552c-0.026,0.61 -0.073,1.226 -0.139,1.85c-0.066,0.623 -0.146,1.219 -0.239,1.79c-0.093,0.57 -0.245,1.014 -0.457,1.332c-0.319,0.531 -0.736,0.875 -1.253,1.034c-0.517,0.16 -1.021,0.173 -1.512,0.04c-0.491,-0.132 -0.902,-0.404 -1.233,-0.815c-0.332,-0.411 -0.484,-0.935 -0.458,-1.572c0.053,-1.087 0.146,-2.161 0.279,-3.222c0.132,-1.06 0.252,-2.134 0.358,-3.222c0.212,-2.36 0.431,-4.707 0.656,-7.041c0.226,-2.333 0.444,-4.694 0.657,-7.08c0.053,-0.69 0.192,-1.326 0.417,-1.91c0.226,-0.583 0.71,-0.994 1.452,-1.233c0.292,-0.106 0.597,-0.146 0.915,-0.119c0.318,0.026 0.61,0.119 0.875,0.278c0.584,0.372 1.041,0.882 1.373,1.532c0.331,0.65 0.643,1.266 0.934,1.85c0.504,0.954 0.995,1.916 1.472,2.883c0.478,0.968 0.955,1.93 1.432,2.884c0.584,1.22 1.174,2.42 1.77,3.6c0.597,1.181 1.214,2.367 1.85,3.561c0.159,-0.398 0.312,-0.796 0.458,-1.194c0.146,-0.397 0.298,-0.795 0.457,-1.193c0.292,-0.69 0.564,-1.386 0.816,-2.088c0.252,-0.703 0.51,-1.399 0.775,-2.089c0.372,-0.902 0.723,-1.79 1.054,-2.665c0.332,-0.875 0.657,-1.764 0.975,-2.665c0.265,-0.663 0.517,-1.379 0.756,-2.148c0.238,-0.769 0.623,-1.419 1.153,-1.949c0.372,-0.398 0.776,-0.637 1.214,-0.716c0.437,-0.08 0.848,-0.047 1.233,0.099c0.384,0.146 0.729,0.391 1.034,0.736c0.305,0.345 0.524,0.742 0.656,1.193c0.16,0.61 0.345,1.3 0.557,2.069c0.212,0.769 0.398,1.458 0.557,2.068c0.292,1.114 0.557,2.208 0.796,3.282c0.238,1.074 0.464,2.168 0.676,3.282c0.371,1.83 0.696,3.64 0.975,5.43c0.278,1.79 0.523,3.6 0.736,5.429l-0,0.279Z"
							style="fill:#fff;fill-rule:nonzero;"
						/><path
							d="M495.099,651.353c0.477,0.026 0.895,0.152 1.253,0.377c0.358,0.226 0.65,0.498 0.875,0.816c0.225,0.318 0.358,0.683 0.398,1.094c0.04,0.411 -0.047,0.829 -0.259,1.253c-0.079,0.186 -0.245,0.404 -0.497,0.656c-0.252,0.252 -0.484,0.405 -0.696,0.458c-1.697,0.504 -3.441,0.815 -5.231,0.935c-1.79,0.119 -3.56,0.086 -5.311,-0.1c-0.503,-0.053 -1.054,-0.106 -1.65,-0.159c-0.597,-0.053 -1.121,-0.225 -1.572,-0.517c-0.822,-0.531 -1.233,-1.286 -1.233,-2.268l0,-16.945c-0.292,-0.213 -0.53,-0.478 -0.716,-0.796c-0.185,-0.318 -0.298,-0.656 -0.338,-1.014c-0.04,-0.358 0.007,-0.703 0.139,-1.035c0.133,-0.331 0.358,-0.616 0.677,-0.855c0.53,-0.424 1.14,-0.709 1.829,-0.855c0.69,-0.146 1.366,-0.272 2.029,-0.378c1.379,-0.212 2.758,-0.318 4.137,-0.318c1.379,-0 2.785,-0.014 4.217,-0.04c0.424,-0 0.915,-0.033 1.471,-0.099c0.557,-0.067 1.048,-0.02 1.472,0.139c0.504,0.185 0.902,0.477 1.194,0.875c0.291,0.398 0.464,0.822 0.517,1.273c0.053,0.451 -0.033,0.888 -0.259,1.313c-0.225,0.424 -0.616,0.755 -1.173,0.994c-0.663,0.265 -1.373,0.385 -2.128,0.358c-0.756,-0.027 -1.479,-0.04 -2.168,-0.04c-1.008,0 -2.016,0.013 -3.024,0.04c-1.007,0.027 -2.015,0.106 -3.023,0.239l0,5.529c0.955,0.053 1.91,0.053 2.864,-0c0.955,-0.053 1.91,-0.119 2.864,-0.199c0.425,-0.026 0.849,-0.066 1.273,-0.119c0.425,-0.053 0.862,-0.053 1.313,-0c0.583,0.079 1.034,0.318 1.353,0.716c0.318,0.398 0.51,0.842 0.576,1.332c0.067,0.491 -0.02,0.975 -0.258,1.452c-0.239,0.478 -0.623,0.822 -1.154,1.035c-0.451,0.185 -1.061,0.324 -1.83,0.417c-0.769,0.093 -1.578,0.159 -2.426,0.199c-0.849,0.04 -1.684,0.06 -2.506,0.06c-0.822,-0 -1.512,-0.013 -2.069,-0.04l0,4.893c1.459,0.185 2.931,0.212 4.416,0.079c1.485,-0.132 2.943,-0.384 4.375,-0.755l0.279,-0Z"
							style="fill:#fff;fill-rule:nonzero;"
						/></g
					><g
						><path
							d="M418.359,633.446c0.159,-0.53 0.418,-0.968 0.776,-1.312c0.358,-0.345 0.749,-0.571 1.174,-0.677c0.424,-0.106 0.855,-0.079 1.292,0.08c0.438,0.159 0.816,0.477 1.134,0.955c0.106,0.132 0.206,0.291 0.298,0.477c0.093,0.186 0.14,0.358 0.14,0.517c0.053,3.792 0.033,7.578 -0.06,11.357c-0.093,3.779 -0.245,7.565 -0.458,11.357c0,0.61 -0.192,1.087 -0.576,1.432c-0.385,0.345 -0.822,0.563 -1.313,0.656c-0.491,0.093 -0.988,0.04 -1.492,-0.159c-0.504,-0.199 -0.875,-0.537 -1.114,-1.014c-0.026,-0.027 -0.039,-0.053 -0.039,-0.08l-0,0.08c-1.724,-2.838 -3.541,-5.563 -5.45,-8.175c-1.909,-2.612 -3.898,-5.204 -5.967,-7.777l0,12.053c0,0.822 -0.013,1.492 -0.04,2.009c-0.026,0.517 -0.059,0.922 -0.099,1.213c-0.04,0.292 -0.1,0.544 -0.179,0.756c-0.239,0.637 -0.603,1.061 -1.094,1.273c-0.491,0.212 -0.988,0.265 -1.492,0.159c-0.504,-0.106 -0.941,-0.371 -1.312,-0.795c-0.372,-0.425 -0.557,-0.955 -0.557,-1.591l-0,-11.099c-0,-1.114 -0.007,-2.154 -0.02,-3.122c-0.014,-0.968 -0.02,-1.784 -0.02,-2.447c-0,-0.901 -0.013,-1.797 -0.04,-2.685c-0.026,-0.888 -0.026,-1.783 0,-2.685c0,-0.451 0.113,-0.835 0.338,-1.154c0.226,-0.318 0.511,-0.563 0.855,-0.735c0.345,-0.173 0.716,-0.272 1.114,-0.299c0.398,-0.026 0.783,0.027 1.154,0.159c0.318,0.106 0.643,0.325 0.974,0.657c0.332,0.331 0.657,0.689 0.975,1.074c0.318,0.384 0.617,0.769 0.895,1.153c0.278,0.385 0.511,0.696 0.696,0.935c0.69,0.849 1.485,1.823 2.387,2.924c0.902,1.1 1.737,2.141 2.506,3.122c0.769,1.008 1.518,2.016 2.247,3.024c0.73,1.007 1.439,2.015 2.129,3.023c0.079,-2.413 0.132,-4.813 0.159,-7.2c0.026,-2.387 0.04,-4.787 0.04,-7.2l0.039,-0.239Z"
							style="fill:#cca254;fill-rule:nonzero;"
						/><path
							d="M447.836,655.882c-0.08,0.583 -0.279,1.08 -0.597,1.491c-0.318,0.411 -0.683,0.696 -1.094,0.856c-0.411,0.159 -0.849,0.179 -1.313,0.059c-0.464,-0.119 -0.895,-0.431 -1.293,-0.935c-0.344,-0.424 -0.537,-0.895 -0.576,-1.412c-0.04,-0.517 -0.113,-1.027 -0.219,-1.531c-0.265,-1.459 -0.65,-2.957 -1.154,-4.495c-1.644,0.026 -3.275,0.04 -4.893,0.04c-1.617,-0 -3.235,0.013 -4.853,0.039c-0.238,0.69 -0.444,1.393 -0.616,2.109c-0.173,0.716 -0.338,1.418 -0.497,2.108c-0.133,0.53 -0.252,1.081 -0.358,1.651c-0.106,0.57 -0.345,1.067 -0.716,1.491c-0.451,0.531 -0.935,0.829 -1.452,0.895c-0.517,0.067 -0.982,-0.019 -1.393,-0.258c-0.411,-0.239 -0.742,-0.603 -0.994,-1.094c-0.252,-0.491 -0.338,-1.054 -0.259,-1.691c0.08,-0.822 0.239,-1.631 0.478,-2.426c0.238,-0.796 0.464,-1.591 0.676,-2.387c1.193,-4.561 2.731,-8.977 4.614,-13.246c0.159,-0.372 0.325,-0.73 0.498,-1.074c0.172,-0.345 0.338,-0.69 0.497,-1.035c0.185,-0.371 0.371,-0.769 0.557,-1.193c0.185,-0.424 0.404,-0.815 0.656,-1.173c0.252,-0.358 0.55,-0.663 0.895,-0.915c0.345,-0.252 0.769,-0.378 1.273,-0.378c0.663,-0 1.22,0.212 1.671,0.636c1.803,1.803 3.288,3.839 4.455,6.106c1.167,2.268 2.214,4.581 3.142,6.942c0.557,-0.027 1.101,-0.027 1.631,-0c0.531,0.026 1.008,0.265 1.432,0.716c0.372,0.371 0.591,0.769 0.657,1.193c0.066,0.424 0.026,0.835 -0.12,1.233c-0.145,0.398 -0.384,0.743 -0.716,1.034c-0.331,0.292 -0.735,0.491 -1.213,0.597c0.265,0.928 0.497,1.876 0.696,2.844c0.199,0.968 0.365,1.943 0.498,2.924l-0,0.279Zm-8.115,-10.82c-0.504,-1.194 -1.041,-2.38 -1.611,-3.561c-0.571,-1.18 -1.214,-2.3 -1.93,-3.361c-0.53,1.167 -1.027,2.327 -1.491,3.481c-0.464,1.153 -0.895,2.327 -1.293,3.52c1.246,-0.026 2.34,-0.04 3.282,-0.04c0.941,0 1.955,-0.013 3.043,-0.039Z"
							style="fill:#cca254;fill-rule:nonzero;"
						/><path
							d="M478.983,656.001c-0.08,0.583 -0.292,1.081 -0.637,1.492c-0.345,0.411 -0.742,0.696 -1.193,0.855c-0.451,0.159 -0.915,0.166 -1.393,0.02c-0.477,-0.146 -0.875,-0.497 -1.193,-1.054c-0.265,-0.451 -0.418,-0.922 -0.457,-1.413c-0.04,-0.49 -0.087,-1.001 -0.14,-1.531c-0.053,-0.583 -0.112,-1.094 -0.179,-1.532c-0.066,-0.437 -0.139,-0.948 -0.218,-1.531c-0.239,-1.591 -0.504,-3.162 -0.796,-4.714c-0.292,-1.551 -0.623,-3.109 -0.994,-4.674c-0.531,1.326 -1.035,2.639 -1.512,3.938c-0.477,1.3 -0.955,2.612 -1.432,3.938c-0.371,0.982 -0.736,1.969 -1.094,2.964c-0.358,0.994 -0.776,1.956 -1.253,2.884c-0.159,0.318 -0.424,0.577 -0.796,0.776c-0.371,0.198 -0.769,0.311 -1.193,0.338c-0.424,0.026 -0.822,-0.033 -1.193,-0.179c-0.372,-0.146 -0.65,-0.391 -0.836,-0.736c-1.14,-2.201 -2.267,-4.389 -3.381,-6.564c-1.114,-2.174 -2.228,-4.362 -3.341,-6.563c-0.133,1.352 -0.252,2.711 -0.358,4.077c-0.106,1.366 -0.226,2.725 -0.358,4.077c-0.027,0.425 -0.053,0.942 -0.08,1.552c-0.026,0.61 -0.073,1.226 -0.139,1.85c-0.066,0.623 -0.146,1.219 -0.239,1.79c-0.093,0.57 -0.245,1.014 -0.457,1.332c-0.319,0.531 -0.736,0.875 -1.253,1.034c-0.517,0.16 -1.021,0.173 -1.512,0.04c-0.491,-0.132 -0.902,-0.404 -1.233,-0.815c-0.332,-0.411 -0.484,-0.935 -0.458,-1.572c0.053,-1.087 0.146,-2.161 0.279,-3.222c0.132,-1.06 0.252,-2.134 0.358,-3.222c0.212,-2.36 0.431,-4.707 0.656,-7.041c0.226,-2.333 0.444,-4.694 0.657,-7.08c0.053,-0.69 0.192,-1.326 0.417,-1.91c0.226,-0.583 0.71,-0.994 1.452,-1.233c0.292,-0.106 0.597,-0.146 0.915,-0.119c0.318,0.026 0.61,0.119 0.875,0.278c0.584,0.372 1.041,0.882 1.373,1.532c0.331,0.65 0.643,1.266 0.934,1.85c0.504,0.954 0.995,1.916 1.472,2.883c0.478,0.968 0.955,1.93 1.432,2.884c0.584,1.22 1.174,2.42 1.77,3.6c0.597,1.181 1.214,2.367 1.85,3.561c0.159,-0.398 0.312,-0.796 0.458,-1.194c0.146,-0.397 0.298,-0.795 0.457,-1.193c0.292,-0.69 0.564,-1.386 0.816,-2.088c0.252,-0.703 0.51,-1.399 0.775,-2.089c0.372,-0.902 0.723,-1.79 1.054,-2.665c0.332,-0.875 0.657,-1.764 0.975,-2.665c0.265,-0.663 0.517,-1.379 0.756,-2.148c0.238,-0.769 0.623,-1.419 1.153,-1.949c0.372,-0.398 0.776,-0.637 1.214,-0.716c0.437,-0.08 0.848,-0.047 1.233,0.099c0.384,0.146 0.729,0.391 1.034,0.736c0.305,0.345 0.524,0.742 0.656,1.193c0.16,0.61 0.345,1.3 0.557,2.069c0.212,0.769 0.398,1.458 0.557,2.068c0.292,1.114 0.557,2.208 0.796,3.282c0.238,1.074 0.464,2.168 0.676,3.282c0.371,1.83 0.696,3.64 0.975,5.43c0.278,1.79 0.523,3.6 0.736,5.429l-0,0.279Z"
							style="fill:#cca254;fill-rule:nonzero;"
						/><path
							d="M495.849,652.103c0.477,0.026 0.895,0.152 1.253,0.377c0.358,0.226 0.65,0.498 0.875,0.816c0.225,0.318 0.358,0.683 0.398,1.094c0.04,0.411 -0.047,0.829 -0.259,1.253c-0.079,0.186 -0.245,0.404 -0.497,0.656c-0.252,0.252 -0.484,0.405 -0.696,0.458c-1.697,0.504 -3.441,0.815 -5.231,0.935c-1.79,0.119 -3.56,0.086 -5.311,-0.1c-0.503,-0.053 -1.054,-0.106 -1.65,-0.159c-0.597,-0.053 -1.121,-0.225 -1.572,-0.517c-0.822,-0.531 -1.233,-1.286 -1.233,-2.268l0,-16.945c-0.292,-0.213 -0.53,-0.478 -0.716,-0.796c-0.185,-0.318 -0.298,-0.656 -0.338,-1.014c-0.04,-0.358 0.007,-0.703 0.139,-1.035c0.133,-0.331 0.358,-0.616 0.677,-0.855c0.53,-0.424 1.14,-0.709 1.829,-0.855c0.69,-0.146 1.366,-0.272 2.029,-0.378c1.379,-0.212 2.758,-0.318 4.137,-0.318c1.379,-0 2.785,-0.014 4.217,-0.04c0.424,-0 0.915,-0.033 1.471,-0.099c0.557,-0.067 1.048,-0.02 1.472,0.139c0.504,0.185 0.902,0.477 1.194,0.875c0.291,0.398 0.464,0.822 0.517,1.273c0.053,0.451 -0.033,0.888 -0.259,1.313c-0.225,0.424 -0.616,0.755 -1.173,0.994c-0.663,0.265 -1.373,0.385 -2.128,0.358c-0.756,-0.027 -1.479,-0.04 -2.168,-0.04c-1.008,0 -2.016,0.013 -3.024,0.04c-1.007,0.027 -2.015,0.106 -3.023,0.239l0,5.529c0.955,0.053 1.91,0.053 2.864,-0c0.955,-0.053 1.91,-0.119 2.864,-0.199c0.425,-0.026 0.849,-0.066 1.273,-0.119c0.425,-0.053 0.862,-0.053 1.313,-0c0.583,0.079 1.034,0.318 1.353,0.716c0.318,0.398 0.51,0.842 0.576,1.332c0.067,0.491 -0.02,0.975 -0.258,1.452c-0.239,0.478 -0.623,0.822 -1.154,1.035c-0.451,0.185 -1.061,0.324 -1.83,0.417c-0.769,0.093 -1.578,0.159 -2.426,0.199c-0.849,0.04 -1.684,0.06 -2.506,0.06c-0.822,-0 -1.512,-0.013 -2.069,-0.04l0,4.893c1.459,0.185 2.931,0.212 4.416,0.079c1.485,-0.132 2.943,-0.384 4.375,-0.755l0.279,-0Z"
							style="fill:#cca254;fill-rule:nonzero;"
						/></g
					><g
						><path
							d="M510.116,654.431c-0,0.61 -0.232,1.133 -0.696,1.571c-0.465,0.438 -1.015,0.656 -1.651,0.656c-0.716,0 -1.306,-0.218 -1.77,-0.656c-0.465,-0.438 -0.697,-0.961 -0.697,-1.571c0,-0.61 0.232,-1.141 0.697,-1.591c0.464,-0.451 1.054,-0.677 1.77,-0.677c0.636,0 1.186,0.226 1.651,0.677c0.464,0.45 0.696,0.981 0.696,1.591Z"
							style="fill:#fff;fill-rule:nonzero;"
						/><path
							d="M517.634,654.431c-0,0.61 -0.232,1.133 -0.696,1.571c-0.464,0.438 -1.015,0.656 -1.651,0.656c-0.716,0 -1.306,-0.218 -1.77,-0.656c-0.464,-0.438 -0.696,-0.961 -0.696,-1.571c-0,-0.61 0.232,-1.141 0.696,-1.591c0.464,-0.451 1.054,-0.677 1.77,-0.677c0.636,0 1.187,0.226 1.651,0.677c0.464,0.45 0.696,0.981 0.696,1.591Z"
							style="fill:#fff;fill-rule:nonzero;"
						/><path
							d="M525.152,654.431c0,0.61 -0.232,1.133 -0.696,1.571c-0.464,0.438 -1.014,0.656 -1.651,0.656c-0.716,0 -1.306,-0.218 -1.77,-0.656c-0.464,-0.438 -0.696,-0.961 -0.696,-1.571c-0,-0.61 0.232,-1.141 0.696,-1.591c0.464,-0.451 1.054,-0.677 1.77,-0.677c0.637,0 1.187,0.226 1.651,0.677c0.464,0.45 0.696,0.981 0.696,1.591Z"
							style="fill:#fff;fill-rule:nonzero;"
						/></g
					><g
						><path
							d="M510.116,655.181c-0,0.61 -0.232,1.133 -0.696,1.571c-0.465,0.438 -1.015,0.656 -1.651,0.656c-0.716,0 -1.306,-0.218 -1.77,-0.656c-0.465,-0.438 -0.697,-0.961 -0.697,-1.571c0,-0.61 0.232,-1.141 0.697,-1.591c0.464,-0.451 1.054,-0.677 1.77,-0.677c0.636,0 1.186,0.226 1.651,0.677c0.464,0.45 0.696,0.981 0.696,1.591Z"
							style="fill:#bd913f;fill-rule:nonzero;"
						/><path
							d="M517.634,655.181c-0,0.61 -0.232,1.133 -0.696,1.571c-0.464,0.438 -1.015,0.656 -1.651,0.656c-0.716,0 -1.306,-0.218 -1.77,-0.656c-0.464,-0.438 -0.696,-0.961 -0.696,-1.571c-0,-0.61 0.232,-1.141 0.696,-1.591c0.464,-0.451 1.054,-0.677 1.77,-0.677c0.636,0 1.187,0.226 1.651,0.677c0.464,0.45 0.696,0.981 0.696,1.591Z"
							style="fill:#bd913f;fill-rule:nonzero;"
						/><path
							d="M525.152,655.181c0,0.61 -0.232,1.133 -0.696,1.571c-0.464,0.438 -1.014,0.656 -1.651,0.656c-0.716,0 -1.306,-0.218 -1.77,-0.656c-0.464,-0.438 -0.696,-0.961 -0.696,-1.571c-0,-0.61 0.232,-1.141 0.696,-1.591c0.464,-0.451 1.054,-0.677 1.77,-0.677c0.637,0 1.187,0.226 1.651,0.677c0.464,0.45 0.696,0.981 0.696,1.591Z"
							style="fill:#bd913f;fill-rule:nonzero;"
						/></g
					></g
				><defs
					><image
						id="_Image1"
						width="831px"
						height="218px"
						xlink:href="data:image/png;base64,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"
					/><image
						id="_Image2"
						width="122px"
						height="138px"
						xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHoAAACKCAYAAABly179AAAACXBIWXMAAA7EAAAOxAGVKw4bAAARHklEQVR4nO2da4ycV3nHf/PuxXvx2llfEt/AOTghLiE4ISSNmiKFFCQgbYFSJBTU0khVS1VV6pd+KP1Qqn5o1Iv6pdCi0oq28AWUSrTiIiEKSXBIQuIY4yR2YueYOL6s7V2PL7tez86lH/7n7Mzaa+/zzs7szK7PTxp5dzzv+56d/7k85znPeU6BDuCcWw9sBgaBKjAFnPben3HO9QC18CoAvcBA+P2S977ciTIvdwpL8RDn3CCwHfg0cDfwTmArMEIQEBgDXgUy4DRwPLw/iMQ+DvwA2O+9r4b7rgJWoYowAJSACe99aSn+ruVE24V2zj0I/DHwEHALEtJKbNWRU8CLqCJUw/+fC+/XgE3Ac8CzwDT13uKG7wnaIrRz7n3AY8ADwG3AmnY8p4Fa+LcQfi4DPwVeAv4PeBK19Nr8l698Wiq0c24U+CbwPmBtK++9CC4DL6NWvhl4B7AHtfwnvfcHOli2JaNlQjvn/hr4A+DmVt1zCZgGTiDhnwB+BBSB6Stbf7AH1gJ9yGaoIBviIlDq9t5iUUIHC/lh4KtofMwz/nYTsbufBi4Ar6Be4OfABLABDT896DsbAhxwKzATXs8D3wb2hntVu0n8poV2zg0AXwF+G1m+K5EaarnRKMyY+53FnyvAUeAFZBO8CBzw3p+/8obOuThd7AnXzbAEFWMxQj8O/BnLtxW3k/PAMdQr7AZ+iHqEjdQbRSl85hIS+iwyGKedc7O6tEr83EKHQnwd+C1WbktuJVXUcmOPkIXfy9R7ixk0RBwEDgE+/PsScDz6DRZDLqGDyLvRtKkVhlwJ/cED4X5L4sBZJpSQ4M8iwfeg8f9iM608r9Cvo3lxs1SRc+MJZLwcRjW6iLxlD6JK9EvA+oZr4MYeIqKtMIMqwGVkOL6JKsB+1GB+BuydrwcwCR1a8teARxdR2EPA3wDfACavVSvDNGY7smh3UO/2Nof37gzvjy6iLCuROAScB57w3n+u8T+tQj+KLOzBJgpwFPgjYLf3vtjE9Y3l6AlluB24Dzk/doTX25nbC1TRfPdG5Rnv/YPxlwWFds6tRWKNNPGwfwP+2Xv/YhPXmnHO9aEhZSuybi8jx8Z69DeeRn72HcCvoF5hpfcIM8Cfeu+/BAsI7ZxbA7xBvaVYeSk85KmmithGwvx/B/Bu4B7UE1SRU+Q2NGyslJ7gx97798M1hA5j8gbgi8Cncty4hhYTPu+9/8FiS7nUOOdiq78LuB/Ne0eALeHntSwvo3Av8F7vfe16Nfcx8on8BvIKPe69P7yY0nUK7/0YWhd/BvhyfD/0Ag64A3gvsIu5Lt8+VBFGac6OaRcFtPYwdlWLDq35PuC/0Zhn4STwUeCg936qVaVcToSVu52oR3CoMtwPDKOZw9nwuhnNHpbCZ/Am8Ij3fv+1WvTfYRe5BnzQe/9yS4q2TPHenwV+El445zI01veHV5z7OuADyCi8H/kPKmj6+QYyJu9APcZiGQ33mVfoncC7ctzsH9BqT6KB4LQohVcjh4BDzrl/px4GVQOmvPeXwzCxFfgw8AnkPNrSZDEG4rWzQocuexh4HBliFspowI+RHQkj3vsKCnOauuL9aeQx/KJz7quoq6+h7v5W1OJHgS8YHpMReubGFj2Mas/7c5T3NPC9VjjdE1fjvZ9E/m6AI/F959zDxlv0IPtpzlThZuCz2B0JNTRXHjd+PtE6jlNfA7geNeAtCEKHbnsE+FiOh50AvpezgInWMIVNaJBOsy06riuvznHxZ+aLoEgsCdPIil+Ii8AZqAs9BLwH22S/BvwFCqFNdIZpJOJCnAHGoS50D3L7WSJGasBT3RT4dgMSo08X4kz8IQp9HruDpMjKX/nparz3M0jshViHnDUS2nt/GbjJ+JwqDaZ+omNYhR5yzhWi1Z1nWW4SxT4nOkSYJVmWjlcjl+ts113AvuryXa526yWWlhFsO2Iy5E3riUKPEJQ38EoyxDrOCJopLUQPCrcaiEJvxWaMlZEfNtFZhrEvc94GDGahv78DLZ4vRNxdkOgseYTeAVQyJPA9xoumUaBgorNYVxdBGwUvZWiedbfxonHv/UTuYiVazbYcn93nvb+UoZAX68K2xb+aaD95WvSsC/SDOS5Mm+q6A4s9FdkMEvp+7F6xJHR30It9mXKTc643GmNWC26gqWIlWs0BNNW1sA0Yyit0N8Us38gcQFtuLMwKvR+bgxxSAGC3MI6muhY2AzsytIXGGnSfFjO6g4vYW/QwcFeG0jKewNZaJ5ssWKK1rEUCWhgmtOhjSGyL0GnVqju4E3t8XxXYl3nvj6OdFhZzPQndHdyG3YCeBn4WV6/2YRO6p5lSJVpOnkCRS8CpvELn8cgk2kceoTNgVRR6ArsVl+g8VkMMrhA6pjVaCOt8O9Fe8gh9DJhs3HtVMVxknaQn2kueae7TwPko9GrsESaJznMqx2efBi42Ct1vuCiN493BMeyN7g6oh/veic2SS6tX3cFr2Bvdfd77WhR6F7auu1uOT7jROULYDmtgJ9Rb9Dux5c9KgQfdQRn4hfGzPVAX923Gi1LMWHdQJsSCGeiFutCbjRel6VUXEHbKWBvdWagLbQ1LSaG+3YM1ZuwYJKGXM9ZEvPVkNeiQDwsW71liabAIXSZoG/de7Tbe3OJUSSwNlkDNMooJJEaBWjPjjzQe1ZPoKBbn1QzKSUaGgvetmejezspJWr7csbhAy4QFkCj0rxlvvpKy0y93LL3wDA1Cl7DHH61CO+gTncfi0+ilwTMWD9S2EA8pSXQey9pEPBmXDG2ZtcaCzaYFTnQcywyoj5ATLgPuJd+eqo1NFCrReiyaFdASNBnKcZFnftzM+VeJ1mMROiOcppChsw0teSUjaVtOd2CxqzJgp3NuQ0Y4wTTHA5LQ3YElwiRDsQabM5QBNk9KKesCSKLzFFCiwG0ZaqHWaAVIQncL1pnSEHBPFjL7WnOHlbDHKiXaizWsawjYFZcpjxsvmkRbbBOdxzr76QU25BV6mvrxPInOYhW6BpQz59wQOljTwgD2DdiJ9mIN4K8BMxnqw/MInWeDV6J9WDc8jgPPZmjibbWke0mrV92CNSJ3AngyQzXjoPGiHsJenkTHsYb7ngD2ZuGC17Elq8lIJ+R0C9alZQ+UMiTw4RwXJodJd2A5agEk9EwWov4PYQ/lTdtyugOL0GXgsPe+GufRk9iD89NRC92BpQeOJ83PBvCXsG/asjpXEu3F2gPPOZuyH1uAYA0db5joIM65eETGQvQQYvyi0BuxhQjVSOvR3UAvtgD+XuYR2rKXZ4okdDfQhz2L4zucc/1R6O3Yuu7TpFTO3UA/9mnurcC63EJ771OL7jz92HvW7TQIPYnNXE9HLXQH04Rdkgb6gN4o9FvYzPUkdHcwST6haRTashoy7JxLe6Q7TwX7KuIMMOsZO4XNM7aalFSuG8iAdxs/WwSKUegxbEIPkoTuBvqwHRQOyko0kQF476vYrO6MfOciJtrDCPYGl3nvpxqzBVrmZRlh01aio6zGnpCg1zlXaBTauh5tPWs60T5iCJiFC8Acoa0xSCmUqPNk2D1jzwC1RqGtyb43OedSHpPOchGd9L4QNST0nIy+1oACh7ITJTrHWXSy0UKUgbHGfN0QUgka2EzKetBRvPfT2OK6y/FzjULvxh4Pti1f0RJtwLKbssI8Qj+PfZvHY865dKpdh3DOWR0mFUIY95VZ988an/WQ8UGJ9rCBkJtkAaohyrcutPe+AvyV8UEXSElrOskGlGRoIWbn2le26G8BJw032IRSSyY6wyZsZ6DM7r6Z82Hv/Tj2KM+P2cuVaDGbsK1NlGI25vlqhWUiDvDnzrlbk1HWEdYYPzc7BZtP6D8BzhluUgD+FttYkWgt1n1Xl64yxiLe+xPAS8YbfQrY45xL+UGXFnNGouiuvtaA/ocohtvCMPAl51zKhLB0WNNuDxG6+WsJ/TraSmvlI8CHc3w+sTisi0qDhGnwvEKHfv33sR902Qf8k3MujddLgzVh0ADBXX29udhelD7Syi3INbo+WeJtxyp0Pwrgv7bQ3vsS8Ms5Hl4APg/8B/BJ51w6sLR9WL/bU4RKsZB35STwrzkKUAAeAb4M/ItzLkWMtger0GPoCOIFhS4DX0eb6/JwE/B7wGHn3K/nvDaxMFVsoV/nCZkeryt0MMqeBr7TZIG2AP/lnPu2cy5Z5a2jzPWFjturLhM0tpjpNeAxdGr83U0U6ibgo8BDzrl9wFPAN4D9IbNwIj9DqLXGhaUYlx/n12XgTST0CBiE9t7XgmP8N4Hv03wU6BDwQHh9DqiEBfQJNGc/iMaTM8gFexrFsZ3y3qd0GnMZZa6buoI2xkehSyhJzey5V6aJdxB7DBlaP0arJ4uh0Sm/GgUbfuCKz5TQHzPunDuNDMMa8sRNo8rxGkorfRT9sSXq4TPrQzmHqcdOnQLGQ8zVcmYcTZ2mkGE2jubM/ahBTSJDbAshv7o5bNd7X3LOnQM+BDwJrGtlyeehn3pulZ2Gz59HvUAVWIsE7qfuF76IImjOOOfGUc+xH/gRWrEbQF/a+vDzedTbTISpZjfxQ+SJPIda9wn0N/eiRjOFKneFEF+QKz7be38mTJkeBv6H7gr7XcP1l+9Wh9fbGt6roC9lGnVxA+g76aMu9Enn3BtoaDmKxr7DwFshKoewcBDzikRnUR/qgS6jVaSr9p+HITF2tzWYNYAX4jl0KMo2VLHHUG91U/j7ziGhL8dK2tQRwc65TcgT9o9o++aNEv5bQ1/sBGpFcWwcRF/ymvD7NPqypxpe4+jskmPItZyhnmpXuN9JFKu9N3y2QH34ugBc9N7PADjnbkFboz4O3B7u6ZEOnwReAf4T+JD3/lFoUujwsFE0HtyJlis/i1pDOl/aRgUNJTH5Tw8aauIQMoDsivOotT6LWvKLqHfJgN8B3oOGpZ8y9+TgLwC/4b3/+3jzpigWi9Ojo6OTwBHv/bdGR0e/g2rgLtLRwxYyJOYaZE/EE4tOoyHiddQyn0dT0t3h9Rb1+Pte1MucRj3MBVR5qsj30VssFj20uPWFsepe4CvYd+Qn6tQa/q0h8Wuoqy8hgU+hNJ3PIKP4IrIHpsLn1qLx+2vAdu/9IWhxy/Pel4HnnHOPoO7808Bd2H2zNzoTqEW+GV5TSMRo6BVQqy8CL6OWP4IqRG+4/jja/D7jnJtdfWzbeBpady8yGP4SJVdJiW7yUUGt+Ajwv8iHEfPNxOnTRvS9TlOvJJu993OS87Zt3bhYLFZHR0eraKx5NRR2DTIwYiF70XhyAlmNHo1BF1BXNYG6o9ilZaxcY6+GRHwNzev3oDH6CLLIS8i6LyEfwAX0/dyMdIz+73MAxWJxztx/Sb60MF/cBvwu8lZtQYLvDa9jqCZWkJglVAFqyLJfC9yHfOb3osX00fD/cRqyEnOgzaDv6Siaer2K5szHUYU4Qn1DfBzTR9BUbM5G+Y62jpCOOK6gVUPSnDzXr0Oi9yOj5F3IJ/+rqGLFHqBAveLMhN+Xk91wDs3BDyBv3gHkyz7CXAOuAMzMl8ZzxXSDodcYQi19FerGBlGUzAPAC2gYibmu47BVQJ6+j6PWcgLNXSvU3aflcJ/bwz1jDpEqqjjR5TgYnm3Nfw51H/04mgsfRNOt1eH9aHyNoZZ9mHpy/EsNzykARKfKlawYoecjiB8d/SDDpgKUG9yXGfpih1DliKJFCqi1rEaVaBvKgT1Aff5aRGPmKPKVb0Sew1vCz5uArcg9uQ5VoDhdGkO2yS+QQ+QFtFv1I6gl70FOkn3ee2v6katY0UJ3E6HSZajFD6LeIM59a2GFsAdVqlg5a6jSlYHSfP5yK/8PzsPrz0KgWZkAAAAASUVORK5CYII="
					/><image
						id="_Image3"
						width="221px"
						height="221px"
						xlink:href="data:image/png;base64,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"
					/><image
						id="_Image4"
						width="46px"
						height="46px"
						xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAuCAYAAABXuSs3AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAFL0lEQVRogc3Za4ydRRkH8N+eLbB4QaZqQjASpwFFSEsg8UI0RkRCWyIxaiyaKAoYEbxFIcbrB6Ix3uIlVA1Ry0U+SLRJbVCqgPGCabNKsLUVMfi0LokaiU65SGmL9cPM6Z52z17Z3bP/L/PO9f2/8z4z88z/GTIPyDmP4CS8FsdgLzIewzNxADtxPLZExL6n+86hp0F2OV6CU/B2XDzDrhuxFb/FfRHx+FzeP2viOefn4Dxcg1f1VN2Og9ikzvYDeAGeh4fxcvwbV/T0uRPfx8aIeHRBiOecn62awifwylb8WYxhG3ZFxIFpxliGU7ES78VrVNPajB/ghxHx5LwRzzmfjM/hXa3oM7gLWyPifzMZo8+YwzgN1+KyVvxVbIiIHdP1n5J4znkIa/EpdZa/jC34RUQ8NRfCfd4xjFfgI3gz7scVEXHPVP0mJZ5z7uAduBFPNMKXRsQj80G4z/tG8H58CU+pa+Hmyf7o8GQDpZTWqQvnEXUhfmw+trHJUEo5mFLaio66li7CzpTS/aWUCe37znjO+Vz8Wv2w1RGxZaEI93n3EM7Fz9QzYE1E3HF0uwkznnM+G7eq29g1EXHLAnM9AqUUpZSxlNIQXoczUkp3lFL29rY7gnjO+TjVzi7G1bi+lHJosUj3IqV0j3rSvgUnppTuLKUc3m6Hj2q8ButxLz443b68kCilHEopbcMI3o3RUsoD3fpO9yHnfAIub9krI+KJRWXaB+00vU0lf3XOOXXrOj3tPow3qifYvYvKcGqM4gasxhu6hcMc9j9OVn2H70TEw4Ng2A/NZMZwJU5IKW0upezrzvjp2KA6Rw8OiuQU2KH6M+fjbMZN5YyW7p6r77GQaJxuaNkV0Mk5PwPr8CR+PCBuM0HXEi7JOY908HxciO34x8BoTY8H8UXVXE7q4EWt4ncRsX9QrKZD4zbSss/toLs37hkMpVlhV0tXdIyfnpN6iksIx7f0UEe97MKvBkRmNvhbS1d18M+WSZM0XkroeoiPdtTLKgzEC5wlzmrp9o4q2sCaAZGZDf7a0mUd47vJkjsx++Cilj7UO+OntAvrkkTTZJa17P4OAreot54VgyI2A6xUdZ3bsafTlKPtrfL0QbGaAc5s6YaI+G/XOxxt6eqmpywpNNHowpbdzbhbe596AF1m/MuWElbiEvxSVboq8YjYi++qx/6H2hcuCTQub1IX5qauLN1rFhtVme1yrFp0hpNjLT6tLsrvdQsPE4+Ix1TycF279Q8U7ZJzXsve2CwDE3WVP6uC43vw95TS7wclCLVN4mv4AL6Ob5ZSDnbrjyBeStmfUtqDV6smc0wp5a5F5IvD+uG1+Kh6sl91tPIwYRGWUv6TUvqjSvy0lFKUUv60GIS7SCldgJtb9p0RMXp0m767R0rpIRRVt1uXUoqU0o6FNpuccyel9D58W72mrYuITf3a9j1sIuIQvoELVJu/CV9YSF8m5/wsNS60HifiKuObxQRMGwPKOZ+P61V3YL2qdm2e51DKmfgKXo8/4OMR8dOp+s00ePViXKfqL1SdcRTb5voBbdfI6p9d24o/j29FxNh0/WcTLjwOL8MnVQFyvxqv2Ycf4S8RcXDyEcg5H4uX4oWqFtj1rzerwYSfzDTeOZcA7XK8FW9T45Rd3K1+zN04Fr9R18jjWI5z8C/jf43qH92GWyNiYqBnPol30RbTWWqs8lI14NSLfcYFnC4O4OfqH9qFnbONKHcxZ+K9aEfzKlXOO1UNfZ+jhsLH1D8Q7Xn3fETv/g++WaQvwtgmfQAAAABJRU5ErkJggg=="
					/><image
						id="_Image5"
						width="42px"
						height="42px"
						xlink:href="data:image/png;base64,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"
					/><image
						id="_Image6"
						width="41px"
						height="41px"
						xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAFg0lEQVRYhbXZa4hdVxUH8N+9k6SZNNOZY1ObaCXuprZQaW1oFa0oglahikTBIIqtRhRBEMUXBY2otYgPxH7QD0qtRavWD7WPDxXRaquoFKUktrFpwmqMscY24SaNZvKYXD+sc5ubO2cmN5m5fxiGc/brf/Zea+21/rdlASilLMEUjmAGxyLiWN12JXZiEk9HRPds11lyFsRa0Lfoy/EKrEW7lHINfo8X41dYiR/if/X4ZRFx9EzWbJ0BuSW4EB1ch03189UYm2foNLbhX7gF7fr5QEQcXzSSpZRxeWxvwJ3o1oudKaZxHB/Admzrmcd8GPa4L8CuvuehT2AAy+v/P8ef8DE8crpBcy5WSllet2/EzbjoLInNh+fwEfwMrbmOv5FkKaWNl+ETNclqnoW6eBy34RK8FP/BU7isHt81t90+jb/i49jVdPyzBpZSxnAuPi+/crxh4hn8Wu7wJhzG9/B3uTs78Qvp1Vult1+MFVg6MNcELq3/tlZVtbfT6ZzSYa6d/Ao+hWUNzQdxQ0TcU0opeCYiDjXNU8+10sndXYU/y7A0iGP4KH4weOynkKxj4HrcY7YNzuABbMC1EfHQXMTmIXw+Pi1N6Z0NXQ5hfUTsaCRZ2+FyPFpP0o8j+CS+j6Xz7dwQRJfiu9iBLzjp8T08VH/Ac72g3x/rXivtcHXD3Dtxd0QcWQhBqB3jQxHxVfy4ocvr5WlN9V48TzIiHpZ2MzEw6AheIwPxoiAiuqWUCvfKm2gQN2FVKeUcau8upayqqmoC6/ATefWtrwl+HY9FxN7FIgmdTme6qqpjMhpcN9A8hd/giU6nc2IMqqq6FHfh3TW52/Fh+ZU/jYjdi0mwh6qqDsjr8RqUvqYWJiPiDmjVW/pCeU29qK/jfqxdqA2eDnVcXivtvh8REReTd/dyvB1rBjpN4MQoCfbhffJW6g+Jk6WU12F7OyIOYK/ZgX033jZqdhExI0/tiYGmF+AdGOt599UN43+E342O3im4U/rEICq02nW2s76hw2qzA+2ocFAmKYMlxjT2t/ESXDHQ2JU7uWfk9BIrNee2r8TRNv6BvzR0uEpf1B8xzsH5De+3RMRMWx7roBe3cD0uHzG5HlbjTWY775OllHY7InZpvkNfrTmlWnRExKN4tqGpixU9735MJq79mMADvRJ2VCilLC2lfA43NDT/Ef/tkdwpk85+TOONMksfJcZx1OwqYZu8Mp+PkxfKWqMf50oz2DQqdvUpbZBlyiD2YF9EHO+R3IsvNnScxI2llKtGQ9MS/FZuUj8O45ampHeL2Xa5TFaAjy82u1LKOnwZD8oCrR/LJXnUdtDpdGaqqnq2JrrBqRXdUqyrqmq8qqodnU5nKGnkNATHcaPMI690aug5LHPY7Z1O5yCz45JSyjOyqhvEvbL+uTUi9i2AYEuKXJvxroYuXXmJHIqIE7NI1qLUJdKzmgb/QdYgkzjYm2RIcm28VSYzF8ikevAq3CMzn90R8e/ey6adLHiLrOiaiP5NigJrpEpxf51uzUeuhfdI+e82nNfQdR8+i9sH52si2cKr8A15f8916zyIb0oNckra12X4tqzR3ytVjg/KD75DVqRN6OLmiNjc1DiXgjEhC/XNspifL6BP42Ep6V0hVYglUt6bwrV1W5Ma0sMv8ZmI2DI0yQHCG+WODauqdQ2vX+7Hl2TC24mIwRCI4fTJ++oFvyYl5tMt3nL6jz/opJPswtH5nHAYktO4u57szVICuXzIsXPhOxFx07Cdz0QzH0M3Ik6UUq6XMe79Qww9IEWGR6Sidium6hRxcUn2ow4rK2QGs1E61piMgedJh3lSKiHfiogddS21Bk+d6c8lC8oV63A1KRWwmfp5XMo1/8RFEbF1IWvA/wF2C7v/BkprhwAAAABJRU5ErkJggg=="
					/><image
						id="_Image7"
						width="36px"
						height="36px"
						xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAD2ElEQVRYhcXYW4iVVRTA8d8cNa2M2iU9REq7fNAuRKWFXR+63zSJfPChsigqkwqCbho9lDR0MciCegkqutCEEZUiRmEUQ6SVWqglO0wRJOrzVuZteth7hmk808zJmTMLDvvb+9uX/9nfXmuvtVo0KDHGFhyDcbgEOzABm0r7WozCh9ieUupoZP6WBkCOwB2lei/G9zFkNd7GT1iaUto+IEAxxlG4BjdjGjqwHS/jJKzHRpxaFp+AVXgWoayxDE/gm5TS3/8bKMZ4IloxszR9j/vwM7aklA70Mq4FJ+BCTMKD5dUzeD2ltKYhoDLh1ZiPM/Ec2rEopbT/v/5EnbmGYSrOw0Pyjt6WUvqyX0AFZgbeKU3v4daU0p+NgNSZ9yjcjgWl6S682vPQD+s5MIQwBYuxH3PwcEppz6HAQFVVe0IIX2MfzscNWFFV1fpegWKM56ANR+OBlNLCqqoaUts+oDqqqloeQtiNK3BWCOHjqqqqzj61bjAjcSPG4m4sHCiQOrIAT8ka2RpjPPwgIFyGR/C+rAl1NWggpMz9NJ6Xz+vZ/wIqtqbT6L17qAe4n1A7sbRU5xXD27VDV+EzXIlFgw3TTZbhjbLupd2BAl7A/pTSvmbRFJvWVqqTYowttRjjsZiHrbLpb7asKGtPR6jJJj7iO/w6BEBb8ArOwNiafGvvQVujrsJASNG4zqNzck22yIdhZLNhukl7KYfXMLlUvh0iGLJjBxNq2FAqY4cIBraV8o+a/Llg7xDBQOfVsa+GdaUyuZfOzZDppVxfk90BGB9jrPUyYNCk+F+dm7K7Jjvjq3CRbLGbLeNk72I1fqxhpxyyHC87Ts2WiWXtT7GtVozh5+XluTHGEc0iKf72PaXallLq6Dwz7ViCucqt2yS5vvyWYg3FZKeUdslx1F7MjjEeOdgkxf+ZWqqtKaVtXUBFvsKLuA6zBlPjima1YhZeQ1dI1LVoSukvORpdW8BmDBYQZsvh+EbM7x7N1ovLpsi7dUD+F3MHyr8uuz5HDjyH4eKU0hfd+9SLyzbLmYxpsm0aHUJYXlXVIXmS5VzegpfkL3NTSmlJz34HAVVVpaqqlSGEVfJ1ci1ODyEcCCGsazROizEODyHMLDBPyl7pDHzSLRzrkr6SDRNxP+7ELnwkb/dmOdlQF658mjG4XM6KPFpevYXHUkq/9LZmf9IxI3EBHpcTVFDhzfJckw3rKfhNtvZb5YM7uvT5QFaU9r5CrEYSVqPlyHZ8KSfW6bYXI+Qc0krZ4C7G8pTSjv6s02+gHnBj5DTNafi9PG/AcXK6ZRN+wI5G/fR/AJDsQxAkKPXlAAAAAElFTkSuQmCC"
					/><image
						id="_Image8"
						width="34px"
						height="150px"
						xlink:href="data:image/png;base64,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"
					/></defs
				></svg
			>
		</div>
		<h3>Your cat is in need of a name!</h3>
		<p>Add the purr-fect name for your cat.</p>
	</div>

	{#if token}
		<div class="container">
			<div style="display: flex; justify-content: space-between;">
				<input
					id="cat-name"
					placeholder="Add a name here"
					style="border: 2px solid blue; border-radius: 20px; padding: 10px 14px; width:100%; margin-right: 9px"
					bind:value={catName}
					on:input={(event) => checkCatNameAvailability(event)}
					disabled={apiRequestStatus === 'success'}
				/>
			</div>
			{#if isCatNameAvailablePending === true}
				<div
					class="fade-in-out"
					style="    font-size: 14px; padding: 12px 4px; border-radius: 20px;"
				>
					<p>Checking if name is available...</p>
				</div>
			{/if}
			{#if apiRequestStatus === 'error'}
				<div style="font-size: 14px; padding: 12px 4px 0 4px; border-radius: 20px;">
					<p>
						❌ Oh, furballs! We encountered a hiccup in the digital litter box. There was an
						unexpected error. Please give it another go, and if the issue persists, try again later.
					</p>
				</div>
			{/if}
			{#if isCatNameAvailable === true && !isCatNameAvailablePending}
				{#if apiRequestStatus !== 'success'}
					<div style="font-size: 14px; padding: 12px 4px; border-radius: 20px;">
						<p>✅ {catName} is available</p>
					</div>
				{/if}
				{#if apiRequestStatus === 'success'}
					<div style="font-size: 14px; padding: 12px 4px; border-radius: 20px;">
						<p>
							Your Cat has been successfully and uniquely named {catName} 🎉
						</p>
					</div>
				{/if}
				<div style="font-size: 14px; padding: 16px 18px; background: #fff4e0; border-radius: 20px;">
					<p>Cat Name: {catName}</p>
					<p>Cat Address: {tba}</p>
					{#if apiRequestStatus === 'success'}
						<p style="margin-top: 12px">
							Details: This action has assigned the name {catName} as an off chain ENS sub record to
							your cats TokenBound Address. Enabled via ENS ERC-3668, TokenBound ERC-6551 and Smart Layer
							ERC-5169.
						</p>
					{/if}
					{#if apiRequestStatus !== 'success'}
						<p style="margin-top: 12px">
							Details: This action will assign the name {catName} as an off chain ENS sub record to your
							cats TokenBound Address. Enabled via ENS ERC-3668, TokenBound ERC-6551 and Smart Layer
							ERC-5169.
						</p>
					{/if}
				</div>
			{/if}
			{#if isCatNameAvailable === false && !isCatNameAvailablePending}
				<div style="font-size: 14px; padding: 12px 4px; border-radius: 20px;">
					<p>Sorry, {catName} has been taken. Please try another name.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.container {
		margin-top: 25px;
		padding: 10px 0;
	}
	.badge-container {
		width: 100%;
		height: 410px;
		position: relative;
		padding: 20px;
		display: flex;
		justify-content: center;
	}
</style>
