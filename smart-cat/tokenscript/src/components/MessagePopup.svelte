
<script lang="ts">
	import context from "../lib/context";
	import type {CatListItem} from "../lib/data";
	import MessageBubble from "./MessageBubble.svelte";
	import Loader from "./Loader.svelte";

	export let closed: () => void;
	export let friendId;
	export let threadsList: ThreadItem;

	type ThreadItem = (CatListItem & { unread: number, messages?: [] });

	let client;
	let token;
	let messages = null;
	let newMessageText = "";
	let reloadTimer;
	let loading = true;

	async function sendMessage(){

		loading = true;

		try {
			const result = await client.sendMessage(newMessageText, friendId);
			messages = [...messages, result];
			const thread = threadsList.find((thread) => thread.tokenId == friendId);
			thread.messages = messages;
			newMessageText = '';
			scrollToBottom(true);
			console.log("Message sent: ", result);
		} catch (e){
			console.error(e);
			alert("Message send failed: " + e.message);
		}

		loading = false;
	}

	async function loadMessages(reload = false){

		const thread = threadsList.find((thread) => thread.tokenId == friendId);

		if (thread.messages && !reload) {
			messages = thread.messages;
			scrollToBottom();
			return;
		}

		thread.messages = await client.getMessageHistory(friendId);
		thread.unread = 0;

		messages = thread.messages;

		scrollToBottom(reload);
	}

	function scrollToBottom(smooth = false){
		setTimeout(() => {
			let messageHistory = document.getElementById('message-history');
			smooth ? messageHistory.scroll({top: messageHistory.scrollHeight, behavior: "smooth"}) : messageHistory.scrollTop = messageHistory.scrollHeight;
		}, 200);
	}

	context.data.subscribe(async (value) => {
		if (!value.token)
			return;

		token = value.token;
		client = (await context.getMessageClient());

		try {
			await loadMessages();
		} catch (e) {
			console.error(e);
			alert("Message load failed: " + e.message);
		}

		loading = false;
		reloadTimer = setInterval(() => loadMessages(true), 10000);
	});

	function cleanupAndClose(){
		if (reloadTimer)
			clearInterval(reloadTimer);
		closed();
	}

</script>

<style>
	#message-popup {
		position: fixed;
		display: flex;
		flex-direction: column;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #fff;
	}

	#message-header {
		display: flex;
		border-bottom: #EEE;
		background: #FAFAFA;
	}

	#message-title {
		flex-grow: 1;
		display: flex;
		align-items: center;
		padding: 10px 10px 10px 0;
		font-size: 16px;
		font-weight: 500;
	}

	#message-close {
		width: 30px;
		height: 50px;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 20px;
		font-weight: bold;
		cursor: pointer;
	}

	#message-history {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		padding: 10px;
		overflow: auto;
	}

	#send-message {
		display: flex;
	}

	#send-message textarea {
		flex-grow: 1;
		margin: 4px;
		border-radius: 4px;
		border: 2px solid #969696;
		outline: 0 !important;
	}

	#send-message textarea:focus {
		border-radius: 4px;
		border: 2px solid #001AFF;
	}

	#send-message button {
		flex-grow: 1;
		margin: 4px 4px 4px 0;
		border-radius: 4px;
		border: 0;
		background: linear-gradient(235deg, #001AFF 37.73%, #4F95FF 118.69%);
	}

	#send-message button:disabled {
		background: linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), linear-gradient(235deg, #001AFF 37.73%, #4F95FF 118.69%);
	}
</style>

<div id="message-popup">
	<div id="message-header">
		<div id="message-close" on:click={() => cleanupAndClose()}>&lt;</div>
		<div id="message-title">
			Chat with cat #{friendId}
		</div>
	</div>
	<div id="message-history">
		{#if messages}
		{#each messages as message}
			<MessageBubble message={message} senderTokenId={token.tokenId} />
		{/each}
		{/if}
		<div class="loader-modal" style="display: {loading ? 'block' : 'none'}">
			<Loader show={loading}/>
		</div>
	</div>
	<div id="send-message">
		<textarea class="message-input" bind:value={newMessageText} placeholder="Message..." disabled={loading}></textarea>
		<button type="button" on:click={() => sendMessage()} disabled={loading || !newMessageText.length}>
			<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
				<g clip-path="url(#clip0_1078_955)">
					<path d="M8.79492 8.20492L13.3749 12.7949L8.79492 17.3849L10.2049 18.7949L16.2049 12.7949L10.2049 6.79492L8.79492 8.20492Z" fill="url(#paint0_linear_1078_955)"/>
					<path d="M8.79492 8.20492L13.3749 12.7949L8.79492 17.3849L10.2049 18.7949L16.2049 12.7949L10.2049 6.79492L8.79492 8.20492Z" fill="white" fill-opacity="0.8"/>
				</g>
				<defs>
					<linearGradient id="paint0_linear_1078_955" x1="12.0883" y1="10.7548" x2="20.3005" y2="17.941" gradientUnits="userSpaceOnUse">
						<stop stop-color="#001AFF"/>
						<stop offset="1" stop-color="#4F95FF"/>
					</linearGradient>
					<clipPath id="clip0_1078_955">
						<rect width="24" height="24" fill="white" transform="translate(0.5 0.5)"/>
					</clipPath>
				</defs>
			</svg>
		</button>
	</div>
</div>

