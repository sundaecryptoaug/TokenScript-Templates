<script lang="ts">
	import context from '../lib/context';
	import Loader from '../components/Loader.svelte';
	import { getTokenBoundClientInstance, setTokenBoundAccount, getCatName } from './../lib/utils';

	let token;
	let loading = true;
	let tba: string | undefined;
	let catName: undefined | string | null;
	// Remove ENS subname details from View Name
	let catNameForViewOnly = catName?.toLowerCase().replace('thesmartcats.eth', '');

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
</script>

<div>
	{#if token}
		<div style="text-align: center;">
			{#if catName}
				Cat Name: {catNameForViewOnly}
			{/if}
			Info Details...
		</div>
		<!-- <pre>{JSON.stringify(token, null, 2)}</pre> -->
	{/if}
	<Loader show={loading} />
</div>
