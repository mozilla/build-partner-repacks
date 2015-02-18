<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE stylesheet SYSTEM "/native/fx/bookmarks.dialog.dtd">

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:html="http://www.w3.org/1999/xhtml"
    xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
>

    <xsl:param name="login" />

    <xsl:output method="xml" encoding="UTF-8" indent="no"/>

    <xsl:template match="yaru[@error]">
        <html:div class="yaru-error">
            <html:p>&livewindow.lastfriends.error.1.label;.</html:p>
            <html:p>&livewindow.lastfriends.error.2.label; <html:a href="mailto:support@element.yandex.ru?subject=&livewindow.lastfriends.error.support.subject;">&livewindow.lastfriends.error.support.label;</html:a>.</html:p>
        </html:div>
    </xsl:template>

    <xsl:template match="yaru">
        <html:div>
            <xsl:choose>
                <xsl:when test="count(friends/friend) = 0">
                    <html:p>&livewindow.lastfriends.nolinks.1.label;.</html:p>
                    <html:p>&livewindow.lastfriends.nolinks.2.label;.</html:p>
                    <html:p>&livewindow.lastfriends.nolinks.3.label; <label tooltiptext="http://{$login}.ya.ru/posts_add_friend.xml"
                                                                             yahref="http://{$login}.ya.ru/posts_add_friend.xml">&livewindow.lastfriends.nolinks.4.label;</label>.</html:p>
                </xsl:when>
                <xsl:otherwise>
                    <vbox flex="1" id="livewindow-firends-links">
                        <grid>
                            <columns>
                                <column style="max-width:10em"/>
                                <column flex="1"/>
                            </columns>
                            <rows>
                                <xsl:apply-templates select="friends/friend"/>
                            </rows>
                        </grid>
                    </vbox>
                    <hbox flex="1" class="friend-url" tooltip="bookmark-links-tooltip">
                    </hbox>
                </xsl:otherwise>
            </xsl:choose>
        </html:div>
    </xsl:template>

    <xsl:template match="friends/friend">
        <row>
            <hbox class="friend-login" tooltiptext="{name}">
                <label value="{substring(normalize-space(name), 1, 1)}" yaLinkTarget="new tab" yahref="http://{login}.ya.ru"/>
                <label value="{substring(normalize-space(name), 2, 200)}" yaLinkTarget="new tab" yahref="http://{login}.ya.ru"/>
                <label value=":"/>
            </hbox>
            <hbox flex="1" class="friend-url">
                <xsl:choose>
                    <xsl:when test="string-length(normalize-space(title)) = 0">
                        <xsl:attribute name="tooltiptext">
                            <xsl:value-of select="url"/>
                        </xsl:attribute>
                        <label value="{substring(normalize-space(url), 1, 400)}" yahref="{url}"/>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:if test="string-length(normalize-space(title)) &gt; 400">
                            <xsl:attribute name="tooltiptext">
                                <xsl:value-of select="substring(normalize-space(title), 1, 1000)"/>
                            </xsl:attribute>
                        </xsl:if>
                        <label value="{substring(normalize-space(title), 1, 400)}" yahref="{url}"/>
                    </xsl:otherwise>
                </xsl:choose>
            </hbox>
        </row>
    </xsl:template>

</xsl:stylesheet>
