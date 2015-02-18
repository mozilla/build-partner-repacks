<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet
    version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:ya="http://bar.yandex.ru/firefox/"
    xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
>

<xsl:output method="xml" encoding="utf-8" indent="no"/>

<xsl:param name="packagePath" select="''"/>
<xsl:param name="contextType" select="''"/>

<xsl:template match="Browser">
    <xsl:apply-templates select="PageContextMenu[@type='text']/Category | PageContextMenu[@type='text']/Link"/>
</xsl:template>

<xsl:template match="Category">
    <menu ya:contextType="{$contextType}">
        <xsl:apply-templates select="@label"/>
        <xsl:if test="@image">
            <xsl:attribute name="class">menu-iconic</xsl:attribute>
            <xsl:attribute name="image">
                <xsl:value-of select="concat($packagePath, @image)"/>
            </xsl:attribute>
        </xsl:if>
        <menupopup>
            <xsl:apply-templates select="Link | Category"/>
        </menupopup>
    </menu>
</xsl:template>

<xsl:template match="Link">
    <menuitem ya:contextType="{$contextType}"
              ya:linkURL="{@url}"
              ya:linkEncoding="{@encoding}"
              label="{@label}">
        <xsl:if test="@image">
            <xsl:attribute name="class">menuitem-iconic menuitem-with-favicon</xsl:attribute>
            <xsl:attribute name="image">
                <xsl:value-of select="concat($packagePath, @image)"/>
            </xsl:attribute>
        </xsl:if>
    </menuitem>
</xsl:template>

</xsl:stylesheet>
