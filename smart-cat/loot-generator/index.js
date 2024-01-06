
const Canvas = require("canvas");
const {loadImage} = require("canvas");
const fs = require("fs");

const baseLabels = {
	"bird_plushie": "Bird Plushie",
	"bouncy_ball": "Bouncy Ball",
	"cardboard_box": "Cardboard Box",
	"collapsible_tunnel": "Collapsible Tunnel",
	"feather_wand": "Feather Wand",
	"fish_cookie": "Fish Cookie",
	"laser_pointer": "Laser Pointer",
	"mini_cat_tree": "Mini Cat Tree",
	"octopus_plushie": "Octopus Plushie",
	"scratch_pole": "Scratch Pole",
	"soft_pillow": "Soft Pillow",
	"squeaky_mouse": "Squeaky Mouse",
};

const backgrounds = {
	"blue": "Blue",
	"green": "Green",
	"indigo": "Indigo",
	"magenta": "Magenta",
	"orange": "Orange",
	"pink": "Pink",
	"tan": "Tan",
	"yellow": "Yellow",
}

const variants = {
	"bird_plushie": {
		"tail": {
			"label": "Tail",
			"values": {
				"eagle": "Eagle",
				"fluffy": "Fluffy",
				"long": "Long",
				"short": "Short",
				"sleek": "Sleek"
			}
		},
		"body": {
			"label": "Body",
			"values": {
				"feathers": "Feathers"
			}
		},
		"beak": {
			"label": "Beak",
			"values": {
				"birdie": "Birdie",
				"colibri": "Colibri",
				"hook": "Hook",
				"pointy": "Pointy",
				"toucan": "Toucan"
			}
		},
		"eyes": {
			"label": "Eyes",
			"values": {
				"candy": "Candy",
				"glass": "Glass",
				"glittery": "Glittery",
				"owl": "Owl",
				"regular": "Regular",
				"swirly": "Swirly",
				"white": "White"
			}
		}
	},
	"bouncy_ball": {
		"body": {
			"label": "Body",
			"values": {
				"purple": "Purple"
			}
		},
		"type": {
			"label": "Type",
			"values": {
				"catch-em": "Catch 'em",
				"confetti": "Confetti",
				"four-way": "Four Way",
				"wave": "Wave",
				"yarn": "Yarn"
			}
		},
		"details": {
			"label": "Details",
			"values": {
				"feather": "Feather",
				"leaf": "Leaf",
			}
		},
	},
	"cardboard_box": {
		"material": {
			"label": "Material",
			"values": {
				"blue": "Blue",
				"cheese": "Cheese",
				"classic": "Classic",
				"pink-gift": "Pink Gift",
				"wooden": "Wooden"
			}
		},
		"detail": {
			"label": "Detail",
			"values": {
				"cat-face": "Cat Face",
				"gift": "Gift",
				"plane": "Plane",
				"smart-cats": "Smart Cats",
				"stickers": "Stickers"
			}
		},
		"top": {
			"label": "Top",
			"values": {
				"birdie": "Birdie",
				"half-open": "Half Open",
				"monster": "Monster",
				"party-balloons": "Party Balloons",
				"playful-cat": "Playful Cat",
				"rabbits": "Rabbits",
				"resting-cat": "Resting Cat",
				"ribbon": "Ribbon",
				"shark": "Shark",
				"shut": "Shut",
				"taped": "Taped",
				"wide-open": "Wide Open",
			}
		},
	},
	"collapsible_tunnel": {
		"color": {
			"label": "Color",
			"values": {
				"green": "Green",
				"orange": "Orange",
				"plastic": "Plastic", // Is this right?
				"rainbow": "Rainbow",
				"yellow": "Yellow",
			}
		},
		"detail": {
			"label": "Detail",
			"values": {
				"mouse": "Mouse",
				"sliding-cat": "Sliding Cat",
				"teethy": "Teethy",
				"yarn-ball": "Yarn Ball",
				"zooming-cat": "Zooming Cat",
			}
		},
		"top": {
			"label": "Top",
			"values": {
				"bunny": "Bunny",
				"dragon": "Dragon",
				"classic": "Classic",
			}
		},
	},
	"feather_wand": {
		"handle": {
			"label": "handle",
			"values": {
				"purple": "Purple"
			}
		},
		"bottom": {
			"label": "Bottom",
			"values": {
				"half-moon": " Half Moon",
				"sphere": "Sphere",
				"star": "Star"
			}
		},
		"face": {
			"label": "Face",
			"values": {
				"cool": "Cool",
				"monocle": "Monocle",
				"moon": "Moon",
			}
		},
		"feather": {
			"label": "Feather",
			"values": {
				"magic": "Magic",
				"pointy": "Pointy",
				"rounded": "Rounded",
			}
		},
	},
	"fish_cookie": {
		"dough": {
			"label": "Dough",
			"values": {
				"cream": "Cream",
				"gold": "Gold",
				"savoury": "Savoury",
				"sweet": "Sweet",
			}
		},
		"eyes": {
			"label": "Eyes",
			"values": {
				"cute": "Cute",
				"regular": "Regular",
				"swirly": "Swirly",
				"wide-open": "Wide Open"
			}
		},
		"pattern": {
			"label": "Pattern",
			"values": {
				"dotted": "Dotted",
				"parallel": "Parallel",
				"regular": "Regular",
				"wavy": "Wavy",
				"wavy-gold": "Wavy Gold",
				"zig-zag": "Zig Zag",
			}
		},
		"tails": {
			"label": "Tails",
			"values": {
				"forked-cream": "Forked Cream",
				"forked-savoury": "Forked Savoury",
				"narrow-cream": "Narrow ",
				"wavy-cream": "Wavy Cream",
				"wavy-gold": "Wavy Gold",
				"wavy-sweet": "Wavy Sweet",
				"wide-cream": "Wide Cream",
			}
		}
	},
	"laser_pointer": {
		"base": {
			"label": "Background",
			"values": {
				"blurple": "Blurple", // Check this with luke
			}
		},
		"laser": {
			"label": "Laser",
			"values": {
				"magenta": "Magenta",
				"orange": "Orange",
				"yellow": "Yellow"
			}
		},
		"button": {
			"label": "Button",
			"values": {
				"asterix": "Asterix",
				"love": "Love",
				"round": "Round"
			}
		},
		"face": {
			"label": "Face",
			"values": {
				"intense": "Intense",
				"kawaii": "Kawaii",
				"swirly": "Swirly"
			}
		},
	},
	"mini_cat_tree": {
		"base" : {
			"label": "Base", // check this with luke
			"values": {
				"base": "Base",
			}
		},
		"dangling": {
			"label": "Dangling",
			"values": {
				"fish": "Fish",
				"hamster-cat": "Hamster Cat",
				"mouse": "Mouse"
			}
		},
		"left_perch": {
			"label": "Left Perch",
			"values": {
				"cat-food": "Cat Food",
				"nest": "Nest",
				"shelf": "Shelf"
			}
		},
		"right_perch": {
			"label": "Right Perch",
			"values": {
				"apple": "Apple",
				"heart": "Heart",
				"shelf": "Shelf"
			}
		},
		"trunk": {
			"label": "Trunk",
			"values": {
				"candy-cane": "Candy Cane",
				"classic": "Classic",
				"polkadot": "Polkadot",
				"yellow": "Yellow"
			}
		},
		"top": {
			"label": "Top",
			"values": {
				"fence": "Fence",
				"flower": "Flower",
				"pillow": "Pillow",
				"platform": "Platform"
			}
		},
	},
	"octopus_plushie": {
		"skin": {
			"label": "Skin",
			"values": {
				"blue": "Blue",
				"gold": "Gold",
			}
		},
		"accessory": {
			"label": "Accessory",
			"values": {
				"flower": "Flower",
				"gold-monocle": "Gold Monocle",
				"monocle": "Monocle",
				"straw-hat": "Straw Hat"
			}
		},
		"eyes": {
			"label": "Eyes",
			"values": {
				"buttoned": "Buttoned",
				"pixelated": "Pixelated",
				"regular": "Regular",
				"swirly": "Swirly"
			}
		},
		"suction_cups": {
			"label": "Suction Cups",
			"values": {
				"circle": "Circle",
				"diamond": "Diamond",
				"gold-circle": "Gold Circle",
				"heart": "Heart"
			}
		}
	},
	"scratch_pole": {
		"base" : {
			"label": "Base", // check this with luke
			"values": {
				"base": "Base",
			}
		},
		"material": {
			"label": "Material",
			"values": {
				"candy-cane": "Candy Cane",
				"clown": "Clown",
				"fluzzy": "Fluzzy", // check this with luke
				"sisal": "Sisal",
				"trunk": "Trunk",
			}
		},
		"dangling": {
			"label": "Dangling",
			"values": {
				"cool-cat": "Cool Cat",
				"ethereum": "Ethereum",
				"hamster-cat": "Hamster Cat",
				"mouse": "Mouse",
				"ribbon": "Ribbon",
				"rubber-ball": "Rubber Ball"
			}
		},
		"top": {
			"label": "Top",
			"values": {
				"classic": "Classic",
				"house": "House",
				"pirate-perch": "Pirate Perch",
				"post-box": "Post Box",
				"ufo": "UFO",
			}
		}
	},
	"soft_pillow": {
		"base" : {
			"label": "Base", // check this with luke
			"values": {
				"pink": "Pink",
			}
		},
		"detail": {
			"label": "Detail",
			"values": {
				"flower": "Flower",
				"ribbon": "Ribbon",
				"star": "Star"
			}
		},
		"face": {
			"label": "Face",
			"values": {
				"happy": "Happy",
				"hypnotized": "Hypnotized",
				"sleepy": "Sleepy"
			}
		},
		"pattern": {
			"label": "Pattern",
			"values": {
				"mask": "Mask",
				"orangellow": "Orangellow",
				"yellow-circle": "Yellow Circle"
			}
		},
	},
	"squeaky_mouse": {
		"body" : {
			"label": "Body", // check this with luke
			"values": {
				"greenorange": "Green & Orange",
			}
		},
		"ears": {
			"label": "Ears",
			"values": {
				"love": "Love",
				"pointy": "Pointy",
				"round": "Round",
			}
		},
		"eyes": {
			"label": "Eyes",
			"values": {
				"annoyed": "Annoyed",
				"cute": "cute",
				"swirly": "swirly"
			}
		},
		"tail": {
			"label": "Tail",
			"values": {
				"lightning": "Lightning",
				"mouse": "mouse",
				"wiggly": "Wiggly"
			}
		},
	},
}

