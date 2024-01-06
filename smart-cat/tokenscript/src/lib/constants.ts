
export const LEVEL_TEXT: {[level: number]: string} = {
	1: "Curious Whisker",
	2: "Clever Purrer",
	3: "Savvy Seer",
	4: "Intellectual Prodigy",
	5: "Genius Trailblazer",
	6: "Enlightened Guru",
	7: "Sage Supreme",
	8: "Infinite Brilliance",
	9: "Academicat",
	10: "Paw-sitively Wise",
	11: "Purrful Puzzler",
	12: "Great Catsby",
	13: "Lazer Chaser",
	14: "Meowowsaurus",
	15: "Feline Supreme",
	16: "Colonel Meow",
	17: "Pounce King",
	18: "Mystic Meowster",
	19: "Quantum Leapurr",
	20: "Catzilla",
}

export const getLevelLabel = (level: number) => {
	return level + (LEVEL_TEXT[level] ? " - " + LEVEL_TEXT[level] : '')
}

export const WHITELIST = {
	"0x2F21dC12dd43bd15b86643332041ab97010357D7": "0x6cb8c96615b9fc8be957aa4b7a0f3881c4d63a5ef705a24f3b099dab139402ce7b51e6e5d4aba174f8ab0ad81bcc306c1d7d896e1e6ae7c4727e9452608a905b1c",
	"0x6DDD22a9bCc22811BEc8786d2090F7381Dcd22e8": "0x6d40dec50a0407b86f002e69ff5bbb8fc4e43b6cb181b8ac5be1c0e5de0511cb52e00644d004f3d557c0c73c286aaf94a4404f3179a170d3fc6564acac001d8c1b",
	"0xbefc0255133BC817739e7B3E8b374796370561Ee": "0xc589c81941c6655f366c0a0d5db97538ccfed0771ad11e84c35b85d81985c8672dbec5ab9bbce98d98753b1d027a5097c52c250b48f4a455ec690b21d3007d151c",
	"0x8646DF47d7b16Bf9c13Da881a2D8CDacDa8f5490": "0x6fd3c97b0028099687119d8990e661f36805980272ad3e71eb63dd45f7e945c35f7d7aca3d058004223ff4e29ba96a73de0e47cb898137d277600e9918cf7d6f1c"
}
