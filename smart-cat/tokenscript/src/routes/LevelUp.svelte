<script lang="ts">
	import context from "../lib/context";
	import CatImage from "../components/CatImage.svelte";
	import {getLevelLabel} from "../lib/constants.js";

	const MathsImage = "https://viewer.tokenscript.org/assets/tokenscripts/smart-cat/images/Maths.png";

	let token;
	context.data.subscribe((value) => {
		token = value.token;
	});

	let leveling = false;

	const onMessage = (evt) => {
		if (evt.data?.method !== "transactionEvent")
			return;

		switch (evt.data?.params?.status){
			case "started":
				leveling = true;
				break;
			case "error":
				leveling = false;
				break;
			case "completed":
				leveling = false;
				break;
		}
	}
</script>

<svelte:window on:message={onMessage} />

<style>
	.smart-level-wrapper {
		position: absolute;
		width: 100%;
		left: 0;
		bottom: -30px;
		z-index: 30;
	}
	.smart-level-box {
		position: relative;
		margin: 0 auto;
		display: flex;
		width: 190px;
		padding: 8px 24px;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		border-radius: 8px;
		border: 1px solid #001AFF;
		background: #FAFAFA;
		box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
	}

	.meme-wrapper {
		position: absolute;
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
		z-index: 20;
		overflow: hidden;
	}

	.meme-wrapper .level-image {
		position: absolute;
		width: 0;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		animation: zoom;
		animation-iteration-count: infinite;
		animation-fill-mode: initial;
		animation-timing-function: ease-in;
		animation-duration: 1.5s;
	}

	.meme-wrapper .level-image2 {
		animation-delay: 0.5s;
	}

	.meme-wrapper .level-image3 {
		animation-delay: 1s;
	}

	@keyframes zoom {
		from {
			width: 1%;
		}

		to {
			width: 250%;
		}
	}
</style>

<div>
	<h3>Getting smarter!</h3>
	<p>You've been taking good care of your cat, he's learning more skillz!</p>
	<CatImage imageUrl={token.image_preview_url}>
		<div class="meme-wrapper" style="display: {leveling ? 'block' : 'none'};">
			<img class="level-image" alt="leveling up" src={MathsImage} />
			<img class="level-image level-image2" alt="leveling up" src={MathsImage} />
			<img class="level-image level-image3" alt="leveling up" src={MathsImage} />
		</div>
		<div class="smart-level-wrapper">
			<div class="smart-level-box score-box">
				<label>Smart level</label>
				<span>{getLevelLabel(token.level)}</span>
			</div>
		</div>
	</CatImage>
</div>
