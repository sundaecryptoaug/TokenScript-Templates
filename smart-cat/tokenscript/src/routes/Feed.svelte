<script lang="ts">
	let feeding = false;
	let completed = false;

	const onMessage = (evt) => {
		if (evt.data?.method !== "transactionEvent")
			return;

		switch (evt.data?.params?.status){
			case "started":
				feeding = true;
				break;
			case "error":
				feeding = false;
				break;
			/*case "completed":
				feeding = false;
				break;*/
		}
	}
</script>

<svelte:window on:message={onMessage} />

<style>
	.gif-container {
		max-width: 400px;
		width: 100%;
		position:relative;
		margin: 0 20px;
	}
	.gif-container .static {
		width: 100%;
	}
	.gif-container .gif {
		width: 100%;
		display: none;
	}
	.gif-container.play .static {
		display: none;
	}
	.gif-container.play .gif {
		display: block;
	}
</style>

<div>
	<div class="gif-container {feeding ? 'play' : ''}">
		<img class="gif" alt="smart food" src="https://viewer.tokenscript.org/assets/tokenscripts/smart-cat/images/SmartFood.gif" />
		<img class="static" alt="smart food" src="https://viewer.tokenscript.org/assets/tokenscripts/smart-cat/images/SmartFood.png" />
	</div>
	<h3>Your cat is starving!</h3>
	<p>Feed him something tasty to keep him happy!</p>
</div>
