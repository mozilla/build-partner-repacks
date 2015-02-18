<?xml version="1.0"?>
<!DOCTYPE xsl:stylesheet [
    <!ENTITY % settings SYSTEM "/native/fx/lenta.dtd">
    %settings;
]>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:html="http://www.w3.org/1999/xhtml"
  xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
>

    <xsl:output method="xml" encoding="UTF-8" indent="no"/>

    <xsl:param name="feedsLastGroupId" select="0"/>

    <xsl:template match="feeds">
        <menulist>
            <menupopup>
                <xsl:apply-templates select="//feed"/>
            </menupopup>
        </menulist>
    </xsl:template>

    <xsl:template match="page | error">
        <menulist id="feeds-select-group">
            <menupopup oncommand="return YaFeeds.toggleNewGroupInput()">
                <xsl:choose>
                    <xsl:when test="boolean(name(/*) = 'error')">
                        <menuitem label="&feeds.dialog.ErrorFeedGroupsRefreshTitle;" disabled="true">
                        </menuitem>
                    </xsl:when>
                    <xsl:otherwise>
                        <menuitem label="&feeds.dialog.MenuAllFeedsLabel;" group-id="0" selected="true">
                        </menuitem>
                        <menuseparator />
                        <xsl:apply-templates select="//group"/>
                        <xsl:if test="boolean(count(//group) &gt; 0)">
                            <menuseparator />
                        </xsl:if>
                        <menuitem label="&feeds.dialog.MenuNewGroupLabel;" group-id="-1" new-group="true">
                        </menuitem>
                    </xsl:otherwise>
                </xsl:choose>
            </menupopup>
        </menulist>
    </xsl:template>

    <xsl:template match="group">
        <menuitem>
             <xsl:attribute name="label">
                 <xsl:value-of select="@title"/>
             </xsl:attribute>
             <xsl:attribute name="group-id">
                 <xsl:value-of select="@id"/>
             </xsl:attribute>
        </menuitem>
    </xsl:template>

    <xsl:template match="feed">
        <menuitem>
             <xsl:attribute name="label">
                 <xsl:value-of select="@label"/>
             </xsl:attribute>
             <xsl:attribute name="tooltiptext">
                 <xsl:value-of select="@href"/>
             </xsl:attribute>
        </menuitem>
    </xsl:template>

</xsl:stylesheet>
