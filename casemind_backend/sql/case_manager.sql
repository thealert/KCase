# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 5.7.44)
# Database: case_manager
# Generation Time: 2026-04-23 10:35:40 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;




# Dump of table mycase_authority
# ------------------------------------------------------------

DROP TABLE IF EXISTS `mycase_authority`;

CREATE TABLE `mycase_authority` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `authority_name` varchar(63) NOT NULL DEFAULT '' COMMENT '权限名称，ROLE_开头，全大写',
  `authority_desc` varchar(255) NOT NULL DEFAULT '' COMMENT '权限描述',
  `authority_content` varchar(1023) NOT NULL COMMENT '权限内容，可访问的url，多个时用,隔开',
  `gmt_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COMMENT='权限信息';



# Dump of table mycase_biz
# ------------------------------------------------------------

DROP TABLE IF EXISTS `mycase_biz`;

CREATE TABLE `mycase_biz` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '文件夹主键',
  `product_line_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '业务线名称',
  `content` mediumtext NOT NULL COMMENT '文件数内容',
  `channel` int(1) NOT NULL DEFAULT '0' COMMENT '渠道',
  `is_delete` int(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除',
  `gmt_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COMMENT='文件夹';



# Dump of table mycase_case_backup
# ------------------------------------------------------------

DROP TABLE IF EXISTS `mycase_case_backup`;

CREATE TABLE `mycase_case_backup` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `case_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '用例集id',
  `title` varchar(64) NOT NULL DEFAULT '' COMMENT '用例名称',
  `creator` varchar(20) NOT NULL DEFAULT '' COMMENT '用例保存人',
  `gmt_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '用例保存时间',
  `case_content` longtext,
  `record_content` longtext COMMENT '任务执行内容',
  `extra` varchar(256) NOT NULL DEFAULT '' COMMENT '扩展字段',
  `is_delete` int(11) NOT NULL DEFAULT '0' COMMENT '是否删除',
  `case_content_blob` longblob,
  PRIMARY KEY (`id`),
  KEY `idx_caseId` (`case_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8795 DEFAULT CHARSET=utf8 COMMENT='测试备份';



DROP TABLE IF EXISTS `mycase_exec_record`;

CREATE TABLE `mycase_exec_record` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `case_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '执行的用例id',
  `title` varchar(64) NOT NULL DEFAULT '' COMMENT '用例名称',
  `env` int(10) NOT NULL DEFAULT '0' COMMENT '执行环境： 0、测试环境 1、预发环境 2.线上环境 3.冒烟qa 4.冒烟rd',
  `case_content` longtext COMMENT '任务执行内容',
  `is_delete` int(10) NOT NULL DEFAULT '0' COMMENT '用例状态 0-正常 1-删除',
  `pass_count` int(10) NOT NULL DEFAULT '0' COMMENT '执行个数',
  `total_count` int(10) NOT NULL DEFAULT '0' COMMENT '需执行总个数',
  `success_count` int(10) NOT NULL DEFAULT '0' COMMENT '成功个数',
  `ignore_count` int(10) NOT NULL DEFAULT '0' COMMENT '不执行个数',
  `block_count` int(10) NOT NULL DEFAULT '0' COMMENT '阻塞个数',
  `fail_count` int(10) NOT NULL DEFAULT '0' COMMENT '失败个数',
  `creator` varchar(20) NOT NULL DEFAULT '' COMMENT '用例创建人',
  `modifier` varchar(20) NOT NULL DEFAULT '' COMMENT '用例修改人',
  `executors` varchar(200) NOT NULL DEFAULT '' COMMENT '执行人',
  `description` varchar(1000) NOT NULL DEFAULT '' COMMENT '描述',
  `choose_content` varchar(200) NOT NULL DEFAULT '' COMMENT '圈选用例内容',
  `gmt_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `gmt_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录修改时间',
  `expect_start_time` timestamp NOT NULL DEFAULT '1971-01-01 00:00:00' COMMENT '预计开始时间',
  `expect_end_time` timestamp NOT NULL DEFAULT '1971-01-01 00:00:00' COMMENT '预计结束时间',
  `actual_start_time` timestamp NOT NULL DEFAULT '1971-01-01 00:00:00' COMMENT '实际开始时间',
  `actual_end_time` timestamp NOT NULL DEFAULT '1971-01-01 00:00:00' COMMENT '实际结束时间',
  `owner` varchar(200) NOT NULL DEFAULT '' COMMENT '负责人',
  `record_type` int(10) NOT NULL DEFAULT '0' COMMENT '执行类型',
  `review_result` int(10) NOT NULL DEFAULT '0' COMMENT '评审结果',
  `note_content` longtext COMMENT '任务备注内容',
  PRIMARY KEY (`id`),
  KEY `idx_caseId_isdelete` (`case_id`,`is_delete`)
) ENGINE=InnoDB AUTO_INCREMENT=1058 DEFAULT CHARSET=utf8 COMMENT='用例执行记录';



# Dump of table mycase_review_record
# ------------------------------------------------------------

DROP TABLE IF EXISTS `mycase_review_record`;

CREATE TABLE `mycase_review_record` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `case_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '执行的用例id',
  `title` varchar(64) NOT NULL DEFAULT '' COMMENT '评审用例名称',
  `case_content` longtext COMMENT '评审case内容',
  `is_delete` int(10) NOT NULL DEFAULT '0' COMMENT '用例状态 0-正常 1-删除',
  `review_result` int(10) NOT NULL DEFAULT '0' COMMENT '用例评审结果 0-待评审 1 评审通过 2评审不通过',
  `pass_count` int(10) NOT NULL DEFAULT '0' COMMENT '执行个数',
  `total_count` int(10) NOT NULL DEFAULT '0' COMMENT '需评审用例总个数',
  `creator` varchar(20) NOT NULL DEFAULT '' COMMENT '评审创建人',
  `modifier` varchar(20) NOT NULL DEFAULT '' COMMENT '评审修改人',
  `executors` varchar(200) NOT NULL DEFAULT '' COMMENT '评审执行人',
  `description` varchar(1000) NOT NULL DEFAULT '' COMMENT '描述',
  `choose_content` varchar(200) NOT NULL DEFAULT '' COMMENT '圈选用例内容',
  `gmt_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `gmt_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录修改时间',
  `expect_start_time` timestamp NOT NULL DEFAULT '1971-01-01 00:00:00' COMMENT '预计开始时间',
  `expect_end_time` timestamp NOT NULL DEFAULT '1971-01-01 00:00:00' COMMENT '预计结束时间',
  `actual_start_time` timestamp NOT NULL DEFAULT '1971-01-01 00:00:00' COMMENT '实际开始时间',
  `actual_end_time` timestamp NOT NULL DEFAULT '1971-01-01 00:00:00' COMMENT '实际结束时间',
  `owner` varchar(200) NOT NULL DEFAULT '' COMMENT '负责人',
  PRIMARY KEY (`id`),
  KEY `idx_caseId_isdelete` (`case_id`,`is_delete`)
) ENGINE=InnoDB AUTO_INCREMENT=20001 DEFAULT CHARSET=utf8 COMMENT='用例评审记录';



