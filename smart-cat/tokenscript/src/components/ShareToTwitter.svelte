
<script lang="ts">
	import CatImage from "./CatImage.svelte";

	export let token;
	export let catState: any;

	let isDrag = false;

	let mouseDown = false;
	let startX, scrollLeft;
	let dragElem;
	let didDrag = false;

	const startDragging = (e) => {
		e.stopPropagation();
		e.preventDefault();
		mouseDown = true;
		startX = e.pageX - dragElem.offsetLeft;
		scrollLeft = dragElem.scrollLeft;
		didDrag = false;
	}

	const stopDragging = (e) => {
		e.stopPropagation();
		e.preventDefault();
		mouseDown = false;
	}

	const move = (e) => {
		e.stopPropagation();
		e.preventDefault();
		if(!mouseDown) { return; }
		const x = e.pageX - dragElem.offsetLeft;
		const scroll = x - startX;
		dragElem.scrollLeft = scrollLeft - scroll;
		didDrag = true;
	}

	const openSeaLink = 'https://opensea.io/assets/matic/0xd5ca946ac1c1f24eb26dae9e1a53ba6a02bd97fe/';

	const shareToTwitter = (type:'play'|'show'|'impress') => {

		if (didDrag)
			return;

		let tweetText;

		switch (type){
			case "play":
				tweetText = `Meow Meow 😺! My #smartcat is lonely. Cat #${token.tokenId} is looking for a playdate. Please invite me.`;
				break;
			case "show":
				tweetText = `Meow Meow 😺! Who have I not followed? Let’s connect & Follow each other on X ${openSeaLink}${token.tokenId}`;
				break;
			case "impress":
				tweetText = `Meow Meow 😺! My #smartcat #${token.tokenId} is now on level ${token.level} and has collected ${catState.pointsBalance} #smartlayer points! Check it out: ${openSeaLink}${token.tokenId}`;
				break;
		}

		window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
	}
</script>

<style>
	.share-container {
		display: flex;
		flex-direction: column;
		background: linear-gradient(0deg, rgba(255, 255, 255, 0.80) 0%, rgba(255, 255, 255, 0.80) 100%), linear-gradient(235deg, #001AFF 37.73%, #4F95FF 118.69%);
		text-align: left;
		width: 100%;
	}
	.share-header {
		font-size: 18px;
		font-style: normal;
		font-weight: 600;
		margin: 0;
		padding: 32px 16px 24px 16px;
	}
	.share-list {
		display: flex;
		padding-bottom: 32px;
		padding-left: 16px;
		padding-right: 16px;
		gap: 16px;
		overflow-x: auto;
	}
	.share-option {
		width: 264px;
		background-color: #FFFEFE;
		display: flex;
		flex-direction: column;
		border-radius: 7px;
		padding: 16px;
		gap: 8px;
		flex-shrink: 0;
		cursor: pointer;
	}
	.share-option h5 {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
	}
	.share-option p {
		font-size: 14px;
		font-weight: 400;
		margin: 0;
	}
	.share-image {
		width: 40px;
	}
</style>

<div class="share-container">
	<h4 class="share-header">Click below to Choose your sharing goals and gain followers</h4>
	<div class="share-list" bind:this={dragElem} on:mousemove={move} on:mousedown={startDragging} on:mouseup={stopDragging} on:mouseleave={stopDragging}>
		<div class="share-option" on:click={() => shareToTwitter('play')}>
			<img class="share-image" alt="letter" src="https://viewer.tokenscript.org/assets/tokenscripts/smart-cat/images/opened-letter.png" crossorigin />
			<h5>Find playdate mates and make new friends</h5>
			<p>Share your Microchip ID with other SmartCat owners to find playdates</p>
		</div>
		<div class="share-option" on:click={() => shareToTwitter('show')}>
			<div class="share-image">
				<CatImage imageUrl={token.image_preview_url} />
			</div>
			<h5>Show off your kitten</h5>
			<p>Share a picture of your cat like a proud owner and get others’ opinion</p>
		</div>
		<div class="share-option" on:click={() => shareToTwitter('impress')}>
			<img class="share-image" alt="rubix cube" src="https://viewer.tokenscript.org/assets/tokenscripts/smart-cat/images/rubix-cube.png" crossorigin />
			<h5>Impress with your Smartness</h5>
			<p>Let the community know how smart your cat has become</p>
		</div>
	</div>
</div>

