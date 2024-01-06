
<script lang="ts">
	import Header from "../components/Header.svelte";

	import context from "../lib/context";
	import {getCatState, getFriendsList} from "../lib/data";
	import NftIcon from "../components/NftIcon.svelte";
	import OwnerAddress from "../components/OwnerAddress.svelte";
	import Loader from "../components/Loader.svelte";
	import LevelProgress from "../components/LevelProgress.svelte";
	import {getLevelLabel} from "../lib/constants.js";
	import FriendsList from "../components/FriendsList.svelte";
	import CountdownTimer from "../components/CountdownTimer.svelte";
	import ShareToTwitter from "../components/ShareToTwitter.svelte";

	let token;
	let catState = null;
	let friendsList = null;
	let loading = true;
	let shareOpened = false;

	const loadInfo = async () => {

		try {
			if (!catState)
				catState = await getCatState(token);

			if (!friendsList)
				friendsList = await getFriendsList(token);
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

	function getCurrentLevelProgress(total, level, threshold){
		const levelsCompleted = Number(level) - 1;
		const levelsLt14 = level > 14 ? 14 : levelsCompleted;
		const levelsGte14 = level > 14 ? levelsCompleted - 14 : 0;

		return Number(total) - (Number(threshold) * levelsLt14) - (Number(threshold) * levelsGte14 * 3);
	}
</script>

<style>
	.info-container {
		border-top: 1px solid #EEE;
		padding: 32px 16px;
	}

	.task-header-wrapper {
		display: flex;
		align-items: center;
		margin-bottom: 24px;
	}

	.task-header {
		font-size: 18px;
		text-align: left;
		margin: 0 10px 0 0;
	}

	.action-limits {
		border-radius: 170px;
		height: 22px;
		font-size: 16px;
		font-weight: 400;
		color: #8B8B8B;
		background: #eee;
		display: flex;
		padding: 0 8px;
		justify-content: center;
		align-items: center;
		gap: 10px;
	}

	.task-table {
		text-align: left;
		width: 100%;
		font-size: 16px;
	}

	.task-table thead {
		font-size: 14px;
		font-weight: 400;
		color: #9D9D9D;
	}

	.task-table td {
		margin: 10px 0;
	}

	.link-button {
		cursor: pointer;
	}

	.link-button.opened {
		background: linear-gradient(0deg, rgba(255, 255, 255, 0.80) 0%, rgba(255, 255, 255, 0.80) 100%), linear-gradient(235deg, #001AFF 37.73%, #4F95FF 118.69%)
	}

</style>

<div style="padding: 10px 10px 0">
	<Header/>
	<div style="display: flex; gap: 8px; margin-top: 24px">
		<div class="score-box" style="flex: 50%;">
			<label>Smart level</label>
			<span>{getLevelLabel(token.level)}</span>
		</div>
		<div class="score-box" style="flex: 50%;">
			<label>SmartLayer Points</label>
			<span>{catState ? catState.pointsBalance : '-'}</span>
		</div>
	</div>

	<div style="display: flex; gap: 8px; margin: 24px 0;">
		<div class="link-button" style="flex: 50%;">
			<a href="https://www.smartlayer.network/smartcat/suitup/browse" target="_blank">
				View
			</a>
		</div>
		<div class="link-button {shareOpened ? 'opened' : ''}" style="flex: 50%;">
			<div on:click={() => shareOpened = !shareOpened}>
				Share on X
			</div>
		</div>
	</div>
</div>
{#if shareOpened}
	<ShareToTwitter token={token} catState={catState}/>
{/if}
<div>
	{#if catState}
	<div class="info-container">
		<div class="task-header-wrapper">
			<h3 class="task-header">Today's duties</h3>
			<div class="action-limits">{catState.actionLimitCount} / {catState.maxActions}</div>
		</div>
		<table class="task-table">
			<colgroup>
				<col style="width:30%">
				<col style="width:30%">
				<col style="width:40%">
			</colgroup>
			<thead>
				<tr>
					<th>Task</th>
					<th>Due date</th>
					<th style="text-align: right;">Level up</th>
				</tr>
			</thead>
			<tr>
				<td>Feed</td>
				<td>
					<CountdownTimer epochMs={catState.nextFeed * 1000}/>
				</td>
				<td style="text-align: right;">
					<LevelProgress total={getCurrentLevelProgress(catState.numFeeds, catState.level, catState.levelThresholds.feed)}
								   threshold={catState.level < 15 ? catState.levelThresholds.feed : (Number(catState.levelThresholds.feed) * 3)} />
				</td>
			</tr>
			<tr>
				<td>Clean</td>
				<td>
					<CountdownTimer epochMs={catState.nextClean * 1000}/>
				</td>
				<td style="text-align: right;">
					<LevelProgress total={getCurrentLevelProgress(catState.numCleans, catState.level, catState.levelThresholds.clean)}
								   threshold={catState.level < 15 ? catState.levelThresholds.clean : (Number(catState.levelThresholds.clean) * 3)} />
				</td>
			</tr>
			<tr>
				<td>Playdates</td>
				<td>
					<CountdownTimer epochMs={catState.nextPlay * 1000}/>
				</td>
				<td style="text-align: right;">
					<LevelProgress total={getCurrentLevelProgress(catState.numPlays, catState.level, catState.levelThresholds.play)}
								   threshold={catState.level < 15 ? catState.levelThresholds.play : (Number(catState.levelThresholds.play) * 3)} />
				</td>
			</tr>
		</table>
	</div>
	{/if}
	{#if friendsList}
	<div class="info-container">
		<h3 style="font-size: 18px; margin-top: 0;">Friends {friendsList.length ? `(${friendsList.length})` : ''}</h3>
		{#if friendsList.length}
			<FriendsList friendsList={friendsList} let:friend>
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
			<h5>Your cat doesn't have any friends yet :-(</h5><p class="light">Once you complete play dates, new friends will appear here.</p>
		{/if}
	</div>
	{/if}
	<Loader show={loading}/>
</div>
