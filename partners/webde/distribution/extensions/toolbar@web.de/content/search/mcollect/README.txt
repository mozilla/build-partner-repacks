This implements a local, multi-source search engine.
It's currently used for the autocomplete suggestions dropdown
of the search field.

Search results are words and actions (mostly URLs).

It collects possible search results from:
* PSH: personal search history: previous searches by this user, stored locally
* Places: browser history and bookmarks: Same thing that the FF awesomebar does, including "frecency" algo
* WebSuggest: web search suggestions: Contacting a search engine (Google, Web.de) and getting word suggestions from them
* WebSuggest: ebay suggestions and similar commercial stuff
Each of the above are a "search engine". Each of them ranks its own results.

The "collect" search engine then works as a meta search engine which queries the others and ranks the results from all engines together in one overall result.

To present the results, we have an implementation of nsIAutoCompleteSearch and nsIAutoCompleteResult, which just wrap the our classes and send the results to the XUL autocomplete widget. There could also be another presentation implementation which presents the results as full-browser-window XHTML or XUL page.
