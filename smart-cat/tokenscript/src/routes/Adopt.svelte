<script lang="ts">
	import context from "../lib/context";
	import CatImage from "../components/CatImage.svelte";

	let token;

	context.data.subscribe((value) => {
		token = value.token;
	});
</script>

<div style="text-align: center; padding: 10px;">
	<img alt="smartcat gameboy" src="https://viewer.tokenscript.org/assets/tokenscripts/smart-cat/images/Gameboy.png" style="width: 200px;"/>
	<h3>Once upon a time...</h3>
	<p>
		There was a cat that was pretty cool, but it also wanted to be smart.
		So it went to Smart Layer Labs and got a TokenScript Microchip to boost its mind.
	</p>
	<div style="position: relative; margin: 0 auto; width: 100%; max-width: 300px;">
		<CatImage imageUrl={token.image_preview_url}></CatImage>
	</div>
	<p>
		Now this cat needs someone to adopt it and help to train its skills. Let's give the cat an initial feed to win it over.
		It's free to adopt and play but you'll need some MATIC to pay for transaction fees on the Polygon network.
		Transactions are generally 0.01 MATIC, starting off with 0.5 MATIC is recommended.
	</p>
	<h3>Adopt your cat Now!</h3>
</div>
