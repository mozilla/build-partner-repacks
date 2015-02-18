<!DOCTYPE widget SYSTEM "town.dtd">
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:template match="/">
		<options>
			<option value="" label="(&wgt.town.settings.autodetect;)"/>
			<xsl:for-each select="data/c[@id]">
				<option value="{@id}" label="{@n}"/>
			</xsl:for-each>
		</options>
	</xsl:template>
</xsl:stylesheet>