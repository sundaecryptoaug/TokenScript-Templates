<script lang="ts">
	import context from '../lib/context';
	import Loader from '../components/Loader.svelte';
	import { getTokenBoundClientInstance, setTokenBoundAccount } from './../lib/utils';

	let token;
	let loading = true;
	let tba: string | undefined;
	let catName: undefined | string | null;

	context.data.subscribe(async (value) => {
		if (!value.token) return;
		token = value.token;
		const tbaClient = getTokenBoundClientInstance(1);
		// @ts-ignore
		tba = setTokenBoundAccount(tbaClient, token.contractAddress, token.tokenId);
		if (tba) catName = await getCatName(tba);
		console.log('catName', catName);
		// You can load other data before hiding the loader
		loading = false;
	});

	async function getCatName(tokenBoundAddress: string) {
		const catNameRequest = await fetch(
			`http://scriptproxy.smarttokenlabs.com:8083/name/${tokenBoundAddress}`
		);
		return catNameRequest.text();
	}
</script>

<div>
	{#if token}
		<div style="text-align: center;">
			{#if catName?.length}
				Cat ID: {tba}
				Cat Name: {catName}
			{/if}
			Info Details...
		</div>
		<!-- <pre>{JSON.stringify(token, null, 2)}</pre> -->
	{/if}
	<Loader show={loading} />
</div>