const metaBaseUrl = "https://viewer-staging.tokenscript.org/assets/tokenscripts/smart-cat/loot-meta/";
const viewerBase = "https://viewer-staging.tokenscript.org/";
const contract = "0x70F6aCb098d57917CD46e8c647fa9c45800D29f2";
const chain = "137";
const outputPath = __dirname + "/output/mumbai/";
const baseImgPath = __dirname + "/base-images/";

function getMetadata(tokenId, attributes){
	return {
		"name": `SmartCatLoot #${tokenId}`,
		"description": "SmartCat Loot",
		"image": `${metaBaseUrl}${tokenId}.png`,
		"attributes": [
			{
				"trait_type": "Collection",
				"value": "SmartCatsLoot"
			},
			{
				"trait_type": "TokenId",
				"value": tokenId
			},
			...attributes
		],
		"animation_url": `${viewerBase}?viewType=opensea&chain=${chain}&contract=${contract}&tokenId=${tokenId}`
	}
}

function calculateVariants(variantInfo, baseName){

	/*
	 	[
	 		[
	 			{
	 				key: "feather",
	 				label: "Feather",
	 				valueKey: "magic",
	 				valueLabel: "Magic"
	 			}
	 			...
	 		]
	 	]
	 */
	const variantDescriptions = [];
	const variantKeys = Object.keys(variantInfo);

	const var1Key = variantKeys[0];
	const var1Label = variantInfo[var1Key].label;
	for (let var1ValueKey in variantInfo[var1Key].values){
		const var1ValueLabel = variantInfo[var1Key].values[var1ValueKey];

		const var2Key = variantKeys[1];
		const var2Label = variantInfo[var2Key].label;
		for (let var2ValueKey in variantInfo[var2Key].values){
			const var2ValueLabel = variantInfo[var2Key].values[var2ValueKey];

			const var3Key = variantKeys[2];
			const var3Label = variantInfo[var3Key].label;
			for (let var3ValueKey in variantInfo[var3Key].values){
				const var3ValueLabel = variantInfo[var3Key].values[var3ValueKey];

				if (variantKeys.length > 3){

					const var4Key = variantKeys[3];
					const var4Label = variantInfo[var4Key].label;
					for (let var4ValueKey in variantInfo[var4Key].values){
						const var4ValueLabel = variantInfo[var4Key].values[var4ValueKey];

						if (variantKeys.length > 4){

							const var5Key = variantKeys[4];
							const var5Label = variantInfo[var5Key].label;
							for (let var5ValueKey in variantInfo[var5Key].values) {
								const var5ValueLabel = variantInfo[var5Key].values[var5ValueKey];


								if (variantKeys.length > 5){

									const var6Key = variantKeys[5];
									const var6Label = variantInfo[var6Key].label;
									for (let var6ValueKey in variantInfo[var6Key].values) {
										const var6ValueLabel = variantInfo[var6Key].values[var6ValueKey];

										variantDescriptions.push([
											{
												key: var1Key,
												label: var1Label,
												valueKey: var1ValueKey,
												valueLabel: var1ValueLabel
											},
											{
												key: var2Key,
												label: var2Label,
												valueKey: var2ValueKey,
												valueLabel: var2ValueLabel
											},
											{
												key: var3Key,
												label: var3Label,
												valueKey: var3ValueKey,
												valueLabel: var3ValueLabel
											},
											{
												key: var4Key,
												label: var4Label,
												valueKey: var4ValueKey,
												valueLabel: var4ValueLabel
											},
											{
												key: var5Key,
												label: var5Label,
												valueKey: var5ValueKey,
												valueLabel: var5ValueLabel
											},
											{
												key: var6Key,
												label: var6Label,
												valueKey: var6ValueKey,
												valueLabel: var6ValueLabel
											}
										]);

									}

								} else {

									variantDescriptions.push([
										{
											key: var1Key,
											label: var1Label,
											valueKey: var1ValueKey,
											valueLabel: var1ValueLabel
										},
										{
											key: var2Key,
											label: var2Label,
											valueKey: var2ValueKey,
											valueLabel: var2ValueLabel
										},
										{
											key: var3Key,
											label: var3Label,
											valueKey: var3ValueKey,
											valueLabel: var3ValueLabel
										},
										{
											key: var4Key,
											label: var4Label,
											valueKey: var4ValueKey,
											valueLabel: var4ValueLabel
										},
										{
											key: var5Key,
											label: var5Label,
											valueKey: var5ValueKey,
											valueLabel: var5ValueLabel
										}
									]);

								}


							}

						} else {

							variantDescriptions.push([
								{
									key: var1Key,
									label: var1Label,
									valueKey: var1ValueKey,
									valueLabel: var1ValueLabel
								},
								{
									key: var2Key,
									label: var2Label,
									valueKey: var2ValueKey,
									valueLabel: var2ValueLabel
								},
								{
									key: var3Key,
									label: var3Label,
									valueKey: var3ValueKey,
									valueLabel: var3ValueLabel
								},
								{
									key: var4Key,
									label: var4Label,
									valueKey: var4ValueKey,
									valueLabel: var4ValueLabel
								}
							]);
						}

					}

				} else {

					variantDescriptions.push([
						{
							key: var1Key,
							label: var1Label,
							valueKey: var1ValueKey,
							valueLabel: var1ValueLabel
						},
						{
							key: var2Key,
							label: var2Label,
							valueKey: var2ValueKey,
							valueLabel: var2ValueLabel
						},
						{
							key: var3Key,
							label: var3Label,
							valueKey: var3ValueKey,
							valueLabel: var3ValueLabel
						}
					]);
				}

			}

		}

	}

	return variantDescriptions;
}

