<script lang="ts">
	import context from "../lib/context";
	import {getInviteList} from "../lib/data";
	import NftIcon from "../components/NftIcon.svelte";
	import OwnerAddress from "../components/OwnerAddress.svelte";
	import Loader from "../components/Loader.svelte";
	import {getLevelLabel} from "../lib/constants.js";
	import TwitterShareButton from "../components/TwitterShareButton.svelte";

	let token;
	let invites = null;
	let selectedInviter = 0;
	let loading = true;

	async function loadInvites(){
		try {
			invites = await getInviteList(token);
		} catch (e){
			console.error(e);
			alert("Failed to load invites: " + e.message);
		}
		loading = false;
	}

	function selectInviter(inviter){
		selectedInviter = inviter.tokenId;
		// @ts-ignore
		web3.action.setProps({inviter: selectedInviter});
	}

	context.data.subscribe(async (value) => {
		if (!value.token)
			return;

		token = value.token;
		await loadInvites();
	});
</script>

<div>
	<h3>Play invites</h3>
	<p>
		Your cat is prone to boredom!
		Accept play-dates from other cats owners to keep your cat happy.
	</p>
	{#if invites}
		{#if invites.length > 0 && !invites.find((invitee) => invitee.canPlay === true)}
			<p>All cats are too tired to play at the moment, check back later.</p>
		{/if}
		{#if invites.length}
			<div class="cat-list">
			{#each invites as inviter}
				<div class="cat-list-item {inviter.canPlay ? '' : 'cant-play'} {selectedInviter === inviter.tokenId ? 'selected' : ''}"
					 title="{!inviter.canPlay ? 'This cat is too tired to play' : ''}"
					 on:click={() => selectInviter(inviter)}>
					<NftIcon tokenUri={inviter.tokenUri}/>
					<div class="cat-list-info">
						<div class="cat-list-title">
							<h4>#{inviter.tokenId}</h4>
							<span>{getLevelLabel(inviter.level)}</span>
						</div>
						<div>
							<OwnerAddress address="{inviter.owner}" />
						</div>
					</div>
				</div>
			{/each}
			</div>
		{:else}
			<h5>You don't have any play requests yet</h5>
			<p class="light">Share your microchip ID with other owners or request a playdate using another microchip ID</p>
			<TwitterShareButton tokenId={token.tokenId} />
		{/if}
	{/if}
	<Loader show={loading}/>
	<input id="inviter" type="hidden" value="{selectedInviter}" />
</div>
