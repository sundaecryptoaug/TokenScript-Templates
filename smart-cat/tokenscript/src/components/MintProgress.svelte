

<script lang="ts">
	import {onDestroy, onMount} from "svelte";
	import {getLootContract} from "../lib/data";

	export let text;
	export let mintCompletedCallback: () => {};

	const contract = getLootContract();
	const total = 1000;

	let timer;
	let totalMinted = null;

	onMount(async () => {

		updateMintedTotal();

		timer = setInterval(() => {
			updateMintedTotal();
		}, 5000);
	})

	async function updateMintedTotal(){
		totalMinted = Number(await contract['tokensMinted']());

		if (totalMinted < total)
			return;

		clearInterval(timer);
		mintCompletedCallback();
	}

	onDestroy(() => {
		clearInterval(timer);
	});
</script>

<div style="margin: 4px 0;">
	<strong style="font-size: 14px;">{text}</strong>
	<h3 style="margin: 2px 0;">{totalMinted ?? '-'} / {total}</h3>
</div>