# Dump of table mycase_test_case
# ------------------------------------------------------------

DROP TABLE IF EXISTS `mycase_test_case`;

CREATE TABLE `mycase_test_case` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `parentid` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '父id',
  `group_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '用例集id',
  `title` varchar(64) NOT NULL DEFAULT 'testcase' COMMENT '用例名称',
  `description` varchar(512) NOT NULL DEFAULT '' COMMENT '用例描述',
  `is_delete` int(11) NOT NULL DEFAULT '0' COMMENT '用例状态 0-正常 1-删除',
  `creator` varchar(20) NOT NULL DEFAULT '' COMMENT '用例创建人',
  `modifier` varchar(1000) NOT NULL DEFAULT '' COMMENT '用例修改人',
  `case_content` longtext CHARACTER SET utf8mb4,
  `gmt_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `gmt_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `extra` varchar(256) NOT NULL DEFAULT '' COMMENT '扩展字段',
  `product_line_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '业务线id 默认0',
  `case_type` int(11) NOT NULL DEFAULT '0' COMMENT '0-需求用例，1-核心用例，2-冒烟用例',
  `module_node_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '模块节点id',
  `requirement_id` varchar(1000) DEFAULT '0' COMMENT '需求id',
  `requirement_name` varchar(1000) NOT NULL DEFAULT '' COMMENT '需求名称',
  `smk_case_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '冒烟case的id',
  `channel` int(11) NOT NULL DEFAULT '0' COMMENT '渠道标志 现默认1',
  `biz_id` varchar(500) NOT NULL DEFAULT '-1' COMMENT '关联的文件夹id',
  `case_extype` int(10) NOT NULL DEFAULT '0' COMMENT '测试case拓展类型',
  PRIMARY KEY (`id`),
  KEY `idx_productline_isdelete` (`product_line_id`,`is_delete`),
  KEY `idx_requirement_id` (`requirement_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3480 DEFAULT CHARSET=utf8 COMMENT='测试用例';



# Dump of table mycase_user
# ------------------------------------------------------------

DROP TABLE IF EXISTS `mycase_user`;

CREATE TABLE `mycase_user` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `username` varchar(255) NOT NULL DEFAULT '' COMMENT '用户名',
  `password` varchar(1023) NOT NULL DEFAULT '' COMMENT '密码',
  `salt` varchar(1023) NOT NULL DEFAULT '' COMMENT '盐',
  `authority_name` varchar(63) DEFAULT '',
  `is_delete` int(1) NOT NULL DEFAULT '0' COMMENT '是否删除',
  `channel` int(1) NOT NULL DEFAULT '0' COMMENT '渠道',
  `product_line_id` bigint(20) NOT NULL DEFAULT '0' COMMENT '业务线',
  `gmt_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `gmt_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=684 DEFAULT CHARSET=utf8 COMMENT='用户信息';





/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
