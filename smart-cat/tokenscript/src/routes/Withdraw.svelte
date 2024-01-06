<script lang="ts">
	import context from "../lib/context";

	let token;
	context.data.subscribe((value) => {
		token = value.token;
	});
</script>

<div>
	<h3>Withdraw Cat Treats</h3>
	<p>You can withdraw Cat Treats to your wallet as ERC20 tokens and trade them on the secondary market or transfer to another cat.</p>
	<strong>Available balance: {token.treatBalance}</strong>
	<div class="form-field">
		<input type="number" step="1" min="1" max={token.treatBalance} placeholder=" " id="amount" name="amount" required />
		<label on:click={() => document.getElementById("amount").focus()}>Amount</label>
	</div>
</div>
