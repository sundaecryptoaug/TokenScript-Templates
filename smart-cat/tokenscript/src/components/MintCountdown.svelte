

<script lang="ts">
	import {onDestroy, onMount} from "svelte";

	export let text;
	export let mintStartMs;

	let timerValue = '-';
	let timer;
	let mintStarted = false;

	onMount(async () => {

		timer = setInterval(() => {
			updateTimerValue();
		}, 1000);
	})

	function updateTimerValue(){

		const nowEpochMs = Date.now();

		if (mintStartMs < nowEpochMs) {
			clearInterval(timer);
			mintStarted = true;
			return;
		}

		const deltaMs = mintStartMs - nowEpochMs;

		const totalSeconds = Math.floor(deltaMs / 1000);
		const totalMinutes = Math.floor(totalSeconds / 60);
		const hours = Math.floor(totalMinutes / 60);
		const seconds = totalSeconds % 60;
		const minutes = totalMinutes % 60;

		timerValue = `${(hours < 10 ? '0' : '') + hours}:${(minutes < 10 ? '0' : '') + minutes}:${(seconds < 10 ? '0' : '') + seconds}`;
	}

	onDestroy(() => {
		clearInterval(timer);
	});
</script>

<div style="margin: 4px 0;">
{#if !mintStarted}
	<strong style="font-size: 14px;">{text}</strong>
	<h3 style="margin: 2px 0;">{@html timerValue}</h3>
	<slot/>
{/if}
</div>
