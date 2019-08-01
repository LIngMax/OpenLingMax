
//压缩css
function CSSencode(code) 
{ 
  code = code.replace(/\n/ig,''); 
  code = code.replace(/(\s){2,}/ig,'$1'); 
  code = code.replace(/\t/ig,''); 
  code = code.replace(/\n\}/ig,'\}'); 
  code = code.replace(/\n\{\s*/ig,'\{'); 
  code = code.replace(/(\S)\s*\}/ig,'$1\}'); 
  code = code.replace(/(\S)\s*\{/ig,'$1\{'); 
  code = code.replace(/\{\s*(\S)/ig,'\{$1'); 
  return code; 
}

//美化css
function CSSdecode(code) 
{ 
  code = code.replace(/(\s){2,}/ig,'$1'); 
  code = code.replace(/(\S)\s*\{/ig,'$1 {'); 
  code = code.replace(/\*\/(.[^\}\{]*)}/ig,'\*\/\n$1}'); 
  code = code.replace(/\/\*/ig,'\n\/\*'); 
  code = code.replace(/;\s*(\S)/ig,';\n\t$1'); 
  code = code.replace(/\}\s*(\S)/ig,'\}\n$1'); 
  code = code.replace(/\n\s*\}/ig,'\n\}'); 
  code = code.replace(/\{\s*(\S)/ig,'\{\n\t$1'); 
  code = code.replace(/(\S)\s*\*\//ig,'$1\*\/'); 
  code = code.replace(/\*\/\s*([^\}\{]\S)/ig,'\*\/\n\t$1'); 
  code = code.replace(/(\S)\}/ig,'$1\n\}'); 
  code = code.replace(/(\n){2,}/ig,'\n'); 
  code = code.replace(/:/ig,': '); 
  code = code.replace(/  /ig,' '); 
  return code; 
} 


/**
 * css美化
 * @param style 
 * @param opt 
 */
function cssbeautify(style, opt) {

    var options, index = 0, length = style.length, blocks, formatted = '',
        ch, ch2, str, state, State, depth, quote, comment,
        openbracesuffix = true,
        autosemicolon = false,
        trimRight;

    options = arguments.length > 1 ? opt : {};
    if (typeof options.indent === 'undefined') {
        options.indent = '    ';
    }
    if (typeof options.openbrace === 'string') {
        openbracesuffix = (options.openbrace === 'end-of-line');
    }
    if (typeof options.autosemicolon === 'boolean') {
        autosemicolon = options.autosemicolon;
    }

    function isWhitespace(c) {
        return (c === ' ') || (c === '\n') || (c === '\t') || (c === '\r') || (c === '\f');
    }

    function isQuote(c) {
        return (c === '\'') || (c === '"');
    }

    // FIXME: handle Unicode characters
    function isName(c) {
        return (ch >= 'a' && ch <= 'z') ||
            (ch >= 'A' && ch <= 'Z') ||
            (ch >= '0' && ch <= '9') ||
            '-_*.:#[]'.indexOf(c) >= 0;
    }

    function appendIndent() {
        var i;
        for (i = depth; i > 0; i -= 1) {
            formatted += options.indent;
        }
    }

    function openBlock() {
        formatted = trimRight(formatted);
        if (openbracesuffix) {
            formatted += ' {';
        } else {
            formatted += '\n';
            appendIndent();
            formatted += '{';
        }
        if (ch2 !== '\n') {
            formatted += '\n';
        }
        depth += 1;
    }

    function closeBlock() {
        var last;
        depth -= 1;
        formatted = trimRight(formatted);

        if (formatted.length > 0 && autosemicolon) {
            last = formatted.charAt(formatted.length - 1);
            if (last !== ';' && last !== '{') {
                formatted += ';';
            }
        }

        formatted += '\n';
        appendIndent();
        formatted += '}';
        blocks.push(formatted);
        formatted = '';
    }

    if (String.prototype.trimRight) {
        trimRight = function (s) {
            return s.trimRight();
        };
    } else {
        // old Internet Explorer
        trimRight = function (s) {
            return s.replace(/\s+$/, '');
        };
    }

    State = {
        Start: 0,
        AtRule: 1,
        Block: 2,
        Selector: 3,
        Ruleset: 4,
        Property: 5,
        Separator: 6,
        Expression: 7,
        URL: 8
    };

    depth = 0;
    state = State.Start;
    comment = false;
    blocks = [];

    // We want to deal with LF (\n) only
    style = style.replace(/\r\n/g, '\n');

    while (index < length) {
        ch = style.charAt(index);
        ch2 = style.charAt(index + 1);
        index += 1;

        // Inside a string literal?
        if (isQuote(quote)) {
            formatted += ch;
            if (ch === quote) {
                quote = null;
            }
            if (ch === '\\' && ch2 === quote) {
                // Don't treat escaped character as the closing quote
                formatted += ch2;
                index += 1;
            }
            continue;
        }

        // Starting a string literal?
        if (isQuote(ch)) {
            formatted += ch;
            quote = ch;
            continue;
        }

        // Comment
        if (comment) {
            formatted += ch;
            if (ch === '*' && ch2 === '/') {
                comment = false;
                formatted += ch2;
                index += 1;
            }
            continue;
        }
        if (ch === '/' && ch2 === '*') {
            comment = true;
            formatted += ch;
            formatted += ch2;
            index += 1;
            continue;
        }

        if (state === State.Start) {

            if (blocks.length === 0) {
                if (isWhitespace(ch) && formatted.length === 0) {
                    continue;
                }
            }

            // Copy white spaces and control characters
            if (ch <= ' ' || ch.charCodeAt(0) >= 128) {
                state = State.Start;
                formatted += ch;
                continue;
            }

            // Selector or at-rule
            if (isName(ch) || (ch === '@')) {

                // Clear trailing whitespaces and linefeeds.
                str = trimRight(formatted);

                if (str.length === 0) {
                    // If we have empty string after removing all the trailing
                    // spaces, that means we are right after a block.
                    // Ensure a blank line as the separator.
                    if (blocks.length > 0) {
                        formatted = '\n\n';
                    }
                } else {
                    // After finishing a ruleset or directive statement,
                    // there should be one blank line.
                    if (str.charAt(str.length - 1) === '}' ||
                            str.charAt(str.length - 1) === ';') {

                        formatted = str + '\n\n';
                    } else {
                        // After block comment, keep all the linefeeds but
                        // start from the first column (remove whitespaces prefix).
                        while (true) {
                            ch2 = formatted.charAt(formatted.length - 1);
                            if (ch2 !== ' ' && ch2.charCodeAt(0) !== 9) {
                                break;
                            }
                            formatted = formatted.substr(0, formatted.length - 1);
                        }
                    }
                }
                formatted += ch;
                state = (ch === '@') ? State.AtRule : State.Selector;
                continue;
            }
        }

        if (state === State.AtRule) {

            // ';' terminates a statement.
            if (ch === ';') {
                formatted += ch;
                state = State.Start;
                continue;
            }

            // '{' starts a block
            if (ch === '{') {
                str = trimRight(formatted);
                openBlock();
                state = (str === '@font-face') ? State.Ruleset : State.Block;
                continue;
            }

            formatted += ch;
            continue;
        }

        if (state === State.Block) {

            // Selector
            if (isName(ch)) {

                // Clear trailing whitespaces and linefeeds.
                str = trimRight(formatted);

                if (str.length === 0) {
                    // If we have empty string after removing all the trailing
                    // spaces, that means we are right after a block.
                    // Ensure a blank line as the separator.
                    if (blocks.length > 0) {
                        formatted = '\n\n';
                    }
                } else {
                    // Insert blank line if necessary.
                    if (str.charAt(str.length - 1) === '}') {
                        formatted = str + '\n\n';
                    } else {
                        // After block comment, keep all the linefeeds but
                        // start from the first column (remove whitespaces prefix).
                        while (true) {
                            ch2 = formatted.charAt(formatted.length - 1);
                            if (ch2 !== ' ' && ch2.charCodeAt(0) !== 9) {
                                break;
                            }
                            formatted = formatted.substr(0, formatted.length - 1);
                        }
                    }
                }

                appendIndent();
                formatted += ch;
                state = State.Selector;
                continue;
            }

            // '}' resets the state.
            if (ch === '}') {
                closeBlock();
                state = State.Start;
                continue;
            }

            formatted += ch;
            continue;
        }

        if (state === State.Selector) {

            // '{' starts the ruleset.
            if (ch === '{') {
                openBlock();
                state = State.Ruleset;
                continue;
            }

            // '}' resets the state.
            if (ch === '}') {
                closeBlock();
                state = State.Start;
                continue;
            }

            formatted += ch;
            continue;
        }

        if (state === State.Ruleset) {

            // '}' finishes the ruleset.
            if (ch === '}') {
                closeBlock();
                state = State.Start;
                if (depth > 0) {
                    state = State.Block;
                }
                continue;
            }

            // Make sure there is no blank line or trailing spaces inbetween
            if (ch === '\n') {
                formatted = trimRight(formatted);
                formatted += '\n';
                continue;
            }

            // property name
            if (!isWhitespace(ch)) {
                formatted = trimRight(formatted);
                formatted += '\n';
                appendIndent();
                formatted += ch;
                state = State.Property;
                continue;
            }
            formatted += ch;
            continue;
        }

        if (state === State.Property) {

            // ':' concludes the property.
            if (ch === ':') {
                formatted = trimRight(formatted);
                formatted += ': ';
                state = State.Expression;
                if (isWhitespace(ch2)) {
                    state = State.Separator;
                }
                continue;
            }

            // '}' finishes the ruleset.
            if (ch === '}') {
                closeBlock();
                state = State.Start;
                if (depth > 0) {
                    state = State.Block;
                }
                continue;
            }

            formatted += ch;
            continue;
        }

        if (state === State.Separator) {

            // Non-whitespace starts the expression.
            if (!isWhitespace(ch)) {
                formatted += ch;
                state = State.Expression;
                continue;
            }

            // Anticipate string literal.
            if (isQuote(ch2)) {
                state = State.Expression;
            }

            continue;
        }

        if (state === State.Expression) {

            // '}' finishes the ruleset.
            if (ch === '}') {
                closeBlock();
                state = State.Start;
                if (depth > 0) {
                    state = State.Block;
                }
                continue;
            }

            // ';' completes the declaration.
            if (ch === ';') {
                formatted = trimRight(formatted);
                formatted += ';\n';
                state = State.Ruleset;
                continue;
            }

            formatted += ch;

            if (ch === '(') {
                if (formatted.charAt(formatted.length - 2) === 'l' &&
                        formatted.charAt(formatted.length - 3) === 'r' &&
                        formatted.charAt(formatted.length - 4) === 'u') {

                    // URL starts with '(' and closes with ')'.
                    state = State.URL;
                    continue;
                }
            }

            continue;
        }

        if (state === State.URL) {


            // ')' finishes the URL (only if it is not escaped).
            if (ch === ')' && formatted.charAt(formatted.length - 1 !== '\\')) {
                formatted += ch;
                state = State.Expression;
                continue;
            }
        }

        // The default action is to copy the character (to prevent
        // infinite loop).
        formatted += ch;
    }

    formatted = blocks.join('') + formatted;

    return formatted;
}


/**
 * js美化
 * @param js_source_text 
 * @param indent_size 
 * @param indent_character 
 * @param indent_level 
 */
function js_beautify(js_source_text, indent_size, indent_character, indent_level)
{

    var input, output, token_text, last_type, last_text, last_word, current_mode, modes, indent_string;
    var whitespace, wordchar, punct, parser_pos, line_starters, in_case;
    var prefix, token_type, do_block_just_closed, var_line, var_line_tainted;



    function trim_output()
    {
        while (output.length && (output[output.length - 1] === ' ' || output[output.length - 1] === indent_string)) {
            output.pop();
        }
    }

    function print_newline(ignore_repeated)
    {
        ignore_repeated = typeof ignore_repeated === 'undefined' ? true: ignore_repeated;
        
        trim_output();

        if (!output.length) {
            return; // no newline on start of file
        }

        if (output[output.length - 1] !== "\n" || !ignore_repeated) {
            output.push("\n");
        }
        for (var i = 0; i < indent_level; i++) {
            output.push(indent_string);
        }
    }



    function print_space()
    {
        var last_output = output.length ? output[output.length - 1] : ' ';
        if (last_output !== ' ' && last_output !== '\n' && last_output !== indent_string) { // prevent occassional duplicate space
            output.push(' ');
        }
    }


    function print_token()
    {
        output.push(token_text);
    }

    function indent()
    {
        indent_level++;
    }


    function unindent()
    {
        if (indent_level) {
            indent_level--;
        }
    }


    function remove_indent()
    {
        if (output.length && output[output.length - 1] === indent_string) {
            output.pop();
        }
    }


    function set_mode(mode)
    {
        modes.push(current_mode);
        current_mode = mode;
    }


    function restore_mode()
    {
        do_block_just_closed = current_mode === 'DO_BLOCK';
        current_mode = modes.pop();
    }


    function in_array(what, arr)
    {
        for (var i = 0; i < arr.length; i++)
        {
            if (arr[i] === what) {
                return true;
            }
        }
        return false;
    }



    function get_next_token()
    {
        var n_newlines = 0;
        var c = '';

        do {
            if (parser_pos >= input.length) {
                return ['', 'TK_EOF'];
            }
            c = input.charAt(parser_pos);

            parser_pos += 1;
            if (c === "\n") {
                n_newlines += 1;
            }
        }
        while (in_array(c, whitespace));

        if (n_newlines > 1) {
            for (var i = 0; i < 2; i++) {
                print_newline(i === 0);
            }
        }
        var wanted_newline = (n_newlines === 1);


        if (in_array(c, wordchar)) {
            if (parser_pos < input.length) {
                while (in_array(input.charAt(parser_pos), wordchar)) {
                    c += input.charAt(parser_pos);
                    parser_pos += 1;
                    if (parser_pos === input.length) {
                        break;
                    }
                }
            }

            // small and surprisingly unugly hack for 1E-10 representation
            if (parser_pos !== input.length && c.match(/^[0-9]+[Ee]$/) && input.charAt(parser_pos) === '-') {
                parser_pos += 1;

                var t = get_next_token(parser_pos);
                c += '-' + t[0];
                return [c, 'TK_WORD'];
            }

            if (c === 'in') { // hack for 'in' operator
                return [c, 'TK_OPERATOR'];
            }
            return [c, 'TK_WORD'];
        }
        
        if (c === '(' || c === '[') {
            return [c, 'TK_START_EXPR'];
        }

        if (c === ')' || c === ']') {
            return [c, 'TK_END_EXPR'];
        }

        if (c === '{') {
            return [c, 'TK_START_BLOCK'];
        }

        if (c === '}') {
            return [c, 'TK_END_BLOCK'];
        }

        if (c === ';') {
            return [c, 'TK_END_COMMAND'];
        }

        if (c === '/') {
            var comment = '';
            // peek for comment /* ... */
            if (input.charAt(parser_pos) === '*') {
                parser_pos += 1;
                if (parser_pos < input.length) {
                    while (! (input.charAt(parser_pos) === '*' && input.charAt(parser_pos + 1) && input.charAt(parser_pos + 1) === '/') && parser_pos < input.length) {
                        comment += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos >= input.length) {
                            break;
                        }
                    }
                }
                parser_pos += 2;
                return ['/*' + comment + '*/', 'TK_BLOCK_COMMENT'];
            }
            // peek for comment // ...
            if (input.charAt(parser_pos) === '/') {
                comment = c;
                while (input.charAt(parser_pos) !== "\x0d" && input.charAt(parser_pos) !== "\x0a") {
                    comment += input.charAt(parser_pos);
                    parser_pos += 1;
                    if (parser_pos >= input.length) {
                        break;
                    }
                }
                parser_pos += 1;
                if (wanted_newline) {
                    print_newline();
                }
                return [comment, 'TK_COMMENT'];
            }

        }

        if (c === "'" || // string
        c === '"' || // string
        (c === '/' &&
        ((last_type === 'TK_WORD' && last_text === 'return') || (last_type === 'TK_START_EXPR' || last_type === 'TK_END_BLOCK' || last_type === 'TK_OPERATOR' || last_type === 'TK_EOF' || last_type === 'TK_END_COMMAND')))) { // regexp
            var sep = c;
            var esc = false;
            c = '';

            if (parser_pos < input.length) {

                while (esc || input.charAt(parser_pos) !== sep) {
                    c += input.charAt(parser_pos);
                    if (!esc) {
                        esc = input.charAt(parser_pos) === '\\';
                    } else {
                        esc = false;
                    }
                    parser_pos += 1;
                    if (parser_pos >= input.length) {
                        break;
                    }
                }

            }

            parser_pos += 1;
            if (last_type === 'TK_END_COMMAND') {
                print_newline();
            }
            return [sep + c + sep, 'TK_STRING'];
        }

        if (in_array(c, punct)) {
            while (parser_pos < input.length && in_array(c + input.charAt(parser_pos), punct)) {
                c += input.charAt(parser_pos);
                parser_pos += 1;
                if (parser_pos >= input.length) {
                    break;
                }
            }
            return [c, 'TK_OPERATOR'];
        }

        return [c, 'TK_UNKNOWN'];
    }


    //----------------------------------

    indent_character = indent_character || ' ';
    indent_size = indent_size || 4;

    indent_string = '';
    while (indent_size--) {
        indent_string += indent_character;
    }

    input = js_source_text;

    last_word = ''; // last 'TK_WORD' passed
    last_type = 'TK_START_EXPR'; // last token type
    last_text = ''; // last token text
    output = [];

    do_block_just_closed = false;
    var_line = false;
    var_line_tainted = false;

    whitespace = "\n\r\t ".split('');
    wordchar = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$'.split('');
    punct = '+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! !! , : ? ^ ^= |='.split(' ');

    // words which should always start on new line.
    line_starters = 'continue,try,throw,return,var,if,switch,case,default,for,while,break,function'.split(',');

    // states showing if we are currently in expression (i.e. "if" case) - 'EXPRESSION', or in usual block (like, procedure), 'BLOCK'.
    // some formatting depends on that.
    current_mode = 'BLOCK';
    modes = [current_mode];

    indent_level = indent_level || 0;
    parser_pos = 0; // parser position
    in_case = false; // flag for parser that case/default has been processed, and next colon needs special attention
    while (true) {
        var t = get_next_token(parser_pos);
        token_text = t[0];
        token_type = t[1];
        if (token_type === 'TK_EOF') {
            break;
        }

        switch (token_type) {

        case 'TK_START_EXPR':
            var_line = false;
            set_mode('EXPRESSION');
            if (last_type === 'TK_END_EXPR' || last_type === 'TK_START_EXPR') {
                // do nothing on (( and )( and ][ and ]( ..
            } else if (last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') {
                print_space();
            } else if (in_array(last_word, line_starters) && last_word !== 'function') {
                print_space();
            }
            print_token();
            break;

        case 'TK_END_EXPR':
            print_token();
            restore_mode();
            break;

        case 'TK_START_BLOCK':
            
            if (last_word === 'do') {
                set_mode('DO_BLOCK');
            } else {
                set_mode('BLOCK');
            }
            if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
                if (last_type === 'TK_START_BLOCK') {
                    print_newline();
                } else {
                    print_space();
                }
            }
            print_token();
            indent();
            break;

        case 'TK_END_BLOCK':
            if (last_type === 'TK_START_BLOCK') {
                // nothing
                trim_output();
                unindent();
            } else {
                unindent();
                print_newline();
            }
            print_token();
            restore_mode();
            break;

        case 'TK_WORD':

            if (do_block_just_closed) {
                print_space();
                print_token();
                print_space();
                break;
            }

            if (token_text === 'case' || token_text === 'default') {
                if (last_text === ':') {
                    // switch cases following one another
                    remove_indent();
                } else {
                    // case statement starts in the same line where switch
                    unindent();
                    print_newline();
                    indent();
                }
                print_token();
                in_case = true;
                break;
            }


            prefix = 'NONE';
            if (last_type === 'TK_END_BLOCK') {
                if (!in_array(token_text.toLowerCase(), ['else', 'catch', 'finally'])) {
                    prefix = 'NEWLINE';
                } else {
                    prefix = 'SPACE';
                    print_space();
                }
            } else if (last_type === 'TK_END_COMMAND' && (current_mode === 'BLOCK' || current_mode === 'DO_BLOCK')) {
                prefix = 'NEWLINE';
            } else if (last_type === 'TK_END_COMMAND' && current_mode === 'EXPRESSION') {
                prefix = 'SPACE';
            } else if (last_type === 'TK_WORD') {
                prefix = 'SPACE';
            } else if (last_type === 'TK_START_BLOCK') {
                prefix = 'NEWLINE';
            } else if (last_type === 'TK_END_EXPR') {
                print_space();
                prefix = 'NEWLINE';
            }

            if (last_type !== 'TK_END_BLOCK' && in_array(token_text.toLowerCase(), ['else', 'catch', 'finally'])) {
                print_newline();
            } else if (in_array(token_text, line_starters) || prefix === 'NEWLINE') {
                if (last_text === 'else') {
                    // no need to force newline on else break
                    print_space();
                } else if ((last_type === 'TK_START_EXPR' || last_text === '=') && token_text === 'function') {
                    // no need to force newline on 'function': (function
                    // DONOTHING
                } else if (last_type === 'TK_WORD' && (last_text === 'return' || last_text === 'throw')) {
                    // no newline between 'return nnn'
                    print_space();
                } else if (last_type !== 'TK_END_EXPR') {
                    if ((last_type !== 'TK_START_EXPR' || token_text !== 'var') && last_text !== ':') {
                        // no need to force newline on 'var': for (var x = 0...)
                        if (token_text === 'if' && last_type === 'TK_WORD' && last_word === 'else') {
                            // no newline for } else if {
                            print_space();
                        } else {
                            print_newline();
                        }
                    }
                } else {
                    if (in_array(token_text, line_starters) && last_text !== ')') {
                        print_newline();
                    }
                }
            } else if (prefix === 'SPACE') {
                print_space();
            }
            print_token();
            last_word = token_text;

            if (token_text === 'var') {
                var_line = true;
                var_line_tainted = false;
            }

            break;

        case 'TK_END_COMMAND':

            print_token();
            var_line = false;
            break;

        case 'TK_STRING':

            if (last_type === 'TK_START_BLOCK' || last_type === 'TK_END_BLOCK') {
                print_newline();
            } else if (last_type === 'TK_WORD') {
                print_space();
            }
            print_token();
            break;

        case 'TK_OPERATOR':

            var start_delim = true;
            var end_delim = true;
            if (var_line && token_text !== ',') {
                var_line_tainted = true;
                if (token_text === ':') {
                    var_line = false;
                }
            }

            if (token_text === ':' && in_case) {
                print_token(); // colon really asks for separate treatment
                print_newline();
                break;
            }

            in_case = false;

            if (token_text === ',') {
                if (var_line) {
                    if (var_line_tainted) {
                        print_token();
                        print_newline();
                        var_line_tainted = false;
                    } else {
                        print_token();
                        print_space();
                    }
                } else if (last_type === 'TK_END_BLOCK') {
                    print_token();
                    print_newline();
                } else {
                    if (current_mode === 'BLOCK') {
                        print_token();
                        print_newline();
                    } else {
                        // EXPR od DO_BLOCK
                        print_token();
                        print_space();
                    }
                }
                break;
            } else if (token_text === '--' || token_text === '++') { // unary operators special case
                if (last_text === ';') {
                    // space for (;; ++i)
                    start_delim = true;
                    end_delim = false;
                } else {
                    start_delim = false;
                    end_delim = false;
                }
            } else if (token_text === '!' && last_type === 'TK_START_EXPR') {
                // special case handling: if (!a)
                start_delim = false;
                end_delim = false;
            } else if (last_type === 'TK_OPERATOR') {
                start_delim = false;
                end_delim = false;
            } else if (last_type === 'TK_END_EXPR') {
                start_delim = true;
                end_delim = true;
            } else if (token_text === '.') {
                // decimal digits or object.property
                start_delim = false;
                end_delim = false;

            } else if (token_text === ':') {
                // zz: xx
                // can't differentiate ternary op, so for now it's a ? b: c; without space before colon
                if (last_text.match(/^\d+$/)) {
                    // a little help for ternary a ? 1 : 0;
                    start_delim = true;
                } else {
                    start_delim = false;
                }
            }
            if (start_delim) {
                print_space();
            }

            print_token();

            if (end_delim) {
                print_space();
            }
            break;

        case 'TK_BLOCK_COMMENT':

            print_newline();
            print_token();
            print_newline();
            break;

        case 'TK_COMMENT':

            // print_newline();
            print_space();
            print_token();
            print_newline();
            break;

        case 'TK_UNKNOWN':
            print_token();
            break;
        }

        last_type = token_type;
        last_text = token_text;
    }

    return output.join('');

}


