(function () {
	let MenuTpl =
		'<div id="menu_{{_namespace}}_{{_name}}" class="menu{{#align}} align-{{align}}{{/align}}">' +
		'<div class="shake"><div class="head"><div class="headtitle">{{{title}}}</div></div>' +
		'<div class="items-container"><div class="menu-items">' +
		'{{#elements}}' +
		'<div class="menu-item {{#selected}}selected{{/selected}}">' +
		'» {{{label}}}{{#isSlider}} : &lt;{{{sliderLabel}}}&gt;{{/isSlider}}' +
		'</div>' +
		'{{/elements}}' +
		'</div></div></div>' +
		'</div>' +
		'</div>' +
		'';

	window.menu_default = {};
	menu_default.ResourceName = 'menu_default';
	menu_default.opened = {};
	menu_default.focus = [];
	menu_default.pos = {};

	menu_default.open = function (namespace, name, data) {
		if (typeof menu_default.opened[namespace] == 'undefined') {
			menu_default.opened[namespace] = {};
		}

		if (typeof menu_default.opened[namespace][name] != 'undefined') {
			menu_default.close(namespace, name);
		}

		if (typeof menu_default.pos[namespace] == 'undefined') {
			menu_default.pos[namespace] = {};
		}

		for (let i = 0; i < data.elements.length; i++) {
			if (typeof data.elements[i].type == 'undefined') {
				data.elements[i].type = 'default';
			}
		}

		data._index = menu_default.focus.length;
		data._namespace = namespace;
		data._name = name;

		for (let i = 0; i < data.elements.length; i++) {
			data.elements[i]._namespace = namespace;
			data.elements[i]._name = name;
		}

		menu_default.opened[namespace][name] = data;
		menu_default.pos[namespace][name] = 0;

		for (let i = 0; i < data.elements.length; i++) {
			if (data.elements[i].selected) {
				menu_default.pos[namespace][name] = i;
			} else {
				data.elements[i].selected = false;
			}
		}

		menu_default.focus.push({
			namespace: namespace,
			name: name
		});

		menu_default.render();
		$('#menu_' + namespace + '_' + name).find('.menu-item.selected')[0].scrollIntoView();
	};

	menu_default.close = function (namespace, name) {
		delete menu_default.opened[namespace][name];

		for (let i = 0; i < menu_default.focus.length; i++) {
			if (menu_default.focus[i].namespace == namespace && menu_default.focus[i].name == name) {
				menu_default.focus.splice(i, 1);
				break;
			}
		}

		menu_default.render();
	};

	menu_default.render = function () {
		let menuContainer = document.getElementById('menus');
		let focused = menu_default.getFocused();
		menuContainer.innerHTML = '';
		$(menuContainer).hide();

		for (let namespace in menu_default.opened) {
			for (let name in menu_default.opened[namespace]) {
				let menuData = menu_default.opened[namespace][name];
				let view = JSON.parse(JSON.stringify(menuData));

				for (let i = 0; i < menuData.elements.length; i++) {
					let element = view.elements[i];

					switch (element.type) {
						case 'default': break;

						case 'slider': {
							element.isSlider = true;
							element.sliderLabel = (typeof element.options == 'undefined') ? element.value : element.options[element.value];

							break;
						}

						default: break;
					}

					if (i == menu_default.pos[namespace][name]) {
						element.selected = true;
					}
				}

				let menu = $(Mustache.render(MenuTpl, view))[0];
				$(menu).hide();
				menuContainer.appendChild(menu);
			}
		}

		if (typeof focused != 'undefined') {
			$('#menu_' + focused.namespace + '_' + focused.name).show();
		}

		$(menuContainer).show();

	};

	menu_default.submit = function (namespace, name, data) {
		$.post('http://' + menu_default.ResourceName + '/menu_submit', JSON.stringify({
			_namespace: namespace,
			_name: name,
			current: data,
			elements: menu_default.opened[namespace][name].elements
		}));
	};

	menu_default.cancel = function (namespace, name) {
		$.post('http://' + menu_default.ResourceName + '/menu_cancel', JSON.stringify({
			_namespace: namespace,
			_name: name
		}));
	};

	menu_default.change = function (namespace, name, data) {
		$.post('http://' + menu_default.ResourceName + '/menu_change', JSON.stringify({
			_namespace: namespace,
			_name: name,
			current: data,
			elements: menu_default.opened[namespace][name].elements
		}));
	};

	menu_default.getFocused = function () {
		return menu_default.focus[menu_default.focus.length - 1];
	};

	window.onData = (data) => {
		switch (data.action) {

			case 'openMenu': {
				menu_default.open(data.namespace, data.name, data.data);
				break;
			}

			case 'closeMenu': {
				menu_default.close(data.namespace, data.name);
				break;
			}

			case 'controlPressed': {
				switch (data.control) {

					case 'ENTER': {
						let focused = menu_default.getFocused();

						if (typeof focused != 'undefined') {
							let menu = menu_default.opened[focused.namespace][focused.name];
							let pos = menu_default.pos[focused.namespace][focused.name];
							let elem = menu.elements[pos];

							if (menu.elements.length > 0) {
								menu_default.submit(focused.namespace, focused.name, elem);
							}
						}

						break;
					}

					case 'BACKSPACE': {
						let focused = menu_default.getFocused();

						if (typeof focused != 'undefined') {
							menu_default.cancel(focused.namespace, focused.name);
						}

						break;
					}

					case 'TOP': {
						let focused = menu_default.getFocused();

						if (typeof focused != 'undefined') {
							let menu = menu_default.opened[focused.namespace][focused.name];
							let pos = menu_default.pos[focused.namespace][focused.name];

							if (pos > 0) {
								menu_default.pos[focused.namespace][focused.name]--;
							} else {
								menu_default.pos[focused.namespace][focused.name] = menu.elements.length - 1;
							}

							let elem = menu.elements[menu_default.pos[focused.namespace][focused.name]];

							for (let i = 0; i < menu.elements.length; i++) {
								if (i == menu_default.pos[focused.namespace][focused.name]) {
									menu.elements[i].selected = true;
								} else {
									menu.elements[i].selected = false;
								}
							}

							menu_default.change(focused.namespace, focused.name, elem);
							menu_default.render();

							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}

						break;
					}

					case 'DOWN': {
						let focused = menu_default.getFocused();

						if (typeof focused != 'undefined') {
							let menu = menu_default.opened[focused.namespace][focused.name];
							let pos = menu_default.pos[focused.namespace][focused.name];
							let length = menu.elements.length;

							if (pos < length - 1) {
								menu_default.pos[focused.namespace][focused.name]++;
							} else {
								menu_default.pos[focused.namespace][focused.name] = 0;
							}

							let elem = menu.elements[menu_default.pos[focused.namespace][focused.name]];

							for (let i = 0; i < menu.elements.length; i++) {
								if (i == menu_default.pos[focused.namespace][focused.name]) {
									menu.elements[i].selected = true;
								} else {
									menu.elements[i].selected = false;
								}
							}

							menu_default.change(focused.namespace, focused.name, elem);
							menu_default.render();

							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}

						break;
					}

					case 'LEFT': {
						let focused = menu_default.getFocused();

						if (typeof focused != 'undefined') {
							let menu = menu_default.opened[focused.namespace][focused.name];
							let pos = menu_default.pos[focused.namespace][focused.name];
							let elem = menu.elements[pos];

							switch (elem.type) {
								case 'default': break;

								case 'slider': {
									let min = (typeof elem.min == 'undefined') ? 0 : elem.min;

									if (elem.value > min) {
										elem.value--;
										menu_default.change(focused.namespace, focused.name, elem);
									}

									menu_default.render();
									break;
								}

								default: break;
							}

							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}

						break;
					}

					case 'RIGHT': {
						let focused = menu_default.getFocused();

						if (typeof focused != 'undefined') {
							let menu = menu_default.opened[focused.namespace][focused.name];
							let pos = menu_default.pos[focused.namespace][focused.name];
							let elem = menu.elements[pos];

							switch (elem.type) {
								case 'default': break;

								case 'slider': {
									if (typeof elem.options != 'undefined' && elem.value < elem.options.length - 1) {
										elem.value++;
										menu_default.change(focused.namespace, focused.name, elem);
									}

									if (typeof elem.max != 'undefined' && elem.value < elem.max) {
										elem.value++;
										menu_default.change(focused.namespace, focused.name, elem);
									}

									menu_default.render();
									break;
								}

								default: break;
							}

							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}

						break;
					}

					default: break;
				}

				break;
			}
		}
	};

	window.onload = function (e) {
		window.addEventListener('message', (event) => {
			onData(event.data);
		});
	};

})();
