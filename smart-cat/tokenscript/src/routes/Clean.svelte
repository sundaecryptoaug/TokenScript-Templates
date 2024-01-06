<script lang="ts">
	import context from "../lib/context";
	import CatImage from "../components/CatImage.svelte";

	let token;
	let cleaning = false;
	let completed = false;

	context.data.subscribe((value) => {
		token = value.token;
	});

	const onMessage = (evt) => {
		if (evt.data?.method !== "transactionEvent")
			return;

		switch (evt.data?.params?.status){
			case "started":
				cleaning = true;
				break;
			case "error":
				cleaning = false;
				break;
			case "completed":
				cleaning = false;
				break;
		}
	}
</script>

<svelte:window on:message={onMessage} />

<style>
	.fade-out-image {
		animation: fadeOut 5s;
		animation-fill-mode: initial;
		animation-iteration-count: infinite;
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
		}

		to {
			opacity: 0;
		}
	}
</style>

<div style="text-align: center; padding: 0 25px;">
	<CatImage imageUrl={token.image_preview_url}>
		<img alt="overlay" class="{cleaning ? 'fade-out-image' : ''}" style="position: absolute; top: 0; left: 0; width: 100%; height: 400px;" src="https://viewer.tokenscript.org/assets/tokenscripts/smart-cat/images/dirty-overlay.png" />
	</CatImage>
	<h3>Your cat is dirty!!!</h3>
	<p>Your cat is usually good at cleaning himself, but today he chose to roll around in the mud :-/</p>
</div>
