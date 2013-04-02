/**
 * Dead code, unused
 * TODO convert from E4X ot JXON
 */

Components.utils.import("resource://unitedtb/util/fetchhttp.js", this);

/**
 * This asks a web search engine for search term suggestions for this term.
 * E.g. Google suggestions.
 *
 * Returns |mSearchTermResult|s.
 *
 * @param searchTerm {String}
 * @param maxItems {Integer}   How many results to request from Amazon.
 *     Optional, default is 10.
 */
function mAmazon(searchTerm, maxItems)
{
  mSearch.call(this, searchTerm);
  if (maxItems)
    this._maxItems = sanitize.integer(maxItems);
}
mAmazon.prototype =
{
  _maxItems : 10,
  _fetch : null, // {FetchHTTP}

  /**
   * Triggers the the network request to the search engine.
   */
  startSearch : function()
  {
    try {
      var self = this;
      this._fetch = new FetchHTTP({
        method : "GET",
        url: brand.amazon.APIProxyURL,
        urlArgs : {
          num : self._maxItems,
          q : self._searchTerm,
          si : "All",
          redirect : "y",
        },
      },
      function(xml)
      {
        var sb = new StringBundle("chrome://unitedtb/locale/search/mcollect.properties");
        var descr = sb.get("mAmazon.descr");
        var icon = null;

        var items = self._parseResponse(xml);
        for each (let item in items)
          self._results.push(new mURLResult(item.title, descr, item.imageURL, item.pageURL));

        // keep sort order of search engine

        self._notifyObserversOfResultChanges();
      },
      function(e) {
        if (e instanceof UserCancelledException)
          return;
        self._haveFatalError(e);
      });
      this._fetch.start();
    } catch (e) { this._haveFatalError(e); }
  },

  /* XML response from Amazon, partial (there's lots more):
  <ItemSearchResponse
      xmlns="http://webservices.amazon.com/AWSECommerceService/2009-03-31">
    <Items>
      <Item>
        <ASIN>B001CQRV4Y</ASIN>
        <DetailPageURL>http://www.amazon.de/.../dp/ ...</DetailPageURL>
        <MediumImage>
          <URL>http://ecx.images-amazon.com/images/I/51LDQubp1gL._SL160_.jpg</URL>
          <Width Units="pixels">160</Width>
          <Height Units="pixels">115</Height>
        </MediumImage>
        <ItemAttributes>
          <Title>LEGO Racers 8183 - Track Turbo RC</Title>
          <ListPrice>
            <Amount>3498</Amount>
            <CurrencyCode>EUR</CurrencyCode>
            <FormattedPrice>EUR 34,98</FormattedPrice>
          </ListPrice>
          <Binding>Spielzeug</Binding>
        </ItemAttributes>
      </Item>
    </Items>
  </ItemSearchResponse>
  */

  /**
   * Processes the XML from Amazon, see example above.
   * @return {Array of {
   *     title {String}  Item title for user
   *     price {String}  Price as string for user, e.g. "EUR 34,98"
   *     imageURL {URL as String}  URL of medium-sized (~150x150) image of item
   *     pageURL {URL as String}  Amazon webpage for the item details.
   * }}
   */
  _parseResponse : function (xml)
  {
    assert(typeof(xml) == "xml", "Response was not XML");
    var ns = new Namespace("http://webservices.amazon.com/AWSECommerceService/2009-11-01");
    //assert(xml.ItemSearchResponse.Items, "Reponse was not in expected XML format");
    /* If you get "TypeError: xml.ns::Items[0] is undefined", check the XML you get,
       with the debug() below. If the xmlns differs from the URL above, it needs
       to be adjusted - a different namespace URL means logically entirely
       different tag names, which means we won't find an "Items" tag. */
    //debug(xml.toString().substr(0, 10000));
    var result = [];
    for each (let item in xml.ns::Items[0].ns::Item)
    {
      //debug("item " + item);
      try {
        let e = {};
        e.title = sanitize.label(item.ns::ItemAttributes.ns::Title)
        e.price = sanitize.label(item.ns::ItemAttributes.ns::ListPrice.ns::FormattedPrice);
        e.pageURL = sanitize.url(item.ns::DetailPageURL);
        try {
          //let image = item.ns::MediumImage;
          let image = item.ns::SmallImage;
          if (image.length() > 0) {
            e.imageURL = sanitize.url(image.ns::URL);
            e.imageWidth = sanitize.integer(image.ns::Width.(@Units == "pixels"));
            e.imageHeight = sanitize.integer(image.ns::Height.(@Units == "pixels"));
          }
        } catch (e) {} // just image, not important
        result.push(e);
      } catch (e) { this._haveItemError(e); }
    }
    return result;
  },

  cancel : function()
  {
    mSearch.prototype.cancel.apply(this);
    if (this._fetch && ! this._fetch.result)
      this._fetch.cancel();
  },
}
extend(mAmazon, mSearch);
