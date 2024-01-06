<script lang="ts">
	import context from "../lib/context";

	let token;
	context.data.subscribe((value) => {
		token = value.token;
	});
</script>

<div>
	<h3>Deposit Cat Treats</h3>
	<p>Send ERC20 cat tokens back to your cat, or gift any cat some treats. Yum!</p>
	<strong>Available balance: {token._count}</strong>
	<div class="form-field">
		<input type="text" placeholder=" " id="catId" name="catId" required />
		<label on:click={() => document.getElementById("catId").focus()}>Microchip ID</label>
	</div>
	<div class="form-field">
		<input type="number" step="1" min="1" max={token._count} placeholder=" " id="amount" name="amount" required />
		<label on:click={() => document.getElementById("amount").focus()}>Amount</label>
	</div>
</div>
