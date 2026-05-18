/*
 Navicat MySQL Data Transfer

 Source Server         : 192.168.60.6
 Source Server Type    : MySQL
 Source Server Version : 80032 (8.0.32)
 Source Host           : 192.168.60.6:5506
 Source Schema         : hr_manage

 Target Server Type    : MySQL
 Target Server Version : 80032 (8.0.32)
 File Encoding         : 65001

 Date: 13/05/2026 15:02:09
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for sys_approval_chain_config
-- ----------------------------
DROP TABLE IF EXISTS `sys_approval_chain_config`;
CREATE TABLE `sys_approval_chain_config`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `module_id` int NULL DEFAULT 0 COMMENT '所属模块ID 0表示不属于模块',
  `up_step` int NULL DEFAULT 0 COMMENT '上一步步骤',
  `current_step` int NULL DEFAULT 1 COMMENT '当前步骤',
  `next_step` int NULL DEFAULT 0 COMMENT '下一步步骤',
  `approval_chain_type` int NULL DEFAULT NULL COMMENT '审批链分类',
  `approval_rule` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `role_approval_percent` int NULL DEFAULT NULL COMMENT '0~100 approval_rule为3时设置需要审批人数的百分比',
  `approve_role_id` int NULL DEFAULT 0 COMMENT '审批角色组  sys_role表的id 审批角色组  approvale_rule 为1  2  3时',
  `approver_id` int NULL DEFAULT NULL COMMENT '审批人  sys_user表的id  approval_rule为0时',
  `delegate_approver_id` int NULL DEFAULT NULL COMMENT '移交人id  approval_rule 为0时使用',
  `is_jump` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否跳过  1为跳过该步骤  默认0不跳过',
  `is_show` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1启用，0删除',
  `child_modules` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `current_status_group` int NULL DEFAULT 0 COMMENT '当前主状态',
  `current_status_child` int NOT NULL DEFAULT 0 COMMENT '当前子状态',
  `next_status_group` int NOT NULL DEFAULT 0 COMMENT '下一主状态',
  `next_status_child` int NOT NULL DEFAULT 0 COMMENT '下一子状态',
  `is_auto_approve` int NULL DEFAULT 0 COMMENT '1可自动审批，0不能自动审批，默认为0',
  `auto_approve_time` int NULL DEFAULT NULL COMMENT '系统自动办理时间  is_auto_approve为1时必填',
  `deadline` int NULL DEFAULT NULL COMMENT '办理人未办理的最迟时间  is_auto_approve为0时可填',
  `button_list` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_ollaboration` tinyint NULL DEFAULT 0 COMMENT '是否协同办理 0否  1是',
  `is_repeated` tinyint NULL DEFAULT 0 COMMENT '是否可重复提交 0否  1是',
  `msg_template_ids` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_default` int NULL DEFAULT 0 COMMENT '是否默认',
  `created_by` int NOT NULL DEFAULT 0,
  `created_date` int NOT NULL DEFAULT 0,
  `updated_by` int NOT NULL DEFAULT 0,
  `updated_date` int NOT NULL DEFAULT 0,
  `is_delete` tinyint(1) NULL DEFAULT 1 COMMENT '0删除，1正常',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '系统表-审批链配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_approval_chain_config
-- ----------------------------
INSERT INTO `sys_approval_chain_config` VALUES (1, 27, 0, 1, 2, 1, 'one_of_role_group', NULL, 4, NULL, NULL, 0, 1, NULL, 5, 10, 1, 6, 0, NULL, NULL, NULL, 0, 0, NULL, 0, 1, 1755742451, 1, 1755742451, 1);
INSERT INTO `sys_approval_chain_config` VALUES (2, 28, 0, 1, 2, 2, 'one_of_role_group', NULL, 5, NULL, NULL, 0, 1, NULL, 5, 10, 1, 6, 0, NULL, NULL, NULL, 0, 0, NULL, 0, 1, 1755742508, 1, 1755742763, 1);
INSERT INTO `sys_approval_chain_config` VALUES (3, 53, 0, 1, 2, 3, 'one_of_role_group', NULL, 25, NULL, NULL, 0, 1, '', 36, 37, 41, 42, 0, NULL, NULL, NULL, 0, 0, '', 0, 1, 1756792244, 13, 1777020420, 1);
INSERT INTO `sys_approval_chain_config` VALUES (4, 54, 0, 1, 2, 4, 'one_of_role_group', NULL, 18, NULL, NULL, 0, 1, NULL, 19, 20, 11, 12, 0, NULL, NULL, NULL, 0, 0, NULL, 0, 1, 1756792788, 1, 1756792788, 1);
INSERT INTO `sys_approval_chain_config` VALUES (5, 79, 0, 1, 2, 5, 'one_of_role_group', NULL, 33, NULL, NULL, 0, 1, NULL, 29, 30, 21, 22, 0, NULL, NULL, NULL, 0, 0, NULL, 0, 1, 1756792244, 1, 1758768528, 1);
INSERT INTO `sys_approval_chain_config` VALUES (6, 80, 0, 1, 2, 6, 'one_of_role_group', NULL, 34, NULL, NULL, 0, 1, NULL, 29, 30, 21, 22, 0, NULL, NULL, NULL, 0, 0, NULL, 0, 1, 1756792788, 1, 1758768592, 1);
INSERT INTO `sys_approval_chain_config` VALUES (7, 53, 1, 2, 3, 10, 'one_of_role_group', NULL, 2, NULL, NULL, 0, 1, '', 17, 18, 11, 12, 0, NULL, NULL, NULL, 0, NULL, '', 0, 169, 1775113346, 169, 1775113346, 0);
INSERT INTO `sys_approval_chain_config` VALUES (8, 53, 0, 1, 2, 10, 'percent_of_group', 30, 2, NULL, NULL, 0, 1, '', 19, 20, 17, 18, 0, NULL, NULL, NULL, 0, NULL, '', 0, 169, 1775114450, 169, 1775115199, 0);
INSERT INTO `sys_approval_chain_config` VALUES (9, 53, 0, 1, 2, 10, 'one_of_role_group', NULL, 2, NULL, NULL, 0, 1, '', 17, 18, 11, 12, 0, NULL, NULL, NULL, 0, NULL, '', 0, 169, 1775116531, 169, 1775116531, 0);
INSERT INTO `sys_approval_chain_config` VALUES (10, 53, 0, 1, 2, 10, 'one_of_role_group', NULL, 2, NULL, NULL, 0, 1, '', 17, 18, 11, 12, 0, NULL, NULL, NULL, 0, 0, '', 0, 169, 1775117573, 169, 1775117573, 0);
INSERT INTO `sys_approval_chain_config` VALUES (12, 53, 1, 2, 3, 3, 'one_of_role_group', NULL, 24, NULL, NULL, 0, 1, '', 41, 42, 43, 44, 0, NULL, NULL, NULL, 0, 0, '', 0, 13, 1777020718, 13, 1777020962, 1);
INSERT INTO `sys_approval_chain_config` VALUES (13, 53, 2, 3, 4, 3, 'one_of_role_group', NULL, 27, NULL, NULL, 0, 1, '', 43, 44, 38, 12, 0, NULL, NULL, NULL, 0, 0, '', 0, 13, 1777020932, 13, 1777020932, 1);

SET FOREIGN_KEY_CHECKS = 1;
