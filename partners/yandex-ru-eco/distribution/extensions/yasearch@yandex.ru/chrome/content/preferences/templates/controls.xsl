<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="1.0"
                xmlns:ui="http://bar.yandex.ru/dev/gui"
                xmlns:f="http://bar.yandex.ru/dev/functional"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xul="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">

<xsl:output method="xml" encoding="utf-8" indent="no"/>

<xsl:template match="control[@type='checkbox']|ui:control[@type='checkbox']|f:control[@type='checkbox']">
  <xul:vbox xb-preftype="checkbox">
    <xsl:apply-templates select="@label"/>
  </xul:vbox>
</xsl:template>

<xsl:template match="control[@type='textedit']|ui:control[@type='textedit']|f:control[@type='textedit']">
  <xul:vbox xb-preftype="textedit">
    <xsl:apply-templates select="@label | @label-after | @value-type |
                                 @min | @max | @max-length | @spin | @empty-default"/>
  </xul:vbox>
</xsl:template>

<xsl:template match="control[@type='combobox']|ui:control[@type='combobox']|f:control[@type='combobox']">
  <xul:vbox xb-preftype="combobox">
    <xsl:apply-templates select="@label | @autocomplete | @free-input |
                                 @source | @alt-source | @template | @alt-template |
                                 @shortcuts-source | @shortcuts-alt-source | @shortcuts-template"/>
    <xsl:apply-templates select="option|ui:option|f:option" mode="combobox"/>
    
  </xul:vbox>
</xsl:template>

<xsl:template match="option|ui:option|f:option" mode="combobox">
  <xul:menuitem>
    <xsl:apply-templates select="@label | @value"/>
  </xul:menuitem>
</xsl:template>

<xsl:template match="control[@type='radiogroup']|ui:control[@type='radiogroup']|f:control[@type='radiogroup']">
  <xul:vbox xb-preftype="radiogroup">
    <xsl:apply-templates select="@label | @value"/>
    <xsl:apply-templates select="option|ui:option|f:option" mode="radiogroup"/>
  </xul:vbox>
</xsl:template>

<xsl:template match="option|ui:option|f:option" mode="radiogroup">
  <xul:radio>
    <xsl:apply-templates select="@label | @value"/>
  </xul:radio>
</xsl:template>

<xsl:template match="@*">
  <xsl:copy/>
</xsl:template>

</xsl:stylesheet>
