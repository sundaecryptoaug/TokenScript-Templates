<script lang="ts">

	import context from "../lib/context";
	import {getFriendsList} from "../lib/data";
	import type {CatListItem} from "../lib/data";
	import NftIcon from "../components/NftIcon.svelte";
	import OwnerAddress from "../components/OwnerAddress.svelte";
	import MessagePopup from "../components/MessagePopup.svelte";
	import Loader from "../components/Loader.svelte";

	type ThreadItem = (CatListItem & { unread: number, messages?: [] });

	let token;
	let threadsList: ThreadItem[]|null = null;
	let selectedFriendId = null;
	let loading = true;
	let reloadTimer;

	const loadThreads = async () => {

		const res = await (await context.getMessageClient()).getNewMessages();

		const friendsList = await getFriendsList(token);

		const list = [];

		for (const friend of friendsList){
			list.push({
				...friend,
				unread: res.senders[friend.tokenId]?.unread ?? 0
			} as ThreadItem)
		}

		threadsList = list.sort((a, b) => {
			return a.unread < b.unread ? 1 : -1
		});
	}

	context.data.subscribe(async (value) => {
		if (!value.token)
			return;

		token = value.token;

		try {
			await loadThreads();
		} catch (e){
			console.error(e);
			//alert("Message load failed: " + e.message);
		}

		loading = false;

		reloadTimer = setInterval(() => loadThreads(), 60000);
	});
</script>

<style>
	.unread-count.has-unread {
		font-weight: 600;
		font-size: 14px;
		display: flex;
		align-items: center;
	}
	.unread-count.has-unread:before {
		content: '•';
		color: #0724ff;
		font-weight: 700;
		font-size: 28px;
		line-height: 14px;
		padding: 0 4px;
	}
</style>

<h3>Messages</h3>
<p>Send messages to other cat owners.</p>
<div style="text-align: left; border-radius: 5px; border: 2px solid red; padding: 5px; margin: 0 10px 20px 0; font-size: 12px;">
	The chat is not moderated so please:
	<ul>
		<li>Do not visit any links sent by people in chat</li>
		<li>Be respectful & mindful of inappropriate language</li>
	</ul>
	Offenders may have their cat confiscated by SmartCat protective services.
</div>
<div id="thread-list">
	{#if threadsList}
		{#if threadsList.length}
			<div class="cat-list">
			{#each threadsList as friend}
				<div class="cat-list-item" on:click={() => {
					selectedFriendId = friend.tokenId;
					friend.unread = 0;
				}}>
					<NftIcon tokenUri={friend.tokenUri}/>
					<div class="cat-list-info">
						<div class="cat-list-title">
							<h4>#{friend.tokenId}</h4>
							<span class={"unread-count" + (friend.unread > 0 ? ' has-unread' : '')}>{friend.unread} Unread</span>
						</div>
						<div>
							<OwnerAddress address="{friend.owner}" />
						</div>
					</div>
				</div>
			{/each}
			</div>
		{:else}
			<h5>You don't have any friends yet :-(</h5><p class="light">Once you complete play dates, new friends will appear here.</p>
		{/if}
	{/if}
	<Loader show={loading}/>
	{#if selectedFriendId}
		<MessagePopup threadsList={threadsList} friendId={selectedFriendId} closed={() => selectedFriendId = null} />
	{/if}
</div>
