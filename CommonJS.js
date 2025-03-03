/*
	jshint
	undef: true,
	noarg: true,
	devel: true,
	typed: true,
	jquery: true,
	strict: global,
	eqeqeq: true,
	freeze: true,
	newcap: true,
	esnext: true,
	browser: true,
	latedef: true,
	shadow: outer,
	varstmt: true,
	quotmark: single,
	laxbreak: true,
	singleGroups: true,
	futurehostile: true
*/
 
/*
	globals
	mw,
	Symbol,
	requestIdleCallback
*/
 
/**
 * @typedef Ref
 * @property {*} [current]
 */
 
/**
 * @typedef ArticleImport
 * @property {!('style' | 'script')} type
 * @property {!string[]} articles
 */
 
'use strict';
 
__main__: {
	if (window.UCP && window.UCP.localJS) break __main__;
	
	const raf = requestAnimationFrame;
	// Removes the need to `.call`
	// I saw this at <https://github.com/tc39/proposal-is-error/blob/main/polyfill.js>
	const find = Function.bind.call(Function.call, Array.prototype.find);
	const slice = Function.bind.call(Function.call, Array.prototype.slice);
	const toStr = Function.bind.call(Function.call, Object.prototype.toString);
	
	/**
	 * List of imports.
	 * @type {ArticleImport[]}
	 */
	const imports = [
		{
			type: 'style',
			articles: [
				'u:bloodborne:User:Arashiryuu0/common.css'
			]
		},
		{
			type: 'script',
			articles: [
				'u:dev:MediaWiki:Highlight-js.js',
				'u:dev:MediaWiki:Preact.js'
			]
		}
	];
	// RL sucks
	// importArticles(...imports);
	window.importArticles.apply(0, imports);
	
	window.CustomAce = {
		options: {
			theme: 'ace/theme/catppuccin',
			fontSize: 15,
			fontFamily: '"Berkeley Mono", "Iosevka NFM", "JetBrainsMono NFM", "Consolas", monospace'
		}
	};
	// disable ligatures while using Iosevka font since its ligatures suck
	// but its `%` character is king
	// mw.util.addCSS(':root {--no-liga: \'calt\' 0, \'liga\' 0, \'zero\' 1;} html .ace_editor, html .ace_editor * { font-feature-settings: var(--no-liga) !important; }');
	
	/**
	 * @param {*} [current]
	 * @returns {!Ref}
	 */
	const _ref = function (current) {
		return { current: current };
	};
	
	/**
	 * Throttles function call rate.
	 * @param {!VoidFunction} callback
	 * @param {!number} timeframe
	 */
	const throttle = function (callback, timeframe) {
		const _t = _ref(0);
		return function () {
			const now = Date.now();
			if (now - _t.current >= timeframe) {
				callback.apply(this, arguments);
				_t.current = now;
			}
		};
	};
	
	/**
	 * A simple function debouncer.
	 * @param {!VoidFunction} callback
	 * @param {!number} timeframe
	 * @param {!boolean} immediate
	 * @returns {!VoidFunction}
	 */
	const debounce = function (callback, timeframe, immediate) {
		const _t = _ref(0);
		return function () {
			const context = this;
			const args = arguments;
			const later = function () {
				_t.current = 0;
				if (!immediate) callback.apply(context, args);
			};
			const now = immediate && !_t.current;
			clearTimeout(_t.current);
			_t.current = setTimeout(later, timeframe);
			if (now) callback.apply(context, args);
		};
	};
	
	/**
	 * Creates clean objects with a `Symbol.toStringTag` description of the object.
	 * @param {!string} value
	 * @returns {!object}
	 */
	const _Object = function (value) {
		if (arguments.length < 1) value = 'NullObject';
		if (!['string', 'symbol'].includes(typeof value)) throw new TypeError('Description must be a `string` or `symbol` value.');
		const obj = Object.create(null);
		// RL sucks
		// Object.create(null, { [Symbol.toStringTag]: { value } });
		Object.defineProperty(obj, Symbol.toStringTag, {
			configurable: false,
			enumerable: false,
			writable: false,
			value: value
		});
		return Object.create(obj);
	};
	
	/**
	 * Cache of fired hooks.
	 */
	const fired = _Object('Hook.Cache');
	
	/**
	 * @type {!IdleRequestCallback}
	 */
	const loaded = function () {
		if (fired.loaded) return;
		
		/**
		 * Function currying helper for creating pipelines.
		 */
		const createPipeline = function () {
			const pipes = slice(arguments);
			return function pipeline (value) {
				return pipes.reduce(function (acc, fn) {
					return fn(acc);
				}, value);
			};
		};
		
		/**
		 * Determines if something is undefined or null.
		 * @param {*} anything
		 * @returns {!boolean}
		 */
		const isNil = function (anything) {
			return anything === undefined || anything === null;
		};
		
		/**
		 * Simple polyfill for the nullish coalescing operator (??)
		 * @param {*} expected
		 * @param {*} fallback
		 * @returns {*}
		 */
		const ifNull = function (expected, fallback) {
			return isNil(expected)
				? fallback
				: expected;
		};
		
		/**
		 * Safely traverses an object, returns undefined if a property does not exist.
		 * @param {!object} obj
		 * @param {!string} path
		 * @returns {*}
		 * @example
		 * ```js
		 *	getProp(mw, 'trackQueue.0.topic'); // 'fandom.timing.wikieditor.ready'
		 * ```
		 */
		const getProp = function (obj, path) {
			return path.split('.').reduce(function (o, prop) {
				return o && o[prop];
			}, obj);
		};
		
		/**
		 * Gets a more accurate description of an object than `typeof`.
		 * @param {*} item
		 * @returns {!string}
		 */
		const typeOf = function (item) {
			return toStr(item)
				.replace(/\[object (\w+)\]/i, '$1')
				.toLowerCase();
		};
		
		/**
		 * Checks whether something is a Node instance.
		 * @param {*} tester
		 * @returns {!boolean}
		 */
		const isNode = function (tester) {
			return tester instanceof Node;
		};
		
		/**
		 * Checks whether something is a function.
		 * @param {*} item
		 * @returns {!boolean}
		 */
		const isFunction = function (item) {
			return typeof item === 'function';
		};
		
		/**
		 * Self-binds an object's methods to the object.
		 * @param {!object} target
		 */
		const applyBinds = function (target) {
			const methods = Object.getOwnPropertyNames(target).filter(function (key) {
				return isFunction(target[key]);
			});
			if (!methods.length) return;
			const counter = _ref(0);
			while (counter.current < methods.length) {
				const method = methods[counter.current++];
				target[method] = target[method].bind(target);
			}
		};
		
		/**
		 * DOM element helper utilities.
		 */
		const DOM = _Object('DOM');
		__dom__: {
			const xmlns = 'http://www.w3.org/2000/svg';
			/**
			 * @typedef DOMElement
			 * @type {!(HTMLElement | SVGElement)}
			 */
			/**
			 * @param {!string} type
			 * @returns {!DOMElement}
			 */
			const getValidElement = function (type) {
				const element = document.createElement(type);
				if (element instanceof window.HTMLUnknownElement) return document.createElementNS(xmlns, type);
				return element;
			};
			/**
			 * @param {!string} key
			 * @returns {!boolean}
			 */
			const isEvent = function (key) {
				return key.slice(0, 2) === 'on' && key[2] === key[2].toUpperCase();
			};
			/**
			 * @param {!string} name
			 * @returns {!string}
			 */
			const normalize = function (name) {
				return name === 'doubleclick'
					? 'dblclick'
					: name;
			};
			/**
			 * @param {!string} key
			 * @returns {!boolean}
			 */
			const isDataAttr = function (key) {
				return key.startsWith('data') && key.toLowerCase() !== key;
			};
			/**
			 * @param {!string} key
			 * @returns {!string}
			 */
			const dataNormalize = function (key) {
				return key.replace(/([A-Z]{1,})/g, '-$1').toLowerCase();
			};
			
			Object.assign(DOM, {
				/**
				 * A `document.createElement` helper function.
				 * @param {!string} type
				 * @param {?object} [props]
				 * @returns {!DOMElement}
				 */
				create: function (type, props) {
					if (typeof type !== 'string') type = 'div';
					const e = getValidElement(type);
					const children = slice(arguments, 2);
					if (typeOf(props) !== 'object' || !Object.keys(props).length) {
						if (children.length) e.append.apply(e, children);
						return e;
					}
					if (!Object.hasOwn(props, 'children') && children.length) {
						e.append.apply(e, children);
					}
					const counter = _ref(0);
					const keys = Object.keys(props);
					while (counter.current < keys.length) {
						const key = keys[counter.current++];
						switch (key) {
							case 'textContent':
							case 'text': {
								e.textContent = props[key];
								break;
							}
							case 'innerText': {
								e.innerText = props[key];
								break;
							}
							case 'className': {
								e[key] = props[key];
								break;
							}
							case 'classes': {
								if (!Array.isArray(props[key])) props[key] = [props[key]];
								e.classList.add.apply(e.classList, props[key]);
								break;
							}
							case 'style': {
								if (typeof props[key] === 'string') {
									e.setAttribute(key, props[key]);
									break;
								}
								Object.assign(e[key], props[key]);
								break;
							}
							case 'children': {
								if (!Array.isArray(props[key])) props[key] = [props[key]];
								if (props[key].length) e.append.apply(e, props[key]);
								break;
							}
							case 'htmlFor': {
								e.setAttribute('for', props[key]);
								break;
							}
							default: {
								if (isEvent(key)) {
									const event = normalize(key.slice(2).toLowerCase());
									if (Array.isArray(props[key]) && props[key].length) {
										const i = _ref(0);
										const listeners = props[key].filter(isFunction);
										while (i.current < listeners.length) {
											const listener = listeners[i.current++];
											e.addEventListener(event, listener);
										}
										break;
									}
									e.addEventListener(event, props[key]);
									break;
								}
								if (isDataAttr(key)) {
									const attr = dataNormalize(key);
									e.setAttribute(attr, props[key]);
									break;
								}
								e.setAttribute(key, props[key]);
								break;
							}
						}
					}
					e.$$props = props;
					return e;
				},
				/**
				 * A `DocumentFragment` helper function.
				 * @param {!(string | Node)[]} [children]
				 * @returns {!DocumentFragment}
				 */
				fragment: function (children) {
					const frag = new DocumentFragment();
					if (isNil(children)) return frag;
					if (!Array.isArray(children) || !children.length) return frag;
					frag.append.apply(frag, children);
					return frag;
				}
			});
			
			applyBinds(DOM);
		}
		
		/**
		 * Create Logger object.
		 */
		const Logger = _Object('Logger');
		__logger__: {
			const counter = _ref(0);
			/**
			 * Logging levels.
			 */
			const levels = /** @type {const} */ (['log', 'dir', 'info', 'warn', 'debug', 'error']);
			
			/**
			 * @typedef LogLevel
			 * @type {typeof levels[number]}
			 */

			/**
			 * Provides label data for logging methods.
			 * @param {!string} name
			 * @returns {!string[]}
			 */
			const getParts = function (name) {
				// separators
				// ::, ⋙
				return [
					'%c[[%c  %s  %c::%c  %s  %c]]%c',
					'color: #a4e5ab;',
					'',
					name,
					'color: #a4e5ab;',
					'',
					new Date().toLocaleString().replace(',', ' ~'),
					'color: #a4e5ab;',
					''
					// Failfox strikes again
					// '\x1b[92m[[\x1b[0m  \x1b[37m%s\x1b[0m  \x1b[92;1m::\x1b[0m  \x1b[37m%s\x1b[0m  \x1b[92m]]\x1b[0m',
				];
			};
			
			/**
			 * Fetches levels to be used for logging.
			 * @param {!LogLevel} level
			 * @returns {!LogLevel}
			 */
			const getLevel = function (level) {
				const base = 'log';
				if (level in levels) return levels[level];
				return levels.includes(level)
					? level
					: base;
			};
			
			/**
			 * Creates log methods.
			 * @param {!LogLevel} level
			 * @param {!string} name
			 * @returns {!VoidFunction}
			 */
			const makeLog = function (level, name) {
				const lvl = getLevel(level);
				return function () {
					console.groupCollapsed.apply(0, getParts(name));
					console[lvl].apply(0, arguments);
					console.groupEnd();
				};
			};
			
			/**
			 * @param {!LogLevel} level
			 * @param {!string} name
			 */
			const stagger = function (level, name) {
				const lvl = getLevel(level);
				const logs = [];
				return Object.freeze({
					push: function () {
						logs.push(arguments);
					},
					flush: function () {
						logs.splice(0);
					},
					print: function () {
						const _len = _ref(0);
						console.groupCollapsed.apply(0, getParts(name));
						while (_len.current < logs.length) console[lvl].apply(0, logs[_len.current++]);
						console.groupEnd();
					}
				});
			};
			
			while (counter.current < levels.length) {
				const level = levels[counter.current++];
				Logger[level] = Object.freeze(makeLog(level, 'Special:MyPage/common.js'));
				Logger['_' + level] = stagger(level, 'Special:MyPage/common.js');
			}
			
			applyBinds(Logger);
			Object.freeze(Logger);
		}
		
		__banners__: {
			const bannerItems = [
				document.querySelector('.wds-global-navigation__logo')
			].concat(slice(document.querySelectorAll('.wds-global-navigation__link')));
			bannerItems.forEach(function (item) {
				if (!item) return;
				item.setAttribute('tabindex', '-1');
			});
		}
		
		__buttons__: {
			if (fired.buttons) break __buttons__;
			const wdsButtons = document.querySelectorAll('.wiki-tools.wds-button-group, nav + div .wiki-tools');
			if (!wdsButtons.length) break __buttons__;
			/**
			 * @param {!HTMLElement} button
			 * @returns {!Node}
			 */
			const clone = function (button) {
				return button.cloneNode(true);
			};
			const names = find(wdsButtons, function (x) {
				return x.firstElementChild.classList.contains('wds-is-secondary');
			});
			if (!names) break __buttons__;
			const firstName = getProp(names, 'firstElementChild.className');
			if (!firstName) break __buttons__;
			const buttons = [
				DOM.create('a', {
					className: firstName.replace('wiki-tools__search', 'wiki-tools__user-js'),
					text: 'JS',
					title: 'User JS',
					href: '/wiki/User:Arashiryuu0/common.js'
				}),
				DOM.create('a', {
					className: firstName.replace('wiki-tools__search', 'wiki-tools__user-css'),
					text: 'CSS',
					title: 'User CSS',
					href: '/wiki/User:Arashiryuu0/common.css'
				}),
				DOM.create('a', {
					className: firstName.replace('wiki-tools__search', 'wiki-tools__random'),
					text: '?',
					title: 'Random Page',
					href: '/wiki/Special:Random',
					dataTracking: 'explore-random'
				})
			];
			const children = DOM.fragment();
			const counter = _ref(0);
			/**
			 * @param {!HTMLElement} wds
			 */
			const handleWds = function (wds) {
				const cloned = buttons.map(function (btn) {
					const c = clone(btn);
					if (wds.parentElement.id === 'community-navigation') {
						c.classList.replace('wds-is-secondary', 'wds-is-text');
					}
					return c;
				});
				children.append.apply(children, cloned);
				wds.appendChild(children);
				/**
				 * fix button positioning
				 * layout should be:
				 * search, discussions, recent changes, theme, my buttons, dropdown
				 */
				wds.appendChild(wds.querySelector('.wds-dropdown'));
			};
			while (counter.current < wdsButtons.length) handleWds(wdsButtons[counter.current++]);
			fired.buttons = true;
		}
		
		const ApexLaser = _Object('ApexLaser');
		// Apex uses BGR so some of these values are reversed RGB values
		__apex_laser__: {
			const HexForms = Object.freeze({
				SHORT: 3,
				NORMAL: 6
			});
			/**
			 * @param {!number} value
			 * @returns {!string}
			 */
			const asString = function (value) {
				return value.toString(16).padEnd(2, '0');
			};
			/**
			 * @param {!number} value
			 * @returns {!boolean}
			 */
			const inRange = function (value) {
				return Number.isFinite(value) && value >= 0 && value <= 255;
			};
			/**
			 * @param {!string} char
			 * @returns {!string}
			 */
			const hexMapper = function (char) {
				return char + char;
			};
			Object.assign(ApexLaser, {
				/**
				 * @param {!number} [r]
				 * @param {!number} [g]
				 * @param {!number} [b]
				 * @returns {!number}
				 */
				fromRGB: function (r, g, b) {
					const args = [r || 0, g || 0, b || 0];
					if (!args.every(inRange)) throw new RangeError('RGB values must be a number between 0 and 255.');
					const strings = args.map(asString);
					const joined = strings.toReversed().join('');
					return parseInt(joined, 16);
				},
				/**
				 * @param {!string} hex
				 * @returns {!number}
				 */
				fromHex: function (hex) {
					if (hex[0] === '#') hex = hex.slice(1);
					const regex = /([0-9a-f]){2}/ig;
					const regexSplits = 3;
					const rangeError = new RangeError('Hex value must be a 3 or 6 character combination using numbers `0-9` and or letters `a-f` (case-insensitive).');
					switch (hex.length) {
						case HexForms.SHORT: {
							const values = hex.split('').map(hexMapper);
							const match = values.join('').match(regex);
							if (!match || match.length !== regexSplits) throw rangeError;
							const joined = values.toReversed().join('');
							return parseInt(joined, 16);
						}
						case HexForms.NORMAL: {
							const match = hex.match(regex);
							if (!match || match.length !== regexSplits) throw rangeError;
							const slices = [
								hex.slice(0, 2),
								hex.slice(2, 4),
								hex.slice(4, 6)
							];
							const joined = slices.toReversed().join('');
							return parseInt(joined, 16);
						}
						default: {
							throw rangeError;
						}
					}
				},
				/**
				 * @param {!number} base10num
				 * @returns {!string}
				 */
				toHex: function (base10num) {
					const string = base10num.toString(16).padStart(6, '0');
					const slices = [
						string.slice(0, 2),
						string.slice(2, 4),
						string.slice(4, 6)
					];
					const flipped = slices.toReversed();
					return flipped.join('');
				},
				/**
				 * @param {!number} base10num
				 * @returns {!number[]}
				 */
				toRGB: function (base10num) {
					const R = base10num & 255;
					const G = base10num >> 8 & 255;
					const B = base10num >> 16 & 255;
					return [R, G, B];
				}
			});
		}
		applyBinds(ApexLaser);
		Object.freeze(ApexLaser);
		
		window.UCP.Logger = Logger;
		window.UCP.Utils = _Object('Utils');
		Object.assign(window.UCP.Utils, {
			DOM: DOM,
			type: typeOf,
			isNil: isNil,
			ifNull: ifNull,
			isNode: isNode,
			getProp: getProp,
			debounce: debounce,
			throttle: throttle,
			ApexLaser: ApexLaser,
			createPipeline: createPipeline
		});
		applyBinds(window.UCP.Utils);
		Object.freeze(window.UCP.Utils);
		
		mw.hook('dev.highlight').add(function (hljs) {
			/**
			 * @type {!Ref}
			 */
			const ref = _ref();
			/**
			 * List of dark-mode themes.
			 * @type {!string[]}
			 */
			const themes = [
				'catppuccin-mocha',
				'monokai-sublime',
				'solarized-dark',
				'tomorrow-night',
				'atom-one-dark',
				'gruvbox-dark',
				'kanagawa',
				'dracula',
				'vs2015'
			];
			/**
			 * Randomly picked theme.
			 * @type {!string}
			 */
			const pick = themes.at(-3);//themes[Math.floor(Math.random() * themes.length)];
			/**
			 * Disables my globally added codeblock theme to allow local themes to highlight properly.
			 */
			const disable = function () {
				const n = document.querySelector('link[href$=".min.css"]');
				if (!n) {
					ref.current = raf(disable);
					return;
				}
				n.setAttribute('disabled', '');
				ref.current = null;
			};
			/**
			 * Sets the current theme.
			 * @param {!string} theme
			 */
			const setTheme = function (theme) {
				return function () {
					hljs.useTheme(theme);
				};
			};
			const setter = setTheme(pick);
			/**
			 * Callback wrapper to be supplied to the `hljs.loadAllLanguages` promise success handler.
			 */
			const useTheme = function () {
				raf(setter);
			};
			
			ref.current = raf(disable);
			hljs.loadAllLanguages().then(useTheme, Logger.error);
		});
		
		/*
		mw.hook('messageWall.activated').add(function () {
			const fLog = '\x1b[102;30;1m WALL ~ ';
			const fLogS = fLog + '%s ';
			const wall = document.getElementById('MessageWall');
			const page = mw.config.get('wgPageName').split(':');
			const view = {
				user: page[1]
			};
			if (!wall || wall.querySelector('#MessageWallGreeting')) return Logger.log(fLogS, 'Aborted loading.');
			const api = new mw.Api();
			Logger.log(fLogS, 'Making API query...');
			api.get({
				page: 'Message_Wall_Greeting:' + view.user,
				prop: 'text|wikitext',
				action: 'parse',
				format: 'json',
				disabletoc: 1,
				formatversion: '2',
				disablelimitreport: 1,
				disableeditsection: 1,
				disablestylededuplication: 1
			}).then(function (d) {
				const text = d.parse.text;
				if (!text) return;
				const parsed = $(text)[0];
				if (!parsed) return;
				const section = DOM.create('section', {
					id: 'MessageWallGreeting',
					children: [
						parsed.firstChild
					]
				});
				wall.prepend(section);
				mw.hook('wikipage.content').fire($(section));
				Logger.log(fLogS, 'Parsed!');
			}, function (error) {
				Logger.error(fLog, error);
			});
		});
		*/
		
		fired.loaded = true;
	};
	
	window.UCP = window.UCP || _Object('UCP');
	Object.assign(window.UCP, {
		localJS: fired,
		strings: {
			'f': String.fromCodePoint(402),
			'deg': String.fromCodePoint(176),
			'emdash': String.fromCodePoint(8212),
			'emdott': String.fromCodePoint(8226)
		}
	});
	
	requestIdleCallback(loaded);
}
 
/*@end@*/
