
<script lang="ts">
	import Adopt from "./routes/Adopt.svelte";
	import Info from "./routes/Info.svelte";
	import NotFound from "./routes/NotFound.svelte";
	import Feed from "./routes/Feed.svelte";
	import Play from "./routes/Play.svelte";
	import Invite from "./routes/Invite.svelte";
	import Clean from "./routes/Clean.svelte";
	import LevelUp from "./routes/LevelUp.svelte";
	import Messages from "./routes/Messages.svelte";
	import context from "./lib/context";
	import Partners from "./routes/Partners.svelte";
	import LootApprove from "./routes/LootApprove.svelte";
	import LootPurchase from "./routes/LootPurchase.svelte";
	//import Deposit from "./routes/Deposit.svelte";
	//import Withdraw from "./routes/Withdraw.svelte";

	let token;
	let initialised = false;

	const routingMap = {
		'#info': Info,
		'#adopt': Adopt,
		'#feed': Feed,
		'#play': Play,
		'#invite': Invite,
		'#clean': Clean,
		'#levelUp': LevelUp,
		'#messages': Messages,
		'#partners': Partners,
		'#lootApprove': LootApprove,
		'#lootPurchase': LootPurchase
		//'#deposit': Deposit,
		//'#withdraw': Withdraw
	};

	let page;

	function routeChange() {
		page = routingMap[token.level == 0 ? "#adopt" : document.location.hash] || NotFound;
	}

	// @ts-ignore
	web3.tokens.dataChanged = async (oldTokens, updatedTokens, cardId) => {

		if (initialised)
			return;

		context.setToken(updatedTokens.currentInstance);
		token = updatedTokens.currentInstance;

		initialised = true;

		routeChange();
	};

</script>

<svelte:window on:hashchange={routeChange} />

<div>
	<div id="token-container">
		<svelte:component this={page} />
	</div>
</div>