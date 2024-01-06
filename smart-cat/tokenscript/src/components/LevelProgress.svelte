
<script lang="ts">
	export let threshold;
	export let total;

	function getPercent(){
		threshold
	}
</script>

<style>
	.progress-contain {
		display: flex;
		align-items: center;
		position: relative;
	}
	.progress-text {
		color: #9D9D9D;
		flex: 40%;
	}
	.progress-bar {
		margin-left: 10px;
		flex-grow: 1;
		height: 12px;
		border-radius: 80px;
		background: #EEEEEE;
		flex: 60%
	}
	.progress-inner {
		position: relative;
		border-radius: 80px;
		left: 0;
		height: 100%;
		background: linear-gradient(235deg, #001AFF 37.73%, #4F95FF 118.69%);
	}
</style>

<div class="progress-contain">
	<span class="progress-text">{total} / {threshold}</span>
	<div class="progress-bar">
		<div class="progress-inner" style="width: {Math.min(Math.round((parseInt(total) / parseInt(threshold)) * 100), 100)}%;"></div>
	</div>
</div>
