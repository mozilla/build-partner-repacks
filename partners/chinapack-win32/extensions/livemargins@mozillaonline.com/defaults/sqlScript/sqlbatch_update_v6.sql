ALTER TABLE tb_tag RENAME TO tb_tag_old;
CREATE TABLE IF NOT EXISTS `tb_tag` (`fd_tagType` VARCHAR NOT NULL, `fd_tagName` VARCHAR NOT NULL, `fd_createModify` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, `fd_parentName` VARCHAR DEFAULT NULL, `fd_jsonValue` VARCHAR DEFAULT '', `fd_index` INTEGER DEFAULT 0, UNIQUE (`fd_tagType`,`fd_tagName`));
CREATE TABLE IF NOT EXISTS `tb_rs_tagAndItem` (`fd_tagType` VARCHAR NOT NULL DEFAULT 'album', `fd_tagName` VARCHAR NOT NULL DEFAULT 'default', `fd_itemKey` VARCHAR NOT NULL, `fd_jsonValue` VARCHAR DEFAULT '', UNIQUE (`fd_tagType`,`fd_tagName`,`fd_itemKey`));
INSERT OR REPLACE INTO tb_tag(`fd_tagType`,`fd_tagName`) values ('album','default');
INSERT OR REPLACE INTO tb_rs_tagAndItem (`fd_itemKey`) SELECT fd_imageURL FROM tb_albumHistory;
ALTER TABLE tb_videoHistory RENAME TO tb_videoHistory_old;
CREATE TABLE `tb_videoHistory` (`fd_widgetId` INTEGER NOT NULL DEFAULT '0' ,`fd_keyword` VARCHAR DEFAULT '' ,`fd_widgetCategoryId` VARCHAR DEFAULT '' ,`fd_widgetAppearence` TEXT DEFAULT '' ,`fd_lastModify` TIMESTAMP DEFAULT '''2008-1-1 00:00:01''' , `fd_imageURL` VARCHAR DEFAULT '', `fd_index` VARCHAR NOT NULL  DEFAULT '', `fd_orderIndex` INTEGER DEFAULT 0, UNIQUE (`fd_index` desc));
INSERT INTO tb_videoHistory (fd_widgetId,fd_keyword,fd_widgetCategoryId,fd_widgetAppearence,fd_lastModify,fd_imageURL,fd_index) SELECT * FROM tb_videoHistory_old;
