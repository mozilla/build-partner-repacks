<?xml version="1.0" encoding="utf-8"?>

<!--
  - Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
  -->

<!--
  Converts the MyeBayBuying response into RDF format.
  @author: Jorge Villalobos.
-->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:ebaycomp="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#"
  xmlns:NC="http://home.netscape.com/NC-rdf#"
  xmlns:eBay="urn:ebay:apis:eBLBaseComponents">
<xsl:template match="/eBay:GetMyeBayBuyingResponse">
<RDF:RDF>
  <RDF:Seq RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#new-list-buying">
  <xsl:for-each select="eBay:WatchList/eBay:ItemArray/eBay:Item">
    <RDF:li>
      <ebaycomp:WatchItem>
        <ebaycomp:item-id><xsl:value-of select="eBay:ItemID"/></ebaycomp:item-id>
        <ebaycomp:listing-type><xsl:value-of select="eBay:ListingType"/></ebaycomp:listing-type>
        <ebaycomp:listing-start-time><xsl:value-of select="eBay:ListingDetails/eBay:StartTime"/></ebaycomp:listing-start-time>
        <ebaycomp:listing-end-time><xsl:value-of select="eBay:ListingDetails/eBay:EndTime"/></ebaycomp:listing-end-time>
        <ebaycomp:picture-url><xsl:value-of select="eBay:PictureDetails/eBay:GalleryURL"/></ebaycomp:picture-url>
        <ebaycomp:quantity-available><xsl:value-of select="eBay:QuantityAvailable"/></ebaycomp:quantity-available>
        <ebaycomp:seller-id><xsl:value-of select="eBay:Seller/eBay:UserID"/></ebaycomp:seller-id>
        <ebaycomp:site><xsl:value-of select="eBay:Site"/></ebaycomp:site>
        <ebaycomp:time-left><xsl:value-of select="eBay:TimeLeft"/></ebaycomp:time-left>
        <ebaycomp:title><xsl:value-of select="eBay:Title"/></ebaycomp:title>
        <ebaycomp:buy-it-now-price-amount><xsl:value-of select="eBay:BuyItNowPrice"/></ebaycomp:buy-it-now-price-amount>
        <ebaycomp:buy-it-now-price-currency><xsl:value-of select="eBay:BuyItNowPrice/@currencyID"/></ebaycomp:buy-it-now-price-currency>
        <ebaycomp:converted-buy-it-now-price-currency><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedBuyItNowPrice/@currencyID"/></ebaycomp:converted-buy-it-now-price-currency>
        <ebaycomp:converted-buy-it-now-price-amount><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedBuyItNowPrice"/></ebaycomp:converted-buy-it-now-price-amount>
        <ebaycomp:start-price-amount><xsl:value-of select="eBay:StartPrice"/></ebaycomp:start-price-amount>
        <ebaycomp:start-price-currency><xsl:value-of select="eBay:StartPrice/@currencyID"/></ebaycomp:start-price-currency>
        <ebaycomp:converted-start-price-amount><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedStartPrice"/></ebaycomp:converted-start-price-amount>
        <ebaycomp:converted-start-price-currency><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedStartPrice/@currencyID"/></ebaycomp:converted-start-price-currency>
        <ebaycomp:bid-count><xsl:value-of select="eBay:SellingStatus/eBay:BidCount"/></ebaycomp:bid-count>
        <ebaycomp:high-bidder><xsl:value-of select="eBay:SellingStatus/eBay:HighBidder/eBay:UserID"/></ebaycomp:high-bidder>
        <ebaycomp:converted-current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice"/></ebaycomp:converted-current-price-amount>
        <ebaycomp:converted-current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice/@currencyID"/></ebaycomp:converted-current-price-currency>
        <ebaycomp:current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:CurrentPrice"/></ebaycomp:current-price-amount>
        <ebaycomp:current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:CurrentPrice/@currencyID"/></ebaycomp:current-price-currency>
      </ebaycomp:WatchItem>
    </RDF:li>
  </xsl:for-each>
  <xsl:for-each select="eBay:BidList/eBay:ItemArray/eBay:Item">
    <RDF:li>
      <ebaycomp:BidItem>
        <ebaycomp:item-id><xsl:value-of select="eBay:ItemID"/></ebaycomp:item-id>
        <ebaycomp:listing-type><xsl:value-of select="eBay:ListingType"/></ebaycomp:listing-type>
        <ebaycomp:listing-start-time><xsl:value-of select="eBay:ListingDetails/eBay:StartTime"/></ebaycomp:listing-start-time>
        <ebaycomp:listing-end-time><xsl:value-of select="eBay:ListingDetails/eBay:EndTime"/></ebaycomp:listing-end-time>
        <ebaycomp:converted-start-price-amount><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedStartPrice"/></ebaycomp:converted-start-price-amount>
        <ebaycomp:converted-start-price-currency><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedStartPrice/@currencyID"/></ebaycomp:converted-start-price-currency>
        <ebaycomp:picture-url><xsl:value-of select="eBay:PictureDetails/eBay:GalleryURL"/></ebaycomp:picture-url>
        <ebaycomp:quantity-available><xsl:value-of select="eBay:QuantityAvailable"/></ebaycomp:quantity-available>
        <ebaycomp:seller-id><xsl:value-of select="eBay:Seller/eBay:UserID"/></ebaycomp:seller-id>
        <ebaycomp:site><xsl:value-of select="eBay:Site"/></ebaycomp:site>
        <ebaycomp:time-left><xsl:value-of select="eBay:TimeLeft"/></ebaycomp:time-left>
        <ebaycomp:title><xsl:value-of select="eBay:Title"/></ebaycomp:title>
        <ebaycomp:buy-it-now-price-amount><xsl:value-of select="eBay:BuyItNowPrice"/></ebaycomp:buy-it-now-price-amount>
        <ebaycomp:buy-it-now-price-currency><xsl:value-of select="eBay:BuyItNowPrice/@currencyID"/></ebaycomp:buy-it-now-price-currency>
        <ebaycomp:converted-buy-it-now-price-currency><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedBuyItNowPrice/@currencyID"/></ebaycomp:converted-buy-it-now-price-currency>
        <ebaycomp:converted-buy-it-now-price-amount><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedBuyItNowPrice"/></ebaycomp:converted-buy-it-now-price-amount>
        <ebaycomp:start-price-amount><xsl:value-of select="eBay:StartPrice"/></ebaycomp:start-price-amount>
        <ebaycomp:start-price-currency><xsl:value-of select="eBay:StartPrice/@currencyID"/></ebaycomp:start-price-currency>
        <ebaycomp:bid-count><xsl:value-of select="eBay:SellingStatus/eBay:BidCount"/></ebaycomp:bid-count>
        <ebaycomp:high-bidder><xsl:value-of select="eBay:SellingStatus/eBay:HighBidder/eBay:UserID"/></ebaycomp:high-bidder>
        <ebaycomp:converted-current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice"/></ebaycomp:converted-current-price-amount>
        <ebaycomp:converted-current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice/@currencyID"/></ebaycomp:converted-current-price-currency>
        <ebaycomp:current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:CurrentPrice"/></ebaycomp:current-price-amount>
        <ebaycomp:current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:CurrentPrice/@currencyID"/></ebaycomp:current-price-currency>
        <ebaycomp:reserve-met><xsl:value-of select="eBay:SellingStatus/eBay:ReserveMet"/></ebaycomp:reserve-met>
        <ebaycomp:converted-max-bid-amount><xsl:value-of select="eBay:BiddingDetails/eBay:ConvertedMaxBid"/></ebaycomp:converted-max-bid-amount>
        <ebaycomp:converted-max-bid-currency><xsl:value-of select="eBay:BiddingDetails/eBay:ConvertedMaxBid/@currencyID"/></ebaycomp:converted-max-bid-currency>
        <ebaycomp:max-bid-amount><xsl:value-of select="eBay:BiddingDetails/eBay:MaxBid"/></ebaycomp:max-bid-amount>
        <ebaycomp:max-bid-currency><xsl:value-of select="eBay:BiddingDetails/eBay:MaxBid/@currencyID"/></ebaycomp:max-bid-currency>
        <ebaycomp:quantity-bid><xsl:value-of select="eBay:BiddingDetails/eBay:QuantityBid"/></ebaycomp:quantity-bid>
        <ebaycomp:quantity-won><xsl:value-of select="eBay:BiddingDetails/eBay:QuantityWon"/></ebaycomp:quantity-won>
      </ebaycomp:BidItem>
    </RDF:li>
  </xsl:for-each>
  <xsl:for-each select="eBay:BestOfferList/eBay:ItemArray/eBay:Item">
    <RDF:li>
      <ebaycomp:BestOfferItem>
        <ebaycomp:item-id><xsl:value-of select="eBay:ItemID"/></ebaycomp:item-id>
        <ebaycomp:time-left><xsl:value-of select="eBay:TimeLeft"/></ebaycomp:time-left>
      </ebaycomp:BestOfferItem>
    </RDF:li>
  </xsl:for-each>
  <xsl:for-each select="eBay:WonList/eBay:OrderTransactionArray/eBay:OrderTransaction/eBay:Transaction">
    <RDF:li>
      <ebaycomp:WonItem>
        <ebaycomp:item-id><xsl:value-of select="eBay:Item/eBay:ItemID"/></ebaycomp:item-id>
        <ebaycomp:listing-type><xsl:value-of select="eBay:Item/eBay:ListingType"/></ebaycomp:listing-type>
        <ebaycomp:listing-start-time><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:StartTime"/></ebaycomp:listing-start-time>
        <ebaycomp:listing-end-time><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:EndTime"/></ebaycomp:listing-end-time>
        <ebaycomp:picture-url><xsl:value-of select="eBay:Item/eBay:PictureDetails/eBay:GalleryURL"/></ebaycomp:picture-url>
        <ebaycomp:seller-id><xsl:value-of select="eBay:Item/eBay:Seller/eBay:UserID"/></ebaycomp:seller-id>
        <ebaycomp:seller-email><xsl:value-of select="eBay:Item/eBay:Seller/eBay:Email"/></ebaycomp:seller-email>
        <ebaycomp:site><xsl:value-of select="eBay:Item/eBay:Site"/></ebaycomp:site>
        <ebaycomp:title><xsl:value-of select="eBay:Item/eBay:Title"/></ebaycomp:title>
        <ebaycomp:buy-it-now-price-amount><xsl:value-of select="eBay:Item/eBay:BuyItNowPrice"/></ebaycomp:buy-it-now-price-amount>
        <ebaycomp:buy-it-now-price-currency><xsl:value-of select="eBay:Item/eBay:BuyItNowPrice/@currencyID"/></ebaycomp:buy-it-now-price-currency>
        <ebaycomp:converted-buy-it-now-price-currency><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:ConvertedBuyItNowPrice/@currencyID"/></ebaycomp:converted-buy-it-now-price-currency>
        <ebaycomp:converted-buy-it-now-price-amount><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:ConvertedBuyItNowPrice"/></ebaycomp:converted-buy-it-now-price-amount>
        <ebaycomp:start-price-amount><xsl:value-of select="eBay:Item/eBay:StartPrice"/></ebaycomp:start-price-amount>
        <ebaycomp:start-price-currency><xsl:value-of select="eBay:Item/eBay:StartPrice/@currencyID"/></ebaycomp:start-price-currency>
        <ebaycomp:converted-start-price-amount><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:ConvertedStartPrice"/></ebaycomp:converted-start-price-amount>
        <ebaycomp:converted-start-price-currency><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:ConvertedStartPrice/@currencyID"/></ebaycomp:converted-start-price-currency>
        <ebaycomp:bid-count><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:BidCount"/></ebaycomp:bid-count>
        <ebaycomp:converted-current-price-amount><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:ConvertedCurrentPrice"/></ebaycomp:converted-current-price-amount>
        <ebaycomp:converted-current-price-currency><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:ConvertedCurrentPrice/@currencyID"/></ebaycomp:converted-current-price-currency>
        <ebaycomp:current-price-amount><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:CurrentPrice"/></ebaycomp:current-price-amount>
        <ebaycomp:current-price-currency><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:CurrentPrice/@currencyID"/></ebaycomp:current-price-currency>
        <ebaycomp:quantity-purchased><xsl:value-of select="eBay:QuantityPurchased"/></ebaycomp:quantity-purchased>
        <ebaycomp:transaction-id><xsl:value-of select="eBay:TransactionID"/></ebaycomp:transaction-id>
        <ebaycomp:paid-status><xsl:value-of select="eBay:BuyerPaidStatus"/></ebaycomp:paid-status>
        <ebaycomp:feedback-left><xsl:value-of select="eBay:FeedbackLeft/eBay:CommentType"/></ebaycomp:feedback-left>
        <ebaycomp:feedback-received><xsl:value-of select="eBay:FeedbackReceived/eBay:CommentType"/></ebaycomp:feedback-received>
        <ebaycomp:converted-max-bid-amount><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:ConvertedMaxBid"/></ebaycomp:converted-max-bid-amount>
        <ebaycomp:converted-max-bid-currency><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:ConvertedMaxBid/@currencyID"/></ebaycomp:converted-max-bid-currency>
        <ebaycomp:max-bid-amount><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:MaxBid"/></ebaycomp:max-bid-amount>
        <ebaycomp:max-bid-currency><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:MaxBid/@currencyID"/></ebaycomp:max-bid-currency>
        <ebaycomp:quantity-bid><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:QuantityBid"/></ebaycomp:quantity-bid>
        <ebaycomp:quantity-won><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:QuantityWon"/></ebaycomp:quantity-won>
      </ebaycomp:WonItem>
    </RDF:li>
  </xsl:for-each>
  <xsl:for-each select="eBay:WonList/eBay:OrderTransactionArray/eBay:OrderTransaction/eBay:Order/eBay:TransactionArray/eBay:Transaction">
    <RDF:li>
      <ebaycomp:WonItem>
        <ebaycomp:item-id><xsl:value-of select="eBay:Item/eBay:ItemID"/></ebaycomp:item-id>
        <ebaycomp:listing-type><xsl:value-of select="eBay:Item/eBay:ListingType"/></ebaycomp:listing-type>
        <ebaycomp:listing-start-time><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:StartTime"/></ebaycomp:listing-start-time>
        <ebaycomp:listing-end-time><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:EndTime"/></ebaycomp:listing-end-time>
        <ebaycomp:picture-url><xsl:value-of select="eBay:Item/eBay:PictureDetails/eBay:GalleryURL"/></ebaycomp:picture-url>
        <ebaycomp:seller-id><xsl:value-of select="eBay:Item/eBay:Seller/eBay:UserID"/></ebaycomp:seller-id>
        <ebaycomp:site><xsl:value-of select="eBay:Item/eBay:Site"/></ebaycomp:site>
        <ebaycomp:title><xsl:value-of select="eBay:Item/eBay:Title"/></ebaycomp:title>
        <ebaycomp:buy-it-now-price-amount><xsl:value-of select="eBay:Item/eBay:BuyItNowPrice"/></ebaycomp:buy-it-now-price-amount>
        <ebaycomp:buy-it-now-price-currency><xsl:value-of select="eBay:Item/eBay:BuyItNowPrice/@currencyID"/></ebaycomp:buy-it-now-price-currency>
        <ebaycomp:converted-buy-it-now-price-currency><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:ConvertedBuyItNowPrice/@currencyID"/></ebaycomp:converted-buy-it-now-price-currency>
        <ebaycomp:converted-buy-it-now-price-amount><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:ConvertedBuyItNowPrice"/></ebaycomp:converted-buy-it-now-price-amount>
        <ebaycomp:start-price-amount><xsl:value-of select="eBay:Item/eBay:StartPrice"/></ebaycomp:start-price-amount>
        <ebaycomp:start-price-currency><xsl:value-of select="eBay:Item/eBay:StartPrice/@currencyID"/></ebaycomp:start-price-currency>
        <ebaycomp:converted-start-price-amount><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:ConvertedStartPrice"/></ebaycomp:converted-start-price-amount>
        <ebaycomp:converted-start-price-currency><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:ConvertedStartPrice/@currencyID"/></ebaycomp:converted-start-price-currency>
        <ebaycomp:bid-count><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:BidCount"/></ebaycomp:bid-count>
        <ebaycomp:converted-current-price-amount><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:ConvertedCurrentPrice"/></ebaycomp:converted-current-price-amount>
        <ebaycomp:converted-current-price-currency><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:ConvertedCurrentPrice/@currencyID"/></ebaycomp:converted-current-price-currency>
        <ebaycomp:current-price-amount><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:CurrentPrice"/></ebaycomp:current-price-amount>
        <ebaycomp:current-price-currency><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:CurrentPrice/@currencyID"/></ebaycomp:current-price-currency>
        <ebaycomp:quantity-purchased><xsl:value-of select="eBay:QuantityPurchased"/></ebaycomp:quantity-purchased>
        <ebaycomp:transaction-id><xsl:value-of select="eBay:TransactionID"/></ebaycomp:transaction-id>
        <ebaycomp:paid-status><xsl:value-of select="eBay:BuyerPaidStatus"/></ebaycomp:paid-status>
        <ebaycomp:feedback-left><xsl:value-of select="eBay:FeedbackLeft/eBay:CommentType"/></ebaycomp:feedback-left>
        <ebaycomp:feedback-received><xsl:value-of select="eBay:FeedbackReceived/eBay:CommentType"/></ebaycomp:feedback-received>
        <ebaycomp:converted-max-bid-amount><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:ConvertedMaxBid"/></ebaycomp:converted-max-bid-amount>
        <ebaycomp:converted-max-bid-currency><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:ConvertedMaxBid/@currencyID"/></ebaycomp:converted-max-bid-currency>
        <ebaycomp:max-bid-amount><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:MaxBid"/></ebaycomp:max-bid-amount>
        <ebaycomp:max-bid-currency><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:MaxBid/@currencyID"/></ebaycomp:max-bid-currency>
        <ebaycomp:quantity-bid><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:QuantityBid"/></ebaycomp:quantity-bid>
        <ebaycomp:quantity-won><xsl:value-of select="eBay:Item/eBay:BiddingDetails/eBay:QuantityWon"/></ebaycomp:quantity-won>
      </ebaycomp:WonItem>
    </RDF:li>
  </xsl:for-each>
  <xsl:for-each select="eBay:LostList/eBay:ItemArray/eBay:Item">
    <RDF:li>
      <ebaycomp:LostItem>
        <ebaycomp:item-id><xsl:value-of select="eBay:ItemID"/></ebaycomp:item-id>
        <ebaycomp:listing-type><xsl:value-of select="eBay:ListingType"/></ebaycomp:listing-type>
        <ebaycomp:listing-start-time><xsl:value-of select="eBay:ListingDetails/eBay:StartTime"/></ebaycomp:listing-start-time>
        <ebaycomp:listing-end-time><xsl:value-of select="eBay:ListingDetails/eBay:EndTime"/></ebaycomp:listing-end-time>
        <ebaycomp:converted-start-price-amount><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedStartPrice"/></ebaycomp:converted-start-price-amount>
        <ebaycomp:converted-start-price-currency><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedStartPrice/@currencyID"/></ebaycomp:converted-start-price-currency>
        <ebaycomp:picture-url><xsl:value-of select="eBay:PictureDetails/eBay:GalleryURL"/></ebaycomp:picture-url>
        <ebaycomp:quantity-available><xsl:value-of select="eBay:QuantityAvailable"/></ebaycomp:quantity-available>
        <ebaycomp:seller-id><xsl:value-of select="eBay:Seller/eBay:UserID"/></ebaycomp:seller-id>
        <ebaycomp:site><xsl:value-of select="eBay:Site"/></ebaycomp:site>
        <ebaycomp:time-left><xsl:value-of select="eBay:TimeLeft"/></ebaycomp:time-left>
        <ebaycomp:title><xsl:value-of select="eBay:Title"/></ebaycomp:title>
        <ebaycomp:buy-it-now-price-amount><xsl:value-of select="eBay:BuyItNowPrice"/></ebaycomp:buy-it-now-price-amount>
        <ebaycomp:buy-it-now-price-currency><xsl:value-of select="eBay:BuyItNowPrice/@currencyID"/></ebaycomp:buy-it-now-price-currency>
        <ebaycomp:converted-buy-it-now-price-currency><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedBuyItNowPrice/@currencyID"/></ebaycomp:converted-buy-it-now-price-currency>
        <ebaycomp:converted-buy-it-now-price-amount><xsl:value-of select="eBay:ListingDetails/eBay:ConvertedBuyItNowPrice"/></ebaycomp:converted-buy-it-now-price-amount>
        <ebaycomp:start-price-amount><xsl:value-of select="eBay:StartPrice"/></ebaycomp:start-price-amount>
        <ebaycomp:start-price-currency><xsl:value-of select="eBay:StartPrice/@currencyID"/></ebaycomp:start-price-currency>
        <ebaycomp:bid-count><xsl:value-of select="eBay:SellingStatus/eBay:BidCount"/></ebaycomp:bid-count>
        <ebaycomp:high-bidder><xsl:value-of select="eBay:SellingStatus/eBay:HighBidder/eBay:UserID"/></ebaycomp:high-bidder>
        <ebaycomp:converted-current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice"/></ebaycomp:converted-current-price-amount>
        <ebaycomp:converted-current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice/@currencyID"/></ebaycomp:converted-current-price-currency>
        <ebaycomp:current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:CurrentPrice"/></ebaycomp:current-price-amount>
        <ebaycomp:current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:CurrentPrice/@currencyID"/></ebaycomp:current-price-currency>
        <ebaycomp:reserve-met><xsl:value-of select="eBay:SellingStatus/eBay:ReserveMet"/></ebaycomp:reserve-met>
        <ebaycomp:converted-max-bid-amount><xsl:value-of select="eBay:BiddingDetails/eBay:ConvertedMaxBid"/></ebaycomp:converted-max-bid-amount>
        <ebaycomp:converted-max-bid-currency><xsl:value-of select="eBay:BiddingDetails/eBay:ConvertedMaxBid/@currencyID"/></ebaycomp:converted-max-bid-currency>
        <ebaycomp:max-bid-amount><xsl:value-of select="eBay:BiddingDetails/eBay:MaxBid"/></ebaycomp:max-bid-amount>
        <ebaycomp:max-bid-currency><xsl:value-of select="eBay:BiddingDetails/eBay:MaxBid/@currencyID"/></ebaycomp:max-bid-currency>
        <ebaycomp:quantity-bid><xsl:value-of select="eBay:BiddingDetails/eBay:QuantityBid"/></ebaycomp:quantity-bid>
        <ebaycomp:quantity-won><xsl:value-of select="eBay:BiddingDetails/eBay:QuantityWon"/></ebaycomp:quantity-won>
      </ebaycomp:LostItem>
    </RDF:li>
  </xsl:for-each>
  </RDF:Seq>
  <RDF:Seq RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#new-list-buying-totals">
    <RDF:li>
      <RDF:Description RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#total-count-watch">
        <ebaycomp:total><xsl:value-of select="eBay:WatchList/eBay:PaginationResult/eBay:TotalNumberOfEntries"/></ebaycomp:total>
      </RDF:Description>
    </RDF:li>
    <RDF:li>
      <RDF:Description RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#total-count-bid">
        <ebaycomp:total><xsl:value-of select="eBay:BidList/eBay:PaginationResult/eBay:TotalNumberOfEntries"/></ebaycomp:total>
      </RDF:Description>
    </RDF:li>
    <RDF:li>
      <RDF:Description RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#total-count-won">
        <ebaycomp:total><xsl:value-of select="eBay:WonList/eBay:PaginationResult/eBay:TotalNumberOfEntries"/></ebaycomp:total>
      </RDF:Description>
    </RDF:li>
    <RDF:li>
      <RDF:Description RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#total-count-lost">
        <ebaycomp:total><xsl:value-of select="eBay:LostList/eBay:PaginationResult/eBay:TotalNumberOfEntries"/></ebaycomp:total>
      </RDF:Description>
    </RDF:li>
  </RDF:Seq>
</RDF:RDF>
</xsl:template>
</xsl:stylesheet>
