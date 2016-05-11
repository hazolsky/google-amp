<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="big-number">
        <div class="article-big-number aside--content c-box c-box--inline u-border--all u-padding--left-right">
            <span class="article-big-number__title">
                <xsl:apply-templates select="big-number-headline" />
            </span>
            <span class="article-big-number__content">
                <xsl:apply-templates select="big-number-intro" />
            </span>
        </div>
    </xsl:template>

    <xsl:template match="big-number-headline">
        <xsl:apply-templates />
    </xsl:template>

    <xsl:template match="big-number-intro">
        <xsl:apply-templates />
    </xsl:template>

</xsl:stylesheet>
