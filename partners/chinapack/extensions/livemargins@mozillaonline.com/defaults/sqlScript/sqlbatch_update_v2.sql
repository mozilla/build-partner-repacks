ALTER TABLE tb_textHistory RENAME TO tb_textHistory_old;
CREATE TABLE `tb_textHistory` (`fd_type` VARCHAR NOT NULL, `fd_key` VARCHAR NOT NULL, `fd_lastModify` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, `fd_widgetValue` VARCHAR DEFAULT '', `fd_widgetCategoryName` VARCHAR DEFAULT 'unknown', `fd_jsonValue` VARCHAR DEFAULT '', UNIQUE (`fd_type`,`fd_key`));
INSERT INTO tb_textHistory SELECT * FROM tb_textHistory_old;