/**
 * 美化html旧版 会卡死
 * @param html_source 
 * @param indent_size 
 * @param indent_character 
 * @param max_char 
 */
function style_html(html_source, indent_size, indent_character, max_char) {
//Wrapper function to invoke all the necessary constructors and deal with the output.
    
    var Parser, multi_parser;
    
    function Parser() {
    
    this.pos = 0; //Parser position
    this.token = '';
    this.current_mode = 'CONTENT'; //reflects the current Parser mode: TAG/CONTENT
    this.tags = { //An object to hold tags, their position, and their parent-tags, initiated with default values
        parent: 'parent1',
        parentcount: 1,
        parent1: ''
    };
    this.tag_type = '';
    this.token_text = this.last_token = this.last_text = this.token_type = '';

    
    this.Utils = { //Uilities made available to the various functions
        whitespace: "\n\r\t ".split(''),
        single_token: 'br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed'.split(','), //all the single tags for HTML
        extra_liners: 'head,body,/html'.split(','), //for tags that need a line of whitespace before them
        in_array: function (what, arr) {
        for (var i=0; i<arr.length; i++) {
            if (what === arr[i]) {
            return true;
            }
        }
        return false;
        }
    }
    
    this.get_content = function () { //function to capture regular content between tags
        
        var char = '';
        var content = [];
        var space = false; //if a space is needed
        while (this.input.charAt(this.pos) !== '<') {
        if (this.pos >= this.input.length) {
            return content.length?content.join(''):['', 'TK_EOF'];
        }
        
        char = this.input.charAt(this.pos);
        this.pos++;
        this.line_char_count++;
        
        
        if (this.Utils.in_array(char, this.Utils.whitespace)) {
            if (content.length) {
            space = true;
            }
            this.line_char_count--;
            continue; //don't want to insert unnecessary space
        }
        else if (space) {
            if (this.line_char_count >= this.max_char) { //insert a line when the max_char is reached
            content.push('\n');
            for (var i=0; i<this.indent_level; i++) {
                content.push(this.indent_string);
            }
            this.line_char_count = 0;
            }
            else{
            content.push(' ');
            this.line_char_count++;
            }
            space = false;
        }
        content.push(char); //letter at-a-time (or string) inserted to an array
        }
        return content.length?content.join(''):'';
    }
        
    this.get_script = function () { //get the full content of a script to pass to js_beautify
        
        var char = '';
        var content = [];
        var reg_match = new RegExp('\<\/script' + '\>', 'igm');
        reg_match.lastIndex = this.pos;
        var reg_array = reg_match.exec(this.input);
        var end_script = reg_array?reg_array.index:this.input.length; //absolute end of script
        while(this.pos < end_script) { //get everything in between the script tags
        if (this.pos >= this.input.length) {
            return content.length?content.join(''):['', 'TK_EOF'];
        }
        
        char = this.input.charAt(this.pos);
        this.pos++;
        
        
        content.push(char);
        }
        return content.length?content.join(''):''; //we might not have any content at all
    }
    
    this.record_tag = function (tag){ //function to record a tag and its parent in this.tags Object
        if (this.tags[tag + 'count']) { //check for the existence of this tag type
        this.tags[tag + 'count']++;
        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
        }
        else { //otherwise initialize this tag type
        this.tags[tag + 'count'] = 1;
        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
        }
        this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)
        this.tags.parent = tag + this.tags[tag + 'count']; //and make this the current parent (i.e. in the case of a div 'div1')
    }
    
    this.retrieve_tag = function (tag) { //function to retrieve the opening tag to the corresponding closer
        if (this.tags[tag + 'count']) { //if the openener is not in the Object we ignore it
        var temp_parent = this.tags.parent; //check to see if it's a closable tag.
        while (temp_parent) { //till we reach '' (the initial value);
            if (tag + this.tags[tag + 'count'] === temp_parent) { //if this is it use it
            break;
            }
            temp_parent = this.tags[temp_parent + 'parent']; //otherwise keep on climbing up the DOM Tree
        }
        if (temp_parent) { //if we caught something
            this.indent_level = this.tags[tag + this.tags[tag + 'count']]; //set the indent_level accordingly
            this.tags.parent = this.tags[temp_parent + 'parent']; //and set the current parent
        }
        delete this.tags[tag + this.tags[tag + 'count'] + 'parent']; //delete the closed tags parent reference...
        delete this.tags[tag + this.tags[tag + 'count']]; //...and the tag itself
        if (this.tags[tag + 'count'] == 1) {
            delete this.tags[tag + 'count'];
        }
        else {
            this.tags[tag + 'count']--;
        }
        }
    }
        
    this.get_tag = function () { //function to get a full tag and parse its type
        var char = '';
        var content = [];
        var space = false;

        do {
        if (this.pos >= this.input.length) {
            return content.length?content.join(''):['', 'TK_EOF'];
        }
        
        char = this.input.charAt(this.pos);
        this.pos++;
        this.line_char_count++;
        
        if (this.Utils.in_array(char, this.Utils.whitespace)) { //don't want to insert unnecessary space
            space = true;
            this.line_char_count--;
            continue;
        }
        
        if (char === "'" || char === '"') {
            if (!content[1] || content[1] !== '!') { //if we're in a comment strings don't get treated specially
            char += this.get_unformatted(char);
            space = true;
            }
        }
        
        if (char === '=') { //no space before =
            space = false;
        }
        
        if (content.length && content[content.length-1] !== '=' && char !== '>'
            && space) { //no space after = or before >
            if (this.line_char_count >= this.max_char) {
            this.print_newline(false, content);
            this.line_char_count = 0;
            }
            else {
            content.push(' ');
            this.line_char_count++;
            }
            space = false;
        }
        content.push(char); //inserts character at-a-time (or string)
        } while (char !== '>');
        
        var tag_complete = content.join('');
        var tag_index;
        if (tag_complete.indexOf(' ') != -1) { //if there's whitespace, thats where the tag name ends
        tag_index = tag_complete.indexOf(' ');
        }
        else { //otherwise go with the tag ending
        tag_index = tag_complete.indexOf('>');
        }
        var tag_check = tag_complete.substring(1, tag_index).toLowerCase();
        if (tag_complete.charAt(tag_complete.length-2) === '/' ||
            this.Utils.in_array(tag_check, this.Utils.single_token)) { //if this tag name is a single tag type (either in the list or has a closing /)
        this.tag_type = 'SINGLE';
        }
        else if (tag_check === 'script') { //for later script handling
        this.record_tag(tag_check);
        this.tag_type = 'SCRIPT';
        }
        else if (tag_check === 'style') { //for future style handling (for now it justs uses get_content)
        this.record_tag(tag_check);
        this.tag_type = 'STYLE';
        }
        else if (tag_check.charAt(0) === '!') { //peek for <!-- comment
        if (tag_check.indexOf('[if') != -1) { //peek for <!--[if conditional comment
            if (tag_complete.indexOf('!IE') != -1) { //this type needs a closing --> so...
            var comment = this.get_unformatted('-->', tag_complete); //...delegate to get_unformatted
            content.push(comment);
            }
            this.tag_type = 'START';
        }
        else if (tag_check.indexOf('[endif') != -1) {//peek for <!--[endif end conditional comment
            this.tag_type = 'END';
            this.unindent();
        }
        else if (tag_check.indexOf('[cdata[') != -1) { //if it's a <[cdata[ comment...
            var comment = this.get_unformatted(']]>', tag_complete); //...delegate to get_unformatted function
            content.push(comment);
            this.tag_type = 'SINGLE'; //<![CDATA[ comments are treated like single tags
        }
        else {
            var comment = this.get_unformatted('-->', tag_complete);
            content.push(comment);
            this.tag_type = 'SINGLE';
        }
        }
        else {
        if (tag_check.charAt(0) === '/') { //this tag is a double tag so check for tag-ending
            this.retrieve_tag(tag_check.substring(1)); //remove it and all ancestors
            this.tag_type = 'END';
        }
        else { //otherwise it's a start-tag
            this.record_tag(tag_check); //push it on the tag stack
            this.tag_type = 'START';
        }
        if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) { //check if this double needs an extra line
            this.print_newline(true, this.output);
        }
        }
        return content.join(''); //returns fully formatted tag
    }
    
    this.get_unformatted = function (delimiter, orig_tag) { //function to return unformatted content in its entirety
        
        if (orig_tag && orig_tag.indexOf(delimiter) != -1) {
        return '';
        }
        var char = '';
        var content = '';
        var space = true;
        do {
        
        
        char = this.input.charAt(this.pos);
        this.pos++
        
        if (this.Utils.in_array(char, this.Utils.whitespace)) {
            if (!space) {
            this.line_char_count--;
            continue;
            }
            if (char === '\n' || char === '\r') {
            content += '\n';
            for (var i=0; i<this.indent_level; i++) {
                content += this.indent_string;
            }
            space = false; //...and make sure other indentation is erased
            this.line_char_count = 0;
            continue;
            }
        }
        content += char;
        this.line_char_count++;
        space = true;
        
        
        } while (content.indexOf(delimiter) == -1);
        return content;
    }
    
    this.get_token = function () { //initial handler for token-retrieval
        var token;
        
        if (this.last_token === 'TK_TAG_SCRIPT') { //check if we need to format javascript
        var temp_token = this.get_script();
        if (typeof temp_token !== 'string') {
            return temp_token;
        }
        token = js_beautify(temp_token, this.indent_size, this.indent_character, this.indent_level); //call the JS Beautifier
        return [token, 'TK_CONTENT'];
        }
        if (this.current_mode === 'CONTENT') {
        token = this.get_content();
        if (typeof token !== 'string') {
            return token;
        }
        else {
            return [token, 'TK_CONTENT'];
        }
        }
        
        if(this.current_mode === 'TAG') {
        token = this.get_tag();
        if (typeof token !== 'string') {
            return token;
        }
        else {
            var tag_name_type = 'TK_TAG_' + this.tag_type;
            return [token, tag_name_type];
        }
        }
    }
    
    this.printer = function (js_source, indent_character, indent_size, max_char) { //handles input/output and some other printing functions
        
        this.input = js_source || ''; //gets the input for the Parser
        this.output = [];
        this.indent_character = indent_character || ' ';
        this.indent_string = '';
        this.indent_size = indent_size || 2;
        this.indent_level = 0;
        this.max_char = max_char || 70; //maximum amount of characters per line
        this.line_char_count = 0; //count to see if max_char was exceeded
        
        for (var i=0; i<this.indent_size; i++) {
        this.indent_string += this.indent_character;
        }
        
        this.print_newline = function (ignore, arr) {
        this.line_char_count = 0;
        if (!arr || !arr.length) {
            return;
        }
        if (!ignore) { //we might want the extra line
            while (this.Utils.in_array(arr[arr.length-1], this.Utils.whitespace)) {
            arr.pop();
            }
        }
        arr.push('\n');
        for (var i=0; i<this.indent_level; i++) {
            arr.push(this.indent_string);
        }
        }
        
        
        this.print_token = function (text) {
        this.output.push(text);
        }
        
        this.indent = function () {
        this.indent_level++;
        }
        
        this.unindent = function () {
        if (this.indent_level > 0) {
            this.indent_level--;
        }
        }
    }
    return this;
    }
    
    /*_____________________--------------------_____________________*/
    
    
    
    multi_parser = new Parser(); //wrapping functions Parser
    multi_parser.printer(html_source, indent_character, indent_size); //initialize starting values
    
    
    
    while (true) {
        var t = multi_parser.get_token();
        multi_parser.token_text = t[0];
        multi_parser.token_type = t[1];
    
    if (multi_parser.token_type === 'TK_EOF') {
        break;
    }
    

    switch (multi_parser.token_type) {
        case 'TK_TAG_START': case 'TK_TAG_SCRIPT': case 'TK_TAG_STYLE':
        multi_parser.print_newline(false, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.indent();
        multi_parser.current_mode = 'CONTENT';
        break;
        case 'TK_TAG_END':
        multi_parser.print_newline(true, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.current_mode = 'CONTENT';
        break;
        case 'TK_TAG_SINGLE':
        multi_parser.print_newline(false, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.current_mode = 'CONTENT';
        break;
        case 'TK_CONTENT':
        if (multi_parser.token_text !== '') {
            multi_parser.print_newline(false, multi_parser.output);
            multi_parser.print_token(multi_parser.token_text);
        }
        multi_parser.current_mode = 'TAG';
        break;
    }
    multi_parser.last_token = multi_parser.token_type;
    multi_parser.last_text = multi_parser.token_text;
    }
    return multi_parser.output.join('');
}

/**
 * html_beautify 新版html美化
 */
(function() {

  /* GENERATED_BUILD_OUTPUT */
  var legacy_beautify_html =
  /******/ (function(modules) { // webpackBootstrap
  /******/ 	// The module cache
  /******/ 	var installedModules = {};
  /******/
  /******/ 	// The require function
  /******/ 	function __webpack_require__(moduleId) {
  /******/
  /******/ 		// Check if module is in cache
  /******/ 		if(installedModules[moduleId]) {
  /******/ 			return installedModules[moduleId].exports;
  /******/ 		}
  /******/ 		// Create a new module (and put it into the cache)
  /******/ 		var module = installedModules[moduleId] = {
  /******/ 			i: moduleId,
  /******/ 			l: false,
  /******/ 			exports: {}
  /******/ 		};
  /******/
  /******/ 		// Execute the module function
  /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
  /******/
  /******/ 		// Flag the module as loaded
  /******/ 		module.l = true;
  /******/
  /******/ 		// Return the exports of the module
  /******/ 		return module.exports;
  /******/ 	}
  /******/
  /******/
  /******/ 	// expose the modules object (__webpack_modules__)
  /******/ 	__webpack_require__.m = modules;
  /******/
  /******/ 	// expose the module cache
  /******/ 	__webpack_require__.c = installedModules;
  /******/
  /******/ 	// define getter function for harmony exports
  /******/ 	__webpack_require__.d = function(exports, name, getter) {
  /******/ 		if(!__webpack_require__.o(exports, name)) {
  /******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
  /******/ 		}
  /******/ 	};
  /******/
  /******/ 	// define __esModule on exports
  /******/ 	__webpack_require__.r = function(exports) {
  /******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
  /******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  /******/ 		}
  /******/ 		Object.defineProperty(exports, '__esModule', { value: true });
  /******/ 	};
  /******/
  /******/ 	// create a fake namespace object
  /******/ 	// mode & 1: value is a module id, require it
  /******/ 	// mode & 2: merge all properties of value into the ns
  /******/ 	// mode & 4: return value when already ns object
  /******/ 	// mode & 8|1: behave like require
  /******/ 	__webpack_require__.t = function(value, mode) {
  /******/ 		if(mode & 1) value = __webpack_require__(value);
  /******/ 		if(mode & 8) return value;
  /******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
  /******/ 		var ns = Object.create(null);
  /******/ 		__webpack_require__.r(ns);
  /******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
  /******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
  /******/ 		return ns;
  /******/ 	};
  /******/
  /******/ 	// getDefaultExport function for compatibility with non-harmony modules
  /******/ 	__webpack_require__.n = function(module) {
  /******/ 		var getter = module && module.__esModule ?
  /******/ 			function getDefault() { return module['default']; } :
  /******/ 			function getModuleExports() { return module; };
  /******/ 		__webpack_require__.d(getter, 'a', getter);
  /******/ 		return getter;
  /******/ 	};
  /******/
  /******/ 	// Object.prototype.hasOwnProperty.call
  /******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
  /******/
  /******/ 	// __webpack_public_path__
  /******/ 	__webpack_require__.p = "";
  /******/
  /******/
  /******/ 	// Load entry module and return exports
  /******/ 	return __webpack_require__(__webpack_require__.s = 18);
  /******/ })
  /************************************************************************/
  /******/ ([
  /* 0 */,
  /* 1 */,
  /* 2 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  function OutputLine(parent) {
    this.__parent = parent;
    this.__character_count = 0;
    // use indent_count as a marker for this.__lines that have preserved indentation
    this.__indent_count = -1;
    this.__alignment_count = 0;
    this.__wrap_point_index = 0;
    this.__wrap_point_character_count = 0;
    this.__wrap_point_indent_count = -1;
    this.__wrap_point_alignment_count = 0;
  
    this.__items = [];
  }
  
  OutputLine.prototype.clone_empty = function() {
    var line = new OutputLine(this.__parent);
    line.set_indent(this.__indent_count, this.__alignment_count);
    return line;
  };
  
  OutputLine.prototype.item = function(index) {
    if (index < 0) {
      return this.__items[this.__items.length + index];
    } else {
      return this.__items[index];
    }
  };
  
  OutputLine.prototype.has_match = function(pattern) {
    for (var lastCheckedOutput = this.__items.length - 1; lastCheckedOutput >= 0; lastCheckedOutput--) {
      if (this.__items[lastCheckedOutput].match(pattern)) {
        return true;
      }
    }
    return false;
  };
  
  OutputLine.prototype.set_indent = function(indent, alignment) {
    if (this.is_empty()) {
      this.__indent_count = indent || 0;
      this.__alignment_count = alignment || 0;
      this.__character_count = this.__parent.get_indent_size(this.__indent_count, this.__alignment_count);
    }
  };
  
  OutputLine.prototype._set_wrap_point = function() {
    if (this.__parent.wrap_line_length) {
      this.__wrap_point_index = this.__items.length;
      this.__wrap_point_character_count = this.__character_count;
      this.__wrap_point_indent_count = this.__parent.next_line.__indent_count;
      this.__wrap_point_alignment_count = this.__parent.next_line.__alignment_count;
    }
  };
  
  OutputLine.prototype._should_wrap = function() {
    return this.__wrap_point_index &&
      this.__character_count > this.__parent.wrap_line_length &&
      this.__wrap_point_character_count > this.__parent.next_line.__character_count;
  };
  
  OutputLine.prototype._allow_wrap = function() {
    if (this._should_wrap()) {
      this.__parent.add_new_line();
      var next = this.__parent.current_line;
      next.set_indent(this.__wrap_point_indent_count, this.__wrap_point_alignment_count);
      next.__items = this.__items.slice(this.__wrap_point_index);
      this.__items = this.__items.slice(0, this.__wrap_point_index);
  
      next.__character_count += this.__character_count - this.__wrap_point_character_count;
      this.__character_count = this.__wrap_point_character_count;
  
      if (next.__items[0] === " ") {
        next.__items.splice(0, 1);
        next.__character_count -= 1;
      }
      return true;
    }
    return false;
  };
  
  OutputLine.prototype.is_empty = function() {
    return this.__items.length === 0;
  };
  
  OutputLine.prototype.last = function() {
    if (!this.is_empty()) {
      return this.__items[this.__items.length - 1];
    } else {
      return null;
    }
  };
  
  OutputLine.prototype.push = function(item) {
    this.__items.push(item);
    var last_newline_index = item.lastIndexOf('\n');
    if (last_newline_index !== -1) {
      this.__character_count = item.length - last_newline_index;
    } else {
      this.__character_count += item.length;
    }
  };
  
  OutputLine.prototype.pop = function() {
    var item = null;
    if (!this.is_empty()) {
      item = this.__items.pop();
      this.__character_count -= item.length;
    }
    return item;
  };
  
  
  OutputLine.prototype._remove_indent = function() {
    if (this.__indent_count > 0) {
      this.__indent_count -= 1;
      this.__character_count -= this.__parent.indent_size;
    }
  };
  
  OutputLine.prototype._remove_wrap_indent = function() {
    if (this.__wrap_point_indent_count > 0) {
      this.__wrap_point_indent_count -= 1;
    }
  };
  OutputLine.prototype.trim = function() {
    while (this.last() === ' ') {
      this.__items.pop();
      this.__character_count -= 1;
    }
  };
  
  OutputLine.prototype.toString = function() {
    var result = '';
    if (this.is_empty()) {
      if (this.__parent.indent_empty_lines) {
        result = this.__parent.get_indent_string(this.__indent_count);
      }
    } else {
      result = this.__parent.get_indent_string(this.__indent_count, this.__alignment_count);
      result += this.__items.join('');
    }
    return result;
  };
  
  function IndentStringCache(options, baseIndentString) {
    this.__cache = [''];
    this.__indent_size = options.indent_size;
    this.__indent_string = options.indent_char;
    if (!options.indent_with_tabs) {
      this.__indent_string = new Array(options.indent_size + 1).join(options.indent_char);
    }
  
    // Set to null to continue support for auto detection of base indent
    baseIndentString = baseIndentString || '';
    if (options.indent_level > 0) {
      baseIndentString = new Array(options.indent_level + 1).join(this.__indent_string);
    }
  
    this.__base_string = baseIndentString;
    this.__base_string_length = baseIndentString.length;
  }
  
  IndentStringCache.prototype.get_indent_size = function(indent, column) {
    var result = this.__base_string_length;
    column = column || 0;
    if (indent < 0) {
      result = 0;
    }
    result += indent * this.__indent_size;
    result += column;
    return result;
  };
  
  IndentStringCache.prototype.get_indent_string = function(indent_level, column) {
    var result = this.__base_string;
    column = column || 0;
    if (indent_level < 0) {
      indent_level = 0;
      result = '';
    }
    column += indent_level * this.__indent_size;
    this.__ensure_cache(column);
    result += this.__cache[column];
    return result;
  };
  
  IndentStringCache.prototype.__ensure_cache = function(column) {
    while (column >= this.__cache.length) {
      this.__add_column();
    }
  };
  
  IndentStringCache.prototype.__add_column = function() {
    var column = this.__cache.length;
    var indent = 0;
    var result = '';
    if (this.__indent_size && column >= this.__indent_size) {
      indent = Math.floor(column / this.__indent_size);
      column -= indent * this.__indent_size;
      result = new Array(indent + 1).join(this.__indent_string);
    }
    if (column) {
      result += new Array(column + 1).join(' ');
    }
  
    this.__cache.push(result);
  };
  
  function Output(options, baseIndentString) {
    this.__indent_cache = new IndentStringCache(options, baseIndentString);
    this.raw = false;
    this._end_with_newline = options.end_with_newline;
    this.indent_size = options.indent_size;
    this.wrap_line_length = options.wrap_line_length;
    this.indent_empty_lines = options.indent_empty_lines;
    this.__lines = [];
    this.previous_line = null;
    this.current_line = null;
    this.next_line = new OutputLine(this);
    this.space_before_token = false;
    this.non_breaking_space = false;
    this.previous_token_wrapped = false;
    // initialize
    this.__add_outputline();
  }
  
  Output.prototype.__add_outputline = function() {
    this.previous_line = this.current_line;
    this.current_line = this.next_line.clone_empty();
    this.__lines.push(this.current_line);
  };
  
  Output.prototype.get_line_number = function() {
    return this.__lines.length;
  };
  
  Output.prototype.get_indent_string = function(indent, column) {
    return this.__indent_cache.get_indent_string(indent, column);
  };
  
  Output.prototype.get_indent_size = function(indent, column) {
    return this.__indent_cache.get_indent_size(indent, column);
  };
  
  Output.prototype.is_empty = function() {
    return !this.previous_line && this.current_line.is_empty();
  };
  
  Output.prototype.add_new_line = function(force_newline) {
    // never newline at the start of file
    // otherwise, newline only if we didn't just add one or we're forced
    if (this.is_empty() ||
      (!force_newline && this.just_added_newline())) {
      return false;
    }
  
    // if raw output is enabled, don't print additional newlines,
    // but still return True as though you had
    if (!this.raw) {
      this.__add_outputline();
    }
    return true;
  };
  
  Output.prototype.get_code = function(eol) {
    this.trim(true);
  
    // handle some edge cases where the last tokens
    // has text that ends with newline(s)
    var last_item = this.current_line.pop();
    if (last_item) {
      if (last_item[last_item.length - 1] === '\n') {
        last_item = last_item.replace(/\n+$/g, '');
      }
      this.current_line.push(last_item);
    }
  
    if (this._end_with_newline) {
      this.__add_outputline();
    }
  
    var sweet_code = this.__lines.join('\n');
  
    if (eol !== '\n') {
      sweet_code = sweet_code.replace(/[\n]/g, eol);
    }
    return sweet_code;
  };
  
  Output.prototype.set_wrap_point = function() {
    this.current_line._set_wrap_point();
  };
  
  Output.prototype.set_indent = function(indent, alignment) {
    indent = indent || 0;
    alignment = alignment || 0;
  
    // Next line stores alignment values
    this.next_line.set_indent(indent, alignment);
  
    // Never indent your first output indent at the start of the file
    if (this.__lines.length > 1) {
      this.current_line.set_indent(indent, alignment);
      return true;
    }
  
    this.current_line.set_indent();
    return false;
  };
  
  Output.prototype.add_raw_token = function(token) {
    for (var x = 0; x < token.newlines; x++) {
      this.__add_outputline();
    }
    this.current_line.set_indent(-1);
    this.current_line.push(token.whitespace_before);
    this.current_line.push(token.text);
    this.space_before_token = false;
    this.non_breaking_space = false;
    this.previous_token_wrapped = false;
  };
  
  Output.prototype.add_token = function(printable_token) {
    this.__add_space_before_token();
    this.current_line.push(printable_token);
    this.space_before_token = false;
    this.non_breaking_space = false;
    this.previous_token_wrapped = this.current_line._allow_wrap();
  };
  
  Output.prototype.__add_space_before_token = function() {
    if (this.space_before_token && !this.just_added_newline()) {
      if (!this.non_breaking_space) {
        this.set_wrap_point();
      }
      this.current_line.push(' ');
    }
  };
  
  Output.prototype.remove_indent = function(index) {
    var output_length = this.__lines.length;
    while (index < output_length) {
      this.__lines[index]._remove_indent();
      index++;
    }
    this.current_line._remove_wrap_indent();
  };
  
  Output.prototype.trim = function(eat_newlines) {
    eat_newlines = (eat_newlines === undefined) ? false : eat_newlines;
  
    this.current_line.trim();
  
    while (eat_newlines && this.__lines.length > 1 &&
      this.current_line.is_empty()) {
      this.__lines.pop();
      this.current_line = this.__lines[this.__lines.length - 1];
      this.current_line.trim();
    }
  
    this.previous_line = this.__lines.length > 1 ?
      this.__lines[this.__lines.length - 2] : null;
  };
  
  Output.prototype.just_added_newline = function() {
    return this.current_line.is_empty();
  };
  
  Output.prototype.just_added_blankline = function() {
    return this.is_empty() ||
      (this.current_line.is_empty() && this.previous_line.is_empty());
  };
  
  Output.prototype.ensure_empty_line_above = function(starts_with, ends_with) {
    var index = this.__lines.length - 2;
    while (index >= 0) {
      var potentialEmptyLine = this.__lines[index];
      if (potentialEmptyLine.is_empty()) {
        break;
      } else if (potentialEmptyLine.item(0).indexOf(starts_with) !== 0 &&
        potentialEmptyLine.item(-1) !== ends_with) {
        this.__lines.splice(index + 1, 0, new OutputLine(this));
        this.previous_line = this.__lines[this.__lines.length - 2];
        break;
      }
      index--;
    }
  };
  
  module.exports.Output = Output;
  
  
  /***/ }),
  /* 3 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  function Token(type, text, newlines, whitespace_before) {
    this.type = type;
    this.text = text;
  
    // comments_before are
    // comments that have a new line before them
    // and may or may not have a newline after
    // this is a set of comments before
    this.comments_before = null; /* inline comment*/
  
  
    // this.comments_after =  new TokenStream(); // no new line before and newline after
    this.newlines = newlines || 0;
    this.whitespace_before = whitespace_before || '';
    this.parent = null;
    this.next = null;
    this.previous = null;
    this.opened = null;
    this.closed = null;
    this.directives = null;
  }
  
  
  module.exports.Token = Token;
  
  
  /***/ }),
  /* 4 */,
  /* 5 */,
  /* 6 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  function Options(options, merge_child_field) {
    this.raw_options = _mergeOpts(options, merge_child_field);
  
    // Support passing the source text back with no change
    this.disabled = this._get_boolean('disabled');
  
    this.eol = this._get_characters('eol', 'auto');
    this.end_with_newline = this._get_boolean('end_with_newline');
    this.indent_size = this._get_number('indent_size', 4);
    this.indent_char = this._get_characters('indent_char', ' ');
    this.indent_level = this._get_number('indent_level');
  
    this.preserve_newlines = this._get_boolean('preserve_newlines', true);
    this.max_preserve_newlines = this._get_number('max_preserve_newlines', 32786);
    if (!this.preserve_newlines) {
      this.max_preserve_newlines = 0;
    }
  
    this.indent_with_tabs = this._get_boolean('indent_with_tabs', this.indent_char === '\t');
    if (this.indent_with_tabs) {
      this.indent_char = '\t';
  
      // indent_size behavior changed after 1.8.6
      // It used to be that indent_size would be
      // set to 1 for indent_with_tabs. That is no longer needed and
      // actually doesn't make sense - why not use spaces? Further,
      // that might produce unexpected behavior - tabs being used
      // for single-column alignment. So, when indent_with_tabs is true
      // and indent_size is 1, reset indent_size to 4.
      if (this.indent_size === 1) {
        this.indent_size = 4;
      }
    }
  
    // Backwards compat with 1.3.x
    this.wrap_line_length = this._get_number('wrap_line_length', this._get_number('max_char'));
  
    this.indent_empty_lines = this._get_boolean('indent_empty_lines');
  
    // valid templating languages ['django', 'erb', 'handlebars', 'php']
    // For now, 'auto' = all off for javascript, all on for html (and inline javascript).
    // other values ignored
    this.templating = this._get_selection_list('templating', ['auto', 'none', 'django', 'erb', 'handlebars', 'php'], ['auto']);
  }
  
  Options.prototype._get_array = function(name, default_value) {
    var option_value = this.raw_options[name];
    var result = default_value || [];
    if (typeof option_value === 'object') {
      if (option_value !== null && typeof option_value.concat === 'function') {
        result = option_value.concat();
      }
    } else if (typeof option_value === 'string') {
      result = option_value.split(/[^a-zA-Z0-9_\/\-]+/);
    }
    return result;
  };
  
  Options.prototype._get_boolean = function(name, default_value) {
    var option_value = this.raw_options[name];
    var result = option_value === undefined ? !!default_value : !!option_value;
    return result;
  };
  
  Options.prototype._get_characters = function(name, default_value) {
    var option_value = this.raw_options[name];
    var result = default_value || '';
    if (typeof option_value === 'string') {
      result = option_value.replace(/\\r/, '\r').replace(/\\n/, '\n').replace(/\\t/, '\t');
    }
    return result;
  };
  
  Options.prototype._get_number = function(name, default_value) {
    var option_value = this.raw_options[name];
    default_value = parseInt(default_value, 10);
    if (isNaN(default_value)) {
      default_value = 0;
    }
    var result = parseInt(option_value, 10);
    if (isNaN(result)) {
      result = default_value;
    }
    return result;
  };
  
  Options.prototype._get_selection = function(name, selection_list, default_value) {
    var result = this._get_selection_list(name, selection_list, default_value);
    if (result.length !== 1) {
      throw new Error(
        "Invalid Option Value: The option '" + name + "' can only be one of the following values:\n" +
        selection_list + "\nYou passed in: '" + this.raw_options[name] + "'");
    }
  
    return result[0];
  };
  
  
  Options.prototype._get_selection_list = function(name, selection_list, default_value) {
    if (!selection_list || selection_list.length === 0) {
      throw new Error("Selection list cannot be empty.");
    }
  
    default_value = default_value || [selection_list[0]];
    if (!this._is_valid_selection(default_value, selection_list)) {
      throw new Error("Invalid Default Value!");
    }
  
    var result = this._get_array(name, default_value);
    if (!this._is_valid_selection(result, selection_list)) {
      throw new Error(
        "Invalid Option Value: The option '" + name + "' can contain only the following values:\n" +
        selection_list + "\nYou passed in: '" + this.raw_options[name] + "'");
    }
  
    return result;
  };
  
  Options.prototype._is_valid_selection = function(result, selection_list) {
    return result.length && selection_list.length &&
      !result.some(function(item) { return selection_list.indexOf(item) === -1; });
  };
  
  
  // merges child options up with the parent options object
  // Example: obj = {a: 1, b: {a: 2}}
  //          mergeOpts(obj, 'b')
  //
  //          Returns: {a: 2}
  function _mergeOpts(allOptions, childFieldName) {
    var finalOpts = {};
    allOptions = _normalizeOpts(allOptions);
    var name;
  
    for (name in allOptions) {
      if (name !== childFieldName) {
        finalOpts[name] = allOptions[name];
      }
    }
  
    //merge in the per type settings for the childFieldName
    if (childFieldName && allOptions[childFieldName]) {
      for (name in allOptions[childFieldName]) {
        finalOpts[name] = allOptions[childFieldName][name];
      }
    }
    return finalOpts;
  }
  
  function _normalizeOpts(options) {
    var convertedOpts = {};
    var key;
  
    for (key in options) {
      var newKey = key.replace(/-/g, "_");
      convertedOpts[newKey] = options[key];
    }
    return convertedOpts;
  }
  
  module.exports.Options = Options;
  module.exports.normalizeOpts = _normalizeOpts;
  module.exports.mergeOpts = _mergeOpts;
  
  
  /***/ }),
  /* 7 */,
  /* 8 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  var regexp_has_sticky = RegExp.prototype.hasOwnProperty('sticky');
  
  function InputScanner(input_string) {
    this.__input = input_string || '';
    this.__input_length = this.__input.length;
    this.__position = 0;
  }
  
  InputScanner.prototype.restart = function() {
    this.__position = 0;
  };
  
  InputScanner.prototype.back = function() {
    if (this.__position > 0) {
      this.__position -= 1;
    }
  };
  
  InputScanner.prototype.hasNext = function() {
    return this.__position < this.__input_length;
  };
  
  InputScanner.prototype.next = function() {
    var val = null;
    if (this.hasNext()) {
      val = this.__input.charAt(this.__position);
      this.__position += 1;
    }
    return val;
  };
  
  InputScanner.prototype.peek = function(index) {
    var val = null;
    index = index || 0;
    index += this.__position;
    if (index >= 0 && index < this.__input_length) {
      val = this.__input.charAt(index);
    }
    return val;
  };
  
  // This is a JavaScript only helper function (not in python)
  // Javascript doesn't have a match method
  // and not all implementation support "sticky" flag.
  // If they do not support sticky then both this.match() and this.test() method
  // must get the match and check the index of the match.
  // If sticky is supported and set, this method will use it.
  // Otherwise it will check that global is set, and fall back to the slower method.
  InputScanner.prototype.__match = function(pattern, index) {
    pattern.lastIndex = index;
    var pattern_match = pattern.exec(this.__input);
  
    if (pattern_match && !(regexp_has_sticky && pattern.sticky)) {
      if (pattern_match.index !== index) {
        pattern_match = null;
      }
    }
  
    return pattern_match;
  };
  
  InputScanner.prototype.test = function(pattern, index) {
    index = index || 0;
    index += this.__position;
  
    if (index >= 0 && index < this.__input_length) {
      return !!this.__match(pattern, index);
    } else {
      return false;
    }
  };
  
  InputScanner.prototype.testChar = function(pattern, index) {
    // test one character regex match
    var val = this.peek(index);
    pattern.lastIndex = 0;
    return val !== null && pattern.test(val);
  };
  
  InputScanner.prototype.match = function(pattern) {
    var pattern_match = this.__match(pattern, this.__position);
    if (pattern_match) {
      this.__position += pattern_match[0].length;
    } else {
      pattern_match = null;
    }
    return pattern_match;
  };
  
  InputScanner.prototype.read = function(starting_pattern, until_pattern, until_after) {
    var val = '';
    var match;
    if (starting_pattern) {
      match = this.match(starting_pattern);
      if (match) {
        val += match[0];
      }
    }
    if (until_pattern && (match || !starting_pattern)) {
      val += this.readUntil(until_pattern, until_after);
    }
    return val;
  };
  
  InputScanner.prototype.readUntil = function(pattern, until_after) {
    var val = '';
    var match_index = this.__position;
    pattern.lastIndex = this.__position;
    var pattern_match = pattern.exec(this.__input);
    if (pattern_match) {
      match_index = pattern_match.index;
      if (until_after) {
        match_index += pattern_match[0].length;
      }
    } else {
      match_index = this.__input_length;
    }
  
    val = this.__input.substring(this.__position, match_index);
    this.__position = match_index;
    return val;
  };
  
  InputScanner.prototype.readUntilAfter = function(pattern) {
    return this.readUntil(pattern, true);
  };
  
  InputScanner.prototype.get_regexp = function(pattern, match_from) {
    var result = null;
    var flags = 'g';
    if (match_from && regexp_has_sticky) {
      flags = 'y';
    }
    // strings are converted to regexp
    if (typeof pattern === "string" && pattern !== '') {
      // result = new RegExp(pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), flags);
      result = new RegExp(pattern, flags);
    } else if (pattern) {
      result = new RegExp(pattern.source, flags);
    }
    return result;
  };
  
  InputScanner.prototype.get_literal_regexp = function(literal_string) {
    return RegExp(literal_string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  };
  
  /* css beautifier legacy helpers */
  InputScanner.prototype.peekUntilAfter = function(pattern) {
    var start = this.__position;
    var val = this.readUntilAfter(pattern);
    this.__position = start;
    return val;
  };
  
  InputScanner.prototype.lookBack = function(testVal) {
    var start = this.__position - 1;
    return start >= testVal.length && this.__input.substring(start - testVal.length, start)
      .toLowerCase() === testVal;
  };
  
  module.exports.InputScanner = InputScanner;
  
  
  /***/ }),
  /* 9 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  var InputScanner = __webpack_require__(8).InputScanner;
  var Token = __webpack_require__(3).Token;
  var TokenStream = __webpack_require__(10).TokenStream;
  var WhitespacePattern = __webpack_require__(11).WhitespacePattern;
  
  var TOKEN = {
    START: 'TK_START',
    RAW: 'TK_RAW',
    EOF: 'TK_EOF'
  };
  
  var Tokenizer = function(input_string, options) {
    this._input = new InputScanner(input_string);
    this._options = options || {};
    this.__tokens = null;
  
    this._patterns = {};
    this._patterns.whitespace = new WhitespacePattern(this._input);
  };
  
  Tokenizer.prototype.tokenize = function() {
    this._input.restart();
    this.__tokens = new TokenStream();
  
    this._reset();
  
    var current;
    var previous = new Token(TOKEN.START, '');
    var open_token = null;
    var open_stack = [];
    var comments = new TokenStream();
  
    while (previous.type !== TOKEN.EOF) {
      current = this._get_next_token(previous, open_token);
      while (this._is_comment(current)) {
        comments.add(current);
        current = this._get_next_token(previous, open_token);
      }
  
      if (!comments.isEmpty()) {
        current.comments_before = comments;
        comments = new TokenStream();
      }
  
      current.parent = open_token;
  
      if (this._is_opening(current)) {
        open_stack.push(open_token);
        open_token = current;
      } else if (open_token && this._is_closing(current, open_token)) {
        current.opened = open_token;
        open_token.closed = current;
        open_token = open_stack.pop();
        current.parent = open_token;
      }
  
      current.previous = previous;
      previous.next = current;
  
      this.__tokens.add(current);
      previous = current;
    }
  
    return this.__tokens;
  };
  
  
  Tokenizer.prototype._is_first_token = function() {
    return this.__tokens.isEmpty();
  };
  
  Tokenizer.prototype._reset = function() {};
  
  Tokenizer.prototype._get_next_token = function(previous_token, open_token) { // jshint unused:false
    this._readWhitespace();
    var resulting_string = this._input.read(/.+/g);
    if (resulting_string) {
      return this._create_token(TOKEN.RAW, resulting_string);
    } else {
      return this._create_token(TOKEN.EOF, '');
    }
  };
  
  Tokenizer.prototype._is_comment = function(current_token) { // jshint unused:false
    return false;
  };
  
  Tokenizer.prototype._is_opening = function(current_token) { // jshint unused:false
    return false;
  };
  
  Tokenizer.prototype._is_closing = function(current_token, open_token) { // jshint unused:false
    return false;
  };
  
  Tokenizer.prototype._create_token = function(type, text) {
    var token = new Token(type, text,
      this._patterns.whitespace.newline_count,
      this._patterns.whitespace.whitespace_before_token);
    return token;
  };
  
  Tokenizer.prototype._readWhitespace = function() {
    return this._patterns.whitespace.read();
  };
  
  
  
  module.exports.Tokenizer = Tokenizer;
  module.exports.TOKEN = TOKEN;
  
  
  /***/ }),
  /* 10 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  function TokenStream(parent_token) {
    // private
    this.__tokens = [];
    this.__tokens_length = this.__tokens.length;
    this.__position = 0;
    this.__parent_token = parent_token;
  }
  
  TokenStream.prototype.restart = function() {
    this.__position = 0;
  };
  
  TokenStream.prototype.isEmpty = function() {
    return this.__tokens_length === 0;
  };
  
  TokenStream.prototype.hasNext = function() {
    return this.__position < this.__tokens_length;
  };
  
  TokenStream.prototype.next = function() {
    var val = null;
    if (this.hasNext()) {
      val = this.__tokens[this.__position];
      this.__position += 1;
    }
    return val;
  };
  
  TokenStream.prototype.peek = function(index) {
    var val = null;
    index = index || 0;
    index += this.__position;
    if (index >= 0 && index < this.__tokens_length) {
      val = this.__tokens[index];
    }
    return val;
  };
  
  TokenStream.prototype.add = function(token) {
    if (this.__parent_token) {
      token.parent = this.__parent_token;
    }
    this.__tokens.push(token);
    this.__tokens_length += 1;
  };
  
  module.exports.TokenStream = TokenStream;
  
  
  /***/ }),
  /* 11 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  var Pattern = __webpack_require__(12).Pattern;
  
  function WhitespacePattern(input_scanner, parent) {
    Pattern.call(this, input_scanner, parent);
    if (parent) {
      this._line_regexp = this._input.get_regexp(parent._line_regexp);
    } else {
      this.__set_whitespace_patterns('', '');
    }
  
    this.newline_count = 0;
    this.whitespace_before_token = '';
  }
  WhitespacePattern.prototype = new Pattern();
  
  WhitespacePattern.prototype.__set_whitespace_patterns = function(whitespace_chars, newline_chars) {
    whitespace_chars += '\\t ';
    newline_chars += '\\n\\r';
  
    this._match_pattern = this._input.get_regexp(
      '[' + whitespace_chars + newline_chars + ']+', true);
    this._newline_regexp = this._input.get_regexp(
      '\\r\\n|[' + newline_chars + ']');
  };
  
  WhitespacePattern.prototype.read = function() {
    this.newline_count = 0;
    this.whitespace_before_token = '';
  
    var resulting_string = this._input.read(this._match_pattern);
    if (resulting_string === ' ') {
      this.whitespace_before_token = ' ';
    } else if (resulting_string) {
      var matches = this.__split(this._newline_regexp, resulting_string);
      this.newline_count = matches.length - 1;
      this.whitespace_before_token = matches[this.newline_count];
    }
  
    return resulting_string;
  };
  
  WhitespacePattern.prototype.matching = function(whitespace_chars, newline_chars) {
    var result = this._create();
    result.__set_whitespace_patterns(whitespace_chars, newline_chars);
    result._update();
    return result;
  };
  
  WhitespacePattern.prototype._create = function() {
    return new WhitespacePattern(this._input, this);
  };
  
  WhitespacePattern.prototype.__split = function(regexp, input_string) {
    regexp.lastIndex = 0;
    var start_index = 0;
    var result = [];
    var next_match = regexp.exec(input_string);
    while (next_match) {
      result.push(input_string.substring(start_index, next_match.index));
      start_index = next_match.index + next_match[0].length;
      next_match = regexp.exec(input_string);
    }
  
    if (start_index < input_string.length) {
      result.push(input_string.substring(start_index, input_string.length));
    } else {
      result.push('');
    }
  
    return result;
  };
  
  
  
  module.exports.WhitespacePattern = WhitespacePattern;
  
  
  /***/ }),
  /* 12 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  function Pattern(input_scanner, parent) {
    this._input = input_scanner;
    this._starting_pattern = null;
    this._match_pattern = null;
    this._until_pattern = null;
    this._until_after = false;
  
    if (parent) {
      this._starting_pattern = this._input.get_regexp(parent._starting_pattern, true);
      this._match_pattern = this._input.get_regexp(parent._match_pattern, true);
      this._until_pattern = this._input.get_regexp(parent._until_pattern);
      this._until_after = parent._until_after;
    }
  }
  
  Pattern.prototype.read = function() {
    var result = this._input.read(this._starting_pattern);
    if (!this._starting_pattern || result) {
      result += this._input.read(this._match_pattern, this._until_pattern, this._until_after);
    }
    return result;
  };
  
  Pattern.prototype.read_match = function() {
    return this._input.match(this._match_pattern);
  };
  
  Pattern.prototype.until_after = function(pattern) {
    var result = this._create();
    result._until_after = true;
    result._until_pattern = this._input.get_regexp(pattern);
    result._update();
    return result;
  };
  
  Pattern.prototype.until = function(pattern) {
    var result = this._create();
    result._until_after = false;
    result._until_pattern = this._input.get_regexp(pattern);
    result._update();
    return result;
  };
  
  Pattern.prototype.starting_with = function(pattern) {
    var result = this._create();
    result._starting_pattern = this._input.get_regexp(pattern, true);
    result._update();
    return result;
  };
  
  Pattern.prototype.matching = function(pattern) {
    var result = this._create();
    result._match_pattern = this._input.get_regexp(pattern, true);
    result._update();
    return result;
  };
  
  Pattern.prototype._create = function() {
    return new Pattern(this._input, this);
  };
  
  Pattern.prototype._update = function() {};
  
  module.exports.Pattern = Pattern;
  
  
  /***/ }),
  /* 13 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  function Directives(start_block_pattern, end_block_pattern) {
    start_block_pattern = typeof start_block_pattern === 'string' ? start_block_pattern : start_block_pattern.source;
    end_block_pattern = typeof end_block_pattern === 'string' ? end_block_pattern : end_block_pattern.source;
    this.__directives_block_pattern = new RegExp(start_block_pattern + / beautify( \w+[:]\w+)+ /.source + end_block_pattern, 'g');
    this.__directive_pattern = / (\w+)[:](\w+)/g;
  
    this.__directives_end_ignore_pattern = new RegExp(start_block_pattern + /\sbeautify\signore:end\s/.source + end_block_pattern, 'g');
  }
  
  Directives.prototype.get_directives = function(text) {
    if (!text.match(this.__directives_block_pattern)) {
      return null;
    }
  
    var directives = {};
    this.__directive_pattern.lastIndex = 0;
    var directive_match = this.__directive_pattern.exec(text);
  
    while (directive_match) {
      directives[directive_match[1]] = directive_match[2];
      directive_match = this.__directive_pattern.exec(text);
    }
  
    return directives;
  };
  
  Directives.prototype.readIgnored = function(input) {
    return input.readUntilAfter(this.__directives_end_ignore_pattern);
  };
  
  
  module.exports.Directives = Directives;
  
  
  /***/ }),
  /* 14 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  var Pattern = __webpack_require__(12).Pattern;
  
  
  var template_names = {
    django: false,
    erb: false,
    handlebars: false,
    php: false
  };
  
  // This lets templates appear anywhere we would do a readUntil
  // The cost is higher but it is pay to play.
  function TemplatablePattern(input_scanner, parent) {
    Pattern.call(this, input_scanner, parent);
    this.__template_pattern = null;
    this._disabled = Object.assign({}, template_names);
    this._excluded = Object.assign({}, template_names);
  
    if (parent) {
      this.__template_pattern = this._input.get_regexp(parent.__template_pattern);
      this._excluded = Object.assign(this._excluded, parent._excluded);
      this._disabled = Object.assign(this._disabled, parent._disabled);
    }
    var pattern = new Pattern(input_scanner);
    this.__patterns = {
      handlebars_comment: pattern.starting_with(/{{!--/).until_after(/--}}/),
      handlebars: pattern.starting_with(/{{/).until_after(/}}/),
      php: pattern.starting_with(/<\?(?:[=]|php)/).until_after(/\?>/),
      erb: pattern.starting_with(/<%[^%]/).until_after(/[^%]%>/),
      // django coflicts with handlebars a bit.
      django: pattern.starting_with(/{%/).until_after(/%}/),
      django_value: pattern.starting_with(/{{/).until_after(/}}/),
      django_comment: pattern.starting_with(/{#/).until_after(/#}/)
    };
  }
  TemplatablePattern.prototype = new Pattern();
  
  TemplatablePattern.prototype._create = function() {
    return new TemplatablePattern(this._input, this);
  };
  
  TemplatablePattern.prototype._update = function() {
    this.__set_templated_pattern();
  };
  
  TemplatablePattern.prototype.disable = function(language) {
    var result = this._create();
    result._disabled[language] = true;
    result._update();
    return result;
  };
  
  TemplatablePattern.prototype.read_options = function(options) {
    var result = this._create();
    for (var language in template_names) {
      result._disabled[language] = options.templating.indexOf(language) === -1;
    }
    result._update();
    return result;
  };
  
  TemplatablePattern.prototype.exclude = function(language) {
    var result = this._create();
    result._excluded[language] = true;
    result._update();
    return result;
  };
  
  TemplatablePattern.prototype.read = function() {
    var result = '';
    if (this._match_pattern) {
      result = this._input.read(this._starting_pattern);
    } else {
      result = this._input.read(this._starting_pattern, this.__template_pattern);
    }
    var next = this._read_template();
    while (next) {
      if (this._match_pattern) {
        next += this._input.read(this._match_pattern);
      } else {
        next += this._input.readUntil(this.__template_pattern);
      }
      result += next;
      next = this._read_template();
    }
  
    if (this._until_after) {
      result += this._input.readUntilAfter(this._until_pattern);
    }
    return result;
  };
  
  TemplatablePattern.prototype.__set_templated_pattern = function() {
    var items = [];
  
    if (!this._disabled.php) {
      items.push(this.__patterns.php._starting_pattern.source);
    }
    if (!this._disabled.handlebars) {
      items.push(this.__patterns.handlebars._starting_pattern.source);
    }
    if (!this._disabled.erb) {
      items.push(this.__patterns.erb._starting_pattern.source);
    }
    if (!this._disabled.django) {
      items.push(this.__patterns.django._starting_pattern.source);
      items.push(this.__patterns.django_value._starting_pattern.source);
      items.push(this.__patterns.django_comment._starting_pattern.source);
    }
  
    if (this._until_pattern) {
      items.push(this._until_pattern.source);
    }
    this.__template_pattern = this._input.get_regexp('(?:' + items.join('|') + ')');
  };
  
  TemplatablePattern.prototype._read_template = function() {
    var resulting_string = '';
    var c = this._input.peek();
    if (c === '<') {
      var peek1 = this._input.peek(1);
      //if we're in a comment, do something special
      // We treat all comments as literals, even more than preformatted tags
      // we just look for the appropriate close tag
      if (!this._disabled.php && !this._excluded.php && peek1 === '?') {
        resulting_string = resulting_string ||
          this.__patterns.php.read();
      }
      if (!this._disabled.erb && !this._excluded.erb && peek1 === '%') {
        resulting_string = resulting_string ||
          this.__patterns.erb.read();
      }
    } else if (c === '{') {
      if (!this._disabled.handlebars && !this._excluded.handlebars) {
        resulting_string = resulting_string ||
          this.__patterns.handlebars_comment.read();
        resulting_string = resulting_string ||
          this.__patterns.handlebars.read();
      }
      if (!this._disabled.django) {
        // django coflicts with handlebars a bit.
        if (!this._excluded.django && !this._excluded.handlebars) {
          resulting_string = resulting_string ||
            this.__patterns.django_value.read();
        }
        if (!this._excluded.django) {
          resulting_string = resulting_string ||
            this.__patterns.django_comment.read();
          resulting_string = resulting_string ||
            this.__patterns.django.read();
        }
      }
    }
    return resulting_string;
  };
  
  
  module.exports.TemplatablePattern = TemplatablePattern;
  
  
  /***/ }),
  /* 15 */,
  /* 16 */,
  /* 17 */,
  /* 18 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  var Beautifier = __webpack_require__(19).Beautifier,
    Options = __webpack_require__(20).Options;
  
  function style_html(html_source, options, js_beautify, css_beautify) {
    var beautifier = new Beautifier(html_source, options, js_beautify, css_beautify);
    return beautifier.beautify();
  }
  
  module.exports = style_html;
  module.exports.defaultOptions = function() {
    return new Options();
  };
  
  
  /***/ }),
  /* 19 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  var Options = __webpack_require__(20).Options;
  var Output = __webpack_require__(2).Output;
  var Tokenizer = __webpack_require__(21).Tokenizer;
  var TOKEN = __webpack_require__(21).TOKEN;
  
  var lineBreak = /\r\n|[\r\n]/;
  var allLineBreaks = /\r\n|[\r\n]/g;
  
  var Printer = function(options, base_indent_string) { //handles input/output and some other printing functions
  
    this.indent_level = 0;
    this.alignment_size = 0;
    this.max_preserve_newlines = options.max_preserve_newlines;
    this.preserve_newlines = options.preserve_newlines;
  
    this._output = new Output(options, base_indent_string);
  
  };
  
  Printer.prototype.current_line_has_match = function(pattern) {
    return this._output.current_line.has_match(pattern);
  };
  
  Printer.prototype.set_space_before_token = function(value, non_breaking) {
    this._output.space_before_token = value;
    this._output.non_breaking_space = non_breaking;
  };
  
  Printer.prototype.set_wrap_point = function() {
    this._output.set_indent(this.indent_level, this.alignment_size);
    this._output.set_wrap_point();
  };
  
  
  Printer.prototype.add_raw_token = function(token) {
    this._output.add_raw_token(token);
  };
  
  Printer.prototype.print_preserved_newlines = function(raw_token) {
    var newlines = 0;
    if (raw_token.type !== TOKEN.TEXT && raw_token.previous.type !== TOKEN.TEXT) {
      newlines = raw_token.newlines ? 1 : 0;
    }
  
    if (this.preserve_newlines) {
      newlines = raw_token.newlines < this.max_preserve_newlines + 1 ? raw_token.newlines : this.max_preserve_newlines + 1;
    }
    for (var n = 0; n < newlines; n++) {
      this.print_newline(n > 0);
    }
  
    return newlines !== 0;
  };
  
  Printer.prototype.traverse_whitespace = function(raw_token) {
    if (raw_token.whitespace_before || raw_token.newlines) {
      if (!this.print_preserved_newlines(raw_token)) {
        this._output.space_before_token = true;
      }
      return true;
    }
    return false;
  };
  
  Printer.prototype.previous_token_wrapped = function() {
    return this._output.previous_token_wrapped;
  };
  
  Printer.prototype.print_newline = function(force) {
    this._output.add_new_line(force);
  };
  
  Printer.prototype.print_token = function(token) {
    if (token.text) {
      this._output.set_indent(this.indent_level, this.alignment_size);
      this._output.add_token(token.text);
    }
  };
  
  Printer.prototype.indent = function() {
    this.indent_level++;
  };
  
  Printer.prototype.get_full_indent = function(level) {
    level = this.indent_level + (level || 0);
    if (level < 1) {
      return '';
    }
  
    return this._output.get_indent_string(level);
  };
  
  var get_type_attribute = function(start_token) {
    var result = null;
    var raw_token = start_token.next;
  
    // Search attributes for a type attribute
    while (raw_token.type !== TOKEN.EOF && start_token.closed !== raw_token) {
      if (raw_token.type === TOKEN.ATTRIBUTE && raw_token.text === 'type') {
        if (raw_token.next && raw_token.next.type === TOKEN.EQUALS &&
          raw_token.next.next && raw_token.next.next.type === TOKEN.VALUE) {
          result = raw_token.next.next.text;
        }
        break;
      }
      raw_token = raw_token.next;
    }
  
    return result;
  };
  
  var get_custom_beautifier_name = function(tag_check, raw_token) {
    var typeAttribute = null;
    var result = null;
  
    if (!raw_token.closed) {
      return null;
    }
  
    if (tag_check === 'script') {
      typeAttribute = 'text/javascript';
    } else if (tag_check === 'style') {
      typeAttribute = 'text/css';
    }
  
    typeAttribute = get_type_attribute(raw_token) || typeAttribute;
  
    // For script and style tags that have a type attribute, only enable custom beautifiers for matching values
    // For those without a type attribute use default;
    if (typeAttribute.search('text/css') > -1) {
      result = 'css';
    } else if (typeAttribute.search(/(text|application|dojo)\/(x-)?(javascript|ecmascript|jscript|livescript|(ld\+)?json|method|aspect)/) > -1) {
      result = 'javascript';
    } else if (typeAttribute.search(/(text|application|dojo)\/(x-)?(html)/) > -1) {
      result = 'html';
    } else if (typeAttribute.search(/test\/null/) > -1) {
      // Test only mime-type for testing the beautifier when null is passed as beautifing function
      result = 'null';
    }
  
    return result;
  };
  
  function in_array(what, arr) {
    return arr.indexOf(what) !== -1;
  }
  
  function TagFrame(parent, parser_token, indent_level) {
    this.parent = parent || null;
    this.tag = parser_token ? parser_token.tag_name : '';
    this.indent_level = indent_level || 0;
    this.parser_token = parser_token || null;
  }
  
  function TagStack(printer) {
    this._printer = printer;
    this._current_frame = null;
  }
  
  TagStack.prototype.get_parser_token = function() {
    return this._current_frame ? this._current_frame.parser_token : null;
  };
  
  TagStack.prototype.record_tag = function(parser_token) { //function to record a tag and its parent in this.tags Object
    var new_frame = new TagFrame(this._current_frame, parser_token, this._printer.indent_level);
    this._current_frame = new_frame;
  };
  
  TagStack.prototype._try_pop_frame = function(frame) { //function to retrieve the opening tag to the corresponding closer
    var parser_token = null;
  
    if (frame) {
      parser_token = frame.parser_token;
      this._printer.indent_level = frame.indent_level;
      this._current_frame = frame.parent;
    }
  
    return parser_token;
  };
  
  TagStack.prototype._get_frame = function(tag_list, stop_list) { //function to retrieve the opening tag to the corresponding closer
    var frame = this._current_frame;
  
    while (frame) { //till we reach '' (the initial value);
      if (tag_list.indexOf(frame.tag) !== -1) { //if this is it use it
        break;
      } else if (stop_list && stop_list.indexOf(frame.tag) !== -1) {
        frame = null;
        break;
      }
      frame = frame.parent;
    }
  
    return frame;
  };
  
  TagStack.prototype.try_pop = function(tag, stop_list) { //function to retrieve the opening tag to the corresponding closer
    var frame = this._get_frame([tag], stop_list);
    return this._try_pop_frame(frame);
  };
  
  TagStack.prototype.indent_to_tag = function(tag_list) {
    var frame = this._get_frame(tag_list);
    if (frame) {
      this._printer.indent_level = frame.indent_level;
    }
  };
  
  function Beautifier(source_text, options, js_beautify, css_beautify) {
    //Wrapper function to invoke all the necessary constructors and deal with the output.
    this._source_text = source_text || '';
    options = options || {};
    this._js_beautify = js_beautify;
    this._css_beautify = css_beautify;
    this._tag_stack = null;
  
    // Allow the setting of language/file-type specific options
    // with inheritance of overall settings
    var optionHtml = new Options(options, 'html');
  
    this._options = optionHtml;
  
    this._is_wrap_attributes_force = this._options.wrap_attributes.substr(0, 'force'.length) === 'force';
    this._is_wrap_attributes_force_expand_multiline = (this._options.wrap_attributes === 'force-expand-multiline');
    this._is_wrap_attributes_force_aligned = (this._options.wrap_attributes === 'force-aligned');
    this._is_wrap_attributes_aligned_multiple = (this._options.wrap_attributes === 'aligned-multiple');
    this._is_wrap_attributes_preserve = this._options.wrap_attributes.substr(0, 'preserve'.length) === 'preserve';
    this._is_wrap_attributes_preserve_aligned = (this._options.wrap_attributes === 'preserve-aligned');
  }
  
  Beautifier.prototype.beautify = function() {
  
    // if disabled, return the input unchanged.
    if (this._options.disabled) {
      return this._source_text;
    }
  
    var source_text = this._source_text;
    var eol = this._options.eol;
    if (this._options.eol === 'auto') {
      eol = '\n';
      if (source_text && lineBreak.test(source_text)) {
        eol = source_text.match(lineBreak)[0];
      }
    }
  
    // HACK: newline parsing inconsistent. This brute force normalizes the input.
    source_text = source_text.replace(allLineBreaks, '\n');
  
    var baseIndentString = source_text.match(/^[\t ]*/)[0];
  
    var last_token = {
      text: '',
      type: ''
    };
  
    var last_tag_token = new TagOpenParserToken();
  
    var printer = new Printer(this._options, baseIndentString);
    var tokens = new Tokenizer(source_text, this._options).tokenize();
  
    this._tag_stack = new TagStack(printer);
  
    var parser_token = null;
    var raw_token = tokens.next();
    while (raw_token.type !== TOKEN.EOF) {
  
      if (raw_token.type === TOKEN.TAG_OPEN || raw_token.type === TOKEN.COMMENT) {
        parser_token = this._handle_tag_open(printer, raw_token, last_tag_token, last_token);
        last_tag_token = parser_token;
      } else if ((raw_token.type === TOKEN.ATTRIBUTE || raw_token.type === TOKEN.EQUALS || raw_token.type === TOKEN.VALUE) ||
        (raw_token.type === TOKEN.TEXT && !last_tag_token.tag_complete)) {
        parser_token = this._handle_inside_tag(printer, raw_token, last_tag_token, tokens);
      } else if (raw_token.type === TOKEN.TAG_CLOSE) {
        parser_token = this._handle_tag_close(printer, raw_token, last_tag_token);
      } else if (raw_token.type === TOKEN.TEXT) {
        parser_token = this._handle_text(printer, raw_token, last_tag_token);
      } else {
        // This should never happen, but if it does. Print the raw token
        printer.add_raw_token(raw_token);
      }
  
      last_token = parser_token;
  
      raw_token = tokens.next();
    }
    var sweet_code = printer._output.get_code(eol);
  
    return sweet_code;
  };
  
  Beautifier.prototype._handle_tag_close = function(printer, raw_token, last_tag_token) {
    var parser_token = {
      text: raw_token.text,
      type: raw_token.type
    };
    printer.alignment_size = 0;
    last_tag_token.tag_complete = true;
  
    printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== '', true);
    if (last_tag_token.is_unformatted) {
      printer.add_raw_token(raw_token);
    } else {
      if (last_tag_token.tag_start_char === '<') {
        printer.set_space_before_token(raw_token.text[0] === '/', true); // space before />, no space before >
        if (this._is_wrap_attributes_force_expand_multiline && last_tag_token.has_wrapped_attrs) {
          printer.print_newline(false);
        }
      }
      printer.print_token(raw_token);
  
    }
  
    if (last_tag_token.indent_content &&
      !(last_tag_token.is_unformatted || last_tag_token.is_content_unformatted)) {
      printer.indent();
  
      // only indent once per opened tag
      last_tag_token.indent_content = false;
    }
  
    if (!last_tag_token.is_inline_element &&
      !(last_tag_token.is_unformatted || last_tag_token.is_content_unformatted)) {
      printer.set_wrap_point();
    }
  
    return parser_token;
  };
  
  Beautifier.prototype._handle_inside_tag = function(printer, raw_token, last_tag_token, tokens) {
    var wrapped = last_tag_token.has_wrapped_attrs;
    var parser_token = {
      text: raw_token.text,
      type: raw_token.type
    };
  
    printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== '', true);
    if (last_tag_token.is_unformatted) {
      printer.add_raw_token(raw_token);
    } else if (last_tag_token.tag_start_char === '{' && raw_token.type === TOKEN.TEXT) {
      // For the insides of handlebars allow newlines or a single space between open and contents
      if (printer.print_preserved_newlines(raw_token)) {
        raw_token.newlines = 0;
        printer.add_raw_token(raw_token);
      } else {
        printer.print_token(raw_token);
      }
    } else {
      if (raw_token.type === TOKEN.ATTRIBUTE) {
        printer.set_space_before_token(true);
        last_tag_token.attr_count += 1;
      } else if (raw_token.type === TOKEN.EQUALS) { //no space before =
        printer.set_space_before_token(false);
      } else if (raw_token.type === TOKEN.VALUE && raw_token.previous.type === TOKEN.EQUALS) { //no space before value
        printer.set_space_before_token(false);
      }
  
      if (raw_token.type === TOKEN.ATTRIBUTE && last_tag_token.tag_start_char === '<') {
        if (this._is_wrap_attributes_preserve || this._is_wrap_attributes_preserve_aligned) {
          printer.traverse_whitespace(raw_token);
          wrapped = wrapped || raw_token.newlines !== 0;
        }
  
  
        if (this._is_wrap_attributes_force) {
          var force_attr_wrap = last_tag_token.attr_count > 1;
          if (this._is_wrap_attributes_force_expand_multiline && last_tag_token.attr_count === 1) {
            var is_only_attribute = true;
            var peek_index = 0;
            var peek_token;
            do {
              peek_token = tokens.peek(peek_index);
              if (peek_token.type === TOKEN.ATTRIBUTE) {
                is_only_attribute = false;
                break;
              }
              peek_index += 1;
            } while (peek_index < 4 && peek_token.type !== TOKEN.EOF && peek_token.type !== TOKEN.TAG_CLOSE);
  
            force_attr_wrap = !is_only_attribute;
          }
  
          if (force_attr_wrap) {
            printer.print_newline(false);
            wrapped = true;
          }
        }
      }
      printer.print_token(raw_token);
      wrapped = wrapped || printer.previous_token_wrapped();
      last_tag_token.has_wrapped_attrs = wrapped;
    }
    return parser_token;
  };
  
  Beautifier.prototype._handle_text = function(printer, raw_token, last_tag_token) {
    var parser_token = {
      text: raw_token.text,
      type: 'TK_CONTENT'
    };
    if (last_tag_token.custom_beautifier_name) { //check if we need to format javascript
      this._print_custom_beatifier_text(printer, raw_token, last_tag_token);
    } else if (last_tag_token.is_unformatted || last_tag_token.is_content_unformatted) {
      printer.add_raw_token(raw_token);
    } else {
      printer.traverse_whitespace(raw_token);
      printer.print_token(raw_token);
    }
    return parser_token;
  };
  
  Beautifier.prototype._print_custom_beatifier_text = function(printer, raw_token, last_tag_token) {
    var local = this;
    if (raw_token.text !== '') {
  
      var text = raw_token.text,
        _beautifier,
        script_indent_level = 1,
        pre = '',
        post = '';
      if (last_tag_token.custom_beautifier_name === 'javascript' && typeof this._js_beautify === 'function') {
        _beautifier = this._js_beautify;
      } else if (last_tag_token.custom_beautifier_name === 'css' && typeof this._css_beautify === 'function') {
        _beautifier = this._css_beautify;
      } else if (last_tag_token.custom_beautifier_name === 'html') {
        _beautifier = function(html_source, options) {
          var beautifier = new Beautifier(html_source, options, local._js_beautify, local._css_beautify);
          return beautifier.beautify();
        };
      }
  
      if (this._options.indent_scripts === "keep") {
        script_indent_level = 0;
      } else if (this._options.indent_scripts === "separate") {
        script_indent_level = -printer.indent_level;
      }
  
      var indentation = printer.get_full_indent(script_indent_level);
  
      // if there is at least one empty line at the end of this text, strip it
      // we'll be adding one back after the text but before the containing tag.
      text = text.replace(/\n[ \t]*$/, '');
  
      // Handle the case where content is wrapped in a comment or cdata.
      if (last_tag_token.custom_beautifier_name !== 'html' &&
        text[0] === '<' && text.match(/^(<!--|<!\[CDATA\[)/)) {
        var matched = /^(<!--[^\n]*|<!\[CDATA\[)(\n?)([ \t\n]*)([\s\S]*)(-->|]]>)$/.exec(text);
  
        // if we start to wrap but don't finish, print raw
        if (!matched) {
          printer.add_raw_token(raw_token);
          return;
        }
  
        pre = indentation + matched[1] + '\n';
        text = matched[4];
        if (matched[5]) {
          post = indentation + matched[5];
        }
  
        // if there is at least one empty line at the end of this text, strip it
        // we'll be adding one back after the text but before the containing tag.
        text = text.replace(/\n[ \t]*$/, '');
  
        if (matched[2] || matched[3].indexOf('\n') !== -1) {
          // if the first line of the non-comment text has spaces
          // use that as the basis for indenting in null case.
          matched = matched[3].match(/[ \t]+$/);
          if (matched) {
            raw_token.whitespace_before = matched[0];
          }
        }
      }
  
      if (text) {
        if (_beautifier) {
  
          // call the Beautifier if avaliable
          var Child_options = function() {
            this.eol = '\n';
          };
          Child_options.prototype = this._options.raw_options;
          var child_options = new Child_options();
          text = _beautifier(indentation + text, child_options);
        } else {
          // simply indent the string otherwise
          var white = raw_token.whitespace_before;
          if (white) {
            text = text.replace(new RegExp('\n(' + white + ')?', 'g'), '\n');
          }
  
          text = indentation + text.replace(/\n/g, '\n' + indentation);
        }
      }
  
      if (pre) {
        if (!text) {
          text = pre + post;
        } else {
          text = pre + text + '\n' + post;
        }
      }
  
      printer.print_newline(false);
      if (text) {
        raw_token.text = text;
        raw_token.whitespace_before = '';
        raw_token.newlines = 0;
        printer.add_raw_token(raw_token);
        printer.print_newline(true);
      }
    }
  };
  
  Beautifier.prototype._handle_tag_open = function(printer, raw_token, last_tag_token, last_token) {
    var parser_token = this._get_tag_open_token(raw_token);
  
    if ((last_tag_token.is_unformatted || last_tag_token.is_content_unformatted) &&
      raw_token.type === TOKEN.TAG_OPEN && raw_token.text.indexOf('</') === 0) {
      // End element tags for unformatted or content_unformatted elements
      // are printed raw to keep any newlines inside them exactly the same.
      printer.add_raw_token(raw_token);
    } else {
      printer.traverse_whitespace(raw_token);
      this._set_tag_position(printer, raw_token, parser_token, last_tag_token, last_token);
      if (!parser_token.is_inline_element) {
        printer.set_wrap_point();
      }
      printer.print_token(raw_token);
    }
  
    //indent attributes an auto, forced, aligned or forced-align line-wrap
    if (this._is_wrap_attributes_force_aligned || this._is_wrap_attributes_aligned_multiple || this._is_wrap_attributes_preserve_aligned) {
      parser_token.alignment_size = raw_token.text.length + 1;
    }
  
    if (!parser_token.tag_complete && !parser_token.is_unformatted) {
      printer.alignment_size = parser_token.alignment_size;
    }
  
    return parser_token;
  };
  
  var TagOpenParserToken = function(parent, raw_token) {
    this.parent = parent || null;
    this.text = '';
    this.type = 'TK_TAG_OPEN';
    this.tag_name = '';
    this.is_inline_element = false;
    this.is_unformatted = false;
    this.is_content_unformatted = false;
    this.is_empty_element = false;
    this.is_start_tag = false;
    this.is_end_tag = false;
    this.indent_content = false;
    this.multiline_content = false;
    this.custom_beautifier_name = null;
    this.start_tag_token = null;
    this.attr_count = 0;
    this.has_wrapped_attrs = false;
    this.alignment_size = 0;
    this.tag_complete = false;
    this.tag_start_char = '';
    this.tag_check = '';
  
    if (!raw_token) {
      this.tag_complete = true;
    } else {
      var tag_check_match;
  
      this.tag_start_char = raw_token.text[0];
      this.text = raw_token.text;
  
      if (this.tag_start_char === '<') {
        tag_check_match = raw_token.text.match(/^<([^\s>]*)/);
        this.tag_check = tag_check_match ? tag_check_match[1] : '';
      } else {
        tag_check_match = raw_token.text.match(/^{{[#\^]?([^\s}]+)/);
        this.tag_check = tag_check_match ? tag_check_match[1] : '';
      }
      this.tag_check = this.tag_check.toLowerCase();
  
      if (raw_token.type === TOKEN.COMMENT) {
        this.tag_complete = true;
      }
  
      this.is_start_tag = this.tag_check.charAt(0) !== '/';
      this.tag_name = !this.is_start_tag ? this.tag_check.substr(1) : this.tag_check;
      this.is_end_tag = !this.is_start_tag ||
        (raw_token.closed && raw_token.closed.text === '/>');
  
      // handlebars tags that don't start with # or ^ are single_tags, and so also start and end.
      this.is_end_tag = this.is_end_tag ||
        (this.tag_start_char === '{' && (this.text.length < 3 || (/[^#\^]/.test(this.text.charAt(2)))));
    }
  };
  
  Beautifier.prototype._get_tag_open_token = function(raw_token) { //function to get a full tag and parse its type
    var parser_token = new TagOpenParserToken(this._tag_stack.get_parser_token(), raw_token);
  
    parser_token.alignment_size = this._options.wrap_attributes_indent_size;
  
    parser_token.is_end_tag = parser_token.is_end_tag ||
      in_array(parser_token.tag_check, this._options.void_elements);
  
    parser_token.is_empty_element = parser_token.tag_complete ||
      (parser_token.is_start_tag && parser_token.is_end_tag);
  
    parser_token.is_unformatted = !parser_token.tag_complete && in_array(parser_token.tag_check, this._options.unformatted);
    parser_token.is_content_unformatted = !parser_token.is_empty_element && in_array(parser_token.tag_check, this._options.content_unformatted);
    parser_token.is_inline_element = in_array(parser_token.tag_name, this._options.inline) || parser_token.tag_start_char === '{';
  
    return parser_token;
  };
  
  Beautifier.prototype._set_tag_position = function(printer, raw_token, parser_token, last_tag_token, last_token) {
  
    if (!parser_token.is_empty_element) {
      if (parser_token.is_end_tag) { //this tag is a double tag so check for tag-ending
        parser_token.start_tag_token = this._tag_stack.try_pop(parser_token.tag_name); //remove it and all ancestors
      } else { // it's a start-tag
        // check if this tag is starting an element that has optional end element
        // and do an ending needed
        if (this._do_optional_end_element(parser_token)) {
          if (!parser_token.is_inline_element) {
            if (parser_token.parent) {
              parser_token.parent.multiline_content = true;
            }
            printer.print_newline(false);
          }
  
        }
  
        this._tag_stack.record_tag(parser_token); //push it on the tag stack
  
        if ((parser_token.tag_name === 'script' || parser_token.tag_name === 'style') &&
          !(parser_token.is_unformatted || parser_token.is_content_unformatted)) {
          parser_token.custom_beautifier_name = get_custom_beautifier_name(parser_token.tag_check, raw_token);
        }
      }
    }
  
    if (in_array(parser_token.tag_check, this._options.extra_liners)) { //check if this double needs an extra line
      printer.print_newline(false);
      if (!printer._output.just_added_blankline()) {
        printer.print_newline(true);
      }
    }
  
    if (parser_token.is_empty_element) { //if this tag name is a single tag type (either in the list or has a closing /)
  
      // if you hit an else case, reset the indent level if you are inside an:
      // 'if', 'unless', or 'each' block.
      if (parser_token.tag_start_char === '{' && parser_token.tag_check === 'else') {
        this._tag_stack.indent_to_tag(['if', 'unless', 'each']);
        parser_token.indent_content = true;
        // Don't add a newline if opening {{#if}} tag is on the current line
        var foundIfOnCurrentLine = printer.current_line_has_match(/{{#if/);
        if (!foundIfOnCurrentLine) {
          printer.print_newline(false);
        }
      }
  
      // Don't add a newline before elements that should remain where they are.
      if (parser_token.tag_name === '!--' && last_token.type === TOKEN.TAG_CLOSE &&
        last_tag_token.is_end_tag && parser_token.text.indexOf('\n') === -1) {
        //Do nothing. Leave comments on same line.
      } else if (!parser_token.is_inline_element && !parser_token.is_unformatted) {
        printer.print_newline(false);
      }
    } else if (parser_token.is_unformatted || parser_token.is_content_unformatted) {
      if (!parser_token.is_inline_element && !parser_token.is_unformatted) {
        printer.print_newline(false);
      }
    } else if (parser_token.is_end_tag) { //this tag is a double tag so check for tag-ending
      if ((parser_token.start_tag_token && parser_token.start_tag_token.multiline_content) ||
        !(parser_token.is_inline_element ||
          (last_tag_token.is_inline_element) ||
          (last_token.type === TOKEN.TAG_CLOSE &&
            parser_token.start_tag_token === last_tag_token) ||
          (last_token.type === 'TK_CONTENT')
        )) {
        printer.print_newline(false);
      }
    } else { // it's a start-tag
      parser_token.indent_content = !parser_token.custom_beautifier_name;
  
      if (parser_token.tag_start_char === '<') {
        if (parser_token.tag_name === 'html') {
          parser_token.indent_content = this._options.indent_inner_html;
        } else if (parser_token.tag_name === 'head') {
          parser_token.indent_content = this._options.indent_head_inner_html;
        } else if (parser_token.tag_name === 'body') {
          parser_token.indent_content = this._options.indent_body_inner_html;
        }
      }
  
      if (!parser_token.is_inline_element && last_token.type !== 'TK_CONTENT') {
        if (parser_token.parent) {
          parser_token.parent.multiline_content = true;
        }
        printer.print_newline(false);
      }
    }
  };
  
  //To be used for <p> tag special case:
  //var p_closers = ['address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul'];
  
  Beautifier.prototype._do_optional_end_element = function(parser_token) {
    var result = null;
    // NOTE: cases of "if there is no more content in the parent element"
    // are handled automatically by the beautifier.
    // It assumes parent or ancestor close tag closes all children.
    // https://www.w3.org/TR/html5/syntax.html#optional-tags
    if (parser_token.is_empty_element || !parser_token.is_start_tag || !parser_token.parent) {
      return;
  
    } else if (parser_token.tag_name === 'body') {
      // A head element’s end tag may be omitted if the head element is not immediately followed by a space character or a comment.
      result = result || this._tag_stack.try_pop('head');
  
      //} else if (parser_token.tag_name === 'body') {
      // DONE: A body element’s end tag may be omitted if the body element is not immediately followed by a comment.
  
    } else if (parser_token.tag_name === 'li') {
      // An li element’s end tag may be omitted if the li element is immediately followed by another li element or if there is no more content in the parent element.
      result = result || this._tag_stack.try_pop('li', ['ol', 'ul']);
  
    } else if (parser_token.tag_name === 'dd' || parser_token.tag_name === 'dt') {
      // A dd element’s end tag may be omitted if the dd element is immediately followed by another dd element or a dt element, or if there is no more content in the parent element.
      // A dt element’s end tag may be omitted if the dt element is immediately followed by another dt element or a dd element.
      result = result || this._tag_stack.try_pop('dt', ['dl']);
      result = result || this._tag_stack.try_pop('dd', ['dl']);
  
      //} else if (p_closers.indexOf(parser_token.tag_name) !== -1) {
      //TODO: THIS IS A BUG FARM. We are not putting this into 1.8.0 as it is likely to blow up.
      //A p element’s end tag may be omitted if the p element is immediately followed by an address, article, aside, blockquote, details, div, dl, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, header, hr, main, nav, ol, p, pre, section, table, or ul element, or if there is no more content in the parent element and the parent element is an HTML element that is not an a, audio, del, ins, map, noscript, or video element, or an autonomous custom element.
      //result = result || this._tag_stack.try_pop('p', ['body']);
  
    } else if (parser_token.tag_name === 'rp' || parser_token.tag_name === 'rt') {
      // An rt element’s end tag may be omitted if the rt element is immediately followed by an rt or rp element, or if there is no more content in the parent element.
      // An rp element’s end tag may be omitted if the rp element is immediately followed by an rt or rp element, or if there is no more content in the parent element.
      result = result || this._tag_stack.try_pop('rt', ['ruby', 'rtc']);
      result = result || this._tag_stack.try_pop('rp', ['ruby', 'rtc']);
  
    } else if (parser_token.tag_name === 'optgroup') {
      // An optgroup element’s end tag may be omitted if the optgroup element is immediately followed by another optgroup element, or if there is no more content in the parent element.
      // An option element’s end tag may be omitted if the option element is immediately followed by another option element, or if it is immediately followed by an optgroup element, or if there is no more content in the parent element.
      result = result || this._tag_stack.try_pop('optgroup', ['select']);
      //result = result || this._tag_stack.try_pop('option', ['select']);
  
    } else if (parser_token.tag_name === 'option') {
      // An option element’s end tag may be omitted if the option element is immediately followed by another option element, or if it is immediately followed by an optgroup element, or if there is no more content in the parent element.
      result = result || this._tag_stack.try_pop('option', ['select', 'datalist', 'optgroup']);
  
    } else if (parser_token.tag_name === 'colgroup') {
      // DONE: A colgroup element’s end tag may be omitted if the colgroup element is not immediately followed by a space character or a comment.
      // A caption element's end tag may be ommitted if a colgroup, thead, tfoot, tbody, or tr element is started.
      result = result || this._tag_stack.try_pop('caption', ['table']);
  
    } else if (parser_token.tag_name === 'thead') {
      // A colgroup element's end tag may be ommitted if a thead, tfoot, tbody, or tr element is started.
      // A caption element's end tag may be ommitted if a colgroup, thead, tfoot, tbody, or tr element is started.
      result = result || this._tag_stack.try_pop('caption', ['table']);
      result = result || this._tag_stack.try_pop('colgroup', ['table']);
  
      //} else if (parser_token.tag_name === 'caption') {
      // DONE: A caption element’s end tag may be omitted if the caption element is not immediately followed by a space character or a comment.
  
    } else if (parser_token.tag_name === 'tbody' || parser_token.tag_name === 'tfoot') {
      // A thead element’s end tag may be omitted if the thead element is immediately followed by a tbody or tfoot element.
      // A tbody element’s end tag may be omitted if the tbody element is immediately followed by a tbody or tfoot element, or if there is no more content in the parent element.
      // A colgroup element's end tag may be ommitted if a thead, tfoot, tbody, or tr element is started.
      // A caption element's end tag may be ommitted if a colgroup, thead, tfoot, tbody, or tr element is started.
      result = result || this._tag_stack.try_pop('caption', ['table']);
      result = result || this._tag_stack.try_pop('colgroup', ['table']);
      result = result || this._tag_stack.try_pop('thead', ['table']);
      result = result || this._tag_stack.try_pop('tbody', ['table']);
  
      //} else if (parser_token.tag_name === 'tfoot') {
      // DONE: A tfoot element’s end tag may be omitted if there is no more content in the parent element.
  
    } else if (parser_token.tag_name === 'tr') {
      // A tr element’s end tag may be omitted if the tr element is immediately followed by another tr element, or if there is no more content in the parent element.
      // A colgroup element's end tag may be ommitted if a thead, tfoot, tbody, or tr element is started.
      // A caption element's end tag may be ommitted if a colgroup, thead, tfoot, tbody, or tr element is started.
      result = result || this._tag_stack.try_pop('caption', ['table']);
      result = result || this._tag_stack.try_pop('colgroup', ['table']);
      result = result || this._tag_stack.try_pop('tr', ['table', 'thead', 'tbody', 'tfoot']);
  
    } else if (parser_token.tag_name === 'th' || parser_token.tag_name === 'td') {
      // A td element’s end tag may be omitted if the td element is immediately followed by a td or th element, or if there is no more content in the parent element.
      // A th element’s end tag may be omitted if the th element is immediately followed by a td or th element, or if there is no more content in the parent element.
      result = result || this._tag_stack.try_pop('td', ['table', 'thead', 'tbody', 'tfoot', 'tr']);
      result = result || this._tag_stack.try_pop('th', ['table', 'thead', 'tbody', 'tfoot', 'tr']);
    }
  
    // Start element omission not handled currently
    // A head element’s start tag may be omitted if the element is empty, or if the first thing inside the head element is an element.
    // A tbody element’s start tag may be omitted if the first thing inside the tbody element is a tr element, and if the element is not immediately preceded by a tbody, thead, or tfoot element whose end tag has been omitted. (It can’t be omitted if the element is empty.)
    // A colgroup element’s start tag may be omitted if the first thing inside the colgroup element is a col element, and if the element is not immediately preceded by another colgroup element whose end tag has been omitted. (It can’t be omitted if the element is empty.)
  
    // Fix up the parent of the parser token
    parser_token.parent = this._tag_stack.get_parser_token();
  
    return result;
  };
  
  module.exports.Beautifier = Beautifier;
  
  
  /***/ }),
  /* 20 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  var BaseOptions = __webpack_require__(6).Options;
  
  function Options(options) {
    BaseOptions.call(this, options, 'html');
    if (this.templating.length === 1 && this.templating[0] === 'auto') {
      this.templating = ['django', 'erb', 'handlebars', 'php'];
    }
  
    this.indent_inner_html = this._get_boolean('indent_inner_html');
    this.indent_body_inner_html = this._get_boolean('indent_body_inner_html', true);
    this.indent_head_inner_html = this._get_boolean('indent_head_inner_html', true);
  
    this.indent_handlebars = this._get_boolean('indent_handlebars', true);
    this.wrap_attributes = this._get_selection('wrap_attributes',
      ['auto', 'force', 'force-aligned', 'force-expand-multiline', 'aligned-multiple', 'preserve', 'preserve-aligned']);
    this.wrap_attributes_indent_size = this._get_number('wrap_attributes_indent_size', this.indent_size);
    this.extra_liners = this._get_array('extra_liners', ['head', 'body', '/html']);
  
    // Block vs inline elements
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Inline_elements
    // https://www.w3.org/TR/html5/dom.html#phrasing-content
    this.inline = this._get_array('inline', [
      'a', 'abbr', 'area', 'audio', 'b', 'bdi', 'bdo', 'br', 'button', 'canvas', 'cite',
      'code', 'data', 'datalist', 'del', 'dfn', 'em', 'embed', 'i', 'iframe', 'img',
      'input', 'ins', 'kbd', 'keygen', 'label', 'map', 'mark', 'math', 'meter', 'noscript',
      'object', 'output', 'progress', 'q', 'ruby', 's', 'samp', /* 'script', */ 'select', 'small',
      'span', 'strong', 'sub', 'sup', 'svg', 'template', 'textarea', 'time', 'u', 'var',
      'video', 'wbr', 'text',
      // obsolete inline tags
      'acronym', 'big', 'strike', 'tt'
    ]);
    this.void_elements = this._get_array('void_elements', [
      // HTLM void elements - aka self-closing tags - aka singletons
      // https://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen',
      'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr',
      // NOTE: Optional tags are too complex for a simple list
      // they are hard coded in _do_optional_end_element
  
      // Doctype and xml elements
      '!doctype', '?xml',
  
      // obsolete tags
      // basefont: https://www.computerhope.com/jargon/h/html-basefont-tag.htm
      // isndex: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/isindex
      'basefont', 'isindex'
    ]);
    this.unformatted = this._get_array('unformatted', []);
    this.content_unformatted = this._get_array('content_unformatted', [
      'pre', 'textarea'
    ]);
    this.unformatted_content_delimiter = this._get_characters('unformatted_content_delimiter');
    this.indent_scripts = this._get_selection('indent_scripts', ['normal', 'keep', 'separate']);
  
  }
  Options.prototype = new BaseOptions();
  
  
  
  module.exports.Options = Options;
  
  
  /***/ }),
  /* 21 */
  /***/ (function(module, exports, __webpack_require__) {
  
  "use strict";
  /*jshint node:true */
  /*
  
    The MIT License (MIT)
  
    Copyright (c) 2007-2018 Einar Lielmanis, Liam Newman, and contributors.
  
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation files
    (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of the Software,
    and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
  
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
  
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
  
  
  
  var BaseTokenizer = __webpack_require__(9).Tokenizer;
  var BASETOKEN = __webpack_require__(9).TOKEN;
  var Directives = __webpack_require__(13).Directives;
  var TemplatablePattern = __webpack_require__(14).TemplatablePattern;
  var Pattern = __webpack_require__(12).Pattern;
  
  var TOKEN = {
    TAG_OPEN: 'TK_TAG_OPEN',
    TAG_CLOSE: 'TK_TAG_CLOSE',
    ATTRIBUTE: 'TK_ATTRIBUTE',
    EQUALS: 'TK_EQUALS',
    VALUE: 'TK_VALUE',
    COMMENT: 'TK_COMMENT',
    TEXT: 'TK_TEXT',
    UNKNOWN: 'TK_UNKNOWN',
    START: BASETOKEN.START,
    RAW: BASETOKEN.RAW,
    EOF: BASETOKEN.EOF
  };
  
  var directives_core = new Directives(/<\!--/, /-->/);
  
  var Tokenizer = function(input_string, options) {
    BaseTokenizer.call(this, input_string, options);
    this._current_tag_name = '';
  
    // Words end at whitespace or when a tag starts
    // if we are indenting handlebars, they are considered tags
    var templatable_reader = new TemplatablePattern(this._input).read_options(this._options);
    var pattern_reader = new Pattern(this._input);
  
    this.__patterns = {
      word: templatable_reader.until(/[\n\r\t <]/),
      single_quote: templatable_reader.until_after(/'/),
      double_quote: templatable_reader.until_after(/"/),
      attribute: templatable_reader.until(/[\n\r\t =\/>]/),
      element_name: templatable_reader.until(/[\n\r\t >\/]/),
  
      handlebars_comment: pattern_reader.starting_with(/{{!--/).until_after(/--}}/),
      handlebars: pattern_reader.starting_with(/{{/).until_after(/}}/),
      handlebars_open: pattern_reader.until(/[\n\r\t }]/),
      handlebars_raw_close: pattern_reader.until(/}}/),
      comment: pattern_reader.starting_with(/<!--/).until_after(/-->/),
      cdata: pattern_reader.starting_with(/<!\[cdata\[/).until_after(/]]>/),
      // https://en.wikipedia.org/wiki/Conditional_comment
      conditional_comment: pattern_reader.starting_with(/<!\[/).until_after(/]>/),
      processing: pattern_reader.starting_with(/<\?/).until_after(/\?>/)
    };
  
    if (this._options.indent_handlebars) {
      this.__patterns.word = this.__patterns.word.exclude('handlebars');
    }
  
    this._unformatted_content_delimiter = null;
  
    if (this._options.unformatted_content_delimiter) {
      var literal_regexp = this._input.get_literal_regexp(this._options.unformatted_content_delimiter);
      this.__patterns.unformatted_content_delimiter =
        pattern_reader.matching(literal_regexp)
        .until_after(literal_regexp);
    }
  };
  Tokenizer.prototype = new BaseTokenizer();
  
  Tokenizer.prototype._is_comment = function(current_token) { // jshint unused:false
    return false; //current_token.type === TOKEN.COMMENT || current_token.type === TOKEN.UNKNOWN;
  };
  
  Tokenizer.prototype._is_opening = function(current_token) {
    return current_token.type === TOKEN.TAG_OPEN;
  };
  
  Tokenizer.prototype._is_closing = function(current_token, open_token) {
    return current_token.type === TOKEN.TAG_CLOSE &&
      (open_token && (
        ((current_token.text === '>' || current_token.text === '/>') && open_token.text[0] === '<') ||
        (current_token.text === '}}' && open_token.text[0] === '{' && open_token.text[1] === '{')));
  };
  
  Tokenizer.prototype._reset = function() {
    this._current_tag_name = '';
  };
  
  Tokenizer.prototype._get_next_token = function(previous_token, open_token) { // jshint unused:false
    var token = null;
    this._readWhitespace();
    var c = this._input.peek();
  
    if (c === null) {
      return this._create_token(TOKEN.EOF, '');
    }
  
    token = token || this._read_open_handlebars(c, open_token);
    token = token || this._read_attribute(c, previous_token, open_token);
    token = token || this._read_raw_content(c, previous_token, open_token);
    token = token || this._read_close(c, open_token);
    token = token || this._read_content_word(c);
    token = token || this._read_comment(c);
    token = token || this._read_open(c, open_token);
    token = token || this._create_token(TOKEN.UNKNOWN, this._input.next());
  
    return token;
  };
  
  Tokenizer.prototype._read_comment = function(c) { // jshint unused:false
    var token = null;
    var resulting_string = null;
    var directives = null;
  
    if (c === '<') {
      var peek1 = this._input.peek(1);
      //if we're in a comment, do something special
      // We treat all comments as literals, even more than preformatted tags
      // we just look for the appropriate close tag
      if (c === '<' && (peek1 === '!' || peek1 === '?')) {
        resulting_string = this.__patterns.comment.read();
  
        // only process directive on html comments
        if (resulting_string) {
          directives = directives_core.get_directives(resulting_string);
          if (directives && directives.ignore === 'start') {
            resulting_string += directives_core.readIgnored(this._input);
          }
        } else {
          resulting_string = this.__patterns.cdata.read();
          resulting_string = resulting_string || this.__patterns.conditional_comment.read();
          resulting_string = resulting_string || this.__patterns.processing.read();
        }
      }
  
      if (resulting_string) {
        token = this._create_token(TOKEN.COMMENT, resulting_string);
        token.directives = directives;
      }
    }
  
    return token;
  };
  
  Tokenizer.prototype._read_open = function(c, open_token) {
    var resulting_string = null;
    var token = null;
    if (!open_token) {
      if (c === '<') {
  
        resulting_string = this._input.next();
        if (this._input.peek() === '/') {
          resulting_string += this._input.next();
        }
        resulting_string += this.__patterns.element_name.read();
        token = this._create_token(TOKEN.TAG_OPEN, resulting_string);
      }
    }
    return token;
  };
  
  Tokenizer.prototype._read_open_handlebars = function(c, open_token) {
    var resulting_string = null;
    var token = null;
    if (!open_token) {
      if (this._options.indent_handlebars && c === '{' && this._input.peek(1) === '{') {
        if (this._input.peek(2) === '!') {
          resulting_string = this.__patterns.handlebars_comment.read();
          resulting_string = resulting_string || this.__patterns.handlebars.read();
          token = this._create_token(TOKEN.COMMENT, resulting_string);
        } else {
          resulting_string = this.__patterns.handlebars_open.read();
          token = this._create_token(TOKEN.TAG_OPEN, resulting_string);
        }
      }
    }
    return token;
  };
  
  
  Tokenizer.prototype._read_close = function(c, open_token) {
    var resulting_string = null;
    var token = null;
    if (open_token) {
      if (open_token.text[0] === '<' && (c === '>' || (c === '/' && this._input.peek(1) === '>'))) {
        resulting_string = this._input.next();
        if (c === '/') { //  for close tag "/>"
          resulting_string += this._input.next();
        }
        token = this._create_token(TOKEN.TAG_CLOSE, resulting_string);
      } else if (open_token.text[0] === '{' && c === '}' && this._input.peek(1) === '}') {
        this._input.next();
        this._input.next();
        token = this._create_token(TOKEN.TAG_CLOSE, '}}');
      }
    }
  
    return token;
  };
  
  Tokenizer.prototype._read_attribute = function(c, previous_token, open_token) {
    var token = null;
    var resulting_string = '';
    if (open_token && open_token.text[0] === '<') {
  
      if (c === '=') {
        token = this._create_token(TOKEN.EQUALS, this._input.next());
      } else if (c === '"' || c === "'") {
        var content = this._input.next();
        if (c === '"') {
          content += this.__patterns.double_quote.read();
        } else {
          content += this.__patterns.single_quote.read();
        }
        token = this._create_token(TOKEN.VALUE, content);
      } else {
        resulting_string = this.__patterns.attribute.read();
  
        if (resulting_string) {
          if (previous_token.type === TOKEN.EQUALS) {
            token = this._create_token(TOKEN.VALUE, resulting_string);
          } else {
            token = this._create_token(TOKEN.ATTRIBUTE, resulting_string);
          }
        }
      }
    }
    return token;
  };
  
  Tokenizer.prototype._is_content_unformatted = function(tag_name) {
    // void_elements have no content and so cannot have unformatted content
    // script and style tags should always be read as unformatted content
    // finally content_unformatted and unformatted element contents are unformatted
    return this._options.void_elements.indexOf(tag_name) === -1 &&
      (this._options.content_unformatted.indexOf(tag_name) !== -1 ||
        this._options.unformatted.indexOf(tag_name) !== -1);
  };
  
  
  Tokenizer.prototype._read_raw_content = function(c, previous_token, open_token) { // jshint unused:false
    var resulting_string = '';
    if (open_token && open_token.text[0] === '{') {
      resulting_string = this.__patterns.handlebars_raw_close.read();
    } else if (previous_token.type === TOKEN.TAG_CLOSE && (previous_token.opened.text[0] === '<')) {
      var tag_name = previous_token.opened.text.substr(1).toLowerCase();
      if (tag_name === 'script' || tag_name === 'style') {
        // Script and style tags are allowed to have comments wrapping their content
        // or just have regular content.
        var token = this._read_comment(c);
        if (token) {
          token.type = TOKEN.TEXT;
          return token;
        }
        resulting_string = this._input.readUntil(new RegExp('</' + tag_name + '[\\n\\r\\t ]*?>', 'ig'));
      } else if (this._is_content_unformatted(tag_name)) {
        resulting_string = this._input.readUntil(new RegExp('</' + tag_name + '[\\n\\r\\t ]*?>', 'ig'));
      }
    }
  
    if (resulting_string) {
      return this._create_token(TOKEN.TEXT, resulting_string);
    }
  
    return null;
  };
  
  Tokenizer.prototype._read_content_word = function(c) {
    var resulting_string = '';
    if (this._options.unformatted_content_delimiter) {
      if (c === this._options.unformatted_content_delimiter[0]) {
        resulting_string = this.__patterns.unformatted_content_delimiter.read();
      }
    }
  
    if (!resulting_string) {
      resulting_string = this.__patterns.word.read();
    }
    if (resulting_string) {
      return this._create_token(TOKEN.TEXT, resulting_string);
    }
  };
  
  module.exports.Tokenizer = Tokenizer;
  module.exports.TOKEN = TOKEN;
  
  
  /***/ })
  /******/ ]);
  var style_html = legacy_beautify_html;
  /* Footer */
  if (typeof window !== "undefined") {
      // If we're running a web page and don't have either of the above, add our one global
      window.html_beautify = function(html_source, options) {
          return style_html(html_source, options, window.js_beautify, window.css_beautify);
      };
  } else if (typeof global !== "undefined") {
      // If we don't even have window, try global.
      global.html_beautify = function(html_source, options) {
          return style_html(html_source, options, global.js_beautify, global.css_beautify);
      };
  }
  
  }());


/**
 * 工具包 压缩JS
 */
var base2 = {
    name: "base2",
    version: "1.0",
    exports: "Base,Package,Abstract,Module,Enumerable,Map,Collection,RegGrp,Undefined,Null,This,True,False,assignID,detect,global",
    namespace: ""
  };
  new
  function(_y) {
    var Undefined = K(),
    Null = K(null),
    True = K(true),
    False = K(false),
    This = function() {
      return this
    };
    var global = This();
    var base2 = global.base2;
    var _z = /%([1-9])/g;
    var _g = /^\s\s*/;
    var _h = /\s\s*$/;
    var _i = /([\/()[\]{}|*+-.,^$?\\])/g;
    var _9 = /try/.test(detect) ? /\bbase\b/: /.*/;
    var _a = ["constructor", "toString", "valueOf"];
    var _j = detect("(jscript)") ? new RegExp("^" + rescape(isNaN).replace(/isNaN/, "\\w+") + "$") : {
      test: False
    };
    var _k = 1;
    var _2 = Array.prototype.slice;
    _5();
    function assignID(a) {
      if (!a.base2ID) a.base2ID = "b2_" + _k++;
      return a.base2ID
    };
    var _b = function(a, b) {
      base2.__prototyping = this.prototype;
      var c = new this;
      if (a) extend(c, a);
      delete base2.__prototyping;
      var e = c.constructor;
      function d() {
        if (!base2.__prototyping) {
          if (this.constructor == arguments.callee || this.__constructing) {
            this.__constructing = true;
            e.apply(this, arguments);
            delete this.__constructing
          } else {
            return extend(arguments[0], c)
          }
        }
        return this
      };
      c.constructor = d;
      for (var f in Base) d[f] = this[f];
      d.ancestor = this;
      d.base = Undefined;
      if (b) extend(d, b);
      d.prototype = c;
      if (d.init) d.init();
      return d
    };
    var Base = _b.call(Object, {
      constructor: function() {
        if (arguments.length > 0) {
          this.extend(arguments[0])
        }
      },
      base: function() {},
      extend: delegate(extend)
    },
    Base = {
      ancestorOf: function(a) {
        return _7(this, a)
      },
      extend: _b,
      forEach: function(a, b, c) {
        _5(this, a, b, c)
      },
      implement: function(a) {
        if (typeof a == "function") {
          a = a.prototype
        }
        extend(this.prototype, a);
        return this
      }
    });
    var Package = Base.extend({
      constructor: function(e, d) {
        this.extend(d);
        if (this.init) this.init();
        if (this.name && this.name != "base2") {
          if (!this.parent) this.parent = base2;
          this.parent.addName(this.name, this);
          this.namespace = format("var %1=%2;", this.name, String2.slice(this, 1, -1))
        }
        if (e) {
          var f = base2.JavaScript ? base2.JavaScript.namespace: "";
          e.imports = Array2.reduce(csv(this.imports),
          function(a, b) {
            var c = h(b) || h("JavaScript." + b);
            return a += c.namespace
          },
          "var base2=(function(){return this.base2})();" + base2.namespace + f) + lang.namespace;
          e.exports = Array2.reduce(csv(this.exports),
          function(a, b) {
            var c = this.name + "." + b;
            this.namespace += "var " + b + "=" + c + ";";
            return a += "if(!" + c + ")" + c + "=" + b + ";"
          },
          "", this) + "this._l" + this.name + "();";
          var g = this;
          var i = String2.slice(this, 1, -1);
          e["_l" + this.name] = function() {
            Package.forEach(g,
            function(a, b) {
              if (a && a.ancestorOf == Base.ancestorOf) {
                a.toString = K(format("[%1.%2]", i, b));
                if (a.prototype.toString == Base.prototype.toString) {
                  a.prototype.toString = K(format("[object %1.%2]", i, b))
                }
              }
            })
          }
        }
        function h(a) {
          a = a.split(".");
          var b = base2,
          c = 0;
          while (b && a[c] != null) {
            b = b[a[c++]]
          }
          return b
        }
      },
      exports: "",
      imports: "",
      name: "",
      namespace: "",
      parent: null,
      addName: function(a, b) {
        if (!this[a]) {
          this[a] = b;
          this.exports += "," + a;
          this.namespace += format("var %1=%2.%1;", a, this.name)
        }
      },
      addPackage: function(a) {
        this.addName(a, new Package(null, {
          name: a,
          parent: this
        }))
      },
      toString: function() {
        return format("[%1]", this.parent ? String2.slice(this.parent, 1, -1) + "." + this.name: this.name)
      }
    });
    var Abstract = Base.extend({
      constructor: function() {
        throw new TypeError("Abstract class cannot be instantiated.");
      }
    });
    var _m = 0;
    var Module = Abstract.extend(null, {
      namespace: "",
      extend: function(a, b) {
        var c = this.base();
        var e = _m++;
        c.namespace = "";
        c.partial = this.partial;
        c.toString = K("[base2.Module[" + e + "]]");
        Module[e] = c;
        c.implement(this);
        if (a) c.implement(a);
        if (b) {
          extend(c, b);
          if (c.init) c.init()
        }
        return c
      },
      forEach: function(c, e) {
        _5(Module, this.prototype,
        function(a, b) {
          if (typeOf(a) == "function") {
            c.call(e, this[b], b, this)
          }
        },
        this)
      },
      implement: function(a) {
        var b = this;
        var c = b.toString().slice(1, -1);
        if (typeof a == "function") {
          if (!_7(a, b)) {
            this.base(a)
          }
          if (_7(Module, a)) {
            for (var e in a) {
              if (b[e] === undefined) {
                var d = a[e];
                if (typeof d == "function" && d.call && a.prototype[e]) {
                  d = _n(a, e)
                }
                b[e] = d
              }
            }
            b.namespace += a.namespace.replace(/base2\.Module\[\d+\]/g, c)
          }
        } else {
          extend(b, a);
          _c(b, a)
        }
        return b
      },
      partial: function() {
        var c = Module.extend();
        var e = c.toString().slice(1, -1);
        c.namespace = this.namespace.replace(/(\w+)=b[^\)]+\)/g, "$1=" + e + ".$1");
        this.forEach(function(a, b) {
          c[b] = partial(bind(a, c))
        });
        return c
      }
    });
    function _c(a, b) {
      var c = a.prototype;
      var e = a.toString().slice(1, -1);
      for (var d in b) {
        var f = b[d],
        g = "";
        if (d.charAt(0) == "@") {
          if (detect(d.slice(1))) _c(a, f)
        } else if (!c[d]) {
          if (d == d.toUpperCase()) {
            g = "var " + d + "=" + e + "." + d + ";"
          } else if (typeof f == "function" && f.call) {
            g = "var " + d + "=base2.lang.bind('" + d + "'," + e + ");";
            c[d] = _o(a, d)
          }
          if (a.namespace.indexOf(g) == -1) {
            a.namespace += g
          }
        }
      }
    };
    function _n(a, b) {
      return function() {
        return a[b].apply(a, arguments)
      }
    };
    function _o(b, c) {
      return function() {
        var a = _2.call(arguments);
        a.unshift(this);
        return b[c].apply(b, a)
      }
    };
    var Enumerable = Module.extend({
      every: function(c, e, d) {
        var f = true;
        try {
          forEach(c,
          function(a, b) {
            f = e.call(d, a, b, c);
            if (!f) throw StopIteration;
          })
        } catch(error) {
          if (error != StopIteration) throw error;
        }
        return !! f
      },
      filter: function(e, d, f) {
        var g = 0;
        return this.reduce(e,
        function(a, b, c) {
          if (d.call(f, b, c, e)) {
            a[g++] = b
          }
          return a
        },
        [])
      },
      invoke: function(b, c) {
        var e = _2.call(arguments, 2);
        return this.map(b, (typeof c == "function") ?
        function(a) {
          return a == null ? undefined: c.apply(a, e)
        }: function(a) {
          return a == null ? undefined: a[c].apply(a, e)
        })
      },
      map: function(c, e, d) {
        var f = [],
        g = 0;
        forEach(c,
        function(a, b) {
          f[g++] = e.call(d, a, b, c)
        });
        return f
      },
      pluck: function(b, c) {
        return this.map(b,
        function(a) {
          return a == null ? undefined: a[c]
        })
      },
      reduce: function(c, e, d, f) {
        var g = arguments.length > 2;
        forEach(c,
        function(a, b) {
          if (g) {
            d = e.call(f, d, a, b, c)
          } else {
            d = a;
            g = true
          }
        });
        return d
      },
      some: function(a, b, c) {
        return ! this.every(a, not(b), c)
      }
    });
    var _1 = "#";
    var Map = Base.extend({
      constructor: function(a) {
        if (a) this.merge(a)
      },
      clear: function() {
        for (var a in this) if (a.indexOf(_1) == 0) {
          delete this[a]
        }
      },
      copy: function() {
        base2.__prototyping = true;
        var a = new this.constructor;
        delete base2.__prototyping;
        for (var b in this) if (this[b] !== a[b]) {
          a[b] = this[b]
        }
        return a
      },
      forEach: function(a, b) {
        for (var c in this) if (c.indexOf(_1) == 0) {
          a.call(b, this[c], c.slice(1), this)
        }
      },
      get: function(a) {
        return this[_1 + a]
      },
      getKeys: function() {
        return this.map(II)
      },
      getValues: function() {
        return this.map(I)
      },
      has: function(a) {
        /*@cc_on @*/
        /*@if(@_jscript_version<5.5)return $Legacy.has(this,_1+a);@else @*/
        return _1 + a in this;
        /*@end @*/
      },
      merge: function(b) {
        var c = flip(this.put);
        forEach(arguments,
        function(a) {
          forEach(a, c, this)
        },
        this);
        return this
      },
      put: function(a, b) {
        this[_1 + a] = b
      },
      remove: function(a) {
        delete this[_1 + a]
      },
      size: function() {
        var a = 0;
        for (var b in this) if (b.indexOf(_1) == 0) a++;
        return a
      },
      union: function(a) {
        return this.merge.apply(this.copy(), arguments)
      }
    });
    Map.implement(Enumerable);
    Map.prototype.filter = function(e, d) {
      return this.reduce(function(a, b, c) {
        if (!e.call(d, b, c, this)) {
          a.remove(c)
        }
        return a
      },
      this.copy(), this)
    };
    var _0 = "~";
    var Collection = Map.extend({
      constructor: function(a) {
        this[_0] = new Array2;
        this.base(a)
      },
      add: function(a, b) {
        assert(!this.has(a), "Duplicate key '" + a + "'.");
        this.put.apply(this, arguments)
      },
      clear: function() {
        this.base();
        this[_0].length = 0
      },
      copy: function() {
        var a = this.base();
        a[_0] = this[_0].copy();
        return a
      },
      forEach: function(a, b) {
        var c = this[_0];
        var e = c.length;
        for (var d = 0; d < e; d++) {
          a.call(b, this[_1 + c[d]], c[d], this)
        }
      },
      getAt: function(a) {
        var b = this[_0].item(a);
        return (b === undefined) ? undefined: this[_1 + b]
      },
      getKeys: function() {
        return this[_0].copy()
      },
      indexOf: function(a) {
        return this[_0].indexOf(String(a))
      },
      insertAt: function(a, b, c) {
        assert(this[_0].item(a) !== undefined, "Index out of bounds.");
        assert(!this.has(b), "Duplicate key '" + b + "'.");
        this[_0].insertAt(a, String(b));
        this[_1 + b] = null;
        this.put.apply(this, _2.call(arguments, 1))
      },
      item: function(a) {
        return this[typeof a == "number" ? "getAt": "get"](a)
      },
      put: function(a, b) {
        if (!this.has(a)) {
          this[_0].push(String(a))
        }
        var c = this.constructor;
        if (c.Item && !instanceOf(b, c.Item)) {
          b = c.create.apply(c, arguments)
        }
        this[_1 + a] = b
      },
      putAt: function(a, b) {
        arguments[0] = this[_0].item(a);
        assert(arguments[0] !== undefined, "Index out of bounds.");
        this.put.apply(this, arguments)
      },
      remove: function(a) {
        if (this.has(a)) {
          this[_0].remove(String(a));
          delete this[_1 + a]
        }
      },
      removeAt: function(a) {
        var b = this[_0].item(a);
        if (b !== undefined) {
          this[_0].removeAt(a);
          delete this[_1 + b]
        }
      },
      reverse: function() {
        this[_0].reverse();
        return this
      },
      size: function() {
        return this[_0].length
      },
      slice: function(a, b) {
        var c = this.copy();
        if (arguments.length > 0) {
          var e = this[_0],
          d = e;
          c[_0] = Array2(_2.apply(e, arguments));
          if (c[_0].length) {
            d = d.slice(0, a);
            if (arguments.length > 1) {
              d = d.concat(e.slice(b))
            }
          }
          for (var f = 0; f < d.length; f++) {
            delete c[_1 + d[f]]
          }
        }
        return c
      },
      sort: function(c) {
        if (c) {
          this[_0].sort(bind(function(a, b) {
            return c(this[_1 + a], this[_1 + b], a, b)
          },
          this))
        } else this[_0].sort();
        return this
      },
      toString: function() {
        return "(" + (this[_0] || "") + ")"
      }
    },
    {
      Item: null,
      create: function(a, b) {
        return this.Item ? new this.Item(a, b) : b
      },
      extend: function(a, b) {
        var c = this.base(a);
        c.create = this.create;
        if (b) extend(c, b);
        if (!c.Item) {
          c.Item = this.Item
        } else if (typeof c.Item != "function") {
          c.Item = (this.Item || Base).extend(c.Item)
        }
        if (c.init) c.init();
        return c
      }
    });
    var _p = /\\(\d+)/g,
    _q = /\\./g,
    _r = /\(\?[:=!]|\[[^\]]+\]/g,
    _s = /\(/g,
    _t = /\$(\d+)/,
    _u = /^\$\d+$/;
    var RegGrp = Collection.extend({
      constructor: function(a, b) {
        this.base(a);
        this.ignoreCase = !!b
      },
      ignoreCase: false,
      exec: function(g, i) {
        g += "";
        var h = this,
        j = this[_0];
        if (!j.length) return g;
        if (i == RegGrp.IGNORE) i = 0;
        return g.replace(new RegExp(this, this.ignoreCase ? "gi": "g"),
        function(a) {
          var b, c = 1,
          e = 0;
          while ((b = h[_1 + j[e++]])) {
            var d = c + b.length + 1;
            if (arguments[c]) {
              var f = i == null ? b.replacement: i;
              switch (typeof f) {
              case "function":
                return f.apply(h, _2.call(arguments, c, d));
              case "number":
                return arguments[c + f];
              default:
                return f
              }
            }
            c = d
          }
          return a
        })
      },
      insertAt: function(a, b, c) {
        if (instanceOf(b, RegExp)) {
          arguments[1] = b.source
        }
        return base(this, arguments)
      },
      test: function(a) {
        return this.exec(a) != a
      },
      toString: function() {
        var d = 1;
        return "(" + this.map(function(c) {
          var e = (c + "").replace(_p,
          function(a, b) {
            return "\\" + (d + Number(b))
          });
          d += c.length + 1;
          return e
        }).join(")|(") + ")"
      }
    },
    {
      IGNORE: "$0",
      init: function() {
        forEach("add,get,has,put,remove".split(","),
        function(b) {
          _8(this, b,
          function(a) {
            if (instanceOf(a, RegExp)) {
              arguments[0] = a.source
            }
            return base(this, arguments)
          })
        },
        this.prototype)
      },
      Item: {
        constructor: function(a, b) {
          if (b == null) b = RegGrp.IGNORE;
          else if (b.replacement != null) b = b.replacement;
          else if (typeof b != "function") b = String(b);
          if (typeof b == "string" && _t.test(b)) {
            if (_u.test(b)) {
              b = parseInt(b.slice(1))
            } else {
              var c = '"';
              b = b.replace(/\\/g, "\\\\").replace(/"/g, "\\x22").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\$(\d+)/g, c + "+(arguments[$1]||" + c + c + ")+" + c).replace(/(['"])\1\+(.*)\+\1\1$/, "$1");
              b = new Function("return " + c + b + c)
            }
          }
          this.length = RegGrp.count(a);
          this.replacement = b;
          this.toString = K(a + "")
        },
        length: 0,
        replacement: ""
      },
      count: function(a) {
        a = (a + "").replace(_q, "").replace(_r, "");
        return match(a, _s).length
      }
    });
    var lang = {
      name: "lang",
      version: base2.version,
      exports: "assert,assertArity,assertType,base,bind,copy,extend,forEach,format,instanceOf,match,pcopy,rescape,trim,typeOf",
      namespace: ""
    };
    function assert(a, b, c) {
      if (!a) {
        throw new(c || Error)(b || "Assertion failed.");
      }
    };
    function assertArity(a, b, c) {
      if (b == null) b = a.callee.length;
      if (a.length < b) {
        throw new SyntaxError(c || "Not enough arguments.");
      }
    };
    function assertType(a, b, c) {
      if (b && (typeof b == "function" ? !instanceOf(a, b) : typeOf(a) != b)) {
        throw new TypeError(c || "Invalid type.");
      }
    };
    function copy(a) {
      var b = {};
      for (var c in a) {
        b[c] = a[c]
      }
      return b
    };
    function pcopy(a) {
      _d.prototype = a;
      return new _d
    };
    function _d() {};
    function base(a, b) {
      return a.base.apply(a, b)
    };
    function extend(a, b) {
      if (a && b) {
        if (arguments.length > 2) {
          var c = b;
          b = {};
          b[c] = arguments[2]
        }
        var e = global[(typeof b == "function" ? "Function": "Object")].prototype;
        if (base2.__prototyping) {
          var d = _a.length,
          c;
          while ((c = _a[--d])) {
            var f = b[c];
            if (f != e[c]) {
              if (_9.test(f)) {
                _8(a, c, f)
              } else {
                a[c] = f
              }
            }
          }
        }
        for (c in b) {
          if (e[c] === undefined) {
            var f = b[c];
            if (c.charAt(0) == "@") {
              if (detect(c.slice(1))) extend(a, f)
            } else {
              var g = a[c];
              if (g && typeof f == "function") {
                if (f != g) {
                  if (_9.test(f)) {
                    _8(a, c, f)
                  } else {
                    f.ancestor = g;
                    a[c] = f
                  }
                }
              } else {
                a[c] = f
              }
            }
          }
        }
      }
      return a
    };
    function _7(a, b) {
      while (b) {
        if (!b.ancestor) return false;
        b = b.ancestor;
        if (b == a) return true
      }
      return false
    };
    function _8(c, e, d) {
      var f = c[e];
      var g = base2.__prototyping;
      if (g && f != g[e]) g = null;
      function i() {
        var a = this.base;
        this.base = g ? g[e] : f;
        var b = d.apply(this, arguments);
        this.base = a;
        return b
      };
      i.method = d;
      i.ancestor = f;
      c[e] = i
    };
    if (typeof StopIteration == "undefined") {
      StopIteration = new Error("StopIteration")
    }
    function forEach(a, b, c, e) {
      if (a == null) return;
      if (!e) {
        if (typeof a == "function" && a.call) {
          e = Function
        } else if (typeof a.forEach == "function" && a.forEach != arguments.callee) {
          a.forEach(b, c);
          return
        } else if (typeof a.length == "number") {
          _e(a, b, c);
          return
        }
      }
      _5(e || Object, a, b, c)
    };
    forEach.csv = function(a, b, c) {
      forEach(csv(a), b, c)
    };
    forEach.detect = function(c, e, d) {
      forEach(c,
      function(a, b) {
        if (b.charAt(0) == "@") {
          if (detect(b.slice(1))) forEach(a, arguments.callee)
        } else e.call(d, a, b, c)
      })
    };
    function _e(a, b, c) {
      if (a == null) a = global;
      var e = a.length || 0,
      d;
      if (typeof a == "string") {
        for (d = 0; d < e; d++) {
          b.call(c, a.charAt(d), d, a)
        }
      } else {
        for (d = 0; d < e; d++) {
          /*@cc_on @*/
          /*@if(@_jscript_version<5.2)if($Legacy.has(a,d))@else @*/
          if (d in a)
          /*@end @*/
          b.call(c, a[d], d, a)
        }
      }
    };
    function _5(g, i, h, j) {
      var k = function() {
        this.i = 1
      };
      k.prototype = {
        i: 1
      };
      var l = 0;
      for (var m in new k) l++;
      _5 = (l > 1) ?
      function(a, b, c, e) {
        var d = {};
        for (var f in b) {
          if (!d[f] && a.prototype[f] === undefined) {
            d[f] = true;
            c.call(e, b[f], f, b)
          }
        }
      }: function(a, b, c, e) {
        for (var d in b) {
          if (a.prototype[d] === undefined) {
            c.call(e, b[d], d, b)
          }
        }
      };
      _5(g, i, h, j)
    };
    function instanceOf(a, b) {
      if (typeof b != "function") {
        throw new TypeError("Invalid 'instanceOf' operand.");
      }
      if (a == null) return false;
      /*@cc_on if(typeof a.constructor!="function"){return typeOf(a)==typeof b.prototype.valueOf()}@*/
      if (a.constructor == b) return true;
      if (b.ancestorOf) return b.ancestorOf(a.constructor);
      /*@if(@_jscript_version<5.1)@else @*/
      if (a instanceof b) return true;
      /*@end @*/
      if (Base.ancestorOf == b.ancestorOf) return false;
      if (Base.ancestorOf == a.constructor.ancestorOf) return b == Object;
      switch (b) {
      case Array:
        return !! (typeof a == "object" && a.join && a.splice);
      case Function:
        return typeOf(a) == "function";
      case RegExp:
        return typeof a.constructor.$1 == "string";
      case Date:
        return !! a.getTimezoneOffset;
      case String:
      case Number:
      case Boolean:
        return typeOf(a) == typeof b.prototype.valueOf();
      case Object:
        return true
      }
      return false
    };
    function typeOf(a) {
      var b = typeof a;
      switch (b) {
      case "object":
        return a == null ? "null": typeof a.constructor == "undefined" ? _j.test(a) ? "function": b: typeof a.constructor.prototype.valueOf();
      case "function":
        return typeof a.call == "function" ? b: "object";
      default:
        return b
      }
    };
    var JavaScript = {
      name: "JavaScript",
      version: base2.version,
      exports: "Array2,Date2,Function2,String2",
      namespace: "",
      bind: function(c) {
        var e = global;
        global = c;
        forEach.csv(this.exports,
        function(a) {
          var b = a.slice(0, -1);
          extend(c[b], this[a]);
          this[a](c[b].prototype)
        },
        this);
        global = e;
        return c
      }
    };
    function _6(b, c, e, d) {
      var f = Module.extend();
      var g = f.toString().slice(1, -1);
      forEach.csv(e,
      function(a) {
        f[a] = unbind(b.prototype[a]);
        f.namespace += format("var %1=%2.%1;", a, g)
      });
      forEach(_2.call(arguments, 3), f.implement, f);
      var i = function() {
        return f(this.constructor == f ? c.apply(null, arguments) : arguments[0])
      };
      i.prototype = f.prototype;
      for (var h in f) {
        if (h != "prototype" && b[h]) {
          f[h] = b[h];
          delete f.prototype[h]
        }
        i[h] = f[h]
      }
      i.ancestor = Object;
      delete i.extend;
      i.namespace = i.namespace.replace(/(var (\w+)=)[^,;]+,([^\)]+)\)/g, "$1$3.$2");
      return i
    };
    if ((new Date).getYear() > 1900) {
      Date.prototype.getYear = function() {
        return this.getFullYear() - 1900
      };
      Date.prototype.setYear = function(a) {
        return this.setFullYear(a + 1900)
      }
    }
    var _f = new Date(Date.UTC(2006, 1, 20));
    _f.setUTCDate(15);
    if (_f.getUTCHours() != 0) {
      forEach.csv("FullYear,Month,Date,Hours,Minutes,Seconds,Milliseconds",
      function(b) {
        extend(Date.prototype, "setUTC" + b,
        function() {
          var a = base(this, arguments);
          if (a >= 57722401000) {
            a -= 3600000;
            this.setTime(a)
          }
          return a
        })
      })
    }
    Function.prototype.prototype = {};
    if ("".replace(/^/, K("$$")) == "$") {
      extend(String.prototype, "replace",
      function(a, b) {
        if (typeof b == "function") {
          var c = b;
          b = function() {
            return String(c.apply(null, arguments)).split("$").join("$$")
          }
        }
        return this.base(a, b)
      })
    }
    var Array2 = _6(Array, Array, "concat,join,pop,push,reverse,shift,slice,sort,splice,unshift", Enumerable, {
      combine: function(e, d) {
        if (!d) d = e;
        return Array2.reduce(e,
        function(a, b, c) {
          a[b] = d[c];
          return a
        },
        {})
      },
      contains: function(a, b) {
        return Array2.indexOf(a, b) != -1
      },
      copy: function(a) {
        var b = _2.call(a);
        if (!b.swap) Array2(b);
        return b
      },
      flatten: function(c) {
        var e = 0;
        return Array2.reduce(c,
        function(a, b) {
          if (Array2.like(b)) {
            Array2.reduce(b, arguments.callee, a)
          } else {
            a[e++] = b
          }
          return a
        },
        [])
      },
      forEach: _e,
      indexOf: function(a, b, c) {
        var e = a.length;
        if (c == null) {
          c = 0
        } else if (c < 0) {
          c = Math.max(0, e + c)
        }
        for (var d = c; d < e; d++) {
          if (a[d] === b) return d
        }
        return - 1
      },
      insertAt: function(a, b, c) {
        Array2.splice(a, b, 0, c);
        return c
      },
      item: function(a, b) {
        if (b < 0) b += a.length;
        return a[b]
      },
      lastIndexOf: function(a, b, c) {
        var e = a.length;
        if (c == null) {
          c = e - 1
        } else if (c < 0) {
          c = Math.max(0, e + c)
        }
        for (var d = c; d >= 0; d--) {
          if (a[d] === b) return d
        }
        return - 1
      },
      map: function(c, e, d) {
        var f = [];
        Array2.forEach(c,
        function(a, b) {
          f[b] = e.call(d, a, b, c)
        });
        return f
      },
      remove: function(a, b) {
        var c = Array2.indexOf(a, b);
        if (c != -1) Array2.removeAt(a, c)
      },
      removeAt: function(a, b) {
        Array2.splice(a, b, 1)
      },
      swap: function(a, b, c) {
        if (b < 0) b += a.length;
        if (c < 0) c += a.length;
        var e = a[b];
        a[b] = a[c];
        a[c] = e;
        return a
      }
    });
    Array2.reduce = Enumerable.reduce;
    Array2.like = function(a) {
      return typeOf(a) == "object" && typeof a.length == "number"
    };
    var _v = /^((-\d+|\d{4,})(-(\d{2})(-(\d{2}))?)?)?T((\d{2})(:(\d{2})(:(\d{2})(\.(\d{1,3})(\d)?\d*)?)?)?)?(([+-])(\d{2})(:(\d{2}))?|Z)?$/;
    var _4 = {
      FullYear: 2,
      Month: 4,
      Date: 6,
      Hours: 8,
      Minutes: 10,
      Seconds: 12,
      Milliseconds: 14
    };
    var _3 = {
      Hectomicroseconds: 15,
      UTC: 16,
      Sign: 17,
      Hours: 18,
      Minutes: 20
    };
    var _w = /(((00)?:0+)?:0+)?\.0+$/;
    var _x = /(T[0-9:.]+)$/;
    var Date2 = _6(Date,
    function(a, b, c, e, d, f, g) {
      switch (arguments.length) {
      case 0:
        return new Date;
      case 1:
        return typeof a == "number" ? new Date(a) : Date2.parse(a);
      default:
        return new Date(a, b, arguments.length == 2 ? 1 : c, e || 0, d || 0, f || 0, g || 0)
      }
    },
    "", {
      toISOString: function(c) {
        var e = "####-##-##T##:##:##.###";
        for (var d in _4) {
          e = e.replace(/#+/,
          function(a) {
            var b = c["getUTC" + d]();
            if (d == "Month") b++;
            return ("000" + b).slice( - a.length)
          })
        }
        return e.replace(_w, "").replace(_x, "$1Z")
      }
    });
    delete Date2.forEach;
    Date2.now = function() {
      return (new Date).valueOf()
    };
    Date2.parse = function(a, b) {
      if (arguments.length > 1) {
        assertType(b, "number", "default date should be of type 'number'.")
      }
      var c = match(a, _v);
      if (c.length) {
        if (c[_4.Month]) c[_4.Month]--;
        if (c[_3.Hectomicroseconds] >= 5) c[_4.Milliseconds]++;
        var e = new Date(b || 0);
        var d = c[_3.UTC] || c[_3.Hours] ? "UTC": "";
        for (var f in _4) {
          var g = c[_4[f]];
          if (!g) continue;
          e["set" + d + f](g);
          if (e["get" + d + f]() != c[_4[f]]) {
            return NaN
          }
        }
        if (c[_3.Hours]) {
          var i = Number(c[_3.Sign] + c[_3.Hours]);
          var h = Number(c[_3.Sign] + (c[_3.Minutes] || 0));
          e.setUTCMinutes(e.getUTCMinutes() + (i * 60) + h)
        }
        return e.valueOf()
      } else {
        return Date.parse(a)
      }
    };
    var String2 = _6(String,
    function(a) {
      return new String(arguments.length == 0 ? "": a)
    },
    "charAt,charCodeAt,concat,indexOf,lastIndexOf,match,replace,search,slice,split,substr,substring,toLowerCase,toUpperCase", {
      csv: csv,
      format: format,
      rescape: rescape,
      trim: trim
    });
    delete String2.forEach;
    function trim(a) {
      return String(a).replace(_g, "").replace(_h, "")
    };
    function csv(a) {
      return a ? (a + "").split(/\s*,\s*/) : []
    };
    function format(c) {
      var e = arguments;
      var d = new RegExp("%([1-" + (arguments.length - 1) + "])", "g");
      return (c + "").replace(d,
      function(a, b) {
        return e[b]
      })
    };
    function match(a, b) {
      return (a + "").match(b) || []
    };
    function rescape(a) {
      return (a + "").replace(_i, "\\$1")
    };
    var Function2 = _6(Function, Function, "", {
      I: I,
      II: II,
      K: K,
      bind: bind,
      compose: compose,
      delegate: delegate,
      flip: flip,
      not: not,
      partial: partial,
      unbind: unbind
    });
    function I(a) {
      return a
    };
    function II(a, b) {
      return b
    };
    function K(a) {
      return function() {
        return a
      }
    };
    function bind(a, b) {
      var c = typeof a != "function";
      if (arguments.length > 2) {
        var e = _2.call(arguments, 2);
        return function() {
          return (c ? b[a] : a).apply(b, e.concat.apply(e, arguments))
        }
      } else {
        return function() {
          return (c ? b[a] : a).apply(b, arguments)
        }
      }
    };
    function compose() {
      var c = _2.call(arguments);
      return function() {
        var a = c.length,
        b = c[--a].apply(this, arguments);
        while (a--) b = c[a].call(this, b);
        return b
      }
    };
    function delegate(b, c) {
      return function() {
        var a = _2.call(arguments);
        a.unshift(this);
        return b.apply(c, a)
      }
    };
    function flip(a) {
      return function() {
        return a.apply(this, Array2.swap(arguments, 0, 1))
      }
    };
    function not(a) {
      return function() {
        return ! a.apply(this, arguments)
      }
    };
    function partial(e) {
      var d = _2.call(arguments, 1);
      return function() {
        var a = d.concat(),
        b = 0,
        c = 0;
        while (b < d.length && c < arguments.length) {
          if (a[b] === undefined) a[b] = arguments[c++];
          b++
        }
        while (c < arguments.length) {
          a[b++] = arguments[c++]
        }
        if (Array2.contains(a, undefined)) {
          a.unshift(e);
          return partial.apply(null, a)
        }
        return e.apply(this, a)
      }
    };
    function unbind(b) {
      return function(a) {
        return b.apply(a, _2.call(arguments, 1))
      }
    };
    function detect() {
      var d = NaN
      /*@cc_on||@_jscript_version@*/
      ;
      var f = global.java ? true: false;
      if (global.navigator) {
        var g = /MSIE[\d.]+/g;
        var i = document.createElement("span");
        var h = navigator.userAgent.replace(/([a-z])[\s\/](\d)/gi, "$1$2");
        if (!d) h = h.replace(g, "");
        if (g.test(h)) h = h.match(g)[0] + " " + h.replace(g, "");
        base2.userAgent = navigator.platform + " " + h.replace(/like \w+/gi, "");
        f &= navigator.javaEnabled()
      }
      var j = {};
      detect = function(a) {
        if (j[a] == null) {
          var b = false,
          c = a;
          var e = c.charAt(0) == "!";
          if (e) c = c.slice(1);
          if (c.charAt(0) == "(") {
            try {
              b = new Function("element,jscript,java,global", "return !!" + c)(i, d, f, global)
            } catch(ex) {}
          } else {
            b = new RegExp("(" + c + ")", "i").test(base2.userAgent)
          }
          j[a] = !!(e ^ b)
        }
        return j[a]
      };
      return detect(arguments[0])
    };
    base2 = global.base2 = new Package(this, base2);
    var exports = this.exports;
    lang = new Package(this, lang);
    exports += this.exports;
    JavaScript = new Package(this, JavaScript);
    eval(exports + this.exports);
    lang.base = base;
    lang.extend = extend
  };
  new function(){new base2.Package(this,{imports:"Function2,Enumerable"});eval(this.imports);var i=RegGrp.IGNORE;var S="~";var A="";var F=" ";var p=RegGrp.extend({put:function(a,c){if(typeOf(a)=="string"){a=p.dictionary.exec(a)}this.base(a,c)}},{dictionary:new RegGrp({OPERATOR:/return|typeof|[\[(\^=,{}:;&|!*?]/.source,CONDITIONAL:/\/\*@\w*|\w*@\*\/|\/\/@\w*|@\w+/.source,COMMENT1:/\/\/[^\n]*/.source,COMMENT2:/\/\*[^*]*\*+([^\/][^*]*\*+)*\//.source,REGEXP:/\/(\\[\/\\]|[^*\/])(\\.|[^\/\n\\])*\/[gim]*/.source,STRING1:/'(\\.|[^'\\])*'/.source,STRING2:/"(\\.|[^"\\])*"/.source})});var B=Collection.extend({add:function(a){if(!this.has(a))this.base(a);a=this.get(a);if(!a.index){a.index=this.size()}a.count++;return a},sort:function(d){return this.base(d||function(a,c){return(c.count-a.count)||(a.index-c.index)})}},{Item:{constructor:function(a){this.toString=K(a)},index:0,count:0,encoded:""}});var v=Base.extend({constructor:function(a,c,d){this.parser=new p(d);if(a)this.parser.put(a,"");this.encoder=c},parser:null,encoder:Undefined,search:function(c){var d=new B;this.parser.putAt(-1,function(a){d.add(a)});this.parser.exec(c);return d},encode:function(c){var d=this.search(c);d.sort();var b=0;forEach(d,function(a){a.encoded=this.encoder(b++)},this);this.parser.putAt(-1,function(a){return d.get(a).encoded});return this.parser.exec(c)}});var w=v.extend({constructor:function(){return this.base(w.PATTERN,function(a){return"_"+Packer.encode62(a)},w.IGNORE)}},{IGNORE:{CONDITIONAL:i,"(OPERATOR)(REGEXP)":i},PATTERN:/\b_[\da-zA-Z$][\w$]*\b/g});var q=v.extend({encode:function(d){var b=this.search(d);b.sort();var f=new Collection;var e=b.size();for(var h=0;h<e;h++){f.put(Packer.encode62(h),h)}function C(a){return b["#"+a].replacement};var k=K("");var l=0;forEach(b,function(a){if(f.has(a)){a.index=f.get(a);a.toString=k}else{while(b.has(Packer.encode62(l)))l++;a.index=l++;if(a.count==1){a.toString=k}}a.replacement=Packer.encode62(a.index);if(a.replacement.length==a.toString().length){a.toString=k}});b.sort(function(a,c){return a.index-c.index});b=b.slice(0,this.getKeyWords(b).split("|").length);d=d.replace(this.getPattern(b),C);var r=this.escape(d);var m="[]";var t=this.getCount(b);var g=this.getKeyWords(b);var n=this.getEncoder(b);var u=this.getDecoder(b);return format(q.UNPACK,r,m,t,g,n,u)},search:function(a){var c=new B;forEach(a.match(q.WORDS),c.add,c);return c},escape:function(a){return a.replace(/([\\'])/g,"\\$1").replace(/[\r\n]+/g,"\\n")},getCount:function(a){return a.size()||1},getDecoder:function(c){var d=new RegGrp({"(\\d)(\\|\\d)+\\|(\\d)":"$1-$3","([a-z])(\\|[a-z])+\\|([a-z])":"$1-$3","([A-Z])(\\|[A-Z])+\\|([A-Z])":"$1-$3","\\|":""});var b=d.exec(c.map(function(a){if(a.toString())return a.replacement;return""}).slice(0,62).join("|"));if(!b)return"^$";b="["+b+"]";var f=c.size();if(f>62){b="("+b+"|";var e=Packer.encode62(f).charAt(0);if(e>"9"){b+="[\\\\d";if(e>="a"){b+="a";if(e>="z"){b+="-z";if(e>="A"){b+="A";if(e>"A")b+="-"+e}}else if(e=="b"){b+="-"+e}}b+="]"}else if(e==9){b+="\\\\d"}else if(e==2){b+="[12]"}else if(e==1){b+="1"}else{b+="[1-"+e+"]"}b+="\\\\w)"}return b},getEncoder:function(a){var c=a.size();return q["ENCODE"+(c>10?c>36?62:36:10)]},getKeyWords:function(a){return a.map(String).join("|").replace(/\|+$/,"")},getPattern:function(a){var a=a.map(String).join("|").replace(/\|{2,}/g,"|").replace(/^\|+|\|+$/g,"")||"\\x0";return new RegExp("\\b("+a+")\\b","g")}},{WORDS:/\b[\da-zA-Z]\b|\w{2,}/g,ENCODE10:"String",ENCODE36:"function(c){return c.toString(36)}",ENCODE62:"function(c){return(c<62?'':e(parseInt(c/62)))+((c=c%62)>35?String.fromCharCode(c+29):c.toString(36))}",UNPACK:"eval(function(p,a,c,k,e,r){e=%5;if('0'.replace(0,e)==0){while(c--)r[e(c)]=k[c];k=[function(e){return r[e]||e}];e=function(){return'%6'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}('%1',%2,%3,'%4'.split('|'),0,{}))"});global.Packer=Base.extend({constructor:function(){this.minifier=new j;this.shrinker=new o;this.privates=new w;this.base62=new q},minifier:null,shrinker:null,privates:null,base62:null,pack:function(a,c,d,b){a=this.minifier.minify(a);if(d)a=this.shrinker.shrink(a);if(b)a=this.privates.encode(a);if(c)a=this.base62.encode(a);return a}},{version:"3.1",init:function(){eval("var e=this.encode62="+q.ENCODE62)},data:new p({"STRING1":i,'STRING2':i,"CONDITIONAL":i,"(OPERATOR)\\s*(REGEXP)":"$1$2"}),encode52:function(c){function d(a){return(a<52?'':d(parseInt(a/52)))+((a=a%52)>25?String.fromCharCode(a+39):String.fromCharCode(a+97))};var b=d(c);if(/^(do|if|in)$/.test(b))b=b.slice(1)+0;return b}});var j=Base.extend({minify:function(a){a+="\n";a=a.replace(j.CONTINUE,"");a=j.comments.exec(a);a=j.clean.exec(a);a=j.whitespace.exec(a);a=j.concat.exec(a);return a}},{CONTINUE:/\\\r?\n/g,init:function(){this.concat=new p(this.concat).merge(Packer.data);extend(this.concat,"exec",function(a){var c=this.base(a);while(c!=a){a=c;c=this.base(a)}return c});forEach.csv("comments,clean,whitespace",function(a){this[a]=Packer.data.union(new p(this[a]))},this);this.conditionalComments=this.comments.copy();this.conditionalComments.putAt(-1," $3");this.whitespace.removeAt(2);this.comments.removeAt(2)},clean:{"\\(\\s*([^;)]*)\\s*;\\s*([^;)]*)\\s*;\\s*([^;)]*)\\)":"($1;$2;$3)","throw[^};]+[};]":i,";+\\s*([};])":"$1"},comments:{";;;[^\\n]*\\n":A,"(COMMENT1)\\n\\s*(REGEXP)?":"\n$3","(COMMENT2)\\s*(REGEXP)?":function(a,c,d,b){if(/^\/\*@/.test(c)&&/@\*\/$/.test(c)){c=j.conditionalComments.exec(c)}else{c=""}return c+" "+(b||"")}},concat:{"(STRING1)\\+(STRING1)":function(a,c,d,b){return c.slice(0,-1)+b.slice(1)},"(STRING2)\\+(STRING2)":function(a,c,d,b){return c.slice(0,-1)+b.slice(1)}},whitespace:{"\\/\\/@[^\\n]*\\n":i,"@\\s+\\b":"@ ","\\b\\s+@":" @","(\\d)\\s+(\\.\\s*[a-z\\$_\\[(])":"$1 $2","([+-])\\s+([+-])":"$1 $2","\\b\\s+\\$\\s+\\b":" $ ","\\$\\s+\\b":"$ ","\\b\\s+\\$":" $","\\b\\s+\\b":F,"\\s+":A}});var o=Base.extend({decodeData:function(d){var b=this._data;delete this._data;return d.replace(o.ENCODED_DATA,function(a,c){return b[c]})},encodeData:function(f){var e=this._data=[];return Packer.data.exec(f,function(a,c,d){var b="\x01"+e.length+"\x01";if(d){b=c+b;a=d}e.push(a);return b})},shrink:function(g){g=this.encodeData(g);function n(a){return new RegExp(a.source,"g")};var u=/((catch|do|if|while|with|function)\b[^~{};]*(\(\s*[^{};]*\s*\))\s*)?(\{[^{}]*\})/;var G=n(u);var x=/\{[^{}]*\}|\[[^\[\]]*\]|\([^\(\)]*\)|~[^~]+~/;var H=n(x);var D=/~#?(\d+)~/;var I=/[a-zA-Z_$][\w\$]*/g;var J=/~#(\d+)~/;var L=/\bvar\b/g;var M=/\bvar\s+[\w$]+[^;#]*|\bfunction\s+[\w$]+/g;var N=/\b(var|function)\b|\sin\s+[^;]+/g;var O=/\s*=[^,;]*/g;var s=[];var E=0;function P(a,c,d,b,f){if(!c)c="";if(d=="function"){f=b+y(f,J);c=c.replace(x,"");b=b.slice(1,-1);if(b!="_no_shrink_"){var e=match(f,M).join(";").replace(L,";var");while(x.test(e)){e=e.replace(H,"")}e=e.replace(N,"").replace(O,"")}f=y(f,D);if(b!="_no_shrink_"){var h=0,C;var k=match([b,e],I);var l={};for(var r=0;r<k.length;r++){id=k[r];if(!l["#"+id]){l["#"+id]=true;id=rescape(id);while(new RegExp(o.PREFIX+h+"\\b").test(f))h++;var m=new RegExp("([^\\w$.])"+id+"([^\\w$:])");while(m.test(f)){f=f.replace(n(m),"$1"+o.PREFIX+h+"$2")}var m=new RegExp("([^{,\\w$.])"+id+":","g");f=f.replace(m,"$1"+o.PREFIX+h+":");h++}}E=Math.max(E,h)}var t=c+"~"+s.length+"~";s.push(f)}else{var t="~#"+s.length+"~";s.push(c+f)}return t};function y(d,b){while(b.test(d)){d=d.replace(n(b),function(a,c){return s[c]})}return d};while(u.test(g)){g=g.replace(G,P)}g=y(g,D);var z,Q=0;var R=new v(o.SHRUNK,function(){do z=Packer.encode52(Q++);while(new RegExp("[^\\w$.]"+z+"[^\\w$:]").test(g));return z});g=R.encode(g);return this.decodeData(g)}},{ENCODED_DATA:/\x01(\d+)\x01/g,PREFIX:"\x02",SHRUNK:/\x02\d+\b/g})};