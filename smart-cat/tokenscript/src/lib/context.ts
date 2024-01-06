
import {writable} from 'svelte/store';
import {MessageClient} from "./messageClient";

let messageClient = null;

const data = writable({
	token: null
});

function setToken(token){
	data.set({
		...data,
		token
	});

	// Do some other stuff
}

async function getMessageClient(){

	if (messageClient)
		return messageClient;

	return new Promise((resolve, reject) => {
		data.subscribe((data) => {
			messageClient = new MessageClient(data.token);
			resolve(messageClient);
		})
	})
}

export default {
	data,
	setToken,
	getMessageClient
}
