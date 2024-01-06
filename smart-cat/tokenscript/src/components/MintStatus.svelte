

<script lang="ts">
	import {onDestroy, onMount} from "svelte";
	import {getLootContract} from "../lib/data";
	import MintCountdown from "./MintCountdown.svelte";
	import MintProgress from "./MintProgress.svelte";
	import context from "../lib/context";
	import {WHITELIST} from "../lib/constants";

	let timerValue = '-';
	let timer;

	let mintStartMs;
	let mintPublicStartMs;
	let started: null | false | "whitelist" | "public" | "completed";

	let token;
	let isWhitelisted = false

	context.data.subscribe((value) => {
		token = value.token;
		setWhitelist();
	});

	function setWhitelist(){
		const sig = WHITELIST[token.ownerAddress];
		if (sig)
			isWhitelisted = true;

		// @ts-ignore
		web3.action.setProps({whitelistSig: sig ?? "0x00"});
	}

	onMount(async () => {

		const contract = getLootContract();

		mintStartMs = Number(await contract['mintStartTime']()) * 1000;
		//mintStartMs = Date.now()
		mintPublicStartMs = mintStartMs + 30000;

		console.log("Mint start time: ", mintStartMs);
		console.log("Public start time: ", mintPublicStartMs);
		updateStatus();

		timer = setInterval(() => {
			updateStatus();
		}, 2000);
	})

	function updateStatus(){

		const nowEpochMs = Date.now();

		if (nowEpochMs > mintStartMs){
			if (nowEpochMs > mintPublicStartMs){
				started = "public";
				clearInterval(timer);
			} else {
				if (started !== "whitelist")
					started = "whitelist"
			}
		} else {
			if (started !== false)
				started = false;
		}
	}

	function mintCompletedCallback(){
		started = "completed";
		clearInterval(timer);
	}

	onDestroy(() => {
		clearInterval(timer);
	});
</script>

<style>
	.whitelist-status {
		display: flex;
		align-items: center;
		justify-content: center;
		padding-bottom: 10px;
	}
	.whitelist-icon {
		font-family: 'Rubix', sans-serif;
		font-weight: bold;
		font-size: 20px;
		padding-right: 5px;
	}
</style>

{#if started === "completed"}
	<h1 style="margin: 0">Minting completed</h1>
	<p>All the loot has sold out!</p>
{:else}
	<div class="whitelist-status">
		<strong class="whitelist-icon" style="color: {isWhitelisted ? 'rgb(59, 210, 59)' : 'rgb(255, 79, 79)'};">{isWhitelisted ? '✔' : '✗'}</strong>
		<strong>{isWhitelisted ? "You are whitelisted" : "You're not whitelisted"}</strong>
	</div>
	{#if started === false}
		<MintCountdown mintStartMs={mintStartMs} text="Whitelist mint starts in:"/>
	{:else}
		{#if started === "whitelist"}
			{#if isWhitelisted}
				<MintProgress text="Whitelist mint in progress..." mintCompletedCallback={() => mintCompletedCallback()}/>
			{:else}
				<MintCountdown mintStartMs={mintPublicStartMs} text="Public mint starts in:"/>
			{/if}
		{/if}
		{#if started === "public"}
			<MintProgress text="Public mint in progress..." mintCompletedCallback={() => mintCompletedCallback()}/>
		{/if}
	{/if}
{/if}
