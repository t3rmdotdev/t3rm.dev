var WebLinkProvider = (function () {
    function WebLinkProvider(_terminal, _regex, _handler) {
        this._terminal = _terminal;
        this._regex = _regex;
        this._handler = _handler;
    }
    WebLinkProvider.prototype.provideLinks = function (y, callback) {
        callback(LinkComputer.computeLink(y, this._regex, this._terminal, this._handler));
    };
    return WebLinkProvider;
}());

var LinkComputer = (function () {
    function LinkComputer() {
    }
    LinkComputer.computeLink = function (y, regex, terminal, handler) {
        var rex = new RegExp(regex.source, (regex.flags || '') + 'g');
        var _a = LinkComputer._translateBufferLineToStringWithWrap(y - 1, false, terminal), line = _a[0], startLineIndex = _a[1];
        var match;
        var stringIndex = -1;
        var result = [];
        while ((match = rex.exec(line)) !== null) {
            var text = match[1];
            if (!text) {
                console.log('match found without corresponding matchIndex');
                break;
            }
            stringIndex = line.indexOf(text, stringIndex + 1);
            rex.lastIndex = stringIndex + text.length;
            if (stringIndex < 0) {
                break;
            }
            var endX = stringIndex + text.length;
            var endY = startLineIndex + 1;
            while (endX > terminal.cols) {
                endX -= terminal.cols;
                endY++;
            }
            var range = {
                start: {
                    x: stringIndex + 1,
                    y: startLineIndex + 1
                },
                end: {
                    x: endX,
                    y: endY
                }
            };
            result.push({ range: range, text: text, activate: handler });
        }
        return result;
    };
    LinkComputer._translateBufferLineToStringWithWrap = function (lineIndex, trimRight, terminal) {
        var lineString = '';
        var lineWrapsToNext;
        var prevLinesToWrap;
        do {
            var line = terminal.buffer.active.getLine(lineIndex);
            if (!line) {
                break;
            }
            if (line.isWrapped) {
                lineIndex--;
            }
            prevLinesToWrap = line.isWrapped;
        } while (prevLinesToWrap);
        var startLineIndex = lineIndex;
        do {
            var nextLine = terminal.buffer.active.getLine(lineIndex + 1);
            lineWrapsToNext = nextLine ? nextLine.isWrapped : false;
            var line = terminal.buffer.active.getLine(lineIndex);
            if (!line) {
                break;
            }
            lineString += line.translateToString(!lineWrapsToNext && trimRight).substring(0, terminal.cols);
            lineIndex++;
        } while (lineWrapsToNext);
        return [lineString, startLineIndex];
    };
    return LinkComputer;
}());

var protocolClause = '(https?:\\/\\/)';
var domainCharacterSet = '[\\da-z\\.-]+';
var negatedDomainCharacterSet = '[^\\da-z\\.-]+';
var domainBodyClause = '(' + domainCharacterSet + ')';
var tldClause = '([a-z\\.]{2,6})';
var ipClause = '((\\d{1,3}\\.){3}\\d{1,3})';
var localHostClause = '(localhost)';
var portClause = '(:\\d{1,5})';
var hostClause = '((' + domainBodyClause + '\\.' + tldClause + ')|' + ipClause + '|' + localHostClause + ')' + portClause + '?';
var pathCharacterSet = '(\\/[\\/\\w\\.\\-%~:+@]*)*([^:"\'\\s])';
var pathClause = '(' + pathCharacterSet + ')?';
var queryStringHashFragmentCharacterSet = '[0-9\\w\\[\\]\\(\\)\\/\\?\\!#@$%&\'*+,:;~\\=\\.\\-]*';
var queryStringClause = '(\\?' + queryStringHashFragmentCharacterSet + ')?';
var hashFragmentClause = '(#' + queryStringHashFragmentCharacterSet + ')?';
var negatedPathCharacterSet = '[^\\/\\w\\.\\-%]+';
var bodyClause = hostClause + pathClause + queryStringClause + hashFragmentClause;
var start = '(?:^|' + negatedDomainCharacterSet + ')(';
var end = ')($|' + negatedPathCharacterSet + ')';
var strictUrlRegex = new RegExp(start + protocolClause + bodyClause + end);
function handleLink(event, uri) {
    var newWindow = window.open();
    if (newWindow) {
        newWindow.opener = null;
        newWindow.location.href = uri;
    }
    else {
        console.warn('Opening link blocked as opener could not be cleared');
    }
}

var WebLinksAddon = (function () {
    function WebLinksAddon(_handler, _options, _useLinkProvider) {
        if (_handler === void 0) { _handler = handleLink; }
        if (_options === void 0) { _options = {}; }
        if (_useLinkProvider === void 0) { _useLinkProvider = false; }
        this._handler = _handler;
        this._options = _options;
        this._useLinkProvider = _useLinkProvider;
        this._options.matchIndex = 1;
    }
    WebLinksAddon.prototype.activate = function (terminal) {
        this._terminal = terminal;
        if (this._useLinkProvider && 'registerLinkProvider' in this._terminal) {
            this._linkProvider = this._terminal.registerLinkProvider(new WebLinkProvider.WebLinkProvider(this._terminal, strictUrlRegex, this._handler));
        }
        else {
            this._linkMatcherId = this._terminal.registerLinkMatcher(strictUrlRegex, this._handler, this._options);
        }
    };
    WebLinksAddon.prototype.dispose = function () {
        var _a;
        if (this._linkMatcherId !== undefined && this._terminal !== undefined) {
            this._terminal.deregisterLinkMatcher(this._linkMatcherId);
        }
        (_a = this._linkProvider) === null || _a === void 0 ? void 0 : _a.dispose();
    };
    return WebLinksAddon;
}());