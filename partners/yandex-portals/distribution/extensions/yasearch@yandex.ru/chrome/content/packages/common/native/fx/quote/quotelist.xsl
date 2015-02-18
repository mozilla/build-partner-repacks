<!DOCTYPE widget SYSTEM "/native/fx/quote.dtd">
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="/">
        <options>
            <option value="0" label="(&wgt.quotes.settings.autodetect;)"/>
            <xsl:for-each select="quotes/group/quote">
                <option>
                    <xsl:attribute name="value">
                        <xsl:value-of select="@id"/>
                    </xsl:attribute>
                    <xsl:attribute name="label">
                        <xsl:value-of select="name"/>
                    </xsl:attribute>
                </option>
            </xsl:for-each>
        </options>
    </xsl:template>
</xsl:stylesheet>
