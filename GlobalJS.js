/**
 * Testing out UCP global JS.
 * @namespace UCPGlobal
 */

/*
	jshint
	undef: true,
	noarg: true,
	devel: true,
	jquery: true,
	strict: true,
	eqeqeq: true,
	freeze: true,
	newcap: true,
	shadow: outer,
	browser: true,
	latedef: true,
	varstmt: true,
	multistr: true,
	laxbreak: true,
	quotmark: single,
	esversion: 11,
	singleGroups: true,
	futurehostile: true
*/

/*
	globals
	mw,
	Symbol,
	Promise,
	Temporal,
	requestIdleCallback
*/

'use strict';

window.CodeblockLinesConfig = {
	ready: false
};

__main__: {
	if (window.UCP && window.UCP.globalJS) break __main__;

	const raf = requestAnimationFrame;

	const slice = Function.call.bind(Array.prototype.slice);
	const toString = Function.call.bind(Object.prototype.toString);

	const pages = ['js', 'ts', 'cpp', 'css', 'json', 'javascript'];
	const extension = window.location.pathname.split('.').pop();

	const _Object = (value) => Object.create(
		Object.create(null, {
			[Symbol.toStringTag]: {
				enumerable: false,
				value
			}
		})
	);

	const css = (styles, ...vars) => String.raw(styles, ...vars).split(/\s+/g).join(' ').trim();

	const Logger = _Object('Logger');
	const Utils = _Object('Tools');

	const applyBinds = (n) => {
		const fns = Object.getOwnPropertyNames(n).filter((method) => typeof n[method] === 'function');
		for (const f of fns) n[f] = n[f].bind(n);
	};

	const debounce = (callback, delay, immediate) => {
		let t = 0;
		return function () {
			const context = this;
			const args = arguments;
			const later = () => {
				t = 0;
				if (!immediate) callback.apply(context, args);
			};
			const now = immediate && t === 0;
			clearTimeout(t);
			t = setTimeout(later, delay);
			if (now) callback.apply(context, args);
		};
	};

	const throttle = (callback, delay) => {
		let last = 0;
		return function () {
			const now = Date.now();
			if (now - last >= delay) {
				last = now;
				callback.apply(this, arguments);
			}
		};
	};

	__logger__: {
		const levels = /** @type {const} */ ([ // jshint ignore: line
			'log',
			'info',
			'warn',
			'debug',
			'error'
		]);
		const c = 'color: #8cde94;';
		const getParts = (name = 'console') => [
			'%c[[%c  %s  %c::%c  %s  %c]]%c',
			c, '',
			name,
			c, '',
			new Date().toLocaleString().replace(',', ' ~'),
			c, ''
			// goofy format because firefox is a disgrace
			// and doesn't support ansi codes
		];

		const getLevel = (level) => levels.includes(level)
			? level
			: 'log';

		const _log = (props) => {
			if (toString(props) !== '[object Object]') return null;
			const level = getLevel(props.type);
			return (...args) => {
				console.groupCollapsed(...getParts(level.toUpperCase()));
				for (const arg of args) {
					console[level]('%c~%c %o', c, '', arg);
				}
				console.groupEnd();
			};
		};

		for (const type of levels) {
			Logger[type] = _log({ type });
		}

		applyBinds(Logger);
		Object.freeze(Logger);
	}

	const isNil = (n) => n === undefined || n === null;

	const create = (type, props, ...children) => {
		if (typeof type !== 'string') type = 'div';
		const e = document.createElement(type);
		if (isNil(props)) {
			if (children.length) e.append(...children);
			return e;
		}
		if (!Object.hasOwn(props, 'children') && children.length) {
			e.append(...children);
		}
		const isEvent = (key) => key.slice(0, 2) === 'on' && key[2] === key[2].toUpperCase();
		const isDataAttr = (key) => key.startsWith('data') && key.toLowerCase() !== key;
		const normalize = (name) => name === 'doubleclick'
			? 'dblclick'
			: name;
		const normalizeDataAttr = (name) => name.replace(/([A-Z]){1}/g, '-$1').toLowerCase();
		const keys = Object.keys(props);
		for (const key of keys) {
			switch (key) {
				case 'text': {
					e.textContent = props[key];
					break;
				}
				case 'style': {
					if (typeof props[key] === 'string') {
						e.setAttribute(key, props[key]);
						break;
					}
					try {
						Object.assign(e[key], props[key]);
						break;
					} catch (fail) {
						Logger.error(fail);
					}
					break;
				}
				case 'htmlFor': {
					e.setAttribute('for', props[key]);
					break;
				}
				case 'className':
					props[key] = props[key].split(' '); // jshint ignore: line
				case 'classList':
				case 'classes': {
					if (!Array.isArray(props[key])) props[key] = [props[key]];
					e.classList.add(...props[key]);
					break;
				}
				case 'children': {
					if (!Array.isArray(props[key])) props[key] = [props[key]];
					e.append(...props[key]);
					break;
				}
				default: {
					if (isEvent(key)) {
						const event = normalize(key.slice(2).toLowerCase());
						e.addEventListener(event, props[key]);
						break;
					}
					if (isDataAttr(key)) {
						const attr = normalizeDataAttr(key);
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
	};

	const queryTree = (tree, query, options) => {
		if (isNil(options)) options = {
			walkable: null,
			ignore: []
		};

		if (typeof query === 'string') {
			if (Object.hasOwn(tree, query)) return tree[query];
		} else if (query(tree)) {
			return tree;
		}

		if (typeof tree !== 'object' || tree === null) return null;

		let ret = null;
		let length = 0;
		let counter = 0;

		if (Array.isArray(tree)) {
			for (counter = 0, length = tree.length; counter < length; counter++) {
				const value = tree[counter];
				ret = queryTree(value, query, options);
				if (!isNil(ret)) return ret;
			}
		} else {
			const walkable = options.walkable === null
				? Object.keys(tree)
				: options.walkable;
			for (counter = 0, length = walkable.length; counter < length; counter++) {
				const key = walkable[counter];
				if (!Object.hasOwn(tree, key) || options.ignore.includes(key)) continue;
				ret = queryTree(tree[key], query, options);
				if (!isNil(ret)) return ret;
			}
		}

		return ret;
	};

	const getFromHook = (hookName) => {
		if (typeof hookName !== 'string') return Promise.reject('Invalid hook name, hook names must be strings.');
		return new Promise((resolve) => {
			mw.hook(hookName).add(resolve);
		});
	};

	const getFromHooks = (list) => {
		if (!Array.isArray(list) || !list.length) return Promise.resolve([]);
		return Promise.all(list.map(getFromHook));
	};

	const run = () => {
		const myHook = mw.hook('window.ready');
		let preloads = 2;

		__hljs__: {
			if (window.hljs) break __hljs__;
			const urls = [
				{
					url: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.2.0/styles/atom-one-dark.min.css',
					type: 'text'
				},
				{
					url: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.2.0/highlight.min.js',
					type: 'script'
				}
			];
			const parse = (url, type) => () => {
				if (type === 'text') {
					const link = create('link', {
						href: url,
						rel: 'stylesheet'
					});
					document.head.appendChild(link);
				} else {
					mw.hook('ext.hljs').fire(window.hljs);
				}
				--preloads;
			};
			for (const { url, type } of urls) {
				$.get(url, void 0, $.noop, type).then(parse(url, type), Logger.error);
			}
		}

		/**
		 * Change source editor theme.
		 */
		__ace__: {
			if (window.dev && window.dev.CustomAce) break __ace__;

			if (!window.ace) {
				const modules = [
					'ext.codeEditor.ace',
					'ext.codeEditor.ace.modes'
				];
				mw.loader.using(modules, (req) => { // req === mw.loader.require
					modules.forEach(req);
				})
				.then(() => {
					const p = mw.config.get('wgExtensionAssetsPath') || '/extensions-ucp/mw143';
					window.ace.config.set('basePath', `${p}/CodeEditor/modules/lib/ace`);
				})
				.then(void 0, Logger.error);
			}

			if (!Object.hasOwn(window, 'CustomAce')) {
				window.CustomAce = {
					options: {
						theme: 'ace/theme/kanagawa',
						fontSize: 16,
						fontFamily: '"Berkeley Mono", "JetBrainsMono NFM", "CaskaydiaCovePL NF SemiLight", "Fira Code Retina", "Iosevka NFM"',
						enableLiveAutocompletion: false
					}
				};
			}

			const toDescriptor = (value, enumerable) => ({
				configurable: false,
				enumerable: Boolean(enumerable),
				writable: false,
				value: Object.freeze(value)
			});

			const isObject = (value) => toString(value) === '[object Object]';

			const getOptions = (userOpts) => {
				if (!isObject(userOpts)) return CustomAce.defaults;
				return Object.assign({}, CustomAce.defaults, userOpts);
			};

			const getDefines = (userDefs) => {
				if (!isObject(userDefs)) return CustomAce.defines;
				return Object.assign({}, CustomAce.defines, userDefs);
			};

			const getDisabledRules = (userDisabled) => {
				if (!Array.isArray(userDisabled)) return CustomAce.disabledRules;
				return userDisabled.filter((value) => typeof value === 'string');
			};

			const getConfig = (ca) => ({
				options: getOptions(ca.options),
				defines: getDefines(ca.defines),
				disabledRules: getDisabledRules(ca.disabledRules)
			});

			const CustomAce = Object.create( // jshint ignore: line
				Object.create(null, {
					[Symbol.toStringTag]: toDescriptor('CustomAce')
				})
			);

			const fn = (data) => (require, exports, module) => {
				const d = require('ace/lib/dom');
				const { isDark, cssText, cssClass } = data;
				Object.assign(exports, { isDark, cssText, cssClass });
				d.importCssString(cssText, cssClass);
			};

			const loadTheme = (ace, data) => void ace.define(`ace/theme/${data.cssClass.slice(4)}`, data.deps, data.fn(data));

			Object.defineProperties(CustomAce, {
				defaults: toDescriptor({
					wrap: 'off',
					theme: 'ace/theme/gruvbox',
					tabSize: 4,
					minLines: 10,
					fontSize: 14,
					showGutter: true,
					fontFamily: '"Monaco", "Menlo", "Consolas", "Ubuntu Mono", monospace',
					cursorStyle: 'ace',
					useSoftTabs: false,
					printMargin: false,
					newLineMode: 'unix',
					placeholder: '아이고',
					showInvisibles: false,
					showLineNumbers: true,
					showFoldWidgets: true,
					showPrintMargin: false,
					keyboardHandler: 'ace/keyboard/vscode',
					indentedSoftWrap: true,
					fixedWidthGutter: true,
					relativeLineNumbers: false,
					wrapBehavioursEnabled: true,
					navigateWithinSoftTabs: true,
					enableLiveAutocompletion: false, // ace has god awful suggestions
					autoScrollEditorIntoView: true
				}, true),
				disabledRules: toDescriptor([
					'ids',
					'important',
					'empty-rules',
					'regex-selectors',
					'fallback-colors',
					'known-properties',
					'adjoining-classes',
					'universal-selector',
					'order-alphabetical',
					'bulletproof-font-face',
					'unqualified-attributes',
					'overqualified-elements'
				], true),
				modes: toDescriptor({
					GO: 'ace/mode/golang',
					JSX: 'ace/mode/jsx',
					TSX: 'ace/mode/tsx',
					ZIG: 'ace/mode/zig',
					PHP: 'ace/mode/php',
					LUA: 'ace/mode/lua',
					CSS: 'ace/mode/css',
					TEXT: 'ace/mode/text',
					HTML: 'ace/mode/html',
					DIFF: 'ace/mode/diff',
					ODIN: 'ace/mode/odin',
					C_CPP: 'ace/mode/c_cpp',
					JAVASCRIPT: 'ace/mode/javascript',
					TYPESCRIPT: 'ace/mode/typescript'
				}, true),
				defines: toDescriptor({
					catppuccin: {
						deps: [
							'require',
							'exports',
							'module',
							'ace/lib/dom'
						],
						isDark: true,
						cssClass: 'ace_catppuccin',
						cssText: css`
							.ace_catppuccin {
							    color: #cdd6f4 !important;
							    background: #1e1e2e !important;
							    & :is(.ace_gutter-active-line, .ace_marker-layer .ace_active-line) {
							        background-color: rgba(0, 0, 0, 0.3);
							    }
							    & .ace_invisible {
							        color: #504945;
							    }
							    & .ace_marker-layer .ace_selection {
							        background: rgba(0, 0, 0, 0.6);
							    }
							    &.ace_multiselect .ace_selection.ace_start {
							        box-shadow: 0 0 3px 0px #002240;
							    }
							    & .ace_keyword {
							        color: #cba6f7;
							    }
							    & .ace_doc {
							        color: #f9e2af;
							        &.ace_lparen,
							        &.ace_rparen {
							            color: #585b70;
							        }
							    }
							    & .ace_comment {
							        color: #585b70;
							        &.ace_doc.ace_tag {
							            color: #cba6f7;
							        }
							    }
							    & :is(.ace_statement,
							    .ace_string) {
							        color: #a6e3a1;
							    }
							    & .ace_variable {
							        color: #cdd6f4;
							        &.ace_language {
							            color: #f9e2af;
							        }
							        &.ace_parameter.ace_doc {
							            color: #f38ba8;
							        }
							    }
							    & .ace_constant {
							        color: #fab387;
							        &:is(.ace_language, .ace_numeric) {
							            color: #fab387;
							        }
							    }
							    & .ace_support {
							        color: #f38ba8;
							        &.ace_function {
							            color: #cdd6f4;
							        }
							    }
							    & .ace_storage {
							        color: #cba6f7;
							    }
							    & :is(.ace_keyword.ace_operator,
							    .ace_punctuation.ace_operator) {
							        color: #94e2d5;
							    }
							    & .ace_marker-layer .ace_selected-word {
							        border-radius: 4px;
							        border: 8px solid #3f475d;
							    }
							    & .ace_print-margin {
							        width: 5px;
							        background: #3c3836;
							    }
							    & .ace_indent-guide {
							        background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNQUFD4z6Crq/sfAAuYAuYl+7lfAAAAAElFTkSuQmCC\") right repeat-y;
							        filter: invert(20%);
							    }
							}
						`,
						fn
					},
					kanagawa: {
						deps: [
							'require',
							'exports',
							'module',
							'ace/lib/dom'
						],
						isDark: true,
						cssClass: 'ace_kanagawa',
						cssText: css`
							.ace_kanagawa {
								color: #dcd7ba !important;
								background: #1f1f28 !important;
								display: block;
								padding: 0.5em;
								overflow-x: auto;

								& .ace_comment {
									color: #727169 !important;
									&.ace_tag {
										color: #957fb8 !important;
									}
								}
								& :is(.ace_keyword, .ace_storage, .ace_type) {
									color: #957fb8 !important;
								}
								&.ace_editor {
									& :is(.ace_paren, .ace_keyword.ace_operator) {
										color: #c0a36e !important;
									}
									& :is(.ace_doc:not(.ace_comment), .ace_variable.ace_language) {
										color: #7aa89f !important;
									}
									& .ace_variable.ace_parameter {
										color: #b8b4d0 !important;
									}
									& .ace_quasi:not(.ace_string) {
										color: #7fb4ca !important;
									}
								}
								& .ace_punctuation {
									color: #9cabca !important;
								}
								& .ace_string {
									color: #98bb6c !important;
								}
								& .ace_constant {
									color: #ffa066 !important;
									&.ace_numeric {
										color: #d27e99 !important;
									}
								}
							}
						`,
						fn
					},
					naysayer: {
						deps: [
							'require',
							'exports',
							'module',
							'ace/lib/dom'
						],
						isDark: true,
						cssClass: 'ace_naysayer',
						cssText: css`
							.ace_naysayer {
								color: #d1b897 !important;
								background: #062323 !important;

								& :is(.ace_gutter-active-line, .ace_marker-layer .ace_active-line) {
									background-color: rgba(0, 0, 0, 0.3);
								}
								& .ace_invisible {
									color: #504945;
								}
								& .ace_marker-layer .ace_selection {
									background: blue;
								}
								&.ace_multiselect .ace_selection.ace_start {
									box-shadow: 0 0 3px 0 black;
								}
								& :is(.ace_storage, .ace_keyword:not(.ace_operator), .ace_comment.ace_doc.ace_tag) {
									color: #fff !important;
								}
								& .ace_comment {
									color: #44b340 !important;
								}
								& .ace_variable.ace_language {
									color: #8cde94 !important;
								}
								& .ace_constant {
									&:is(.ace_language, .ace_numeric) {
										color: #7ad0c6 !important;
									}
								}
								& :is(.ace_regexp, .ace_string) {
									color: #2ec09c !important;
								}
								& :is(.ace_support, .ace_variable:not(.ace_language), .ace_support.ace_function, .ace_keyword.ace_operator, .ace_punctuation.ace_operator) {
									color: unset !important;
								}
								& .ace_marker-layer .ace_selected-word {
									border-radius: 4px;
									border: 8px solid #3f475d;
								}
								& .ace_print-margin {
									width: 5px;
									background: transparent;
								}
								& .ace_indent-guide {
									background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNQUFD4z6Crq/sfAAuYAuYl+7lfAAAAAElFTkSuQmCC\") right repeat-y;
									filter: invert(20%);
								}
							}
						`,
						fn
					}
				}, true)
			});

			mw.hook('codeEditor.configure').add((session) => {
				const target = document.querySelector('.ace_editor');
				if (!target) return;

				const { ace } = window;
				const { options, defines, disabledRules } = getConfig(window.CustomAce);

				const editor = ace.edit(target);
				CustomAce.editor = editor;
				if (Object.keys(defines).length) {
					for (const key in defines) {
						const data = defines[key];
						loadTheme(ace, data);
					}
				}
				raf(() => {
					editor.setOptions(options);
					if (!ace.config.$modes[CustomAce.modes.CSS]) return;
					session.$worker.call('setDisabledRules', [
						disabledRules.join('|')
					]);
				});
			});

			window.dev = Object.assign({}, window.dev, { CustomAce });
			mw.hook('dev.CustomAce').fire(CustomAce);
		}

		/**
		 * Codeblock theme buttons
		 */
		__themes__: {
			if (!pages.includes(extension)) break __themes__;

			const base = 'https://dev.fandom.com/wiki/MediaWiki:Highlight-js/styles/';
			const themes = [
				'atom-one-dark',
				'tomorrow-night',
				'solarized-dark',
				'monokai-sublime',
				'catppuccin-mocha',
				'gruvbox-dark',
				'tokyo-night',
				'naysayer',
				'ef-dream',
				'kanagawa',
				'dracula',
				'vs2015',
				'nord'
			];
			const buttons = [];
			const fs = create('fieldset', {
				className: 'codeblock-themes',
				children: [
					create('legend', {
						children: ['Theme Select']
					})
				]
			});
			const container = create('div');

			container.setAttribute('id', 'code-button-container');
			container.setAttribute('style', 'display: block; padding: 6px 0 0 0; text-align: center;');

			const handleLinks = (links, activeTheme) => {
				const found = links.find((link) => link.getAttribute('href').includes(activeTheme));

				for (const link of links) {
					if (link.getAttribute('disabled') !== null) continue;
					link.setAttribute('disabled', '');
				}

				if (!found) {
					const fresh = create('link', {
						href: `${base}${activeTheme}.css?action=raw&ctype=text/css`,
						rel: 'stylesheet'
					});
					document.head.appendChild(fresh);
					return;
				}

				found.removeAttribute('disabled');
			};

			const setTheme = (theme) => {
				const links = [
					...document.querySelectorAll(`link[href*="${base}"]`),
					...document.querySelectorAll('link[href*="highlight.js/10.2.0/styles/"]')
				];

				raf(() => handleLinks(links, theme));
			};

			const buttonClick = (button) => {
				const theme = button.getAttribute('data-theme');
				return () => {
					if (!theme) return;
					setTheme(theme);
					button.blur();
					if (Array.isArray(window.__blockCache)) {
						window.__blockCache.forEach(raf);
					}
				};
			};

			const addButtons = () => {
				if (buttons.length || document.contains(fs)) return;
				const target = document.getElementById('mw-clearyourcache');
				if (!target) return;
				themes.forEach((theme, idx) => {
					if (idx > 0 && idx % 5 === 0) {
						const n = create('hr', {
							style: {
								visibility: 'hidden',
								margin: '0'
							}
						});
						buttons.push(n);
					}
					const btn = create('button', { classes: ['wds-button'] }, theme);
					btn.setAttribute('data-theme', theme);
					btn.setAttribute('style', 'margin-right: 2px;');
					btn.addEventListener('click', buttonClick(btn));
					buttons.push(btn);
				});
				container.append(...buttons);
				fs.append(container);
				target.appendChild(fs);
			};

			mw.hook('wikipage.content').add(addButtons);
		}

		const ready = (toasts, lines) => {
			if (preloads > 0) return setTimeout(ready, 1000, toasts, lines);

			Object.assign(Utils, {
				css,
				pull: window.importArticles,
				lines,
				toasts,
				logger: Logger,
				debounce,
				throttle,
				queryTree
			});
			applyBinds(Utils);
			Object.assign(Utils.toasts, toasts);
			Object.freeze(Utils);
			myHook.fire(Utils);
		};

		myHook.add((utils) => {
			const uri = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.2.0/styles/atom-one-dark.min.css';
			const highlightTheme = document.head.querySelector(`link[href="${uri}"]`);
			const href = highlightTheme && highlightTheme.getAttribute('href');

			if (utils.logger) utils.logger.log('Tools:', utils);
			if (href) {
				raf(() => {
					const hrefN = href.replace(/atom-one-(light|dark)/, 'vs2015');
					highlightTheme.setAttribute('href', hrefN);
				});
			}

			window.UCP.tools = utils;
		});

		const useHljs = (hljs, lines) => {
			if (!hljs || !lines) return;

			const style = create('style', {
				id: '&selection_style',
				children: [
					css`
						::selection, .hljs-selection {
							background: var(--text, rgba(255, 255, 255, 0.1));
							color: var(--back, rgba(255, 255, 255, 1));
						}
					`
				]
			});

			if (!document.getElementById('&selection_style')) document.head.appendChild(style);

			const blockCache = [];

			const addSelectionHighlights = (element) => {
				const cache = {
					backgroundColor: '',
					color: ''
				};
				return () => {
					const ascertained = getComputedStyle(element);
					if (cache.backgroundColor !== ascertained.backgroundColor) {
						for (const key in cache) {
							cache[key] = ascertained[key];
						}
						element.style.setProperty('--text', cache.color);
						element.style.setProperty('--back', cache.backgroundColor);
					}
					const hls = element.querySelectorAll('[class^="hljs-"], .ace_line_group .ace_line span');
					raf(() => {
						for (const marker of hls) {
							const compu = getComputedStyle(marker);
							marker.style.setProperty('--text', compu.color);
							marker.style.setProperty('--back', cache.backgroundColor);
						}
					});
				};
			};

			const addIdentifier = (element) => () => {
				let lang = 'javascript';
				if (pages.includes(extension)) {
					lang = hljs.getLanguage(extension).name.toLowerCase();
				} else {
					const mwLang = slice(element.parentElement.classList)
						.find((string) => string.startsWith('mw-highlight-language-'));
					if (mwLang) lang = mwLang.split('-').pop();
				}
				if (lang.length === 0) return;
				element.classList.add(lang);
				element.setAttribute('data-lang', lang);
				element.style.setProperty('--attr', 'data-lang');
				raf(lines.process);
			};

			const synFix = (element) => () => {
				const name = element.parentElement.classList[1].split('-').pop();
				element.classList.replace('javascript', name);
				element.setAttribute('data-lang', name);
			};

			const _paint = (element) => () => {
				hljs.highlightBlock(element);
				raf(addIdentifier(element));
				const cb = addSelectionHighlights(element);
				blockCache.push(cb);
				raf(cb);
				raf(synFix(element));
			};

			const paint = (element) => void raf(_paint(element));

			const pres = document.querySelectorAll('.mw-highlight pre');
			for (const pre of pres) {
				paint(pre);
			}

			window.__blockCache = blockCache;
		};

		__assert__: {
			if (window.dev && window.dev.assert) break __assert__;
			/**
			 * @callback BehaviourFunction
			 * @param {!string} message
			 */

			/**
			 * @type {!BehaviourFunction}
			 */
			const _debug = (message) => {
				console.error('Assertion error: %s', message);
				debugger; // jshint ignore: line
			};

			/**
			 * @type {!BehaviourFunction}
			 */
			const _throw = (message) => {
				throw new Error(message);
			};

			/**
			 * @param {!BehaviourFunction} action Intended behaviour if assertion fails
			 */
			const behaviour = (action) => {
				/**
				 * @param {!boolean} assertion
				 * @param {!string} message
				 */
				return (assertion, message) => {
					if (!assertion) {
						action(message);
					}
				};
			};

			const assert = {
				/**
				 * Begins a debugger session if assertion fails
				 */
				debug: behaviour(_debug),
				/**
				 * Throws an error if assertion fails
				 * @throws {!Error}
				 */
				error: behaviour(_throw)
			};

			Object.freeze(assert);

			window.dev = window.dev || {};
			window.dev.assert = assert;

			mw.hook('dev.assert').fire(assert);
		}

		const hooks = [
			'ext.hljs',
			'dev.toasts',
			'dev.CodeblockLineNumbers'
		];
		getFromHooks(hooks).then((deps) => {
			const [hljs, toasts, lines] = deps;
			ready(toasts, lines);
			useHljs(hljs, lines);
		});
	};

	mw.hook('dev.preact').add((Preact) => {
		const {
			h,
			render,
			_hooks: {
				useRef,
				useMemo,
				useState,
				useEffect,
				useReducer,
				useCallback,
				useLayoutEffect
			},
			_preact: {
				options: {
					unmount
				}
			}
		} = Preact;

		const useInterval = (callback, delay) => { // jshint ignore: line
			const ref = useRef(callback);
			const tick = useCallback(() => {
				raf(ref.current);
			}, [ref.current]);

			useLayoutEffect(() => {
				ref.current = callback;
			}, [callback]);

			useEffect(() => {
				const id = setInterval(tick, delay);
				return () => {
					clearInterval(id);
				};
			}, [delay]);
		};

		const getClockState = () => {
			const lang = mw.user.options.get('language') || 'en-gb';
			return {
				day: Temporal.Now.instant().toLocaleString(lang, { weekday: 'long' }),
				time: Temporal.Now.plainTimeISO().toLocaleString(lang, { hour12: false })
			};
		};

		const Clock = () => {
			const [date, setDate] = useState(getClockState);
			const [hovered, setHovered] = useState(false);
			const update = useCallback(() => {
				setDate(getClockState);
			}, []);

			useInterval(update, 1000);

			return h('span', {
				key: 'ClockMain',
				className: 'clock',
				children: [
					h('span', {
						key: 'ClockDay',
						className: 'clock-day',
						children: date.day
					}),
					h('span', {
						key: 'ClockSeparator',
						className: 'clock-separator',
						children: String.fromCodePoint(160)
					}),
					h('span', {
						key: 'ClockTime',
						className: 'clock-time',
						children: date.time
					})
				],
				onMouseEnter (e) {
					if (hovered) return;
					e.target.classList.add('hovered');
					setHovered(() => true);
				},
				onMouseLeave (e) {
					if (!hovered) return;
					e.target.classList.remove('hovered');
					setHovered(() => false);
				},
				onClick () {
					location.href = location.href;
				}
			});
		};

		const Text = () => h(Preact.Fragment, {
			children: [
				h('span', {
					className: 'version-v',
					children: [
						'v'
					]
				}),
				h('span', {
					className: 'version-number',
					children: [
						mw.config.get('wgVersion')
					]
				})
			]
		});

		const regions = [
			'top-container',
			'local-navigation'
		];

		const selector = regions.map((region) => `.fandom-community-header__${region}`).join(' + ');

		const addClock = () => {
			if (document.getElementById('DisplayClock')) return;

			const timeRoot = create('div', {
				id: 'DisplayClock'
			});
			const target = document.querySelector(selector);

			render(h(Clock), timeRoot);
			target.appendChild(timeRoot);
		};

		const addText = () => {
			if (document.getElementById('mw-current-version')) return;

			const textRoot = create('div', {
				id: 'mw-current-version'
			});
			const target = document.querySelector(selector);

			render(h(Text), textRoot);
			target.append(textRoot);
		};

		addClock();
		addText();
	});

	window.UCP = Object.assign(_Object('GlobalJS'), window.UCP, {
		globalJS: true,
		version: '1.0.0'
	});

	window.importArticles(
		{
			type: 'script',
			articles: [
				'u:dev:MediaWiki:Toasts.js',
				'u:dev:MediaWiki:Preact.js',
				'u:dev:MediaWiki:View_Source/code.js',
				'u:dev:MediaWiki:CodeblockLineNumbers/code.js'
			]
		},
		{
			type: 'style',
			articles: [
				'u:dev:MediaWiki:CodeblockLineNumbers.css'
			]
		}
	);

	requestIdleCallback(run);
}

/*@end@*/