<script lang="ts">

	import context from "../lib/context";

	let token;

	context.data.subscribe(async (value) => {
		if (!value.token)
			return;

		token = value.token;
	});
</script>

<style>

</style>

<div>
	<h3>Find cat to play</h3>
	<p>Smart Cats are prone to boredom</p>
	<p>
		Lend your cat toy to a cat to keep them entertained.
		In return you accumulate SmartLayer points that can later be transferred to your SmartLayer pass!
	</p>
	<div class="form-field">
		<input type="text" placeholder=" " id="catId" name="catId" required />
		<label on:click={() => document.getElementById("catId").focus()}>Microchip ID</label>
	</div>
</div>
