<?xml version="1.0" encoding="utf-8"?>

<!--
  - Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
  -->

<!--
  Converts the MyeBaySelling response into RDF format.
  @author: Jorge Villalobos.
-->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:ebaycomp="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#"
  xmlns:NC="http://home.netscape.com/NC-rdf#"
  xmlns:eBay="urn:ebay:apis:eBLBaseComponents">
<xsl:template match="/eBay:GetMyeBaySellingResponse">
<RDF:RDF>
  <RDF:Seq RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#new-list-selling">
  <xsl:for-each select="eBay:ActiveList/eBay:ItemArray/eBay:Item">
    <RDF:li>
      <ebaycomp:ActiveItem>
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
        <ebaycomp:start-price-amount><xsl:value-of select="eBay:StartPrice"/></ebaycomp:start-price-amount>
        <ebaycomp:start-price-currency><xsl:value-of select="eBay:StartPrice/@currencyID"/></ebaycomp:start-price-currency>
        <ebaycomp:reserve-met><xsl:value-of select="eBay:SellingStatus/eBay:ReserveMet"/></ebaycomp:reserve-met>
        <ebaycomp:bid-count><xsl:value-of select="eBay:SellingStatus/eBay:BidCount"/></ebaycomp:bid-count>
        <ebaycomp:high-bidder><xsl:value-of select="eBay:SellingStatus/eBay:HighBidder/eBay:UserID"/></ebaycomp:high-bidder>
        <ebaycomp:buy-it-now-price-amount><xsl:value-of select="eBay:BuyItNowPrice"/></ebaycomp:buy-it-now-price-amount>
        <ebaycomp:buy-it-now-price-currency><xsl:value-of select="eBay:BuyItNowPrice/@currencyID"/></ebaycomp:buy-it-now-price-currency>
        <ebaycomp:converted-current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice"/></ebaycomp:converted-current-price-amount>
        <ebaycomp:converted-current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice/@currencyID"/></ebaycomp:converted-current-price-currency>
        <ebaycomp:current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:CurrentPrice"/></ebaycomp:current-price-amount>
        <ebaycomp:current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:CurrentPrice/@currencyID"/></ebaycomp:current-price-currency>
      </ebaycomp:ActiveItem>
    </RDF:li>
  </xsl:for-each>
  <xsl:for-each select="eBay:SoldList/eBay:OrderTransactionArray/eBay:OrderTransaction/eBay:Transaction">
    <RDF:li>
      <ebaycomp:SoldItem>
        <ebaycomp:item-id><xsl:value-of select="eBay:Item/eBay:ItemID"/></ebaycomp:item-id>
        <ebaycomp:listing-type><xsl:value-of select="eBay:Item/eBay:ListingType"/></ebaycomp:listing-type>
        <ebaycomp:listing-start-time><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:StartTime"/></ebaycomp:listing-start-time>
        <ebaycomp:listing-end-time><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:EndTime"/></ebaycomp:listing-end-time>
        <ebaycomp:picture-url><xsl:value-of select="eBay:Item/eBay:PictureDetails/eBay:GalleryURL"/></ebaycomp:picture-url>
        <ebaycomp:title><xsl:value-of select="eBay:Item/eBay:Title"/></ebaycomp:title>
        <ebaycomp:start-price-amount><xsl:value-of select="eBay:Item/eBay:StartPrice"/></ebaycomp:start-price-amount>
        <ebaycomp:start-price-currency><xsl:value-of select="eBay:Item/eBay:StartPrice/@currencyID"/></ebaycomp:start-price-currency>
        <ebaycomp:current-price-amount><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:CurrentPrice"/></ebaycomp:current-price-amount>
        <ebaycomp:current-price-currency><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:CurrentPrice/@currencyID"/></ebaycomp:current-price-currency>
        <ebaycomp:reserve-price-amount><xsl:value-of select="eBay:Item/eBay:ReservePrice"/></ebaycomp:reserve-price-amount>
        <ebaycomp:reserve-price-currency><xsl:value-of select="eBay:Item/eBay:ReservePrice/@currencyID"/></ebaycomp:reserve-price-currency>
        <ebaycomp:buyer-id><xsl:value-of select="eBay:Buyer/eBay:UserID"/></ebaycomp:buyer-id>
        <ebaycomp:buyer-email><xsl:value-of select="eBay:Buyer/eBay:Email"/></ebaycomp:buyer-email>
        <ebaycomp:site><xsl:value-of select="eBay:Site"/></ebaycomp:site>
        <ebaycomp:time-left><xsl:value-of select="eBay:TimeLeft"/></ebaycomp:time-left>
        <ebaycomp:paid-status><xsl:value-of select="eBay:SellerPaidStatus"/></ebaycomp:paid-status>
        <ebaycomp:feedback-left><xsl:value-of select="eBay:FeedbackLeft/eBay:CommentType"/></ebaycomp:feedback-left>
        <ebaycomp:shipped-time><xsl:value-of select="eBay:ShippedTime"/></ebaycomp:shipped-time>
        <ebaycomp:feedback-received><xsl:value-of select="eBay:FeedbackReceived/eBay:CommentType"/></ebaycomp:feedback-received>
        <ebaycomp:quantity-purchased><xsl:value-of select="eBay:QuantityPurchased"/></ebaycomp:quantity-purchased>
        <ebaycomp:transaction-id><xsl:value-of select="eBay:TransactionID"/></ebaycomp:transaction-id>
        <ebaycomp:converted-current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice"/></ebaycomp:converted-current-price-amount>
        <ebaycomp:converted-current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice/@currencyID"/></ebaycomp:converted-current-price-currency>
      </ebaycomp:SoldItem>
    </RDF:li>
  </xsl:for-each>
  <xsl:for-each select="eBay:SoldList/eBay:OrderTransactionArray/eBay:OrderTransaction/eBay:Order/eBay:TransactionArray/eBay:Transaction">
    <RDF:li>
      <ebaycomp:SoldItem>
        <ebaycomp:item-id><xsl:value-of select="eBay:Item/eBay:ItemID"/></ebaycomp:item-id>
        <ebaycomp:listing-type><xsl:value-of select="eBay:Item/eBay:ListingType"/></ebaycomp:listing-type>
        <ebaycomp:listing-start-time><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:StartTime"/></ebaycomp:listing-start-time>
        <ebaycomp:listing-end-time><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:EndTime"/></ebaycomp:listing-end-time>
        <ebaycomp:picture-url><xsl:value-of select="eBay:Item/eBay:PictureDetails/eBay:GalleryURL"/></ebaycomp:picture-url>
        <ebaycomp:title><xsl:value-of select="eBay:Item/eBay:Title"/></ebaycomp:title>
        <ebaycomp:start-price-amount><xsl:value-of select="eBay:Item/eBay:StartPrice"/></ebaycomp:start-price-amount>
        <ebaycomp:start-price-currency><xsl:value-of select="eBay:Item/eBay:StartPrice/@currencyID"/></ebaycomp:start-price-currency>
        <ebaycomp:current-price-amount><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:CurrentPrice"/></ebaycomp:current-price-amount>
        <ebaycomp:current-price-currency><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:CurrentPrice/@currencyID"/></ebaycomp:current-price-currency>
        <ebaycomp:reserve-price-amount><xsl:value-of select="eBay:Item/eBay:ReservePrice"/></ebaycomp:reserve-price-amount>
        <ebaycomp:reserve-price-currency><xsl:value-of select="eBay:Item/eBay:ReservePrice/@currencyID"/></ebaycomp:reserve-price-currency>
        <ebaycomp:buyer-id><xsl:value-of select="eBay:Buyer/eBay:UserID"/></ebaycomp:buyer-id>
        <ebaycomp:buyer-email><xsl:value-of select="eBay:Buyer/eBay:Email"/></ebaycomp:buyer-email>
        <ebaycomp:site><xsl:value-of select="eBay:Site"/></ebaycomp:site>
        <ebaycomp:time-left><xsl:value-of select="eBay:TimeLeft"/></ebaycomp:time-left>
        <ebaycomp:paid-status><xsl:value-of select="eBay:SellerPaidStatus"/></ebaycomp:paid-status>
        <ebaycomp:feedback-left><xsl:value-of select="eBay:FeedbackLeft/eBay:CommentType"/></ebaycomp:feedback-left>
        <ebaycomp:shipped-time><xsl:value-of select="eBay:ShippedTime"/></ebaycomp:shipped-time>
        <ebaycomp:feedback-received><xsl:value-of select="eBay:FeedbackReceived/eBay:CommentType"/></ebaycomp:feedback-received>
        <ebaycomp:quantity-purchased><xsl:value-of select="eBay:QuantityPurchased"/></ebaycomp:quantity-purchased>
        <ebaycomp:transaction-id><xsl:value-of select="eBay:TransactionID"/></ebaycomp:transaction-id>
        <ebaycomp:converted-current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice"/></ebaycomp:converted-current-price-amount>
        <ebaycomp:converted-current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice/@currencyID"/></ebaycomp:converted-current-price-currency>
      </ebaycomp:SoldItem>
    </RDF:li>
  </xsl:for-each>
  <xsl:for-each select="eBay:UnsoldList/eBay:ItemArray/eBay:Item">
    <RDF:li>
      <ebaycomp:UnsoldItem>
        <ebaycomp:item-id><xsl:value-of select="eBay:ItemID"/></ebaycomp:item-id>
        <ebaycomp:listing-type><xsl:value-of select="eBay:ListingType"/></ebaycomp:listing-type>
        <ebaycomp:listing-start-time><xsl:value-of select="eBay:ListingDetails/eBay:StartTime"/></ebaycomp:listing-start-time>
        <ebaycomp:listing-end-time><xsl:value-of select="eBay:ListingDetails/eBay:EndTime"/></ebaycomp:listing-end-time>
        <ebaycomp:picture-url><xsl:value-of select="eBay:PictureDetails/eBay:GalleryURL"/></ebaycomp:picture-url>
        <ebaycomp:site><xsl:value-of select="eBay:Site"/></ebaycomp:site>
        <ebaycomp:time-left><xsl:value-of select="eBay:TimeLeft"/></ebaycomp:time-left>
        <ebaycomp:title><xsl:value-of select="eBay:Title"/></ebaycomp:title>
        <ebaycomp:start-price-amount><xsl:value-of select="eBay:StartPrice"/></ebaycomp:start-price-amount>
        <ebaycomp:start-price-currency><xsl:value-of select="eBay:StartPrice/@currencyID"/></ebaycomp:start-price-currency>
        <ebaycomp:quantity><xsl:value-of select="eBay:Quantity"/></ebaycomp:quantity>
        <ebaycomp:quantity-available><xsl:value-of select="eBay:QuantityAvailable"/></ebaycomp:quantity-available>
        <ebaycomp:relisted><xsl:value-of select="eBay:Relisted"/></ebaycomp:relisted>
        <ebaycomp:buy-it-now-price-amount><xsl:value-of select="eBay:BuyItNowPrice"/></ebaycomp:buy-it-now-price-amount>
        <ebaycomp:buy-it-now-price-currency><xsl:value-of select="eBay:BuyItNowPrice/@currencyID"/></ebaycomp:buy-it-now-price-currency>
        <ebaycomp:bid-count><xsl:value-of select="eBay:SellingStatus/eBay:BidCount"/></ebaycomp:bid-count>
        <ebaycomp:high-bidder><xsl:value-of select="eBay:SellingStatus/eBay:HighBidder/eBay:UserID"/></ebaycomp:high-bidder>
        <ebaycomp:converted-current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice"/></ebaycomp:converted-current-price-amount>
        <ebaycomp:converted-current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:ConvertedCurrentPrice/@currencyID"/></ebaycomp:converted-current-price-currency>
        <ebaycomp:current-price-amount><xsl:value-of select="eBay:SellingStatus/eBay:CurrentPrice"/></ebaycomp:current-price-amount>
        <ebaycomp:current-price-currency><xsl:value-of select="eBay:SellingStatus/eBay:CurrentPrice/@currencyID"/></ebaycomp:current-price-currency>
        <ebaycomp:reserve-price-amount><xsl:value-of select="eBay:ReservePrice"/></ebaycomp:reserve-price-amount>
        <ebaycomp:reserve-price-currency><xsl:value-of select="eBay:ReservePrice/@currencyID"/></ebaycomp:reserve-price-currency>
      </ebaycomp:UnsoldItem>
    </RDF:li>
  </xsl:for-each>
  </RDF:Seq>
  <RDF:Seq RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#new-list-selling-totals">
    <RDF:li>
      <RDF:Description RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#total-count-active">
        <ebaycomp:total><xsl:value-of select="eBay:ActiveList/eBay:PaginationResult/eBay:TotalNumberOfEntries"/></ebaycomp:total>
      </RDF:Description>
    </RDF:li>
    <RDF:li>
      <RDF:Description RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#total-count-sold">
        <ebaycomp:total><xsl:value-of select="eBay:SoldList/eBay:PaginationResult/eBay:TotalNumberOfEntries"/></ebaycomp:total>
      </RDF:Description>
    </RDF:li>
    <RDF:li>
      <RDF:Description RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#total-count-unsold">
        <ebaycomp:total><xsl:value-of select="eBay:UnsoldList/eBay:PaginationResult/eBay:TotalNumberOfEntries"/></ebaycomp:total>
      </RDF:Description>
    </RDF:li>
  </RDF:Seq>
</RDF:RDF>
</xsl:template>
</xsl:stylesheet>
