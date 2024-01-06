
<script lang="ts">
	import context from "../lib/context";

	let token;
	let challengeUrl;

	context.data.subscribe(async (value) => {
		if (!value.token)
			return;

		token = value.token;
	});

	function signChallengeAndOpenLink(e){
		const elem = e.target;

		const challengeCompleted = elem.getAttribute("href");

		if (challengeCompleted) {
			return;
		}

		const link = elem.getAttribute("data-link");
		let challenge = elem.getAttribute("data-challenge");
		challenge += token.tokenId;

		// @ts-ignore
		web3.personal.sign({ data: challenge }, function (error, value) {
			if (error != null) {
				alert(error);
			}
			else
			{
				console.log(value);
				const challengeParam = challenge + "-" + value;
				const url = link + (link.indexOf("?") > -1 ? "&" : "?") + "challenge=" + encodeURIComponent(challengeParam);

				challengeUrl = url;
				//window.open(url, "_blank");
			}
		});
	}

</script>

<style>
	.partner-link {
		margin-top: 25px;
		padding: 10px 0;
		border-top: 1px #eee solid;
	}

	.partner-link .link-button {
		cursor: pointer;
	}
</style>

<div>
	<h3>Our Partners</h3>
	<p>Earn additional SmartLayer points by completing quests only available through your SmartCat</p>
	<p>These are gas free transactions powered by your SmartLayer pass.</p>
	{#if token}
	<div class="partner-link">
		<h4>Aethir</h4>
		<p>Follow Aethir on Twitter to get 200 points</p>
		<div class="link-button" style="position: relative; margin: 0 auto; max-width: 200px;">
			<a data-link="https://smartlayer.network/pass?enableTwitterRaid=true"
			   data-challenge="AethirTwitterRaid"
			   target="_blank"
			   href={challengeUrl}
				on:click={(e) => signChallengeAndOpenLink(e)}>
				{challengeUrl ? "2. Complete Quest" : "1. Sign Challenge"}
			</a>
		</div>
	</div>
	{/if}
</div>
