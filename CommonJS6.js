/*
	jshint
	undef: true,
	noarg: true,
	devel: true,
	typed: true,
	jquery: true,
	strict: true,
	eqeqeq: true,
	freeze: true,
	newcap: true,
	browser: true,
	latedef: true,
	shadow: outer,
	varstmt: true,
	quotmark: single,
	laxbreak: true,
	esversion: 11,
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
 * @typedef DictKey
 * @type {!Exclude<PropertyKey, number>}
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
	// I saw this at <https://github.com/tc39/proposal-is-error/blob/33dd75bb6b2c4159cbe8b11bb6554bbf4de69cf8/polyfill.js>
	const find = Function.call.bind(Array.prototype.find);
	const toStr = Function.call.bind(Object.prototype.toString);
	
	/**
	 * List of imports.
	 * @type {ArticleImport[]}
	 */
	const imports = [
		{
			type: 'script',
			articles: [
				'u:dev:MediaWiki:Highlight-js.js',
				'u:dev:MediaWiki:Preact.js'
			]
		},
		{
			type: 'style',
			articles: [
				'u:bloodborne:User:Arashiryuu0/common.css'
			]
		}
	];
	
	window.importArticles(...imports);
	
	window.CustomAce = {
		options: {
			theme: 'ace/theme/naysayer',
			fontSize: 18,
			fontFamily: '"Berkeley Mono Variable", "Iosevka NFM", "JetBrainsMono NFM", "Consolas", monospace'
		}
	};
	
	const css = (styles, ...vars) => String.raw(styles, ...vars).split(/\s+/g).join(' ').trim();
	// disable ligatures while using Iosevka font since its ligatures suck
	// but its `%` character is king
	// mw.util.addCSS(css`
	// 	:root {
	// 		--no-liga: 'calt' 0, 'liga' 0, 'zero' 1;
	// 	}
	// 	html .ace_editor,
	// 	html .ace_editor * {
	// 		font-feature-settings: var(--no-liga) !important;
	// 	}
	// `);
	
	/**
	 * @param {*} [current]
	 * @returns {!Ref}
	 */
	const _ref = (current) => ({ current });
	
	/**
	 * Throttles function call rate.
	 * @param {!VoidFunction} callback
	 * @param {!number} timeframe
	 */
	const throttle = (callback, timeframe) => {
		let t = 0;
		return function () {
			const now = Date.now();
			if (now - t >= timeframe) {
				callback.apply(this, arguments);
				t = now;
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
	const debounce = (callback, timeframe, immediate = false) => {
		let t = 0;
		return function () {
			const context = this;
			const args = arguments;
			const later = () => {
				t = 0;
				if (!immediate) callback.apply(context, args);
			};
			const now = immediate && !t;
			clearTimeout(t);
			t = setTimeout(later, timeframe);
			if (now) callback.apply(context, args);
		};
	};
	
	/**
	 * Creates clean objects with a `Symbol.toStringTag` description of the object as the only inherited data.
	 * @param {!DictKey} [value='0']
	 * @returns {!object}
	 */
	const _Object = (value = '0') => Object.create(
		Object.create(null, {
			[Symbol.toStringTag]: {
				configurable: false,
				enumerable: false,
				writable: false,
				value
			}
		})
	);
	
	/**
	 * Cache of fired hooks.
	 */
	const fired = _Object('Hook.Cache');
	
	/**
	 * @type {!IdleRequestCallback}
	 */
	const loaded = () => {
		if (fired.loaded) return;
		
		/**
		 * Function currying helper for creating pipelines.
		 */
		const createPipeline = (...args) => (value) => args.reduce((acc, fn) => fn(acc), value);
		
		/**
		 * Determines if something is undefined or null.
		 * @param {*} anything
		 * @returns {!boolean}
		 */
		const isNil = (anything) => anything === undefined || anything === null;
		
		/**
		 * Simple polyfill for nullish coalescing operator (??). 
		 * @param {*} target
		 * @param {*} fallback
		 * @returns {*}
		 * @example
		 * ```js
		 * const user = ifNil(getUserSync(), { id: -1, name: 'John Doe' });
		 * ```
		 */
		const ifNil = (target, fallback) => isNil(target)
			? fallback
			: target;
		
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
		const getProp = (obj, path) => path.split('.').reduce((o, prop) => o && o[prop], obj);
		
		/**
		 * Gets a more accurate description of an object than `typeof`.
		 * @param {*} item
		 * @returns {!string}
		 */
		const typeOf = (item) => toStr(item)
			.replace(/\[object (\w+)\]/i, '$1')
			.toLowerCase();
		
		/**
		 * Checks whether something is a Node instance.
		 * @param {*} tester
		 * @returns {!boolean}
		 */
		const isNode = (tester) => tester instanceof Node;
		
		/**
		 * Checks whether something is a function.
		 * @param {*} item
		 * @returns {!boolean}
		 */
		const isFunction = (item) => typeof item === 'function';
		
		/**
		 * Self-binds an object's methods to the object.
		 * @param {!object} target
		 */
		const applyBinds = (target) => {
			const methods = Object.getOwnPropertyNames(target).filter((key) => isFunction(target[key]));
			for (const method of methods) target[method] = target[method].bind(target);
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
			const getValidElement = (type) => {
				const element = document.createElement(type);
				if (element instanceof window.HTMLUnknownElement) return document.createElementNS(xmlns, type);
				return element;
			};
			/**
			 * @param {!string} key
			 * @returns {!boolean}
			 */
			const isEvent = (key) => key.slice(0, 2) === 'on' && key[2] === key[2].toUpperCase();
			/**
			 * @param {!string} name
			 * @returns {!string}
			 */
			const toEventName = (name) => name === 'doubleclick'
				? 'dblclick'
				: name;
			/**
			 * @param {!string} key
			 * @returns {!boolean}
			 */
			const isDataAttr = (key) => key.startsWith('data') && key.toLowerCase() !== key;
			/**
			 * @param {!string} key
			 * @returns {!string}
			 */
			const toDataAttr = (key) => key.replace(/([A-Z]{1,})/g, '-$1').toLowerCase();
			
			Object.assign(DOM, {
				/**
				 * A `document.createElement` helper function.
				 * @param {!string} type
				 * @param {?object} [props]
				 * @param {!any[]} children
				 * @returns {!DOMElement}
				 */
				create (type, props, ...children) {
					if (typeof type !== 'string') type = 'div';
					const e = getValidElement(type);
					if (typeOf(props) !== 'object' || !Object.keys(props).length) {
						if (children.length) e.append(...children);
						return e;
					}
					if (!Object.hasOwn(props, 'children') && children.length) {
						e.append(...children);
					}
					for (const key in props) {
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
								props[key] = props[key].split(' ');
							} // jshint ignore: line
							case 'classList': // eslint-disable-line no-fallthrough
							case 'classes': {
								if (!Array.isArray(props[key])) props[key] = [props[key]];
								e.classList.add(...props[key]);
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
								if (props[key].length) e.append(...props[key]);
								break;
							}
							case 'htmlFor': {
								e.setAttribute('for', props[key]);
								break;
							}
							default: {
								if (isEvent(key)) {
									const event = toEventName(key.slice(2).toLowerCase());
									if (Array.isArray(props[key]) && props[key].length) {
										const listeners = props[key].filter(isFunction);
										for (const listener of listeners) {
											e.addEventListener(event, listener);
										}
										break;
									}
									e.addEventListener(event, props[key]);
									break;
								}
								if (isDataAttr(key)) {
									const attr = toDataAttr(key);
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
				fragment (children = []) {
					const frag = new DocumentFragment();
					if (isNil(children)) return frag;
					if (!Array.isArray(children) || !children.length) return frag;
					frag.append(...children);
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
			/**
			 * Logging levels.
			 */
			const levels = /** @type {const} */ ([ // jshint ignore: line
				'log',
				'dir',
				'info',
				'warn',
				'debug',
				'error'
			]);

			/**
			 * @typedef LogLevel
			 * @type {typeof levels[number]}
			 */
			
			/**
			 * Provides label data for logging methods.
			 * @returns {!string[]}
			 */
			const getParts = () => [
				'%c[[%c  %s  %c::%c  %s  %c]]%c',
				'color: #8cde94;', // previously #a4e5ab
				'',
				'CommonJS',
				'color: #8cde94;',
				'',
				new Date().toLocaleString().replace(',', ' ~'),
				'color: #8cde94;',
				''
				// firefox is an embarrassment
				// '\x1b[92m[[\x1b[0m  \x1b[37m%s\x1b[0m  \x1b[92;1m::\x1b[0m  \x1b[37m%s\x1b[0m  \x1b[92m]]\x1b[0m',
			];
			// separators
			// ::, ⋙
			
			/**
			 * Fetches levels to be used for logging.
			 * @param {!LogLevel} level
			 * @returns {!LogLevel}
			 */
			const getLevel = (level) => levels.includes(level)
				? level
				: 'log';
			
			/**
			 * Creates log methods.
			 * @param {!LogLevel} level
			 * @returns {!VoidFunction}
			 */
			const makeLog = (level) => {
				const lvl = getLevel(level);
				return (...args) => {
					console.groupCollapsed(...getParts());
					console[lvl](...args);
					console.groupEnd();
				};
			};

			/**
			 * @param {!LogLevel} level
			 */
			const stagger = (level = 'log') => {
				const lvl = getLevel(level);
				const logs = [];
				return Object.freeze({
					push (...log) {
						logs.push(log);
					},
					flush () {
						logs.splice(0);
					},
					print () {
						console.groupCollapsed(...getParts());
						for (const log of logs) {
							console[lvl](...log);
						}
						console.groupEnd();
					}
				});
			};
			
			for (const level of levels) {
				Logger[level] = Object.freeze(makeLog(level));
				Logger[`_${level}`] = stagger(level);
			}
			
			applyBinds(Logger);
			Object.freeze(Logger);
		}
		
		__banners__: {
			const bannerItems = [
				document.querySelector('.wds-global-navigation__logo'),
				...document.querySelectorAll('.wds-global-navigation__link')
			];
			for (const item of bannerItems) {
				if (!item) continue;
				item.setAttribute('tabindex', -1);
			}
		}
		
		__buttons__: {
			if (fired.buttons) break __buttons__;
			const wdsButtons = document.querySelectorAll('.wiki-tools.wds-button-group, nav + div .wiki-tools');
			if (!wdsButtons.length) break __buttons__;
			/**
			 * @param {!HTMLElement} button
			 * @returns {!Node}
			 */
			const clone = (button) => button.cloneNode(true);
			const names = find(wdsButtons, (x) => x.firstElementChild.classList.contains('wds-is-secondary'));
			if (!names) break __buttons__;
			const wanted = 'wiki-tools__theme-switch';
			const found = find(names.children, (x) => x.classList.contains(wanted));
			if (!found) break __buttons__;
			const firstName = found.className;
			if (!firstName) break __buttons__;
			const buttons = [
				DOM.create('a', {
					className: firstName.replace(wanted, 'wiki-tools__user-js').trim(),
					text: 'JS',
					title: 'User JS',
					href: '/wiki/User:Arashiryuu0/common.js'
				}),
				DOM.create('a', {
					className: firstName.replace(wanted, 'wiki-tools__user-css').trim(),
					text: 'CSS',
					title: 'User CSS',
					href: '/wiki/User:Arashiryuu0/common.css'
				}),
				DOM.create('a', {
					className: firstName.replace(wanted, 'wiki-tools__random').trim(),
					text: '?',
					title: 'Random Page',
					href: '/wiki/Special:Random',
					dataTracking: 'explore-random'
				})
			];
			const children = DOM.fragment();
			/**
			 * @param {!HTMLElement} wds
			 */
			const handleWds = (wds) => {
				const cloned = buttons.map((btn) => {
					const c = clone(btn);
					if (wds.parentElement.id === 'community-navigation') {
						c.classList.replace('wds-is-secondary', 'wds-is-text');
					}
					return c;
				});
				children.append(...cloned);
				/**
				 * fix button positioning
				 * layout should be:
				 * search, discussions, recent changes, theme, my buttons, dropdown
				 */
				wds.append(children, wds.querySelector('.wds-dropdown'));
				const f = document.querySelector(`.${wanted}`);
				if (!f) return;
				f.remove();
			};
			for (const wds of wdsButtons) handleWds(wds);
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
			const asString = (value) => value.toString(16).padEnd(2, '0');
			/**
			 * @param {!number} value
			 * @returns {!boolean}
			 */
			const inRange = (value) => Number.isFinite(value) && value >= 0 && value <= 255;
			/**
			 * @param {!string} char
			 * @returns {!string}
			 */
			const hexMapper = (char) => char + char;
			Object.assign(ApexLaser, {
				/**
				 * @param {!number} [r]
				 * @param {!number} [g]
				 * @param {!number} [b]
				 * @returns {!number}
				 */
				fromRGB (r = 0, g = 0, b = 0) {
					const args = [r, g, b];
					if (!args.every(inRange)) throw new RangeError('RGB values must be a number between 0 and 255.');
					const strings = args.map(asString);
					const joined = strings.toReversed().join('');
					return parseInt(joined, 16);
				},
				/**
				 * @param {!string} hex
				 * @returns {!number}
				 */
				fromHex (hex) {
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
				toHex (base10num) {
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
				toRGB (base10num) {
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
			DOM,
			type: typeOf,
			isNil,
			isNode,
			getProp,
			debounce,
			throttle,
			ApexLaser,
			createPipeline
		});
		applyBinds(window.UCP.Utils);
		Object.freeze(window.UCP.Utils);
		
		mw.hook('dev.highlight').add((hljs) => {
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
			const pick = themes.at(-3);
			/**
			 * Disables my globally added codeblock theme to allow local themes to highlight properly.
			 */
			const disable = () => {
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
			const setTheme = (theme) => () => void hljs.useTheme(theme);
			const setter = setTheme(pick);
			/**
			 * Callback wrapper to be supplied to the `hljs.loadAllLanguages` promise success handler.
			 */
			const useTheme = () => void raf(setter);
			ref.current = raf(disable);
			hljs.loadAllLanguages().then(useTheme, Logger.error);
		});
		
		fired.loaded = true;
		Logger.log('Loaded!');
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
