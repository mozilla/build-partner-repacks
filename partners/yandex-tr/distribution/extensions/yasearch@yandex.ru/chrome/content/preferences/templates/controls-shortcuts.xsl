<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="1.0"
                xmlns:ui="http://bar.yandex.ru/dev/gui"
                xmlns:f="http://bar.yandex.ru/dev/functional"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xul="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">

<xsl:output method="xml" encoding="utf-8" indent="no"/>

<xsl:template match="/">
  <xsl:apply-templates select="*/*[local-name()='shortcut']"/>
</xsl:template>

<xsl:template match="shortcut|ui:shortcut|f:shortcut">
  <xul:label>
    <xsl:apply-templates select="@label | @value"/>
  </xul:label>
</xsl:template>

<xsl:template match="@*">
  <xsl:copy/>
</xsl:template>

</xsl:stylesheet>
