
<script lang="ts">
	import {onMount} from "svelte";

	export let tokenUri;

	let src;
	let loaded = false;

	onMount(async () => {
		try {
			const meta = await (await fetch(tokenUri, {
				headers: {
					'Content-type': 'text/plain'
				}
			})).json();

			src = meta.image;
		} catch (e){

		}
	});
</script>

<style>
	.cat-list-image {
		width: 64px;
		position: relative;
	}

	.cat-list-image img {
		width: 64px;
	}

	.shimmer {
		display: inline-block;
		background-color: #dddbdd;
		height: 100%;
		width: 64px;
	}

	.shimmer:after {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		transform: translateX(-100%);
		background-image: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0) 0,
			rgba(255, 255, 255, 0.2) 20%,
			rgba(255, 255, 255, 0.5) 60%,
			rgba(255, 255, 255, 0)
		);
		animation: shimmer 2s infinite;
		content: "";
	}

	@keyframes shimmer {
		100% {
			transform: translateX(100%);
		}
	}
</style>

<div class="cat-list-image">
	<div class="shimmer" style="display: {loaded ? 'none' : 'block'};"></div>
	<img alt="cat" on:load={() => loaded = true} src="{src}"/>
</div>


