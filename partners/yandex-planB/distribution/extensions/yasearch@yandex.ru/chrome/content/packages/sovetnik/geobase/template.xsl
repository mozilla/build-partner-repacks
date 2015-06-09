<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE stylesheet SYSTEM "/sovetnik/entities.dtd">

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="/data">
        <options>
            <option value="" label="(&sovetnik.options.town.autodetect;)"/>
            <xsl:for-each select="c[@id][@cid]">
                <option value="{@id};{@cid}" label="{@n}"/>
            </xsl:for-each>
        </options>
    </xsl:template>
</xsl:stylesheet>
