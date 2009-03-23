<?xml version="1.0" encoding="utf-8"?>

<!--
  - Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
  -->

<!--
  Converts the MyeBayMessages response into RDF format.
  @author: Jorge Villalobos.
-->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:ebaycomp="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#"
  xmlns:NC="http://home.netscape.com/NC-rdf#"
  xmlns:eBay="urn:ebay:apis:eBLBaseComponents">
<xsl:template match="/eBay:GetMyMessagesResponse">
<RDF:RDF>
  <RDF:Seq RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#new-list-messages">
  <xsl:for-each select="eBay:Messages/eBay:Message">
    <RDF:li>
      <ebaycomp:MessageItem>
        <ebaycomp:item-id><xsl:value-of select="eBay:MessageID"/></ebaycomp:item-id>
        <ebaycomp:message-read><xsl:value-of select="eBay:Read"/></ebaycomp:message-read>
      </ebaycomp:MessageItem>
    </RDF:li>
  </xsl:for-each>
  </RDF:Seq>
</RDF:RDF>
</xsl:template>
</xsl:stylesheet>
