<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE stylesheet SYSTEM "/site/entities.dtd">

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="/hostlist">
        <options>
            <option value="" label="(&site.setts.autosite;)"/>
            <xsl:for-each select="host">
                <option value="{name}" label="{name}"/>
            </xsl:for-each>
        </options>
    </xsl:template>
</xsl:stylesheet>
