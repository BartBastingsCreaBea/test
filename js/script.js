var customValidation = false, personalValidation = false, json;
// polyfille form
//webshims.polyfill("forms");
// helper functions
var isEmptyStr = function (str) {
	"use strict";
	return !str.replace(/^\s+/g, "").length;
};
var isEmptyObj = function (obj) {
	"use strict";
	try {
		Object.getOwnPropertyNames(obj);
	} catch (e) {
		return false;
	}
	return true;
};
var hasClass = function (el, className) {
	"use strict";
	return el.classList ? el.classList.contains(className) : new RegExp("\\b" + className + "\\b").test(el.className);
};
var addClass = function (el, className) {
	"use strict";
	if (el.classList) {
		el.classList.add(className);
	} else if (!hasClass(el, className)) {
		el.className += " " + className;
	}
};
var removeClass = function (el, className) {
	"use strict";
	if (el.classList) {
		el.classList.remove(className);
	} else if (hasClass(el, className)) {
		var reg = new RegExp("(\\s|^)" + className + "(\\s|$)");
		el.className = el.className.replace(reg, " ");
	}
};
//
var urlExists = function (url) {
	"use strict";
	var xhttp = new XMLHttpRequest();
	xhttp.open("HEAD", url, false);
	xhttp.send();
	return xhttp.status !== 404;
};
//
var fromElementCheck = function (element) {
	"use strict";
	var type;
	switch (element.tagName) {
	case "INPUT":
		type = element.type;
		break;
	default:
		type = element.tagName;
	}
	return type;
};
//
var formValidationMessage = function (input) {
	"use strict";
	var validity;
	if (input.validity.valueMissing) {
		validity = "valueMissing";
	} else if (input.validity.badInput) {
		validity = "badInput";
	} else if (input.validity.patternMismatch) {
		validity = "patternMismatch";
	} else if (input.validity.rangeUnderflow) {
		validity = "rangeUnderflow";
	} else if (input.validity.rangeOverflow) {
		validity = "rangeOverflow";
	} else if (input.validity.stepMismatch) {
		validity = "stepMismatch";
	} else if (input.validity.tooLong) {
		validity = "tooLong";
	} else if (input.validity.typeMismatch) {
		validity = "typeMismatch";
	} else {
		validity = false;
	}
	return validity;
};
//
var buildUrl = function (lang) {
	"use strict";
	return "/json/" + lang + ".json";
};
//
var url = function (lang) {
	"use strict";
	if (!urlExists(buildUrl(lang))) {
		return buildUrl("en");
	}
	return buildUrl(lang);
};
//
var jsonUrl = function () {
	"use strict";
	var lang = window.navigator.languages ? window.navigator.languages[0] : null;
	lang = lang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage;
	if (lang.indexOf("-") !== -1) {
		lang = lang.split("-")[0];
	}
	if (lang.indexOf("_") !== -1) {
		lang = lang.split("_")[0];
	}
	return url(lang);
};
//
var loadJSON = function (url, callback) {
	"use strict";
	var xhttp = new XMLHttpRequest();
	xhttp.overrideMimeType("application/json");
	xhttp.onreadystatechange = function (event) {
		if (xhttp.readyState === 4 && xhttp.status === 200) {
			callback(xhttp.responseText);
		}
	};
	xhttp.open("GET", url, true);
	xhttp.send(null);
};
//
var checkJson = function (json, data) {
	"use strict";
	if (json[data] !== undefined) {
		return true;
	}
	return false;
};
var buildErrorMessage = function (element, type, message) {
	"use strict";
	if (type === "radio" || type === "checkbox") {
		element.parentNode.insertAdjacentHTML("beforeend", "<div class='error-message'>" + message + "</div>");
	} else {
		element.insertAdjacentHTML("beforeend", "<div class='error-message'>" + message + "</div>");
	}
};
//
var submitValidation = function (element, validation, json) {
	"use strict";
	var parent = element.parentNode, type = fromElementCheck(element), validity = formValidationMessage(element);
	if (validity !== false) {
		if (validation === "personal") {
			if (element.dataset.personal && checkJson(json, "personal-" + element.dataset.personal)) {
				buildErrorMessage(parent, type, json["personal-" + element.dataset.personal][0][validity]);
			} else {
				buildErrorMessage(parent, type, json[type][0][validity]);
			}
		} else if (validation === "custom") {
			buildErrorMessage(parent, type, json[type][0][validity]);
		} else {
			buildErrorMessage(parent, type, element.validationMessage);
		}
	}
};
//
var focusValidation = function (element) {
	"use strict";
	element.addEventListener("blur", function (event) {
		if (!event.currentTarget.validity.valid) {
			addClass(event.currentTarget, "is-invalid");
		} else {
			removeClass(event.currentTarget, "is-invalid");
		}
	}, true);
};
//
var formValidation = function (form, json) {
	"use strict";
	//
	console.log(json);
	var formElements = form.querySelectorAll("input, select, textarea"), submitButton = form.querySelector("button[type=submit], input[type=submit]"), resetButton = form.querySelector("button[type=reset], input[type=reset]");
	// Suppress the default bubbles
	form.addEventListener("invalid", function (event) {
		event.preventDefault();
	}, true);
	// Support Safari, iOS Safari, and the Android browser—each of which do not prevent
	// form submissions by default
	form.addEventListener("submit", function (event) {
		if (!event.currentTarget.checkValidity()) {
			event.preventDefault();
		}
	});
	//validation onFocus  input, select, textarea
	if (formElements.length > 0) {
		Array.prototype.forEach.call(formElements, function (formElement) {
			focusValidation(formElement);
		});
	}
	// submit event listener
	submitButton.addEventListener("click", function () {
		var invalidFields = form.querySelectorAll(":invalid"), errorMessages = form.querySelectorAll(".error-message"), validation = false;
		// Remove any existing messages
		if (errorMessages.length > 0) {
			Array.prototype.forEach.call(errorMessages, function (errorMessage) {
				errorMessage.parentNode.removeChild(errorMessage);
			});
		}
		// add error messages
		if (invalidFields.length > 0) {
			Array.prototype.forEach.call(invalidFields, function (invalidField) {
				if (isEmptyObj(json) && form.dataset.validation !== undefined) {
					validation = form.dataset.validation;
				}
				submitValidation(invalidField, validation, json);
			});
		}
		// If there are errors, give focus to the first invalid field
		if (invalidFields.length > 0) {
			invalidFields[0].focus();
		}
	});
	// reset event listener
	if (resetButton) {
		resetButton.addEventListener("click", function () {
			var errorMessages = form.querySelectorAll(".error-message");
			Array.prototype.forEach.call(formElements, function (formElement) {
				removeClass(formElement, "is-invalid");
			});
			if (errorMessages.length > 0) {
				Array.prototype.forEach.call(errorMessages, function (errorMessage) {
					errorMessage.parentNode.removeChild(errorMessage);
				});
			}
		});
	}
};
// form label focus effect script
var formLabel = function (form) {
	"use strict";
	var formLabelInputs = form.getElementsByTagName("input"), resetButton = form.querySelector("button[type=reset], input[type=reset]");
	if (formLabelInputs) {
		Array.prototype.forEach.call(formLabelInputs, function (formLabelInput) {
			if (!isEmptyStr(formLabelInput.value)) {
				addClass(formLabelInput, "is-focus");
			}
			formLabelInput.addEventListener("blur", function (event) {
				if (!isEmptyStr(event.currentTarget.value)) {
					addClass(event.currentTarget, "is-focus");
				} else {
					removeClass(event.currentTarget, "is-focus");
					
				}
			}, true);
		});
	}
	// reset event listener
	if (resetButton) {
		resetButton.addEventListener("click", function () {
			Array.prototype.forEach.call(formLabelInputs, function (formLabelInput) {
				removeClass(formLabelInput, "is-focus");
			});
		});
	}
};
// document ready
document.addEventListener("DOMContentLoaded", function () {
	"use strict";
	// custom validation
	var formsValidation = document.getElementsByClassName("js-formValidation"), formsLabel = document.getElementsByClassName("js-formLabel"), jsonURL = jsonUrl();
	if (formsValidation.length > 0) {
		loadJSON(jsonURL, function (response) {
			json = JSON.parse(response);
			Array.prototype.forEach.call(formsValidation, function (form) {
				formValidation(form, json);
			});
		});
	}
	// label onfocus
	if (formsLabel.length > 0) {
		Array.prototype.forEach.call(formsLabel, function (form) {
			formLabel(form);
		});
	}
});