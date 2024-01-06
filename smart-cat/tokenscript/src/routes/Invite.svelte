<script lang="ts">

	import {getFriendsList, getPendingInvites} from "../lib/data";
	import context from "../lib/context";
	import Loader from "../components/Loader.svelte";
	import FriendsList from "../components/FriendsList.svelte";
	import NftIcon from "../components/NftIcon.svelte";
	import OwnerAddress from "../components/OwnerAddress.svelte";
	import TwitterShareButton from "../components/TwitterShareButton.svelte";

	let token;
	let selectedTab = "pending";
	let pendingLoading = false;
	let pendingList = null;
	let friendsLoading = false;
	let friendsList = null;

	const loadPending = async () => {
		pendingLoading = true;
		try {
			if (!pendingList)
				pendingList = await getPendingInvites(token);
		} catch (e){
			console.error(e);
			alert("Failed to load pending invites: " + e.message);
		}
		pendingLoading = false;
	}

	const loadFriends = async () => {
		friendsLoading = true;
		try {
			if (!friendsList)
				friendsList = await getFriendsList(token);
		} catch (e){
			console.error(e);
			alert("Failed to load pending invites: " + e.message);
		}
		friendsLoading = false;
	}

	const selectTab = (tabId: 'pending'|'friends') => {
		if (tabId === 'friends')
			loadFriends();
		selectedTab = tabId;
	}

	context.data.subscribe(async (value) => {
		if (!value.token)
			return;

		token = value.token;
		await loadPending();
	});
</script>

<style>
	.tabs {
		padding: 0 10px;
	}
	.tabs-header {
		display: flex;
		align-items: center;
		padding: 20px 0;
		gap: 20px;
	}
	.tab-item {
		font-size: 18px;
		font-style: normal;
		font-weight: 500;
		color: #8B8B8B;
		cursor: pointer;
	}
	.tab-item.selected {
		color: #001AFF;
	}
	.invite-btn-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 8px;
	}
	.invite-btn {
		width: 88px;
	}
</style>

<div>
	<h3>Play with other cats</h3>
	<p>Your cat is prone to boredom!</p>
	<p>
		Send play-dates request to other cats owners to keep your cat happy.
		Note that you cannot send invites to your own cat, or your cats brothers and sisters in the same wallet.
	</p>
	<TwitterShareButton tokenId={token.tokenId} />
	<div class="form-field">
		<input type="text" placeholder=" " id="invitee" name="invitee" required />
		<label on:click={() => document.getElementById("invitee").focus()}>Microchip ID</label>
	</div>
	<div class="tabs">
		<div class="tabs-header">
			<div class="tab-item {selectedTab === 'pending' ? 'selected' : ''}" on:click={() => selectTab('pending')}>Pending dates ({pendingList?.length ?? 0})</div>
			<div class="tab-item {selectedTab === 'friends' ? 'selected' : ''}" on:click={() => selectTab('friends')}>Friends</div>
		</div>
		<div class="pending-tab" style="display: {selectedTab === 'pending' ? 'block' : 'none'}">
			{#if pendingList !== null}
				{#if pendingList.length}
					<div class="cat-list">
						{#each pendingList as pending}
						<div class="cat-list-item" style="cursor: unset;">
							<NftIcon tokenUri={pending.tokenUri}/>
							<div class="cat-list-info">
								<div class="cat-list-title">
									<h4>#{pending.tokenId}</h4>
								</div>
								<div>
									<OwnerAddress address="{pending.owner}" />
								</div>
							</div>
						</div>
						{/each}
					</div>
				{:else}
					<h5>No pending invites</h5>
				{/if}
			{/if}
			<Loader show={pendingLoading}/>
		</div>
		<div class="friends-tab" style="display: {selectedTab === 'friends' ? 'block' : 'none'}">
			{#if friendsList !== null}
				{#if friendsList.length}
					<FriendsList friendsList={friendsList} let:friend>
						<div class="cat-list-item" style="cursor: unset;">
							<NftIcon tokenUri={friend.tokenUri}/>
							<div class="cat-list-info">
								<div class="cat-list-title">
									<h4>#{friend.tokenId}</h4>
								</div>
								<div>
									<OwnerAddress address="{friend.owner}" />
								</div>
							</div>
							<div class="invite-btn-wrapper">
								<button class="primary-btn invite-btn" on:click={() => {
										const elem = document.getElementById("invitee");
										elem.value = friend.tokenId;
										const event = new Event('change', {bubbles: true});
										elem.dispatchEvent(event);
									}}>Invite</button>
							</div>
						</div>
					</FriendsList>
				{:else}
					<h5>Your cat doesn't have any friends yet :-(</h5><p class="light">Once you complete play dates, new friends will appear here.</p>
				{/if}
			{/if}
			<Loader show={friendsLoading}/>
		</div>
	</div>

</div>
