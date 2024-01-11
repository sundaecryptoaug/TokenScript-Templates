<script lang="ts">
	import context from '../lib/context';
	import Loader from '../components/Loader.svelte';
	import { getTokenBoundClientInstance, setTokenBoundAccount, getCatName } from './../lib/utils';
	import { environmentConfig } from './../lib/constants';
	let token;
	let loading = true;
	let tba: string | undefined;
	let catName: undefined | string | null;
	const environmentType = 'test'; // "test" or "prod" //

	context.data.subscribe(async (value) => {
		if (!value.token) return;
		token = value.token;
		const tbaClient = getTokenBoundClientInstance(1);
		// @ts-ignore
		tba = await setTokenBoundAccount(tbaClient, token.contractAddress, token.tokenId);
		// @ts-ignore
		if (tba) catName = await getCatName(environmentConfig[environmentType].nameAPIEndPoint, tba);
		console.log('catName', catName);
		// You can load other data before hiding the loader
		loading = false;
	});
</script>

<div>
	{#if token}
		<div style="text-align: center;">
			{#if catName}
				Cat Name: {catName}
			{/if}
			Info Details...
		</div>
		<!-- <pre>{JSON.stringify(token, null, 2)}</pre> -->
	{/if}
	<Loader show={loading} />
</div>