function getRandomBackground(){
	const keys = Object.keys(backgrounds);
	const randomKey = keys[Math.floor(Math.random()*keys.length)];
	return {valueKey: randomKey, valueLabel: backgrounds[randomKey]};
}

async function generateMetadataAndImage(tokenId, baseName, variantDescription, dryRun){

	const canvas = new Canvas.Canvas(2000, 2000, "image");
	const canvas2dContext = canvas.getContext("2d");

	let background;

	// Check if variant has backgrounds defined
	if (variantDescription[0].key === "background"){
		background = variantDescription.shift();
		const bgImage = await loadImage(`${baseImgPath}background-${background.valueKey}.png`);
		if (!dryRun)
			canvas2dContext.drawImage(bgImage, 0, 0, 2000, 2000);
	} else {
		// Otherwise use random
		background = getRandomBackground();
		const bgImage = await loadImage(`${baseImgPath}background-${background.valueKey}.png`);
		if (!dryRun)
			canvas2dContext.drawImage(bgImage, 0, 0, 2000, 2000);
	}

	const metadata = getMetadata(tokenId, [
		{
			"trait_type": "Loot Type",
			"value": baseLabels[baseName]
		},
		{
			"trait_type": "Background",
			"value": background.valueLabel
		},
		...variantDescription.map((attr) => {
			return {
				"trait_type": attr.label,
				"value": attr.valueLabel
			}
		})
	]);

	// Apply base image
	//const image = await loadImage(`${baseImgPath}${baseName}-base.png`);
	//canvas2dContext.drawImage(image, 0, 0, 2397, 2397);

	// Apply rest of the layers
	for (let variantPart of variantDescription){
		const image = await loadImage(`${baseImgPath}${baseName}-${variantPart.key}-${variantPart.valueKey}.png`);
		if (!dryRun)
			canvas2dContext.drawImage(image, 0, 0, 2000, 2000);
	}

	if (dryRun)
		return;

	const buffer = canvas.toBuffer("image/png");
	fs.writeFileSync(outputPath + tokenId + ".png", buffer);
	fs.writeFileSync(outputPath + tokenId + ".json", JSON.stringify(metadata, undefined, 2));
}

