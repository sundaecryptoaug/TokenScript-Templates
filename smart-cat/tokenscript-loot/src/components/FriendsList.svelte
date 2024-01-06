
<script lang="ts">
	import type {CatListItem} from "../lib/data";
	import {onMount} from "svelte";

	export let friendsList: CatListItem[] = [];

	let loadedFriends: CatListItem[] = [];

	onMount(() => {
		loadFriends(5);
	});

	function loadFriends(pageSize){
		const currentCursor = loadedFriends.length;
		const nextLimit = currentCursor + pageSize;

		const newLoaded: CatListItem[] = loadedFriends;

		for (let i = currentCursor; i < nextLimit && i < friendsList.length; i++){
			newLoaded.push(friendsList[i]);
		}

		loadedFriends = newLoaded;
	}

</script>

<style>
	.btn-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.load-more-btn {
		margin-top: 16px;
		height: 36px;
		padding: 8px 32px;
		border-radius: 8px;
		border: none;
		background: #EEE;
		cursor: pointer;
	}
	.load-more-btn:hover {
		border-color: #dadada;
		background: #dadada;
	}
</style>

<div class="cat-list">
	{#each loadedFriends as friend}
		<slot friend={friend} />
	{/each}
	{#if loadedFriends.length < friendsList.length}
	<div class="btn-container">
		<button class="load-more-btn" on:click={() => loadFriends(10)}>Load More</button>
	</div>
	{/if}
</div>
