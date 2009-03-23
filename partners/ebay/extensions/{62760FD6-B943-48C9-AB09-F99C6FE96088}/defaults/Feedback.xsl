<?xml version="1.0" encoding="utf-8"?>

<!--
  - Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
  -->

<!--
  Converts the Feedback response into RDF format.
  @author: Jorge Villalobos.
-->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:ebaycomp="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#"
  xmlns:NC="http://home.netscape.com/NC-rdf#"
  xmlns:eBay="urn:ebay:apis:eBLBaseComponents">
<xsl:template match="/eBay:GetFeedbackResponse">
<RDF:RDF>
  <RDF:Description RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#new-list-feedback">
    <ebaycomp:feedback-score><xsl:value-of select="eBay:FeedbackScore"/></ebaycomp:feedback-score>
  </RDF:Description>
  <RDF:Seq RDF:about="http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#new-list-feedback">
  <xsl:for-each select="eBay:FeedbackDetailArray/eBay:FeedbackDetail">
    <RDF:li>
      <ebaycomp:FeedbackItem>
        <ebaycomp:commenting-user><xsl:value-of select="eBay:CommentingUser"/></ebaycomp:commenting-user>
        <ebaycomp:comment-type><xsl:value-of select="eBay:CommentType"/></ebaycomp:comment-type>
        <ebaycomp:comment-replaced><xsl:value-of select="eBay:CommentReplaced"/></ebaycomp:comment-replaced>
        <ebaycomp:comment-text><xsl:value-of select="eBay:CommentText"/></ebaycomp:comment-text>
        <ebaycomp:comment-time><xsl:value-of select="eBay:CommentTime"/></ebaycomp:comment-time>
        <ebaycomp:feedback-id><xsl:value-of select="eBay:FeedbackID"/></ebaycomp:feedback-id>
        <ebaycomp:item-id><xsl:value-of select="eBay:ItemID"/></ebaycomp:item-id>
        <ebaycomp:role><xsl:value-of select="eBay:Role"/></ebaycomp:role>
      </ebaycomp:FeedbackItem>
    </RDF:li>
 </xsl:for-each>
  </RDF:Seq>
</RDF:RDF>
</xsl:template>
</xsl:stylesheet>
