<script>
	import MintStatus from "./MintStatus.svelte";
</script>
<style>

	.mint-container {
		color: #fff;
		position: relative;
		min-height: calc(100dvh - 20px);
		background-image: url("https://resources.smartlayer.network/images/catloot-hero-bg-1.png");
		background-size: cover;
		background-position: center;
		border-radius: 8px;
	}
	.title-image {
		max-width: 350px;
		width: 100%;
		margin: 15px auto 0;
	}
	.chest-body, .chest-top {
		max-width: 200px;
		width: 100%;
		margin: 0 auto;
	}
	.chest-body {
		position: relative;
		top: -5px;
	}
	.mint-progress {
		width: 280px;
		min-height: 130px;
		border: 6px #000 solid;
		border-radius: 1rem;
		margin: 0 auto;
		background-color: #fff;
		color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
	}
	.chest-container {
		position: relative;
		top: 30px;
	}
	.loot-link {
		position: relative;
		top: 30px;
		border: 3px #000 solid;
		border-radius: 1rem;
		padding: 5px 10px;
		font-size: 16px;
		text-decoration: none;
		font-weight: bold;
		background-color: #fff;
		color: #000;
	}
	.title-text {
		font-size: 15px;
		text-align: center;
		padding: 0 10px;
		text-transform: uppercase;
	}
</style>

<div class="mint-container">
	<img class="title-image" alt="cat loot" src="https://resources.smartlayer.network/images/catloot-hero.png"/>
	<div class="title-text">
		<p>
			Cat loot is a smart drop for smart cats.<br/>
			1000 Cat Loot xNFTs. 900 Whitelist Spots.
		</p>
	</div>
	<div class="mint-progress">
		<MintStatus/>
	</div>
	<div class="chest-container">
		<img class="chest-top" alt="chest top" src="https://resources.smartlayer.network/images/chest-top.png"/><br/>
		<img class="chest-body" alt="chest body" src="https://resources.smartlayer.network/images/chest-body.png"/>
	</div>
	<a class="loot-link" href="https://www.smartlayer.network/smartcatloot" target="_blank">Learn More</a>
	<slot/>
</div>
