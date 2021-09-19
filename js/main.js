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

	const buildRadio = function (label, name, options, unchecked) {
		let $holder = $('<div>', {class: "btn-group mb-3", role: "group"});

		let gid = randomID();

		// let $ret = $('<div>', {class: "input-group mb-3 row"});

		// add label
		$('<label>', {class: "h3 col-3 col-form-label", text: label}).appendTo($holder);

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
		let $holder = $('<div>', {class: "row"});
		
		// $('<h3>', {text: "Membrane Type"}).appendTo($form);
		$holder.appendTo($form);

		buildRadio("Membrane Type", "membrane", ["Monochorionic Monoamniotic", "Monochorionic Diamniotic", "Dichorionic Diamniotic"], true).appendTo($holder);
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

	const line1build = function (formData, data) {
		let retStr = "&#9;--&#9;";
		let weight = formData.weight || 0;
		let age = formData.age || 0;

		console.log("line1", formData);

		if (formData.hasOwnProperty('meconium') && formData.meconium) {
			retStr += "MECONIUM-STAINED ";
		}

		if (formData.hasOwnProperty("membrane")) {
			if (formData.membrane) {
				retStr += formData.membrane.toUpperCase();
			} else {
				retStr += "[### MONOCHORIONIC/DICHORIONIC ###], [### MONOAMNIONIC/DIAMNIONIC ###]";
			}
			retStr += " ";
		}

		if (weight > 0 && age > 0) {
			let match = data.weight.singleton.find(function (obj) {
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
				}
				
				// set percentile sentence
				let percentileStr = "";
				if (group === -1) {
					group = 0;
					percentileStr += "(LESS THAN " + match.percentiles[group].percentile;
					if (match.percentiles[group] === 3) {
						percentileStr += "RD";
					} else {
						percentileStr += "TH";
					}
					percentileStr += " PERCENTILE FOR GESTATIONAL AGE)";
				} else if (group === match.percentiles.length - 1) {
					percentileStr += "(";
					if (match.percentiles[group].weight < weight) {
						percentileStr += "GREATER THAN ";
					}
					percentileStr += match.percentiles[group].percentile + "TH PERCENTILE FOR GESTATIONAL AGE)";
				} else {
					percentileStr += "(" + match.percentiles[group].percentile;
					if (match.percentiles[group] === 3) {
						percentileStr += "RD";
					} else {
						percentileStr += "TH";
					}
					percentileStr += " PERCENTILE FOR GESTATIONAL AGE)";
				}

				// set trimester sentence
				let trimester = getTrimester(age);
				retStr += trimester + " TRIMESTER PLACENTA, " + weight + " GRAMS " + percentileStr;
			} else {
				retStr += getTrimester(age) + " TRIMESTER PLACENTA, " + weight + " GRAMS"
			}
		} else {
			let trimesterStr = "[#]";
			let weightStr = "[#]";
			if (age > 0) {
				trimesterStr = getTrimester(age);
			}
			if (weight > 0) {
				weightStr = weight;
			}
			retStr += trimesterStr + " TRIMESTER PLACENTA, " + weightStr + " GRAMS " + "([#] PERCENTILE FOR GESTATIONAL AGE)";
		}
		return retStr;
	};

	const buildHeader = function (age, days, type) {
		age = age || "[#]";
		let dayStr = "";
		if (days) {
			dayStr += days + " DAYS, ";
		}
		if (!type) {
			type = "[#]";
		}
		let ret = "DIAGNOSIS:\n" + "PLACENTA, " + age + " WEEKS, " + dayStr + type.toUpperCase() + "\n";
		return ret;
	};

	const buildInputText = function (label, list) {
		let id = randomID();

		let $ret = $('<div>', {class: "input-group mb-3"});

		// add label
		$('<label>', { class: "h3 col-3 col-form-label", text: label}).appendTo($ret);
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
			$('<input>', inputOpts).appendTo($ret);
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
				if(!objCmp(obj1, arr2[i])) {
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
		let ret = false;
		
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
		buildInputText("Gestation", [{name: "weeks", display: "Weeks"}, {name: "days", display: "Days"}]).appendTo($form);
		buildInputText("Weight", [{name: "weight", display: "Weight (grams)"}]).appendTo($form);
	};

	const copyFunction = function ($textArea) {
		return function (evt) {
			const copyText = $textArea.text();
			const textArea = document.createElement('textarea');
			textArea.textContent = copyText;
			textArea.style = "position: absolute;left: -100%;font-weight: bold;";
			document.body.append(textArea);
			textArea.select();
			document.execCommand("copy");		
		};
	};

	const respondToChanges = function (data, $form, $addOpts, $response) {
		let last = [];
		let change = function () {
			let resp = $form.serializeArray();
			if (!check(last, resp)) {

				//check if twin status changed
				let gests = getValue(resp, "gestations");
				if (gests && gests !== getValue(last, "gestations")) {
					$addOpts.empty();
					if (gests === gestationOptions[0]) {
						// set up other options
						addOtherOptions(data, $addOpts);
					} else if (gests === gestationOptions[1]) {
						// add twin options
						addTwinGestationOptions($addOpts);
						// set up other options
						$("<h4>", {text: "Twin A"}).appendTo($addOpts);
						addOtherOptions(data, $addOpts);
						$("<h4>", {text: "Twin B"}).appendTo($addOpts);
						addOtherOptions(data, $addOpts);
					} else {
						// add twin options
						addTwinGestationOptions($addOpts);
						// set up other options
						$("<h4>", {text: "Twin 1"}).appendTo($addOpts);
						addOtherOptions(data, $addOpts);
						$("<h4>", {text: "Twin 2"}).appendTo($addOpts);
						addOtherOptions(data, $addOpts);
					}
					// re assign the resp so that it doesn't keep the gestation and other options
					resp = $form.serializeArray();
				}

				// set up area
				$response.empty();				

				//update 'last'
				last = JSON.parse(JSON.stringify(resp));

				// build lines
				console.log(resp);
				let $header = buildHeader(getValue(resp, "weeks") * 1, getValue(resp, "days") * 1, getValue(resp, "surgery"));
				let $line1;
				if (gests === gestationOptions[0]) {
					$line1 = line1build({
						weight: getValue(resp, "weight") * 1,
						age: getValue(resp, "weeks") * 1,
						meconium: getValue(resp, "mstaining") === "Present"
					}, data);
				} else {
					$line1 = line1build({
						weight: getValue(resp, "weight") * 1,
						age: getValue(resp, "weeks") * 1,
						membrane: getValue(resp, "membrane"),
						meconium: getValue(resp, "mstaining") === "Present"
					}, data);
				}

				//append lines
				$response.append($header);
				$response.append($line1);
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
			that.parent().find("input").prop('checked', false);
		} else {
			that.parent().parent().parent().find("[label='None']").prop('checked', false);
		}
		
		//turn sister elements off
		that.parent().children('.form-check').find('input').prop('checked', false);
		
		//turn target element on
		target.prop('checked', true);
	};

	const buildSwitch = function (item, depth) {
		let $switch = $('<div>', {class: "form-check form-switch opt" + depth});
		let tid = randomID();
		$('<input>', {
			class: "form-check-input",
			type: "checkbox",
			label: item.label,
			name: item.name,
			id: tid
		}).appendTo($switch);
		$("<label>", {
			class: "form-check-label",
			for: tid,
			html: item.label
		}).appendTo($switch);
		return $switch;
	};

	const basicLabel = function (item, depth) {
		return $('<div>', {class: "opt" + depth, html: item.label});
	};

	const buildOptions = function (options, depth) {
		let $ret = $('<div>');

		options.forEach(function (item) {
			let optRowSettings = {
				class: "depth-" + depth
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
					optRowAppends.push($("<label>", {
						class: "form-check-label",
						for: tid,
						html: item.label
					}));
				}
			} else if (!item.collapsed && input !== "switch") { // basic label
				optRowAppends.push(basicLabel(item, depth));
			}

			// add description
			if (item.description && item.description.length) {
				optRowAppends.push($('<p>', {html: item.description}));
			}

			// go deeper as needed
			if (item.options && item.options.length) {
				optRowAppends.push(buildOptions(item.options, depth + 1)); 
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
			$('<div>', {class: "row"}).appendTo($form)
		);

		//Break remaining page into header column and content column
		let $specFinds = $('<div>', {class: "col-sm-9 col-xs-12"});
		$('<div>', {class: "row"}).append(
			$('<label>', {class: "h3 col-sm-3 col-xs-12 col-form-label", text: "Special Findings"})
		).append(
			$specFinds
		).appendTo($form);

		//Start building options
		buildOptions(data.options, 0).appendTo($('<div>', {class: "container", style: "padding-left:6px;padding-right:6px;"}).appendTo($specFinds));
	};

	const buildPage = function (data) {
		let $main = $('main');
		let $form = $('<form>').appendTo($main);

		console.log(data);

		// Twin gestation options
		// $("<p>", {class: "h3", html: "Gestational Type"}).appendTo($form);
		buildRadio("Gestational Number", "gestations", gestationOptions).appendTo(
			$("<div>", {class: "row"}).appendTo($form)
		);

		// set up basic options
		// $("<h3>", {text: "Birth Parameters"}).appendTo($form);
		setGestationalParams($("<div>", {style: "margin-bottom:10px"}).appendTo($form));

		// set up type
		// $("<p>", {class: "h3", html: "Delivery Type"}).appendTo($form);
		buildRadio("Delivery Type", "surgery", ["Vaginal Delivery", "Cesarian Section"]).appendTo(
			$("<div>", {class: "row"}).appendTo($form)
		);

		// set up staining
		// $("<p>", {class: "h3", html: "Delivery Type"}).appendTo($form);
		buildRadio("Meconium Staining", "mstaining", ["None", "Present"]).appendTo(
			$("<div>", {class: "row"}).appendTo($form)
		);

		// add in other options area
		let $otherOpts = $("<div>").appendTo($form);

		//build response area
		$('<hr>', {class: "col-sm-12"}).appendTo($main);
		let $response = $('<div>', {style: 'white-space: pre-wrap;font-weight: bold;', id: "responseText"})

		// copy button
		$("<button>", {class: "btn btn-success", text: "Copy Diagnosis"}).click(copyFunction($response)).appendTo(
			$('<div>').appendTo($main)
		);
		$('<hr>', {class: "col-sm-12"}).appendTo($main);

		//add in response area
		$response.appendTo($main);

		// set up response to changes
		let respFunc = respondToChanges(data, $form, $otherOpts, $response);
		$form.change(respFunc);
		$form.keyup(respFunc);
		respFunc();
		
	};

	fetch("./page.json")
		.then(a => a.json())
		.then(buildPage);
}())