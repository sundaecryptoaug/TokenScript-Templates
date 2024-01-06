
<script lang="ts">
	export let tokenId;
</script>

<button class="primary-btn invite-btn" on:click={() => {
	const tweetText = `Meow Meow 😺! My #smartcat is lonely. Cat #${tokenId} is looking for a playdate. Please invite me.`;
	window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
}}>Share on X (Twitter)</button>
