
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
