<script lang="ts">
	import context from "../lib/context";
	import CatImage from "../components/CatImage.svelte";

	let token;

	context.data.subscribe((value) => {
		token = value.token;
	});
</script>

<div style="text-align: center; padding: 10px;">
	<h4 style="margin-bottom: 20px">CoolCat Raffle</h4>
	<div style="text-align: left;">
		<p>
			For the next 5 weeks, 5 Cool Cats will be raffled off to our community.
			The raffle starts December 8, 2023, and will last for five weeks. One Cool Cat will be raffled each week.
		</p>
		<p>
			For each level your Smart Cat gains, you will earn an additional entry into the raffle.
			This means that the higher the level of your Smart Cat, the more chances you have to win the raffle.
		</p>
		<p>
			Here's a breakdown of how the raffle entries work:
			<br/><br/>
			Level 1: +1 entry<br/>
			Level 2: +2 entries<br/>
			Level 3: +3 entries<br/>
			Level 4: +4 entries<br/>
			...<br/>
			Level 20: +20 entries<br/>
			<br/><br/>
			For example, if your Smart Cat is level 3, you will have a total of 6 entries into the raffle. This is because you will earn 1 entry for level 1, 2 entries for level 2, and 3 entries for level 3.
		</p>
	</div>
	<div class="link-button" style="position: relative; margin: 20px auto; max-width: 200px;">
		<a href="https://twitter.com/SmartLayer/status/1727826020651438465" target="_blank">Learn More</a>
	</div>
</div>
