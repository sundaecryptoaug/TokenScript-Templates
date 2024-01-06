
<script lang="ts">
	import Header from "../components/Header.svelte";

	import context from "../lib/context";
	import {getCatsList} from "../lib/data";
	import NftIcon from "../components/NftIcon.svelte";
	import OwnerAddress from "../components/OwnerAddress.svelte";
	import Loader from "../components/Loader.svelte";
	import FriendsList from "../components/FriendsList.svelte";
	import {getLevelLabel} from "../lib/constants.js";
	import {formatEther} from "ethers";

	let token;
	let catList = null;
	let loading = true;

	const loadInfo = async () => {

		try {
			if (!catList)
				catList = await getCatsList(token);
		} catch (e){
			console.error(e);
			alert("Failed to load cat info: " + e.message);
		}

		loading = false;
	}

	context.data.subscribe(async (value) => {
		if (!value.token)
			return;

		token = value.token;
		await loadInfo();
	});

</script>

<style>
	.info-container {
		border-top: 1px solid #EEE;
		padding: 32px 16px;
	}
</style>

<div style="padding: 10px 10px 0">
	<Header/>
	<div style="display: flex; gap: 8px; margin: 24px 0">
		<div class="score-box" style="flex: 33%;">
			<label>WETH Return</label>
			<span>{formatEther(token.wethPayout)} WETH</span>
		</div>
		<div class="score-box" style="flex: 33%;">
			<label>MATIC Return</label>
			<span>{formatEther(token.maticPayout)} MATIC</span>
		</div>
		<div class="score-box" style="flex: 33%;">
			<label>SmartLayer Points</label>
			<span>{token.points}</span>
		</div>
	</div>
</div>
<div>
	{#if catList}
	<div class="info-container">
		<h3 style="font-size: 18px; margin-top: 0;">Cats that have played with this toy {catList.length ? `(${catList.length})` : ''}</h3>
		{#if catList.length}
			<FriendsList friendsList={catList} let:friend>
				<div class="cat-list-item" style="cursor: unset;">
					<NftIcon tokenUri={friend.tokenUri}/>
					<div class="cat-list-info">
						<div class="cat-list-title">
							<h4>#{friend.tokenId}</h4>
							<span>{getLevelLabel(friend.level)}</span>
						</div>
						<div>
							<OwnerAddress address="{friend.owner}" />
						</div>
					</div>
				</div>
			</FriendsList>
		{:else}
			<h5>You haven't lent your toy to any cats yet :-(</h5><p class="light">Once you share the toy, each cat will appear here.</p>
		{/if}
	</div>
	{/if}
	<Loader show={loading}/>
</div>