function makeRandomRange(x) {

	let range = [];

	for (let i = 0; i < x; i++){
		range.push(i);
	}

	// randomize the array
	range = range.sort(function () {
		return Math.random() - 0.5;
	});

	getRandom = () => {

		if (range.length === 0)
			throw new Error("Random numbers exhausted :-(");

		return range.pop()
	}

	getNumbersLeft = () => {
		return range.length;
	}

	return this;
}

async function run(dryRun){

	// TODO: Randomize Token ID
	let tokenId = 1
	//const randomRange = makeRandomRange(1000);

	if (!fs.existsSync(outputPath))
		fs.mkdirSync(outputPath, { recursive: true });

	for (let baseVariantName in variants){

		const variantInfo = variants[baseVariantName];

		const variantDescriptions = calculateVariants(variantInfo, baseVariantName);

		console.log("Generating (" + variantDescriptions.length + ") " + baseVariantName + " variants...");

		let count = 1;

		for (let variantDescription of variantDescriptions){

			//const tokenId = randomRange.getRandom();
			/*if (fs.existsSync(outputPath + tokenId + ".png")){
				tokenId++;
				count++;
				continue;
			}*/

			console.log("Creating " + count + " of " + variantDescriptions.length);

			await generateMetadataAndImage(tokenId, baseVariantName, variantDescription, dryRun);

			tokenId++;
			count++;
			//break;
		}
	}

	//console.log("Random numbers left: ", randomRange.getNumbersLeft());
	console.log("Total: ", tokenId - 1);
}

run(false);
