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

 Date: 13/05/2026 15:02:17
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for sys_approval_chain_config_button
-- ----------------------------
DROP TABLE IF EXISTS `sys_approval_chain_config_button`;
CREATE TABLE `sys_approval_chain_config_button`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `pid` int NULL DEFAULT NULL COMMENT 'sys_approval_chain_config表对应的ID',
  `type` int NULL DEFAULT NULL COMMENT '操作类型 sys_config表对应的ID',
  `button_id` int NULL DEFAULT NULL COMMENT '按钮 sys_config_button按钮表对应ID',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '日志对应图标',
  `log_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '日志对应状态描述',
  `msg_template_ids` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '消息模板 sys_wechat_template对应ID',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 87 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_approval_chain_config_button
-- ----------------------------
INSERT INTO `sys_approval_chain_config_button` VALUES (1, 1, 203, 2, 'pass', '已通过', '61');
INSERT INTO `sys_approval_chain_config_button` VALUES (2, 1, 204, 3, 'reject', '已驳回', '62');
INSERT INTO `sys_approval_chain_config_button` VALUES (5, 2, 203, 2, 'pass', '已通过', '64');
INSERT INTO `sys_approval_chain_config_button` VALUES (6, 2, 204, 3, 'reject', '已驳回', '65');
INSERT INTO `sys_approval_chain_config_button` VALUES (9, 4, 203, 5, 'pass', '审批', '73');
INSERT INTO `sys_approval_chain_config_button` VALUES (10, 4, 204, 6, 'reject', '驳回', '74');
INSERT INTO `sys_approval_chain_config_button` VALUES (11, 5, 203, 8, 'pass', '已通过', '79');
INSERT INTO `sys_approval_chain_config_button` VALUES (12, 5, 204, 9, 'reject', '已驳回', '80');
INSERT INTO `sys_approval_chain_config_button` VALUES (13, 6, 203, 8, 'pass', '已通过', '82');
INSERT INTO `sys_approval_chain_config_button` VALUES (14, 6, 204, 9, 'reject', '已驳回', '83');
INSERT INTO `sys_approval_chain_config_button` VALUES (15, 7, 203, 5, 'pass', '', '69');
INSERT INTO `sys_approval_chain_config_button` VALUES (16, 7, 204, 6, 'reject', '', '71');
INSERT INTO `sys_approval_chain_config_button` VALUES (19, 8, 203, 5, 'pass', '', '70');
INSERT INTO `sys_approval_chain_config_button` VALUES (20, 8, 204, 6, 'reject', '', '71');
INSERT INTO `sys_approval_chain_config_button` VALUES (21, 9, 203, 5, 'pass', '', '69');
INSERT INTO `sys_approval_chain_config_button` VALUES (22, 9, 204, 6, 'reject', '', '71');
INSERT INTO `sys_approval_chain_config_button` VALUES (77, 3, 203, 5, 'pass', '通过', '70');
INSERT INTO `sys_approval_chain_config_button` VALUES (78, 3, 204, 6, 'reject', '驳回', '71');
INSERT INTO `sys_approval_chain_config_button` VALUES (83, 13, 203, 5, 'pass', '通过', '70');
INSERT INTO `sys_approval_chain_config_button` VALUES (84, 13, 204, 6, 'reject', '驳回', '70');
INSERT INTO `sys_approval_chain_config_button` VALUES (85, 12, 203, 5, 'create', '通过', '70');
INSERT INTO `sys_approval_chain_config_button` VALUES (86, 12, 204, 6, 'submit', '驳回', '71');

SET FOREIGN_KEY_CHECKS = 1;
