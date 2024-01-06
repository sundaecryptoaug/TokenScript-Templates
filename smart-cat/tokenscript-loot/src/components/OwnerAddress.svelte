
<script lang="ts">
	import {onMount} from "svelte";
	import {lookupEnsName} from "../lib/data";

	export let address;

	let ensName;

	onMount(async () => {
		const name = await lookupEnsName(address);
		if (name)
			ensName = name;
	});
</script>

<small class="eth-address" title="{address}">Owner: <span>{ensName ? `${ensName} (${address})` : address}</span></small>
