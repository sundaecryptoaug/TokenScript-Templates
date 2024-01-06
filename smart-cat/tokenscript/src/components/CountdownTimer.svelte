
<script lang="ts">
	import {onDestroy, onMount} from "svelte";

	export let epochMs;

	let nowEpochMs;
	let timerValue = '-';
	let timer;

	onMount(() => {
		timer = setInterval(() => {
			nowEpochMs = Date.now();
			updateTimerValue();
		}, 1000);
	})

	function updateTimerValue(){

		if (epochMs < nowEpochMs) {
			timerValue = '<span style="color: #D93F45;">Now</span>';
			clearInterval(timer);
			return;
		}

		const dueDate = new Date(epochMs);
		const isToday = dueDate.getDate() === (new Date(nowEpochMs)).getDate();

		const deltaMs = epochMs - nowEpochMs;

		const totalSeconds = Math.floor(deltaMs / 1000);
		const totalMinutes = Math.floor(totalSeconds / 60);
		const hours = Math.floor(totalMinutes / 60);
		const seconds = totalSeconds % 60;
		const minutes = totalMinutes % 60;

		timerValue = `
			<span style="color: ${isToday ? '#FFC759' : '#000'};" title="${dueDate.toLocaleString()}">
				${(hours < 10 ? '0' : '') + hours}:${(minutes < 10 ? '0' : '') + minutes}:${(seconds < 10 ? '0' : '') + seconds}
			</span>
		`;
	}

	onDestroy(() => {
		clearInterval(timer);
	});
</script>

{@html timerValue}


