<script lang="ts">
	import context from "../lib/context";
	import {formatEther} from "ethers";
	import ToyImage from "../components/ToyImage.svelte";

	const BurningImage = "https://jadziadoesthings.files.wordpress.com/2017/03/wall-o-fire-1.gif?w=1200";

	let token;
	let burning = false;
	let completed = false;

	context.data.subscribe((value) => {
		token = value.token;
	});

	const onMessage = (evt) => {
		if (evt.data?.method !== "transactionEvent")
			return;

		switch (evt.data?.params?.status){
			case "started":
				burning = true;
				break;
			case "error":
				burning = false;
				break;
			case "completed":
				burning = false;
				break;
		}
	}
</script>

<style>
	.burning-image {
		position: absolute;
		width: 100%;
		height: 60%;
		left: 0;
		bottom: 0;
		z-index: 20;
		overflow: hidden;
	}
</style>

<svelte:window on:message={onMessage} />

<div style="padding: 0 25px;">
	<h3 style="text-align: center;">Burn Cat Loot</h3>
	<p style="text-align: left;">
		By burning your cat loot toy, you will receive a payout amount equal to your total share of the pool.
		This includes 90% of the original mint price, plus any royalties collected from sales on third party marketplaces.
	</p>
	<div style="display: flex; gap: 8px; margin-top: 24px">
		<div class="score-box" style="flex: 50%;">
			<label>WETH Return</label>
			<span>{formatEther(token.wethPayout)} WETH</span>
		</div>
		<div class="score-box" style="flex: 50%;">
			<label>MATIC Return</label>
			<span>{formatEther(token.maticPayout)} MATIC</span>
		</div>
	</div>
	<div style="margin: 20px auto;">
		<ToyImage imageUrl={token.image_preview_url}>
			<img class="burning-image"
				 alt="burning NFT"
				 style="display: {burning ? 'block' : 'none'};"
				 src={BurningImage} />
		</ToyImage>
	</div>
</div>
