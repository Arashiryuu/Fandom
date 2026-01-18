/**
 * Adds numbers to each line of code in a codeblock.
 * @name CodeblockLineNumbers
 * @author Arashiryuu0
 * @version 1.2.5
 * Last modified: 1768745144296
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
	esnext: true,
	browser: true,
	latedef: true,
	shadow: outer,
	varstmt: false,
	laxbreak: true,
	quotmark: single,
	singleGroups: true,
	futurehostile: true
*/

/*
	globals
	Symbol
*/

;((mw) => {
    'use strict';

    if (window.dev && window.dev.CodeblockLineNumbers) return;

	const classes = [
		'lineNumbers',
		'obs'
	];

    const codeblocks = [
        ['de1', 'hljs'],
        ['theme-solarized-light', 'theme-solarized-dark'],
        ['.mw-highlight pre', 'code pre', '.pi-data-value pre']
    ];

    const ourblocks = [...document.querySelectorAll('pre')];

    if (!ourblocks.length) return;

    window.importArticles({
        type: 'style',
        articles: ['u:dev:MediaWiki:CodeblockLineNumbers.css']
    });

    const noOl = (codeblock) => !codeblock.querySelector('ol');

    const mapLine = (line) => {
        if (!!line) return '<li>' + line + '</li>';
	};

    const addLines = (codeblock) => {
        codeblock.innerHTML = codeblock.innerHTML
            .split('\n')
            .map(mapLine)
            .join('');

        return codeblock;
    };

    const ourFilter = (codeblock) => {
        const hasId = () => codeblocks[1].includes(codeblock.getAttribute('id'));
        const hasClass = () => codeblocks[0].some((name) => codeblock.classList && codeblock.classList.contains(name));
        const ucpBlock = () => codeblocks[2].some((selector) => codeblock.matches(selector));

        if (codeblock.tagName === 'PRE' && codeblock.parentElement.tagName !== 'PRE') {
            return hasId() || hasClass() || ucpBlock();
        }

        return false;
    };

	const combineFilters = (...filters) => (codeblock) => filters.every((filter) => filter(codeblock));

	const wrapInner = (parent, wrapper) => {
        if (typeof wrapper === 'string') wrapper = document.createElement(wrapper);

        parent.appendChild(wrapper);

        while (parent.firstChild !== wrapper) wrapper.appendChild(parent.firstChild);
    };

	const isCommentStart = (child) => child.textContent.trim().startsWith('/*');

	const isInlineComment = (child) => {
        const blockClasses = ['coMULTI', 'hljs-comment'];
        const hasClass = () => {
            const a = Boolean(child.className) && blockClasses.includes(child.className);
            const b = Boolean(child.firstElementChild) && blockClasses.includes(child.firstElementChild.className);
            return a || b;
        };
        const starts = child.textContent.trim().startsWith('/*');
        const ends = child.textContent.trim().endsWith('*/');
        return (hasClass() && starts && ends) || starts && ends; // jshint ignore: line
    };

	const getEndIndex = (i) => (child, ind) => {
        const greater = ind > i;
        const trimmed = child.textContent.trim();
        const ends = trimmed[0] === '*' && trimmed.endsWith('*/');

        return Boolean(greater && ends);
    };

	const mapSlicedChildren = (child) => child.cloneNode(true);

	const createUL = () => {
        var ul = document.createElement('ul');
        ul.classList.add('no-list');
        return ul;
    };

	const remove = (t) => void t.parentElement.removeChild(t);

	const filterSliced = (group) => (children, index) => {
		const a = index >= group.start || index <= group.end;
		const b = children.tagName !== 'UL';
		return a && b;
    };

	const addCommentGroup = (codeblock, group) => {
        const pe = codeblock.parentElement;
        const cn = pe.className === 'de1' || pe.getAttribute('id');

        group.parent.classList.add(cn ? 'coMULTI' : 'hljs-comment');
		for (const child of group.children) {
            group.parent.appendChild(child);
        }

        const end = codeblock.children[group.end];

        if (codeblock.children.length - 1 === group.end) {
            codeblock.appendChild(group.parent);
        } else if (end) {
            end.insertAdjacentElement('afterend', group.parent);
        }

        const fn = filterSliced(group);
        const children = [...codeblock.children];
        const filtered = children.slice(group.start, group.end + 1).filter(fn);

        for (const fil of filtered) {
            remove(fil);
        }
    };

	const parseComments = (codeblock) => {
        const groups = [];
        const children = [...codeblock.children];

        for (let i = 0, len = children.length; i < len; i++) {
            let start = 0;
			let end = 0;
			const child = children[i];

            if (!isCommentStart(child) || isInlineComment(child)) continue;

            start = i;
            end = children.findIndex(getEndIndex(start));
            const sliced = children.slice(start, end + 1).map(mapSlicedChildren);

            groups.push({
                start: start,
                end: end,
                parent: createUL(),
                children: sliced
            });
        }

        if (!groups.length) return;

        for (let i = groups.length - 1, len = 0; i >= len; i--) {
            addCommentGroup(codeblock, groups[i]);
        }
    };

	const match = (block, selector) => block.matches(selector);

	const processCodeblock = (block) => {
        if (block.querySelector('ol.lineNumbers')) return;

        const ol = document.createElement('ol');
        const matched = match(block, codeblocks[2][1]);
        const ignore = match(block, codeblocks[2][2]);

        if (ignore) return;

        ol.classList.add(...classes);
        if (!block.parentElement.classList.contains('mw-highlight-lines')) ol.classList.remove('obs');
        /**
         * weird edge-case, <syntaxhighlight line> element but doesn't render any linenos?
         * see Luxon for reference {@link https://sky-children-of-the-light.fandom.com/wiki/MediaWiki:Luxon.js}
         */
        if (block.matches('.mw-highlight-lines pre') && !block.querySelector('.linenos')) ol.classList.remove('obs');
        wrapInner(addLines(block), ol);

        /** remove empty trailing <li>s */
        if (!ol.lastElementChild.childNodes.length) ol.removeChild(ol.lastElementChild);

        if (matched || !mw.user.getRights) parseComments(ol);
    };

	const processCodeblocks = () => {
        const filtered = ourblocks.filter(combineFilters(noOl, ourFilter));
        const len = filtered.length;

        if (!len) return;

        for (const f of filtered) processCodeblock(f);
    };

	const defaults = {
        ready: true
    };

	const obj = {
        processBlock: processCodeblock,
        process: processCodeblocks,
        settings: Object.assign({}, defaults, window.CodeblockLinesConfig)
    };

	Object.defineProperty(obj, Symbol.toStringTag, {
        configurable: false,
        writable: false,
        value: 'CodeblockLineNumbers'
    });

	Object.freeze(obj);

	window.dev = window.dev || {};
    window.dev.CodeblockLineNumbers = obj;

	const fire = () => {
        const lines = window.dev.CodeblockLineNumbers;
        const settings = lines.settings;

        if (typeof settings.delay === 'number' && !Number.isNaN(settings.delay) && settings.delay >= 0) {
            setTimeout(lines.process, settings.delay);
        } else if (typeof settings.loadAction === 'function') {
            settings.loadAction(lines);
        } else if (settings.ready) {
            lines.process();
        }

        mw.hook('dev.CodeblockLineNumbers').fire(lines);
    };

	const ready = () => {
        if (document.readyState !== 'complete') return setTimeout(ready, 1000);
        Promise.resolve().then(fire, console.error);
    };

	window.requestIdleCallback(ready);
})(window.mediaWiki);

/*@end@*/