<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet
    version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
>

<xsl:output method="xml" encoding="utf-8" indent="no"/>

<xsl:param name="packagePath" select="''"/>

<xsl:template match="LogoButton">
    <xsl:apply-templates select="Menu/Category | Menu/Link"/>
</xsl:template>

<xsl:template match="Category">
    <menu label="{@label}" tooltiptext="{@tooltip}">
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
    <menuitem rel="{@id}" label="{@label}" url="{@url}" action="{@action}" tooltiptext="{@tooltip}">
        <xsl:if test="@image">
            <xsl:attribute name="class">menuitem-iconic menuitem-with-favicon</xsl:attribute>
            <xsl:attribute name="image">
                <xsl:value-of select="concat($packagePath, @image)"/>
            </xsl:attribute>
        </xsl:if>
        <xsl:if test="@accesskey">
            <xsl:attribute name="accesskey">
                <xsl:value-of select="@accesskey"/>
            </xsl:attribute>
        </xsl:if>
    </menuitem>
</xsl:template>

</xsl:stylesheet>
