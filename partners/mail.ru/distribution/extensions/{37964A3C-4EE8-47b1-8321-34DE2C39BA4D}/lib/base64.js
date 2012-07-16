/**
 * base64.js
 *
 * The MIT License
 *
 * Copyright (c) 2011 Takehito Gondo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var Base64 = {
	encode:function(s){
		var f = [];
		var stack = [];
		function map64(b) {
			if (b==62) return '+';
			else if (b==63) return '/';
			else if (b>=52) return String.fromCharCode(b-4); // 0-9
			else if (b>=26) return String.fromCharCode(b+71); // a-z
			else return String.fromCharCode(b+65); // A-Z
		}
		for (var i=0; i<s.length; ++i) {
                        var c;
                        if(typeof s == 'string'){
                            c = s.charCodeAt(i);
                        } else {
                            c = s[i];
                        }
			stack = stack.concat([
				c>>6 & 0x03,
				c>>4 & 0x03,
				c>>2 & 0x03,
				c>>0 & 0x03
			]);
			while (stack.length >= 3) {
				f.push(map64(stack.shift()<<4 | stack.shift()<<2 | stack.shift()));
			}
		}
		if (stack.length) {
			for (var i=3-stack.length; i>0; --i) stack.push(0);
			f.push(map64(stack.shift()<<4 | stack.shift()<<2 | stack.shift()));
		}
		for (var i=0; i<f.length%4; ++i)
			f.push("=");
		return f.join('');
	},
	decode:function(s){
		var f=[];
		var stack = [];
		function map64(b) {
			if (b==47) return 63; // "/"
			else if (b==43) return 62; // "+"
			else if (b>=97) return b-71; // a-z
			else if (b>=65) return b-65; // A-Z
			else return b+4; // 0-9
		}
		for (var i=0; i<s.length; ++i) {
			if (s[i] == "=") break;
			var c = map64(s.charCodeAt(i));
			stack = stack.concat([
				c>>4 & 0x03,
				c>>2 & 0x03,
				c>>0 & 0x03
			]);
			while (stack.length >= 4) {
				f.push(String.fromCharCode(stack.shift()<<6 | stack.shift()<<4 | stack.shift()<<2 | stack.shift()));
			}
		}
		return f.join('');
	}
};
