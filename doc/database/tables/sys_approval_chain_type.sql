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

 Date: 13/05/2026 15:03:47
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for sys_approval_chain_type
-- ----------------------------
DROP TABLE IF EXISTS `sys_approval_chain_type`;
CREATE TABLE `sys_approval_chain_type`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'id',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '名称',
  `module_id` int NULL DEFAULT NULL COMMENT '模块id',
  `is_default` int NULL DEFAULT NULL COMMENT '是否默认审批链分类（1：是，0：否）',
  `is_enable` int NOT NULL DEFAULT 1 COMMENT '是否启用(1:启用。0：不启用)',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人（对用OA用户表id）',
  `created_date` int NULL DEFAULT NULL COMMENT '创建时间',
  `updated_by` int NULL DEFAULT NULL COMMENT '更改人',
  `updated_date` int NULL DEFAULT NULL COMMENT '更改时间',
  `is_delete` int NOT NULL DEFAULT 1 COMMENT '1:显示，0.隐藏',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '业务表-审批链类型表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_approval_chain_type
-- ----------------------------
INSERT INTO `sys_approval_chain_type` VALUES (1, '部门管理审批', 27, 1, 1, 1, 1755742346, 170, 1755742346, 1);
INSERT INTO `sys_approval_chain_type` VALUES (2, '组织架构审批', 28, 1, 1, 1, 1755742360, 1, 1755742360, 1);
INSERT INTO `sys_approval_chain_type` VALUES (3, '能化部门审批链', 53, 1, 1, 1, 1756792147, 1, 1756792627, 1);
INSERT INTO `sys_approval_chain_type` VALUES (4, '能化组织架构审批链', 54, 1, 1, 1, 1756792716, 1, 1756792716, 1);
INSERT INTO `sys_approval_chain_type` VALUES (5, '电气部门审批链', 79, 1, 1, 1, 1756792147, 1, 1756792627, 1);
INSERT INTO `sys_approval_chain_type` VALUES (6, '电气组织架构审批链', 80, 1, 1, 1, 1756792716, 1, 1756792716, 1);
INSERT INTO `sys_approval_chain_type` VALUES (7, '员工管理审批', 29, 1, 1, 172, 1774257613, 172, 1774257660, 0);
INSERT INTO `sys_approval_chain_type` VALUES (9, '部门管理审批链分类添加测试改名', 27, 0, 1, 170, 1775023407, 170, 1775025641, 0);
INSERT INTO `sys_approval_chain_type` VALUES (10, '测试审批链新增修改', 53, 0, 1, 169, 1775112140, 175, 1775792091, 0);
INSERT INTO `sys_approval_chain_type` VALUES (11, '部门管理审批链配置增加分类', 53, 0, 1, 170, 1776039695, 170, 1776039739, 0);
INSERT INTO `sys_approval_chain_type` VALUES (12, '员工审核1类', 29, 0, 1, 2, 1777336420, 2, 1777336420, 1);

SET FOREIGN_KEY_CHECKS = 1;
