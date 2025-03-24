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
	requestIdleCallback
*/
 
'use strict';
 
window.CodeblockLinesConfig = {
	ready: false
};
 
__main__: {
	if (window.UCP && window.UCP.globalJS) break __main__;
	
	const raf = requestAnimationFrame;
	
	const slice = Function.call.bind(Function.call, Array.prototype.slice);
	const toString = Function.call.bind(Function.call, Object.prototype.toString);
	
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
		const levels = /** @type {const} */ ([
			'log',
			'info',
			'warn',
			'debug',
			'error'
		]);
		const c = 'color: #8cde94;';
		const getParts = (name = 'console') => [
			'%c[[%c  %s  %c::%c  %s  %c]]%c',
			c,
			'',
			name,
			c,
			'',
			new Date().toLocaleString().replace(',', ' ~'),
			c,
			''
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
		
		for (const level of levels) {
			Logger[level] = _log({ type: level });
		}
		
		applyBinds(Logger);
		Object.freeze(Logger);
	}
	
	let preloads = 2;
	
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
					e.classList.add.apply(e.classList, props[key]);
					break;
				}
				case 'children': {
					if (!Array.isArray(props[key])) props[key] = [props[key]];
					e.append.apply(e, props[key]);
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
		} else if (!isNil(query(tree))) {
			return tree;
		}
		
		if (typeof tree !== 'object' || tree === null) return null;
		
		let ret = null;
		if (Array.isArray(tree)) {
			for (let counter = 0, length = tree.length; counter < length; counter++) {
				const value = tree[counter];
				ret = queryTree(value, query, options);
				if (!isNil(ret)) return ret;
			}
		} else {
			const walkable = options.walkable === null
				? Object.keys(tree)
				: options.walkable;
			for (let counter = 0, length = walkable.length; counter < length; counter++) {
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
	
	const getHookValues = (list) => {
		if (!Array.isArray(list) || !list.length) return [];
		return Promise.all(list.map(getFromHook));
	};
	
	const run = () => {
		const myHook = mw.hook('window.ready');
		
		__hljs__: {
			if (window.hljs) break __hljs__;
			[
				'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.2.0/styles/atom-one-dark.min.css',
				'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.2.0/highlight.min.js'
			].forEach((url, index) => {
				const isCss = index === 0;
				const type = isCss
					? 'text'
					: 'script';
					
				$.get(url, void 0, $.noop, type).then(() => {
					if (isCss) {
						const link = create('link', {
							href: url,
							rel: 'stylesheet'
						});
						document.head.appendChild(link);
					} else {
						mw.hook('ext.hljs').fire(window.hljs);
					}
					--preloads.current;
				}, Logger.error);
			});
		}
		
		/**
		 * Change source editor theme.
		 */
		__ace__: {
			// const isAcePage = ['edit', 'submit'].includes(mw.config.get('wgAction'));
			// if (!isAcePage || !pages.includes(extension)) break __ace__;
			
			const loadTheme = (ace, data) => void ace.define('ace/theme/' + data.cssClass.slice(4), data.deps, data.fn.bind(data));
			
			if (!window.ace) {
				const modules = [
					'ext.codeEditor.ace',
					'ext.codeEditor.ace.modes'
				];
				mw.loader.using(modules, (req) => { // req === mw.loader.require
					modules.forEach(req);
				})
				.then(() => {
					const p = mw.config.get('wgExtensionAssetsPath') || '/extensions-ucp/mw139';
					window.ace.config.set('basePath', p + '/CodeEditor/modules/ace');
				})
				.then(void 0, Logger.error);
			}
			
			if (!Object.hasOwn(window, 'CustomAce')) {
				window.CustomAce = {
					options: {
						theme: 'ace/theme/kanagawa',
						fontSize: 14,
						fontFamily: '"Berkeley Mono", "JetBrainsMono NFM", "CaskaydiaCovePL NF SemiLight", "Fira Code Retina", "Iosevka NFM"',
						enableLiveAutocompletion: false
					}
				};
			}
			/*mw.hook('codeEditor.configure').add(function (session) {
				const editor = window.ace.edit(document.querySelector('.ace_editor'));
				raf(function () {
					editor.setOptions({
						wrap: 'off',
						// ambiance, gruvbox, tomorrow_night, tomorrow_night_bright
						theme: 'ace/theme/gruvbox',
						tabSize: 4,
						fontSize: 13,
						minLines: 10,
						showGutter: true,
						fontFamily: '"JetBrainsMono NF", "CaskaydiaCove NFP", "Fira Code Retina", "Iosevka NFM", "Ubuntu Mono", "Consolas", monospace',
						useSoftTabs: false,
						printMargin: false,
						newLineMode: 'unix',
						placeholder: '아이고',
						showInvisibles: false,
						showLineNumbers: true,
						showFoldWidgets: true,
						showPrintMargin: false,
						// ace, vim, emacs, sublime, vscode
						keyboardHandler: 'ace/keyboard/vscode',
						indentedSoftWrap: true,
						fixedWidthGutter: true,
						// true for vim mode, false
						relativeLineNumbers: false,
						wrapBehavioursEnabled: true,
						navigateWithinSoftTabs: true,
						enableLiveAutocompletion: true,
						autoScrollEditorIntoView: true
					});
					
					if (window.ace.config.$modes['ace/mode/css']) {
						const rules = [
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
						];
						session.$worker.call('setDisabledRules', [
							rules.join('|')
						]);
					}
				});
			});*/
			;(() => {
				if (window.dev && window.dev.CustomAce) return;
				
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
				
				var CustomAce = Object.create( // jshint ignore: line
					Object.create(null, {
						[Symbol.toStringTag]: toDescriptor('CustomAce')
					})
				);
				
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
						placeholder: 'Wherefore art thou, Code?',
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
						php: 'ace/mode/php',
						lua: 'ace/mode/lua',
						css: 'ace/mode/css',
						text: 'ace/mode/text',
						diff: 'ace/mode/diff',
						javascript: 'ace/mode/javascript'
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
							cssText: [
								'.ace_catppuccin',
								'.ace_gutter-active-line',
								'{background-color:',
								'rgba(0,',
								'0,',
								'0,',
								'0.3);}.ace_catppuccin',
								'{color:',
								'#cdd6f4',
								'!important;background:',
								'#1e1e2e',
								'!important;}.ace_catppuccin',
								'.ace_invisible',
								'{color:',
								'#504945;}.ace_catppuccin',
								'.ace_marker-layer',
								'.ace_selection',
								'{background:',
								'rgba(0,',
								'0,',
								'0,',
								'0.6);}.ace_catppuccin.ace_multiselect',
								'.ace_selection.ace_start',
								'{box-shadow:',
								'0',
								'0',
								'3px',
								'0px',
								'#002240;}.ace_catppuccin',
								'.ace_keyword',
								'{color:',
								'#cba6f7;}.ace_catppuccin',
								'.ace_comment',
								'{color:',
								'#585b70;}.ace_catppuccin',
								'.ace-statement',
								'{color:',
								'#a6e3a1;}.ace_catppuccin',
								'.ace_variable',
								'{color:',
								'#cdd6f4;}.ace_catppuccin',
								'.ace_variable.ace_language',
								'{color:',
								'#f9e2af;}.ace_catppuccin',
								'.ace_constant',
								'{color:',
								'#fab387;}.ace_catppuccin',
								'.ace_constant.ace_language',
								'{color:',
								'#fab387;}.ace_catppuccin',
								'.ace_constant.ace_numeric',
								'{color:',
								'#fab387;}.ace_catppuccin',
								'.ace_string',
								'{color:',
								'#a6e3a1;}.ace_catppuccin',
								'.ace_support',
								'{color:',
								'#f38ba8;}.ace_catppuccin',
								'.ace_support.ace_function',
								'{color:',
								'#cdd6f4;}.ace_catppuccin',
								'.ace_storage',
								'{color:',
								'#cba6f7;}.ace_catppuccin',
								'.ace_keyword.ace_operator',
								'{color:',
								'#94e2d5;}.ace_catppuccin',
								'.ace_punctuation.ace_operator',
								'{color:',
								'#94e2d5;}.ace_catppuccin',
								'.ace_marker-layer',
								'.ace_active-line',
								'{background:',
								'rgba(0,',
								'0,',
								'0,',
								'0.3);}.ace_catppuccin',
								'.ace_marker-layer',
								'.ace_selected-word',
								'{border-radius:',
								'4px;border:',
								'8px',
								'solid',
								'#3f475d;}.ace_catppuccin',
								'.ace_print-margin',
								'{width:',
								'5px;background:',
								'#3C3836;}.ace_catppuccin',
								'.ace_indent-guide',
								'{background:',
								'url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNQUFD4z6Crq/sfAAuYAuYl+7lfAAAAAElFTkSuQmCC\")',
								'right',
								'repeat-y;filter:',
								'invert(20%);}'
							].join(' '),
							fn (require, exports, module) {
								const d = require('ace/lib/dom');
								exports.isDark = this.isDark;
								exports.cssText = this.cssText;
								exports.cssClass = this.cssClass;
								d.importCssString(this.cssText, this.cssClass);
							}
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
							cssText: [
								'.ace_kanagawa',
								'{',
								'color:',
								'#dcd7ba',
								'!important;',
								'background:',
								'#1f1f28',
								'!important;',
								'display:',
								'block;',
								'padding:',
								'0.5em;',
								'overflow-x:',
								'auto;',
								'}',
								'.ace_kanagawa',
								'.ace_comment',
								'{',
								'color:',
								'#727169',
								'!important;',
								'}',
								'.ace_kanagawa',
								':is(.ace_keyword,',
								'.ace_storage,',
								'.ace_type,',
								'.ace_comment.ace_tag)',
								'{',
								'color:',
								'#957fb8',
								'!important;',
								'}',
								'.ace_editor.ace_kanagawa',
								':is(.ace_paren,',
								'.ace_keyword.ace_operator)',
								'{',
								'color:',
								'#c0a36e',
								'!important;',
								'}',
								'.ace_kanagawa',
								':is(.ace_punctuation)',
								'{',
								'color:',
								'#9cabca',
								'!important;',
								'}',
								'.ace_kanagawa',
								'.ace_string',
								'{',
								'color:',
								'#98bb6c',
								'!important;',
								'}',
								'.ace_editor.ace_kanagawa',
								':is(.ace_doc:not(.ace_comment),',
								'.ace_variable.ace_language)',
								'{',
								'color:',
								'#7aa89f',
								'!important;',
								'}',
								'.ace_editor.ace_kanagawa',
								':is(.ace_variable.ace_parameter)',
								'{',
								'color:',
								'#b8b4d0',
								'!important;',
								'}',
								'.ace_kanagawa',
								'.ace_constant.ace_numeric',
								'{',
								'color:',
								'#d27e99',
								'!important;',
								'}',
								'.ace_kanagawa',
								'.ace_constant',
								'{',
								'color:',
								'#ffa066',
								'!important;',
								'}',
								'.ace_editor.ace_kanagawa',
								'.ace_quasi:not(.ace_string)',
								'{',
								'color:',
								'#7fb4ca',
								'!important;',
								'}'
							].join(' '),
							fn (require, exports, module) {
								const d = require('ace/lib/dom');
								exports.isDark = this.isDark;
								exports.cssText = this.cssText;
								exports.cssClass = this.cssClass;
								d.importCssString(this.cssText, this.cssClass);
							}
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
							cssText: [
							  '/**',
							  '*',
							  'Naysayer',
							  'ace',
							  'editor',
							  'theme',
							  '*/',
							  '.ace_naysayer',
							  '.ace_gutter-active-line',
							  '{',
							  'background-color:',
							  'rgba(0,',
							  '0,',
							  '0,',
							  '0.3);',
							  '}',
							  '.ace_naysayer',
							  '{',
							  'color:',
							  '#d1b897',
							  '!important;',
							  'background:',
							  '#062626',
							  '!important;',
							  '}',
							  '.ace_naysayer',
							  '.ace_invisible',
							  '{',
							  'color:',
							  '#504945;',
							  '}',
							  '.ace_naysayer',
							  '.ace_marker-layer',
							  '.ace_selection',
							  '{',
							  'background:',
							  'blue;',
							  '}',
							  '.ace_naysayer.ace_multiselect',
							  '.ace_selection.ace_start',
							  '{',
							  'box-shadow:',
							  '0',
							  '0',
							  '3px',
							  '0px',
							  '#000;',
							  '}',
							  '.ace_naysayer',
							  '.ace_comment.ace_doc.ace_tag,',
							  '.ace_naysayer',
							  '.ace_storage,',
							  '.ace_naysayer',
							  '.ace_keyword',
							  '{',
							  'color:',
							  '#fff',
							  '!important;',
							  '}',
							  '.ace_naysayer',
							  '.ace_comment',
							  '{',
							  'color:',
							  '#44b340',
							  '!important;',
							  '}',
							  '.ace_naysayer',
							  '.ace_variable.ace_language',
							  '{',
							  'color:',
							  '#8cde94',
							  '!important;',
							  '}',
							  '.ace_naysayer',
							  '.ace_constant.ace_language,',
							  '.ace_naysayer',
							  '.ace_constant.ace_numeric',
							  '{',
							  'color:',
							  '#7ad0c6',
							  '!important;',
							  '}',
							  '.ace_naysayer',
							  '.ace_regexp,',
							  '.ace_naysayer',
							  '.ace_string',
							  '{',
							  'color:',
							  '#2ec09c',
							  '!important;',
							  '}',
							  '.ace_naysayer',
							  '.ace_support,',
							  '.ace_naysayer',
							  '.ace_variable,',
							  '.ace_naysayer',
							  '.ace_keyword.ace_operator,',
							  '.ace_naysayer',
							  '.ace_support.ace_function,',
							  '.ace_naysayer',
							  '.ace_punctuation.ace_operator',
							  '{',
							  'color:',
							  'unset',
							  '!important;',
							  '}',
							  '.ace_naysayer',
							  '.ace_marker-layer',
							  '.ace_active-line',
							  '{',
							  'background:',
							  'rgba(0,',
							  '0,',
							  '0,',
							  '0.3);',
							  '}',
							  '.ace_naysayer',
							  '.ace_marker-layer',
							  '.ace_selected-word',
							  '{',
							  'border-radius:',
							  '4px;',
							  'border:',
							  '8px',
							  'solid',
							  '#3f475d;',
							  '}',
							  '.ace_naysayer',
							  '.ace_print-margin',
							  '{',
							  'width:',
							  '5px;',
							  'background:',
							  'transparent;',
							  '}',
							  '.ace_naysayer',
							  '.ace_indent-guide',
							  '{',
							  'background:',
							  'url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNQUFD4z6Crq/sfAAuYAuYl+7lfAAAAAElFTkSuQmCC\")',
							  'right',
							  'repeat-y;',
							  'filter:',
							  'invert(20%);',
							  '}',
							  '/*@end@*/'
							].join(' '),
							fn (require, exports, module) {
								const d = require('ace/lib/dom');
								exports.isDark = this.isDark;
								exports.cssText = this.cssText;
								exports.cssClass = this.cssClass;
								d.importCssString(this.cssText, this.cssClass);
							}
						}
					}, true)
				});
				
				mw.hook('codeEditor.configure').add((session) => {
					const target = document.querySelector('.ace_editor');
					if (!target) return;
					
					const ace = window.ace;
					const options = getOptions(window.CustomAce.options);
					const defines = getDefines(window.CustomAce.defines);
					const disabledRules = getDisabledRules(window.CustomAce.disabledRules);
					
					const editor = ace.edit(target);
					if (Object.keys(defines).length) {
						for (const key in defines) {
							const data = defines[key];
							loadTheme(ace, data);
						}
					}
					requestAnimationFrame(() => {
						editor.setOptions(options);
						if (!ace.config.$modes[CustomAce.modes.css]) return;
						session.$worker.call('setDisabledRules', [
							disabledRules.join('|')
						]);
					});
				});
				
				window.dev = window.dev || {};
				window.dev.CustomAce = CustomAce;
				
				mw.hook('dev.CustomAce').fire(CustomAce);
			})();
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
				'kanagawa',
				'dracula',
				'vs2015',
				'nord'
			];
			const buttons = [];
			const container = create('div');
			
			container.setAttribute('id', 'code-button-container');
			container.setAttribute('style', 'display: block; padding: 5px 0 10px 0; text-align: center;');
			
			const handleLinks = (links, activeTheme) => {
				const found = links.find((link) => link.getAttribute('href').includes(activeTheme));
				
				for (const link of links) {
					if (link.getAttribute('disabled') !== null) continue;
					link.setAttribute('disabled', '');
				}
				
				if (!found) {
					const fresh = create('link', {
						href: base + activeTheme + '.css?action=raw&ctype=text/css',
						rel: 'stylesheet'
					});
					document.head.appendChild(fresh);
					return;
				}
				
				found.removeAttribute('disabled');
			};
				
			const setTheme = (theme) => {
				const links = [
					...document.querySelectorAll('link[href*="' + base + '"]'),
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
				if (buttons.length || document.contains(container)) return;
				const target = document.getElementById('mw-clearyourcache');
				if (!target) return;
				themes.forEach((theme, idx) => {
					if (idx === 5) {
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
				container.append.apply(container, buttons);
				target.appendChild(container);
			};
			
			mw.hook('wikipage.content').add(addButtons);
		}
		
		const ready = (toasts, lines) => {
			if (preloads.current > 0) return setTimeout(ready, 1000, toasts, lines);
			
			Object.assign(Utils, {
				'pull': window.importArticles,
				'lines': lines,
				'logger': Logger,
				'toasts': toasts,
				'debounce': debounce,
				'throttle': throttle,
				'queryTree': queryTree,
			});
			applyBinds(Utils);
			Object.assign(Utils.toasts, toasts);
			Object.freeze(Utils);
			myHook.fire(Utils);
		};
		
		myHook.add((utils) => {
			const uri = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.2.0/styles/atom-one-dark.min.css';
			const highlightTheme = document.head.querySelector('link[href="' + uri + '"]');
			const href = highlightTheme && highlightTheme.getAttribute('href');
				
			// if (utils.lines) utils.lines.process();
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
				id: '__selection_style__',
				textContent: [
					'::selection, .hljs-selection {',
					'background: var(--text, rgba(255, 255, 255, 0.1));',
					'color: var(--back, rgba(255, 255, 255, 1));',
					'}'
				].join(' ')
			});
			
			if (!document.getElementById('__selection_style__')) document.head.appendChild(style);
			
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
			
			const addIdentifier = (element) => {
				return () => {
					let lang = 'javascript';
					if (pages.includes(extension)) {
						lang = hljs.getLanguage(extension).name.toLowerCase();
					} else {
						const mwLang = slice(element.parentElement.classList).find((string) => {
							return string.startsWith('mw-highlight-language-');
						});
						if (mwLang) lang = mwLang.split('-').pop();
					}
					element.classList.add(lang);
					element.setAttribute('data-lang', lang);
					element.style.setProperty('--attr', 'data-lang');
					raf(lines.process);
				};
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
		
		const hookList = [
			'ext.hljs',
			'dev.toasts',
			'dev.CodeblockLineNumbers'
		];
		getHookValues(hookList).then((deps) => {
			const lines = deps.pop();
			ready(deps[1], lines);
			useHljs(deps[0], lines);
		});
	};
	
	mw.hook('dev.preact').add((Preact) => {
		const {
			h,
			render
		} = Preact;
		const {
			useRef,
			useMemo,
			useState,
			useEffect,
			useReducer,
			useCallback,
			useLayoutEffect
		} = Preact._hooks;
		const { unmount } = Preact._preact.options;
		
		const useInterval = (callback, delay) => { // jshint ignore: line
			const ref = useRef(callback);
			const tick = useCallback(() => {
				raf(ref.current);
			}, []);
			
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
			const date = new Date();
			const lang = mw.user.options.get('language') || 'en-gb';
			return {
				day: date.toLocaleDateString(lang, { weekday: 'long' }),
				time: date.toLocaleTimeString(lang, { hour12: false })
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
		
		const Text = () => h('span', {
			className: 'version-text',
			children: [
				'v',
				mw.config.get('wgVersion')
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
	
	window.UCP = window.UCP || {};
	window.UCP.globalJS = Object.assign(_Object('GlobalJS'), { version: '1.0.0' });
	
	window.importArticles.apply(null, [
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
	]);
	
	requestIdleCallback(run);
}
	
/*@end@*/
