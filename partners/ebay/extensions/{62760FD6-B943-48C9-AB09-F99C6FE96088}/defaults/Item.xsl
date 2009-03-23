<?xml version="1.0" encoding="utf-8"?>

<!--
  - Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
  -->

<!--
  Converts the GetItem response into RDF format.
  @author: Jorge Villalobos.
-->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:ebaycomp="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#"
  xmlns:NC="http://home.netscape.com/NC-rdf#"
  xmlns:eBay="urn:ebay:apis:eBLBaseComponents">
<xsl:template match="/eBay:GetItemResponse">
<RDF:RDF>
  <ebaycomp:Item>
    <ebaycomp:item-id><xsl:value-of select="eBay:Item/eBay:ItemID"/></ebaycomp:item-id>
    <ebaycomp:end-time><xsl:value-of select="eBay:Item/eBay:ListingDetails/eBay:EndTime"/></ebaycomp:end-time>
    <ebaycomp:seller-feedback-rating-star><xsl:value-of select="eBay:Item/eBay:Seller/eBay:FeedbackRatingStar"/></ebaycomp:seller-feedback-rating-star>
    <ebaycomp:seller-feedback-score><xsl:value-of select="eBay:Item/eBay:Seller/eBay:FeedbackScore"/></ebaycomp:seller-feedback-score>
    <ebaycomp:high-bidder><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:HighBidder/eBay:UserID"/></ebaycomp:high-bidder>
    <ebaycomp:bidder-feedback-rating-star><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:HighBidder/eBay:FeedbackRatingStar"/></ebaycomp:bidder-feedback-rating-star>
    <ebaycomp:bidder-feedback-score><xsl:value-of select="eBay:Item/eBay:SellingStatus/eBay:HighBidder/eBay:FeedbackScore"/></ebaycomp:bidder-feedback-score>
    <ebaycomp:ship-to-locations><xsl:value-of select="eBay:Item/eBay:ShipToLocations"/></ebaycomp:ship-to-locations>
    <ebaycomp:shipping-cost-amount><xsl:value-of select="eBay:Item/eBay:ShippingDetails/eBay:ShippingServiceOptions/eBay:ShippingServiceCost"/></ebaycomp:shipping-cost-amount>
    <ebaycomp:shipping-cost-currency><xsl:value-of select="eBay:Item/eBay:ShippingDetails/eBay:ShippingServiceOptions/eBay:ShippingServiceCost/@currencyID"/></ebaycomp:shipping-cost-currency>
    <ebaycomp:shipping-additional-cost-amount><xsl:value-of select="eBay:Item/eBay:ShippingDetails/eBay:ShippingServiceOptions/eBay:ShippingServiceCost"/></ebaycomp:shipping-additional-cost-amount>
    <ebaycomp:shipping-additional-cost-currency><xsl:value-of select="eBay:Item/eBay:ShippingDetails/eBay:ShippingServiceOptions/eBay:ShippingServiceCost/@currencyID"/></ebaycomp:shipping-additional-cost-currency>
    <ebaycomp:shipping-type><xsl:value-of select="eBay:Item/eBay:ShippingDetails/eBay:ShippingType"/></ebaycomp:shipping-type>
    <ebaycomp:watch-count><xsl:value-of select="eBay:Item/eBay:WatchCount"/></ebaycomp:watch-count>
    <ebaycomp:hit-count><xsl:value-of select="eBay:Item/eBay:HitCount"/></ebaycomp:hit-count>
    <ebaycomp:shipping-terms-in-description><xsl:value-of select="eBay:Item/eBay:ShippingTermsInDescription"/></ebaycomp:shipping-terms-in-description>
  </ebaycomp:Item>
</RDF:RDF>
</xsl:template>
</xsl:stylesheet>
