(function () {
	"use strict";

	const gestationOptions = [
		"Single",
		"Twins Designated A & B",
		"Twins Not Designated 1 & 2"
	];

	const randomID = function () {
		//generate random number string
		return "ID" + Math.random().toString().replace(/0\./, "");
	};

	const MEMB_INFO = {
		"name": "membrane",
		"image": {
			"title": "Twin Placenta",
			"images": [
				{
					"title": "Diamniotic-monochorionic twin placenta",
					"description": "Two amnion layers in contact and no middle chorion layer"
				}, 
				{
					"title": "Diamniotic-dichorionic twin placenta",
					"description": "Two amnion layers separated by a chorion layer"
				}
			]
		}
	};

	const MEC_INFO = {
		"name": "meconium",
		"image": {
			"title": "Meconium Staining",
			"images": [
				{
					"title": "Amniocyte necrosis",
					"description": "Demonstrated by black arrow."
				},
				{
					"title": "Meconium laden macrophage",
					"description": "Demonstrated by black arrow."
				}
			]
		}
	};

	const $INFOSTR = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>';

	const buildRadio = function (label, name, options, unchecked, imageinfo) {
		let $holder = $('<div>', {
			class: "btn-group mb-3",
			role: "group"
		});

		let gid = randomID();

		// let $ret = $('<div>', {class: "input-group mb-3 row"});

		// add label
		let $label = $('<label>', {
			class: "h3 col-3 col-form-label",
			text: label
		});

		if (imageinfo) {
			createInfo(imageinfo).appendTo($label);
		}

		$label.appendTo($holder);

		options.forEach(function (opt, i) {
			let valOpts = {
				class: "btn-check",
				value: opt,
				type: "radio",
				name: name,
				autocomplete: "off",
				id: gid + i
			};

			let labelOpts = {
				class: "btn btn-outline-primary",
				text: opt,
				for: gid + i
			};

			if (i === 0) {
				labelOpts.style = "border-top-left-radius: .25rem;border-bottom-left-radius: .25rem;";
				if (!unchecked) {
					valOpts.checked = "checked";
				}
			}

			let $val =
				$holder.append(
					$('<input>', valOpts)
				).append(
					$('<label>', labelOpts)
				);
		});
		return $holder;
	};

	const addTwinGestationOptions = function ($form) {
		let $holder = $('<div>', {
			class: "row"
		});

		// $('<h3>', {text: "Membrane Type"}).appendTo($form);
		$holder.appendTo($form);

		buildRadio("Membrane Type", "membrane", ["Monochorionic Monoamniotic", "Monochorionic Diamniotic", "Dichorionic Diamniotic"], true, MEMB_INFO).appendTo($holder);
		// $('<h4>', {text: "Amniosity"}).appendTo($form);
	};

	const getTrimester = function (age) {
		let trimester = "THIRD";
		if (age < 14) {
			trimester = "FIRST";
		} else if (age < 27) {
			trimester = "SECOND";
		}
		return trimester;
	}

	const addEnding = function (num) {
		let str = num.toString();
		switch (str[str.length -1]) {
			case "1":
				str += "ST";
				break;
			case "2":
				str += "ND";
				break;
			case "3":
				str += "RD";
				break;
			default:
				str += "TH";
				break;
		}
		return str;
	};

	const getPercentile = function (data, weight, age, twin) {
		weight = weight || 0;
		age = age || 0;
		let percentileStr = "";
		let cmdArr = [];
		let lessThan = false;
		let greaterThan = false;
		let objSearch = data.weight.singleton;

		if (twin) {
			objSearch = data.weight.twin;
		}
		
		if (weight > 0 && age > 9) {
			let match = objSearch.find(function (obj) {
				return obj.weeks === age;
			});
			if (match) {
				let group = -2;
				match.percentiles.forEach(function (obj, ind) {
					if (group < -1 && weight < obj.weight) {
						group = ind - 1;
					}
				});

				// adjust group number 
				if (group === -2) { // adjust for > last percentile
					group = match.percentiles.length - 1;
					if (weight > match.percentiles[group].weight) {
						greaterThan = true; // false if "==" for less than 21 weeks
					}
				}
				if (group === -1) { // adjust for < first percentile
					group = 0;
					lessThan = true;
				}

				// get percentile
				let percentile = match.percentiles[group].percentile;

				// generate text
				if (age > 20 || twin) { // For > 20 weeks for singletons
					// add greater than/less than 
					if (greaterThan || group === match.percentiles.length - 1) {
						greaterThan = true; // updated here
						percentileStr += "GREATER THAN ";
					} else if (lessThan) {
						percentileStr += "LESS THAN ";
					}
					
					// add percentile to string
					percentileStr += addEnding(percentile);

					if (!lessThan && !greaterThan) {
						percentileStr += "-" + addEnding(match.percentiles[group + 1].percentile);
					}

					percentileStr += " PERCENTILE";

					// add LFGA/SFGA
					if (percentile < 10 || (percentile === 10 && lessThan)) {
						cmdArr.push({type: 'text', value: "SMALL FOR GESTATIONAL AGE"});
					} else if (percentile > 90 || (percentile === 90 && greaterThan)) {
						cmdArr.push({type: 'text', value: "LARGE FOR GESTATIONAL AGE"});
					}
				} else { // for <= 20 weeks for singleton

					//Less complicated analysis, just is it within the 95% confidence interval
					if (percentile < 5 || (percentile === 5 && lessThan)) {
						cmdArr.push({type: 'text', value: "SMALL FOR GESTATIONAL AGE"});
						percentileStr += "BELOW 95 PERCENT CONFIDENCE INTERVAL";
					} else if (percentile > 95 || (percentile === 95 && greaterThan)) {
						cmdArr.push({type: 'text', value: "LARGE FOR GESTATIONAL AGE"});
						percentileStr += "ABOVE 95 PERCENT CONFIDENCE INTERVAL";
					} else  {
						percentileStr += "WITHIN 95 PERCENT CONFIDENCE INTERVAL";
					}
				}
				
				// add replace to the string
				cmdArr.push({
					type: "replace",
					value: {
						replace: "[#PER#] PERCENTILE",
						replaceStr: percentileStr
					}
				});
			}
		}
		return cmdArr;
	}

	const line1build = function (formData, data) {
		let cmdArr = [];

		console.log(formData);

		cmdArr.push({
			type: "text",
			value: "[#MS#] [#WEIGHT#] GRAMS ([#PER#] PERCENTILE FOR GESTATIONAL AGE)"
		});

		// twin gestation
		if (formData.tgestation) {
			cmdArr.push({
				type: "replace",
				value: {
					replace: "[#MS#]",
					replaceStr: "[#MS#] [#MONOCHORIONIC/DICHORIONIC#], [#MONOAMNIONIC/DIAMNIONIC#] TWIN PLACENTA,"
				}
			});
			if (formData.membrane) {
				cmdArr.push({
					type: "replace",
					value: {
						replace: "[#MONOCHORIONIC/DICHORIONIC#], [#MONOAMNIONIC/DIAMNIONIC#]",
						replaceStr: formData.membrane.toUpperCase()
					}
				});
			}
		}

		// meconium staining
		if (formData.meconium) {
			cmdArr.push({
				type: "replace",
				value: {
					replace: "[#MS#]",
					replaceStr: "MECONIUM-STAINED"
				}
			});
		} else {
			cmdArr.push({
				type: "replace",
				value: {
					replace: "[#MS#] ",
					replaceStr: ""
				}
			});
		}

		// weight
		if (formData.weight) {
			cmdArr.push({
				type: "replace",
				value: {
					replace: "[#WEIGHT#]",
					replaceStr: formData.weight
				}
			});
		}

		//percentile
		if (formData.weight && formData.age) {
			cmdArr = cmdArr.concat(getPercentile(data, formData.weight, formData.age, formData.tgestation));
		}

		return cmdArr;
	};

	const buildHeader = function (age, days, type) {
		let cmdArr = [];

		cmdArr.push({
			type: "header",
			value: "DIAGNOSIS:"
		})
		cmdArr.push({
			type: "header",
			value: "PLACENTA, [#TRIMESTER#] TRIMESTER, [#WEEKS#] WEEKS, [#DAYS#] DAYS, [#DELIVERY#]"
		});

		if (age) {
			cmdArr.push({
				type: "replace",
				value: {
					replace: "[#WEEKS#]",
					replaceStr: age
				}
			});
			cmdArr.push({
				type: "replace",
				value: {
					replace: "[#TRIMESTER#]",
					replaceStr: getTrimester(age)
				}
			});
		}

		if (days) {
			cmdArr.push({
				type: "replace",
				value: {
					replace: "[#DAYS#]",
					replaceStr: days
				}
			});
		} else { // remove days component if no days entered
			cmdArr.push({
				type: "replace",
				value: {
					replace: "[#DAYS#] DAYS, ",
					replaceStr: days
				}
			});
		}

		if (type) {
			cmdArr.push({
				type: "replace",
				value: {
					replace: "[#DELIVERY#]",
					replaceStr: type.toUpperCase()
				}
			});
		}


		return cmdArr;
	};

	const buildInputText = function (label, list) {
		let id = randomID();

		let $ret = $('<div>', {
			class: "input-group mb-3"
		});

		// add label
		$('<label>', {
			class: "h3 col-3 col-form-label",
			text: label
		}).appendTo($ret);
		// let $inpHold = $('<div>', {id: id, class: "input-group mb-3"}).appendTo($ret);

		list.forEach(function (input, i) {
			let inputOpts = {
				id: id + i,
				name: input.name,
				type: "text",
				class: "form-control",
				placeholder: input.display
			};

			if (i === 0) {
				inputOpts.style = "border-top-left-radius: .25rem;border-bottom-left-radius: .25rem;";
			}

			let $inp = $('<input>', inputOpts);


			if (input.validation) {
				// let $holder = $('<span>').appendTo($ret);
				$inp.appendTo($ret);
				let $invalid = $('<div>', {
					class: "invalid-feedback",
					text: input.validation.text
				}).appendTo($ret);
				$inp.keyup(function (evt) {
					if (!input.validation.func(evt.target.value)) {
						let $element = $(evt.target);
						let parentPos = $element.position();

						//calculate offset
						let offset = parentPos.left - (
							$element.css("padding-left").replace("px", "") * 1
							// $element.css("margin-left").replace("px", "") * 1 + 
							// $element.css("border-left-width").replace("px", "") * 1
						);

						// $invalid.position({
						// 	top: parentPos.top + $element.height(),
						// 	left: parentPos.left
						// });
						console.log('position', $element, parentPos, offset);
						// $invalid.position({left: parentPos.left});
						$invalid.css("margin-left", offset + "px");

						$inp.addClass('is-invalid');
					} else {
						$inp.removeClass('is-invalid');
					}
				});
			} else {
				$inp.appendTo($ret);
			}
		});
		return $ret;
	};

	const objCmp = function (obj1, obj2) {
		let keys1 = Object.keys(obj1).sort();
		let keys2 = Object.keys(obj2).sort();
		let aws = true;
		if (keys1.length === keys2.length) {
			keys1.forEach(function (key1, i) {
				if (key1 === keys2[i]) {
					if (obj1[keys1[i]] !== obj2[keys2[i]]) {
						aws = false;
					}
				} else {
					aws = false;
				}
			});
		} else {
			aws = false;
		}
		return aws;
	};

	const check = function (arr1, arr2) {
		let aws = true;
		if (arr1.length === arr2.length) {
			arr1.forEach(function (obj1, i) {
				if (!objCmp(obj1, arr2[i])) {
					aws = false;
				}
			})
		} else {
			aws = false;
		}
		return aws;
	};

	const getValue = function (arr, name) {
		//get the value in an array of form objects {name: "" ,value: ""}
		let ret = undefined;

		let found = arr.find(function (obj) {
			return obj.name === name;
		});

		if (found && found.hasOwnProperty("value")) {
			ret = found.value;
		}

		// did not find
		return ret;
	};

	const setGestationalParams = function ($form) {
		buildInputText("Gestation", [{
			name: "weeks",
			display: "Weeks"
		}, {
			name: "days",
			display: "Days",
			validation: {
				text: "Days must be between 0 and 6.",
				func: function (val) {
					return val < 7;
				}
			}
		}]).appendTo($form);
		buildInputText("Weight", [{
			name: "weight",
			display: "Weight (grams)"
		}]).appendTo($form);
	};

	const copyFunction = function ($textArea) {
		return function (evt) {

			navigator.clipboard.write([
				new ClipboardItem({
					"text/plain": $textArea.text(),
					"text/html": $textArea.html()
				}),
			]);

			// const copyText = $textArea.text();
			// const textArea = document.createElement('textarea');
			// textArea.textContent = copyText;
			// textArea.style = "position: absolute;left: -100%;font-weight: bold;";
			// document.body.append(textArea);
			// textArea.select();
			// document.execCommand("copy");

		};
	};

	const filterUUIDNames = function (obj) {
		//for filtering out names
		return obj.name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
	};

	let serializeData = function (data) {
		// copy it
		let returnArr = JSON.parse(JSON.stringify(data.options));
		let movementArr = JSON.parse(JSON.stringify(data.options));

		// define recursive function
		const returnOptions = function (arr) {
			let miniRet = arr;
			arr.forEach(function (obj) {
				if (obj.hasOwnProperty("options") && obj.options.length > 0) {
					miniRet = miniRet.concat(returnOptions(obj.options));
				}
			});
			// console.log(miniRet, arr);
			return miniRet;
		};

		//start recurive loop
		returnArr = returnArr.concat(returnOptions(movementArr));

		//done once redefine this function
		serializeData = function () {
			return returnArr;
		}

		//return the arr for the first time
		return returnArr;
	};

	const findObj = function (id) {
		return function (elem) {
			return elem.name === id;
		};
	};

	const getCommands = function (data, id) {

		// find that id
		let obj = data.find(findObj(id));
		let cmdArr = [];

		// get the commands
		if (obj.hasOwnProperty("report") && obj.report.length > 0) {
			cmdArr = obj.report.map(function (cmd, i) {
				let retVal = cmd;
				// cmd.from = id + "--" + i;
				if (cmd.type === "build") {
					retVal = {
						// from: id,
						type: "build",
						value: cmd.value,
						cmds: getCommands(data, cmd.value)
					}
				}
				return retVal;
			});
		}

		return cmdArr;
	};

	const orderCMDs = function (commands) {
		return commands.map(function (cmds) {
			let end = [];
			let out = [];
			cmds.forEach(function (cmd, i) {
				if (cmd.hasOwnProperty("order") && cmd.order === "last") {
					end.push(cmd);
				} else {
					out.push(cmd)
				}
			});
			return out.concat(end);
		});
	};

	const linearize = function (arr) {
		let out = [];
		arr.forEach(function (item) {
			if (Array.isArray(item)) {
				out = out.concat(linearize(item));
			} else {
				out.push(item);
			}
		});
		return out;
	};

	const executeCommands = function (arr, currentIndent) {
		currentIndent = currentIndent || 1;

		let $ret = $("<div>");
		let strBreak = randomID();
		let str = "";
		let comment = "";
		let tabChar = "&#9;"
		let $tabChar = '<span class="mswordtab">' + tabChar + "</span>";
		let findTabChar = new RegExp(tabChar, "g");
		let styleString = [];


		arr.forEach(function (cmd) {
			switch (cmd.type) {
			case "header":
				styleString.push("margin-left:" + ((currentIndent - 1) * 0.5) + "in;");
				str += cmd.value + strBreak;
				break;
			case "text":
				styleString.push("text-indent:-.5in;margin-left:" + (1 + (currentIndent - 1) * 0.5) + "in;");
				str += "--" + tabChar + cmd.value + strBreak;
				break;
			case "format":
				switch (cmd.value) {
				case "indent":
					currentIndent += 1;
					break;
				case "outdent":
					currentIndent -= 1;
					break;
				}
				break;
			case "replace":
				let regex = new RegExp(cmd.value.replace.replace(/([^\w\s])/ig, "\\$1"));
				str = str.replace(regex, cmd.value.replaceStr);
				break;
			case "comment":
				comment += cmd.value + "\n\n";
				break;
			}
		});

		str.split(strBreak).forEach(function (line, ind) {
			let lineOpts = {
				class: "MsoNormal",
				style: "text-transform:uppercase;font-weight:bold;" + styleString[ind],
				html: line.replace(findTabChar, $tabChar)
			};
			$("<p>", lineOpts).appendTo($ret);
		});

		// deal with comment
		if (comment.length) {
			let $com = $('#commentStringHolder');
			if ($com.text() === "[#]") {
				$com.empty();
			} else {
				$com.append('</br></br>');
			}
			$com.append(comment);
		}

		return $ret;
	};

	const flattenOne = function (arr) {
		let retArr = [];
		arr.forEach(function (row) {
			if (Array.isArray(row)) {
				retArr = retArr.concat(row);
			} else {
				retArr.push(row);
			}
		});
		return retArr;
	};

	const cmdRecurse = function (list, builds, key) {
		//traverse list for builds
		builds = builds || {
			'start': []
		};
		key = key || 'start';

		list.forEach(function (item) {
			if (item.type === "build") {
				//propogate builds if it does not already exist
				if (!builds.hasOwnProperty(item.value)) {
					builds[key].push(item);
					builds[item.value] = [];
					cmdRecurse(item.cmds, builds, item.value);
				}

				//add remaining builds in the correct list
				key = item.value;
			} else {
				builds[key].push(item);
			}
		});

		return builds;
	};

	const clearDups = function (id, arr) {
		let out = [];
		arr.forEach(function (row) {
			if (!row.hasOwnProperty('spec') && row.spec !== id) {
				out.push(row);
			}
		});
		return out;
	};

	const getUmbilicalCmds = function (resp) {
		let cmdArr = [];
		let ulength = getValue(resp, "ulen");
		let ucoils = getValue(resp, "ucoils");
		let uvessels = getValue(resp, "uvess");

		let umbFinds = getValue(resp, "8d1bbb1d-435c-4612-9777-391758591e11") ||
			getValue(resp, "5a89b6e1-6317-4b27-a93b-93b8728c6039") ||
			getValue(resp, "acd227c3-a0b9-4554-b733-421389103b74") ||
			"none";

		let starter = "";

		console.log("length, coils", ulength, ucoils);

		if ((ulength || ucoils === 0) && (ucoils || ucoils === 0)) {
			let ratio = ucoils / ulength;
			if (ratio < 0.1) {
				starter += "HYPOCOILED ";
			} else if (ratio > 0.3) {
				starter += "HYPERCOILED ";
			}
		}

		console.log(uvessels);

		switch (uvessels) {
		case "1":
			starter += "ONE";
			break;
		case "2":
			starter += "TWO";
			break;
		case "3":
			starter += "THREE";
			break;
		}

		cmdArr.push({
			type: "replace",
			value: {
				replace: "[#N#]",
				replaceStr: starter
			}
		});

		if (umbFinds === "none") {
			cmdArr.push({
				type: "replace",
				value: {
					replace: "[### NO ABNORMALITIES ###]",
					replaceStr: "NO SIGNIFICANT HISTOLOGIC ABNORMALITY"
				}
			});
		} else {
			cmdArr.push({
				type: "replace",
				value: {
					replace: "[### NO ABNORMALITIES ###]",
					replaceStr: "INFLAMMATION AS DESCRIBED ABOVE"
				}
			});
		}
		return cmdArr;
	};

	const collapseCommands = function (commands) {
		// let builds = {};
		// let buildOrder = [];

		// console.log(cmdRecurse(commands.map(function (cmd) {
		// 	return {type: "build", name: "0", cmds: cmd};
		// })));

		console.log("start collapse", commands);

		//let builds = cmdRecurse(flattenOne(commands));
		let builds = {
			'start': []
		};

		commands.forEach(function (list) {
			cmdRecurse(list, builds);
		});

		//move builds down as needed
		Object.keys(builds).forEach(function (key) {
			let end = [];
			for (let i = 0; i < builds[key].length; i += 1) {
				if (builds[key][i].hasOwnProperty('order') && builds[key][i].order === "last") {
					end = end.concat(builds[key].splice(i, 1));
					i -= 1;
				}
			}
			builds[key] = builds[key].concat(end);
		});

		console.log("builds resolved", JSON.parse(JSON.stringify(builds)));

		//resolve complete builds object
		let outarr = builds.start;
		for (let i = 0; i < outarr.length; i += 1) {
			let cmd = outarr[i];
			if (cmd.type === "build") {
				let args = [i, 1].concat(builds[cmd.value]);
				Array.prototype.splice.apply(outarr, args);
				i -= 1;
			}
		}

		// // move through to move down 'last commands'
		// let moveDown = [];
		// for (let i = 0; i < outcommands.length; i += 1) {
		// 	if (outcommands[i].hasOwnProperty('order') && outcommands[i].order === "last") {
		// 		moveDown = moveDown.concat(outcommands.splice(i, 1));
		// 		i -= 1;
		// 	} else if (outcommands[i].hasOwnProperty('spec') && outcommands[i].spec === "end") {
		// 		let cmdArr = [i, 1].concat(moveDown);
		// 		Array.prototype.splice.apply(outcommands, cmdArr);
		// 		i += moveDown.length - 1;
		// 		moveDown = [];
		// 	}
		// }

		console.log("final command array", outarr);

		return outarr;
	};

	const buildSpecFindings = function (data, formObj) {
		let findData = serializeData(data);
		let commands = [];

		console.log(findData, formObj);

		//get command list
		formObj.forEach(function (idobj) {
			commands.push(getCommands(findData, idobj.name));
		});

		// console.log(commands);

		// flatten command list
		let commandsCollapsed = collapseCommands(commands); // recurrsive
		// return;
		// console.log(commandsCollapsed, commands, "collapsed");
		// commandsCollapsed = orderCMDs(commandsCollapsed);
		// console.log(commandsCollapsed, "ordered");
		// commandsCollapsed = linearize(commandsCollapsed);
		// console.log(commandsCollapsed, "linerized");

		// return the commands
		return commandsCollapsed;
	};

	const respondToChanges = function (data, $form, $addOpts, $response, $headerOpts) {
		let last = [];
		let $gestOpts = [$addOpts];
		let gest = [""];
		let $membraneOption = $('<form>');
		addTwinGestationOptions($membraneOption); // add to $membraneOption

		const getResp = function (which) {
			let ret;

			// header options
			let headResp = $headerOpts.serializeArray();

			// each gestation option
			let addOpts = $gestOpts.map(function ($formelem) {
				return $formelem.serializeArray();
			});

			//membrane option, just add to header options
			headResp = headResp.concat($membraneOption.serializeArray());

			if (which === 0 || which === 1) {
				ret = addOpts[which];
			} else {
				ret = Array.prototype.concat.apply(headResp, addOpts);
			}

			return ret;
		};

		const buildGestationOptions = function (gests) {
			if (gests === gestationOptions[0]) {
				// set up other options
				gest = [""];
				addOtherOptions(data, $addOpts);
				$gestOpts = [$addOpts];

			} else {
				if (gests === gestationOptions[1]) {
					gest = ["Twin A placenta", "Twin B placenta"];
				} else {
					gest = ["Twin 1 placenta", "Twin 2 placenta"];
				}
				// add twin options
				$membraneOption.appendTo($addOpts)

				// set up other options
				let $ta = $('<form>').appendTo($addOpts);
				$("<h4>", {
					text: gest[0]
				}).appendTo($ta);
				addOtherOptions(data, $ta);

				let $tb = $('<form>').appendTo($addOpts);
				$("<h4>", {
					text: gest[1]
				}).appendTo($tb);
				addOtherOptions(data, $tb);

				$gestOpts = [$ta, $tb];
			}
		};

		let change = function () {
			// get all form data
			let resp = getResp();

			//check if there are any changes at all
			if (!check(last, resp)) {
				//check if twin status changed
				let gests = getValue(resp, "gestations");
				if (gests && gests !== getValue(last, "gestations")) {

					// clear old additional options
					$addOpts.empty();

					// build gestational options interface
					buildGestationOptions(gests)

					// re assign the resp so that it doesn't keep the gestation and other options
					let resp = getResp();
				}

				// set up area
				$response.empty();
				$('#commentStringHolder').text("[#]");

				//update 'last'
				last = JSON.parse(JSON.stringify(resp));

				// build header
				let headerCmdArr = buildHeader(
					getValue(resp, "weeks") * 1,
					getValue(resp, "days") * 1,
					getValue(resp, "surgery")
				);

				// build line 1
				headerCmdArr = headerCmdArr.concat(line1build({
					weight: getValue(resp, "weight") * 1,
					age: getValue(resp, "weeks") * 1,
					membrane: getValue(resp, "membrane"),
					tgestation: gests !== gestationOptions[0],
					meconium: getValue(resp, "mstaining") === "Present"
				}, data));

				let cmdResponses = [
					executeCommands(headerCmdArr)
				];


				gest.forEach(function (label, ind) {
					let cmdArr = [];
					let finalResp = getResp();
					if (gest.length > 1) {
						finalResp = getResp(ind);
						cmdArr.push({
							type: "format",
							value: "indent"
						});
						cmdArr.push({
							type: "header",
							value: label.toUpperCase()
						});
						cmdArr = cmdArr.concat(buildSpecFindings(data, finalResp.filter(filterUUIDNames)));
					} else {
						cmdArr = buildSpecFindings(data, finalResp.filter(filterUUIDNames));
					}

					cmdArr.push({
						type: "text",
						value: "AMNIOTIC MEMBRANES WITH [###]"
					});
					cmdArr.push({
						type: "text",
						value: "TERMINAL VILLI [### APPROPRIATE FOR GESTATIONAL AGE ###]"
					});
					cmdArr.push({
						type: "text",
						value: "[#N#]-VESSEL UMBILICAL CORD WITH [### NO ABNORMALITIES ###]"
					});

					cmdArr = cmdArr.concat(getUmbilicalCmds(finalResp));

					cmdResponses.push(executeCommands(cmdArr));
				});


				// add elements to response
				$response.append(cmdResponses);
			}
		};
		return change;
	};

	const buildCollapse = function (tid, label) {
		// $optRow.addClass("row")
		// let id = randomID();
		return $('<button>', {
			class: "btn btn-outline-primary",
			type: "button",
			"data-bs-toggle": "collapse",
			"data-bs-target": "#" + tid,
			"aria-expanded": "false",
			"aria-controls": tid,
			html: label
		});

		//.appendTo($optRow);

		return $('<div>', {
			id: id,
			class: "collapse"
		}).appendTo($optRow);
	};

	const radioChange = function (evt) {
		evt.preventDefault();
		// set up holder information
		let that = $(this);

		// set up radio information
		let target = $(evt.target);
		let tclass = target.attr("class").split(/\s/)[1];

		// if Label is none or parent label is none
		if (target.attr("label") === "None") {
			that.parent().find('input[type="radio"]').prop('checked', false);
		} else {
			that.parent().parent().parent().find("[label='None']").prop('checked', false);
		}

		//turn sister elements off
		that.parent().children('.form-check').find('input').prop('checked', false);

		//turn target element on
		target.prop('checked', true);
	};

	const buildSwitch = function (item, depth) {
		let $switch = $('<div>', {
			class: "form-check form-switch opt" + depth
		});
		let tid = randomID();
		$('<input>', {
			class: "form-check-input",
			type: "checkbox",
			label: item.label,
			name: item.name,
			id: tid
		}).appendTo($switch);

		let $label = $("<label>", {
			class: "form-check-label",
			for: tid,
			html: item.label
		});
		if (item.image) {
			let $info = createInfo(item);
			$label.append($info);
		}
		$label.appendTo($switch);

		return $switch;
	};

	const basicLabel = function (item, depth) {
		return $('<div>', {
			class: "opt" + depth,
			html: item.label
		});
	};

	const addLink = function (nameIn) {
		return function (linkObj) {
			let id = linkObj.value;
			let type = linkObj.type;
			let ret = function () {};

			// console.log('adding link?', linkObj, id, type);

			//types -> equal, on
			if (type === "equal") {
				ret = function (evt) {
					console.log('event for link!', evt.target.name, event.target.checked, id, $('body').find('[name="' + id + '"]'));
					if (event.target.name === nameIn) {
						$('body').find('[name="' + id + '"]').prop("checked", event.target.checked);
					}
				}
			} else if (type === "on") {
				ret = function (evt) {
					if (event.target.name === nameIn && event.target.checked) {
						$('body').find('[name="' + id + '"]').click();
					}
				}
			} else if (type === "off") {
				ret = function (evt) {
					if (event.target.name === nameIn && event.target.checked) {
						$('body').find('[name="' + id + '"]:checked').prop("checked", false);
					}
				}
			}
			return ret;
		}
	}

	const createInfo = function (item) {
		let $info = $("<a>", {html: $INFOSTR, style: "margin-left: 5px;", tabindex: "0", "title": item.image.title});
		let content = item.image.images.map(function (img, ind) {
			let $body = $("<div>");
			$("<div>", {class: "h6", html: img.title}).appendTo($body);
			$("<p>", {html: img.description}).appendTo($body);
			$("<img>", {class: "img-pop", src: "./img/" + item.name + "/" + ind + ".png", width: "90%"}).appendTo($body);
			return $body.html();
		}).join("");

		let placement = "bottom";

		if ($(window).width() > 900) {
			placement = "right";
		}

		$info.popover({
			placement: placement,
			trigger: 'focus',
			content: content,
			html: true,
			template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body">body text</div></div>'
		});
		// let $info = $("<span>",{href: "", html: $INFOSTR, style: "margin-left: 5px;"});
		$info.click(function (evt) {
			evt.preventDefault();
			// <a tabindex="0" class="btn btn-lg btn-danger" role="button" data-toggle="popover" data-trigger="focus" title="Dismissible popover" data-content="And here's some amazing content. It's very engaging. Right?">Dismissible popover</a>
			console.log(JSON.stringify(item.image));
		});
		return $info;
	};

	const buildOptions = function (options, depth) {
		let $ret = $('<div>');

		options.forEach(function (item) {
			let optRowSettings = {
				class: "depth-" + depth,
				style: ""
			};
			let optRowType = "<div>";
			let optRowAppends = [];
			let optRowFuncs = [];
			let tid = randomID();
			let input = item.input;

			//create collapse
			if (item.collapsed) {
				$ret.append(buildCollapse(tid, item.label));
				$ret.addClass('row');
				optRowSettings.class += " collapse";
				optRowSettings.id = tid;
			};

			//set up switches
			if (input === "switch") {
				optRowSettings.class += " form-check";
				optRowAppends.push(buildSwitch(item, depth));
				item.select = false;
			}

			//add linked
			if (item.hasOwnProperty('link') && item.link.length > 0) {
				optRowFuncs = optRowFuncs.concat(item.link.map(addLink(item.name)));
			}

			//set up rest
			if (input && !item.collapsed && input !== "switch") {
				if (!item.select) {
					optRowSettings.class += " form-check";
					optRowAppends.push(basicLabel(item, depth));
				} else { // checkboxes, radios
					if (input === "radio") {
						optRowFuncs.push(radioChange);
					}
					optRowSettings.class += " form-check";
					optRowAppends.push($('<input>', {
						class: "form-check-input",
						type: input,
						label: item.label,
						name: item.name,
						id: tid
					}));
					let $label = $("<label>", {
						class: "form-check-label",
						for: tid,
						html: item.label
					});
					if (item.image) {
						let $info = createInfo(item)
						$label.append($info);
					}
					optRowAppends.push($label);
				}
			} else if (!item.collapsed && input !== "switch") { // basic label
				let $label = basicLabel(item, depth);
				if (item.image) {
					let $info = createInfo(item);
					$label.append($info);
				}
				optRowAppends.push($label);
			}

			// add description
			if (item.description && item.description.length) {
				optRowAppends.push($('<p>', {
					html: item.description
				}));
			}

			// go deeper as needed
			if (item.options && item.options.length) {
				optRowAppends.push(buildOptions(item.options, depth + 1));
			}

			//hide as needed
			if (item.hasOwnProperty("hidden") && item.hidden) {
				optRowSettings.style += "display:none; "
			}

			//build html item and append to starter row
			let $optRow = $(optRowType, optRowSettings);
			optRowFuncs.forEach(function (func) {
				$optRow.change(func);
			});
			optRowAppends.forEach(function ($elem) {
				$optRow.append($elem);
			});
			$optRow.appendTo($ret);

			return;
		});
		return $ret;
	};

	const addOtherOptions = function (data, $form) {
		buildInputText("Umbilical Cord", [{
			name: "ulen",
			display: "Length (cm)"
		}, {
			name: "ucoils",
			display: "Number of Coils"
		}]).appendTo($form);

		buildRadio("Umbilical Vessels", "uvess", [3, 2, 1]).appendTo(
			$('<div>', {
				class: "row"
			}).appendTo($form)
		);

		//Break remaining page into header column and content column
		let $specFinds = $('<div>', {
			class: "col-sm-9 col-xs-12"
		});
		$('<div>', {
			class: "row"
		}).append(
			$('<label>', {
				class: "h3 col-sm-3 col-xs-12 col-form-label",
				text: "Special Findings"
			})
		).append(
			$specFinds
		).appendTo($form);

		//Start building options
		buildOptions(data.options, 0).appendTo($('<div>', {
			class: "container",
			style: "padding-left:6px;padding-right:6px;"
		}).appendTo($specFinds));
	};

	const buildPage = function (data) {
		let $main = $('main');
		let $form = $('<form>').appendTo($main);
		let $headOpts = $('<form>').appendTo($form);
		let $emptyLine = '<p class="MsoNormal">&nbsp;</p>';

		console.log(data);

		// Twin gestation options
		buildRadio("Gestational Number", "gestations", gestationOptions).appendTo(
			$("<div>", {
				class: "row"
			}).appendTo($headOpts)
		);

		// set up basic options
		setGestationalParams($("<div>", {
			style: "margin-bottom:10px"
		}).appendTo($headOpts));

		// set up type
		buildRadio("Delivery Type", "surgery", ["Vaginal Delivery", "Cesarean Section"]).appendTo(
			$("<div>", {
				class: "row"
			}).appendTo($headOpts)
		);

		// set up staining
		buildRadio("Meconium Staining", "mstaining", ["None", "Present"], false, MEC_INFO).appendTo(
			$("<div>", {
				class: "row"
			}).appendTo($headOpts)
		);

		// add in other options area
		let $otherOpts = $("<form>", {
			id: "addOpts:-)"
		}).appendTo($form);

		//build response area
		$('<hr>', {
			class: "col-sm-12"
		}).appendTo($main);
		let $response = $('<div>', {
			class: "msword",
			id: "responseText"
		});

		// copy button
		// $("<button>", {class: "btn btn-success", text: "Copy Diagnosis"}).click(copyFunction($response)).appendTo(
		// 	$('<div>').appendTo($main)
		// );
		// $('<hr>', {class: "col-sm-12"}).appendTo($main);

		//add in response area
		$response.appendTo($main);
		let $responseText = $('<div>').appendTo($response);

		//Add in some empty lines
		$response.append($emptyLine);
		$response.append($emptyLine);

		//Add in vertical line
		$response.append('<div style="mso-element:para-border-div; border-top:solid windowtext 2.25pt;"><p class="p">&nbsp;</p></div>');

		//Add in comment line
		$response.append(
			'<p class="MsoNormal">' +
			'<b>COMMENT:</b> ' +
			'<span id="commentStringHolder">[#]</span>' +
			"</p>"
		);

		// set up response to changes
		let respFunc = respondToChanges(data, $form, $otherOpts, $responseText, $headOpts);
		$form.change(respFunc);
		$form.keyup(respFunc);
		respFunc();
	};

	fetch("./page.json")
		.then(a => a.json())
		.then(buildPage);
}())