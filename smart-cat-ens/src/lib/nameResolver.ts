import { ethers } from 'ethers';

// Define the ENS resolver contract address for now, will add dynamic resolution if needed
const ensResolverAddress = '0x4dBFD41eA7639eB5FbC95e4D2Ea63369e7Be143f';

const returnAbi = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "sender",
        "type": "address"
      },
      {
        "name": "urls",
        "type": "string[]"
      },
      {
        "name": "callData",
        "type": "bytes"
      },
      {
        "name": "callbackFunction",
        "type": "bytes4"
      },
      {
        "name": "extraData",
        "type": "bytes"
      }
    ],
    "name": "OffchainLookup",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const decodeAbi = [
  {
    "constant": true,
    "inputs": [],
    "name": "decode",
    "outputs": [
      {
        "name": "address",
        "type": "bytes"
      },
      {
        "name": "time",
        "type": "uint64"
      },
      {
        "name": "sig",
        "type": "bytes"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

export const getOwnerAddressFromResolver = async (chainId: number, _name: string) => {

  // const provider = new ethers.JsonRpcProvider('https://ethereum-goerli.publicnode.com');
  const ensAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  const name = _name + '.smartcat.eth';

  // @ts-ignore
  const provider = new ethers.JsonRpcProvider(window.rpcUrl, {
    // @ts-ignore
    chainId: chainId,
    ensAddress,
  });

  let userAddress = await resolve(name, ensResolverAddress);
  console.log(`UserAddress: ${userAddress}`);

  async function resolve(name: string, resolverAddress: string): Promise<string> {
    const namehash = ethers.namehash(name);
    const dnsEncode = ethers.dnsEncode(name);
    const funcEncode = "0x3b3b57de" + namehash.substring(2);

    const catResolver = new ethers.Contract(resolverAddress, [
      'function resolve(bytes name, bytes data) view returns (bytes)'
    ], provider);

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
      const callUrl = decoded.urls[0].replace('{sender}', decoded.sender).replace('{data}', decoded.callData);

      try {
        const response = await fetch(callUrl);

        if (response.ok) {
          const data = await response.json();

          //split up the response data
          const decode = new ethers.Interface(decodeAbi);
          const decoded = decode.decodeFunctionResult('decode', data.data);

          return ethers.getAddress(hexStripZeros(decoded.address));
        }
      } catch (callError) {
        // nop, expected
      }
    }

    return "0x0000000000000000000000000000000000000000";
  }

}

function hexStripZeros(inputStr: string) {
  const pattern = /\b(?:0x)?([1-9a-fA-F][0-9a-fA-F]*|0)\b/g;
  const result = inputStr.replace(pattern, (match, group1) => group1);
  return result;
}


