
<script lang="ts">
	export let message;
	export let senderTokenId;

	let dateString;

	$: {
		const now = new Date();
		const date = new Date(message.createdAt);
		date.setTime(date.getTime() + (now.getTimezoneOffset() * 60000));
		if (date.getDate() < now.getDate()) {
			dateString = date.toLocaleString();
		} else {
			dateString = date.toLocaleTimeString();
		}
	}
</script>

<style>
	.message-bubble {
		margin: 5px;
		border-radius: 10px;
		width: 80%;
		background: #EEE;
		color: #000;
		padding: 8px;
	}

	.message-content {
		font-size: 14px;
		text-align: left;
		word-break: break-word;
	}

	.message-meta {
		padding-top: 6px;
		font-size: 11px;
		text-align: right;
		display: block;
	}

	.message-bubble.sender {
		align-self: end;
		background: #0084ff;
		color: #fff;
	}
</style>

<div class="message-bubble {message.sendingTokenId == senderTokenId ? 'sender' : ''}">
	<div class="message-content">
		{message.message}
	</div>
	<small class="message-meta">
		{message.sendingTokenId == senderTokenId && message.read ? '✓ (seen) ' : ''} {dateString}
	</small>
</div>
