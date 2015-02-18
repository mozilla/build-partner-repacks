<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/rss">
    <menu>
      <xsl:for-each select="./channel/item[position()&lt;6]">
        <menuitem xmlns="http://bar.yandex.ru/dev/gui">
          <text>
            <xsl:value-of select="title"/>
          </text>
          <url action="5101">
            <xsl:value-of select="link"/>?from=bar_rss
          </url>
          <xsl:if test="@icon">
             <icon>
               <xsl:value-of select="@icon"/>
             </icon>
          </xsl:if>
        </menuitem>
      </xsl:for-each>
    </menu>
  </xsl:template>
</xsl:stylesheet>
