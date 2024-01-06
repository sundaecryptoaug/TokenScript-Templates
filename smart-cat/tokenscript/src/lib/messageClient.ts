

export class MessageClient {

	private static BASE_URL = "https://chat.tokenscript.org/api";
		// "https://stltesting.wallaceit.com.au/sc-chat/api";
		// "http://127.0.0.1:3008/api";

	private challengeExp = null;
	private challengeText = null;
	private challengeSig = null;

	constructor(private tokenContext: any) {

	}

	public async getNewMessages(){
		return (await this.requestWithAuth(`/message-count/${this.tokenContext.tokenId}`, "get"));
	}

	public async getMessageHistory(friendId: number){
		return await this.requestWithAuth(`/message-history/${this.tokenContext.tokenId}/${friendId}`, "get");
	}

	public async sendMessage(message: string, friendId: number){
		return await this.requestWithAuth(`/send-message/${this.tokenContext.tokenId}/${friendId}`, "post", {message});
	}

	private async requestWithAuth(url: string, method: "get"|"post", requestData?: any){

		if (!this.challengeText || this.challengeExp < Date.now()){
			await this.fetchAndSignChallenge();
		}

		try {
			return await this.request(url, method, requestData);
		} catch (e) {
			if (e.message === "Authorisation failed"){
				this.challengeText = null;
				await this.fetchAndSignChallenge();
				return await this.request(url, method, requestData);
			}
			throw e;
		}
	}

	private async fetchAndSignChallenge(){

		const challenge = (await this.request("/challenge", "get"));

		const res = new Promise((resolve, reject) => {
			// @ts-ignore
			web3.personal.sign({ data: challenge.text }, function (error, value) {
				if (error != null) {
					reject(error);
				}
				else
				{
					resolve(value);
					console.log(value);
				}
			});
		});

		try {
			this.challengeSig = await res;
			this.challengeExp = challenge.expiry;
			this.challengeText = challenge.text;
		} catch (e){
			console.error("Authentication failed: ", e);
			throw new Error(e);
		}
	}

	private async request(url: string, method: "get"|"post", requestData?: any){

		const headers: any = {
			"Content-type": "application/json",
			"Accept": "application/json",
		};

		if (this.challengeSig)
			headers["X-SmartCat-Auth"] = this.challengeText + ":" + this.challengeSig;

		const res = await fetch(MessageClient.BASE_URL + url, {
			method,
			headers,
			body: requestData ? JSON.stringify(requestData): undefined
		});

		let data: any;

		try {
			data = await res.json();
		} catch (e: any){

		}

		if (res.status > 299 || res.status < 200){
			if (res.status === 403)
				throw new Error("Authorisation failed");
			throw new Error("HTTP Request failed:" + (data?.message ?? res.statusText ));
		}

		return data;
	}
}
