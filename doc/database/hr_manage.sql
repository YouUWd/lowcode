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

 Date: 07/04/2026 10:33:28
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for depart_manage
-- ----------------------------
DROP TABLE IF EXISTS `depart_manage`;
CREATE TABLE `depart_manage`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `subject_id` tinyint(1) NOT NULL DEFAULT 0 COMMENT '所属主体',
  `business_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '部门管理编号',
  `number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '唯一编码',
  `depart_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '部门信息',
  `source_id` int NULL DEFAULT 0 COMMENT '来源id',
  `version_no` tinyint(1) NOT NULL DEFAULT 1 COMMENT '版本号',
  `status_group_id` int NULL DEFAULT 0 COMMENT '主状态id',
  `status_id` int NOT NULL DEFAULT 0 COMMENT '状态id',
  `status_value` int NOT NULL DEFAULT 0 COMMENT '状态值',
  `current_step` tinyint(1) NOT NULL DEFAULT 1 COMMENT '当前步骤',
  `reason` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '驳回原因',
  `is_history` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否为历史版本',
  `created_by` int NOT NULL DEFAULT 0 COMMENT '创建人',
  `created_date` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updated_by` int NOT NULL DEFAULT 0 COMMENT '更新人',
  `updated_date` int NOT NULL DEFAULT 0 COMMENT '更新时间',
  `is_delete` tinyint NOT NULL DEFAULT 1 COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 147 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '部门管理' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for depart_version_record
-- ----------------------------
DROP TABLE IF EXISTS `depart_version_record`;
CREATE TABLE `depart_version_record`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `business_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `depart_manage_id` int NOT NULL DEFAULT 0 COMMENT '所属版本记录id',
  `project_id` int NULL DEFAULT 0 COMMENT '对应业务id(部门)',
  `pid` int NOT NULL DEFAULT 0 COMMENT '父id',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '类型',
  `depart_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '部门号',
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '部门名称',
  `child_num` int NOT NULL DEFAULT 0 COMMENT '子级数量',
  `sort_order` tinyint(1) NOT NULL DEFAULT 0,
  `expanded` tinyint(1) NULL DEFAULT 0 COMMENT '是否展开',
  `dragged` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否拖动过',
  `manager` json NULL COMMENT '部门负责人',
  `is_delete` tinyint(1) NULL DEFAULT 1 COMMENT '软删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2662 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '部门管理版本记录' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for department
-- ----------------------------
DROP TABLE IF EXISTS `department`;
CREATE TABLE `department`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `subject_id` int NOT NULL DEFAULT 0 COMMENT '主体id',
  `pid` int NOT NULL DEFAULT 0 COMMENT '父id',
  `type` tinyint NOT NULL DEFAULT 0 COMMENT '类型',
  `depart_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '部门号',
  `name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '部门名称',
  `manager_id` int NOT NULL DEFAULT 0 COMMENT '负责人',
  `manager_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '负责人名字',
  `child_num` int NOT NULL DEFAULT 0 COMMENT '子级数量',
  `employee_num` int NOT NULL DEFAULT 0 COMMENT '员工数量(包含子级)',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态',
  `with_org` tinyint NOT NULL DEFAULT 0 COMMENT '是否存在org关系',
  `sort_order` tinyint NOT NULL DEFAULT 0 COMMENT '排序',
  `description` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '部门描述',
  `created_by` int NULL DEFAULT NULL,
  `updated_by` int NULL DEFAULT NULL,
  `created_date` int NULL DEFAULT NULL,
  `updated_date` int NULL DEFAULT NULL,
  `is_delete` tinyint NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 126 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '部门表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for department_user
-- ----------------------------
DROP TABLE IF EXISTS `department_user`;
CREATE TABLE `department_user`  (
  `department_id` int NOT NULL DEFAULT 0,
  `user_id` int NOT NULL DEFAULT 0,
  `subject_id` tinyint(1) NOT NULL DEFAULT 0,
  UNIQUE INDEX `depart_user_pk2`(`department_id` ASC, `user_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '部门人员记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for organization
-- ----------------------------
DROP TABLE IF EXISTS `organization`;
CREATE TABLE `organization`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `subject_id` tinyint(1) NOT NULL DEFAULT 0 COMMENT '所属主体',
  `business_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '组织架构编号',
  `number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '唯一编码',
  `organization_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '组织架构信息',
  `source_id` int NOT NULL DEFAULT 0 COMMENT '来源id',
  `version_no` tinyint(1) NOT NULL DEFAULT 1 COMMENT '版本号',
  `status_group_id` int NOT NULL DEFAULT 0 COMMENT '主状态id',
  `status_id` int NOT NULL DEFAULT 0 COMMENT '状态id',
  `status_value` int NOT NULL DEFAULT 0 COMMENT '状态值',
  `current_step` tinyint(1) NOT NULL DEFAULT 1 COMMENT '当前步骤',
  `reason` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '驳回原因',
  `is_history` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否为历史版本',
  `created_by` int NOT NULL DEFAULT 0 COMMENT '创建人',
  `created_date` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updated_by` int NOT NULL DEFAULT 0 COMMENT '更新人',
  `updated_date` int NOT NULL DEFAULT 0 COMMENT '更新时间',
  `is_delete` tinyint NOT NULL DEFAULT 1 COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 78 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for organization_version_record
-- ----------------------------
DROP TABLE IF EXISTS `organization_version_record`;
CREATE TABLE `organization_version_record`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `business_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `organization_id` int NOT NULL DEFAULT 0 COMMENT '架构记录id',
  `project_id` int NOT NULL DEFAULT 0 COMMENT '对应业务id(部门或者人员)',
  `pid` int NOT NULL DEFAULT 0 COMMENT '父记录id',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '类型',
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '记录名称',
  `extra_property` json NULL COMMENT '自定义信息',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `pid`(`organization_id` ASC, `pid` ASC, `project_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4403 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '本表存放部门信息' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for personalized_settings
-- ----------------------------
DROP TABLE IF EXISTS `personalized_settings`;
CREATE TABLE `personalized_settings`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `setting_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '类型',
  `module_id` int NOT NULL DEFAULT 0 COMMENT '所属模块id',
  `setting_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '名称',
  `setting_slug` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '标识',
  `created_by` int NOT NULL DEFAULT 0,
  `created_date` int NOT NULL DEFAULT 0,
  `updated_by` int NOT NULL DEFAULT 0,
  `updated_date` int NOT NULL DEFAULT 0,
  `is_delete` tinyint NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for personalized_user_column
-- ----------------------------
DROP TABLE IF EXISTS `personalized_user_column`;
CREATE TABLE `personalized_user_column`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `user_id` int NOT NULL DEFAULT 0 COMMENT '用户id',
  `module_id` int NOT NULL DEFAULT 0 COMMENT '所属模块id',
  `columns` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '个性化列属性',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC, `module_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for personalized_user_settings
-- ----------------------------
DROP TABLE IF EXISTS `personalized_user_settings`;
CREATE TABLE `personalized_user_settings`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL DEFAULT 0 COMMENT '用户id',
  `setting_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '设置类型',
  `personalized_setting_id` int NOT NULL DEFAULT 0 COMMENT '选中的个性化设置项id',
  `personalized_setting_slug` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '标识',
  `extra_property` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '额外属性',
  `is_delete` tinyint NOT NULL DEFAULT 1 COMMENT '是否开启',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC, `personalized_setting_slug` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for project
-- ----------------------------
DROP TABLE IF EXISTS `project`;
CREATE TABLE `project`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `title` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '项目名称',
  `slug` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '项目标识',
  `logo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '项目logo地址',
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '项目图标地址',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for subject
-- ----------------------------
DROP TABLE IF EXISTS `subject`;
CREATE TABLE `subject`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `subject_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '主体名称',
  `company_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '对应公司名称',
  `alias` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '别名',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_action_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_action_log`;
CREATE TABLE `sys_action_log`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'id',
  `action_type` int NULL DEFAULT NULL COMMENT '操作类型',
  `action_icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '操作日志对应的图片类型',
  `action_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '操作日志对应的显示状态名称',
  `number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '业务唯一编码',
  `business_id` int NULL DEFAULT NULL COMMENT '业务id',
  `module_id` int NULL DEFAULT NULL COMMENT '模块id',
  `status_group_id` int NULL DEFAULT NULL COMMENT '当前业务主状态id',
  `status_id` int NULL DEFAULT NULL COMMENT '当前业务状态id',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '动作内容描述',
  `real_user_id` int NULL DEFAULT NULL COMMENT '真实操作人(当前登录人)',
  `created_by` int NULL DEFAULT NULL COMMENT '模拟操作用户',
  `created_date` int NULL DEFAULT NULL COMMENT '创建时间',
  `updated_by` int NULL DEFAULT NULL COMMENT '更改人',
  `updated_date` int NULL DEFAULT NULL COMMENT '更改时间',
  `is_delete` int NOT NULL DEFAULT 1 COMMENT '1:显示，0.隐藏',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 557 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-操作日志' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_approval_chain
-- ----------------------------
DROP TABLE IF EXISTS `sys_approval_chain`;
CREATE TABLE `sys_approval_chain`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `pid` int NOT NULL DEFAULT 0 COMMENT '父id',
  `number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `module_id` int NULL DEFAULT 0 COMMENT '所属模块ID 0表示不属于模块',
  `pid_module_hash` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `current_step` int NULL DEFAULT 1 COMMENT '当前步骤',
  `next_step` int NULL DEFAULT 0 COMMENT '下一步步骤',
  `up_step` int NULL DEFAULT 0 COMMENT '上一步步骤',
  `approval_chain_type` int NULL DEFAULT NULL COMMENT '审批链分类',
  `approval_rule` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '审批规则',
  `role_approval_percent` int NULL DEFAULT 0 COMMENT '0~100 approval_rule为3时设置需要审批人数的百分比',
  `approve_role_id` int NULL DEFAULT 0 COMMENT '审批角色组  sys_role表的id 审批角色组  approvale_rule 为1  2  3时',
  `approver_id` int NULL DEFAULT NULL COMMENT '审批人  sys_user表的id  approval_rule为0时',
  `approver_id_list` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '当前步骤已审批人，驳回会会清空，用于百分比判断',
  `comment` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `delegate_approver_id` int NULL DEFAULT NULL COMMENT '移交人id  approval_rule 为0时使用',
  `is_jump` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否跳过  1为跳过该步骤  默认0不跳过',
  `is_show` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1启用，0删除',
  `child_modules` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `current_status_group` int NOT NULL DEFAULT 0 COMMENT '当前主状态',
  `current_status_child` int NOT NULL DEFAULT 0 COMMENT '当前子状态',
  `next_status_group` int NOT NULL DEFAULT 0 COMMENT '下一主状态',
  `next_status_child` int NOT NULL DEFAULT 0 COMMENT '下一子状态',
  `is_auto_approve` int NULL DEFAULT 0 COMMENT '1可自动审批，0不能自动审批，默认为0',
  `auto_approve_time` int NULL DEFAULT 0 COMMENT '系统自动办理时间  is_auto_approve为1时必填',
  `deadline` int NULL DEFAULT 0 COMMENT '办理人未办理的最迟时间  is_auto_approve为0时可填',
  `button_list` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_ollaboration` tinyint NULL DEFAULT 0 COMMENT '是否协同办理 0否  1是',
  `is_repeated` tinyint NULL DEFAULT 0 COMMENT '是否可以重复提交 0否  1是',
  `msg_template_ids` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_default` int NULL DEFAULT 0 COMMENT '是否默认',
  `approval_uids` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '当前步骤已办理过的人，不会清空',
  `approval_uid` int NULL DEFAULT NULL,
  `is_approved` int NULL DEFAULT 0 COMMENT '是否审批',
  `is_send_msg` int NULL DEFAULT 0 COMMENT '是否发送过消息',
  `created_by` int NOT NULL DEFAULT 0,
  `created_date` int NOT NULL DEFAULT 0,
  `updated_by` int NOT NULL DEFAULT 0,
  `updated_date` int NOT NULL DEFAULT 0,
  `is_delete` tinyint(1) NULL DEFAULT 1 COMMENT '0删除，1正常',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `pid`(`pid` ASC, `is_approved` ASC, `current_step` ASC) USING BTREE,
  INDEX `pid_module_hash`(`pid_module_hash` ASC, `is_approved` ASC, `current_step` ASC, `pid` ASC) USING BTREE,
  INDEX `approve_role_id`(`approve_role_id` ASC, `approval_rule` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 268 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '系统表-审批链记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_approval_chain_button
-- ----------------------------
DROP TABLE IF EXISTS `sys_approval_chain_button`;
CREATE TABLE `sys_approval_chain_button`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `pid` int NULL DEFAULT NULL COMMENT 'sys_approval_chain表对应的ID',
  `type` int NULL DEFAULT NULL COMMENT '操作类型 sys_config表对应的ID',
  `button_id` int NULL DEFAULT NULL COMMENT '按钮 sys_config_button按钮表对应ID',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '日志对应图标',
  `log_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '日志对应状态描述',
  `msg_template_ids` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '消息模板 sys_wechat_template对应ID',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 535 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-审批链记录按钮表' ROW_FORMAT = DYNAMIC;

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
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci COMMENT = '系统表-审批链配置表' ROW_FORMAT = DYNAMIC;

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
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

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
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '业务表-审批链类型表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_category_module
-- ----------------------------
DROP TABLE IF EXISTS `sys_category_module`;
CREATE TABLE `sys_category_module`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL DEFAULT 0,
  `module_id` int NOT NULL DEFAULT 0,
  `is_delete` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `category_id`(`category_id` ASC, `module_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 197 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_company
-- ----------------------------
DROP TABLE IF EXISTS `sys_company`;
CREATE TABLE `sys_company`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pid` bigint NOT NULL DEFAULT 0,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `type` tinyint(1) NOT NULL DEFAULT 1,
  `status` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_config
-- ----------------------------
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` tinyint NOT NULL DEFAULT 0 COMMENT '所属主体',
  `config_category_id` int NOT NULL DEFAULT 0 COMMENT '配置类别id',
  `config_category_alias` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '配置类别alias',
  `pid` int NOT NULL DEFAULT 0 COMMENT '父级id',
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '配置项名称',
  `alias` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '配置项别名；英文',
  `value` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '配置项值',
  `trigger_return` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '配置返回触发预设',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `extra_property` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '自定义属性',
  `config_type` tinyint NOT NULL DEFAULT 0 COMMENT '0通用 1审批链',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `is_delete` tinyint NOT NULL DEFAULT 1 COMMENT '是否删除 0删除 1正常',
  `is_show` tinyint NOT NULL DEFAULT 1 COMMENT '1显示 0隐藏',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2155 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_config_button
-- ----------------------------
DROP TABLE IF EXISTS `sys_config_button`;
CREATE TABLE `sys_config_button`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` tinyint(1) NOT NULL DEFAULT 0 COMMENT '所属主体',
  `config_type` int NULL DEFAULT 0 COMMENT '用途 0-通用  1-审批链',
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '按钮名称',
  `alias` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '别名',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `default_bg_color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '默认背景颜色',
  `default_font_color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '默认字体颜色',
  `levitate_bg_color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '悬浮背景颜色',
  `levitate_font_color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '悬浮字体颜色',
  `selected_bg_color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '选中背景颜色',
  `selected_font_color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '选中字体颜色',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '日志对应图标',
  `log_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '日志对应状态',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `is_show` tinyint NOT NULL DEFAULT 1 COMMENT '1显示 0隐藏',
  `is_enable` int NOT NULL DEFAULT 1 COMMENT '是否启用(1:启用。0：不启用)',
  `created_by` int NOT NULL DEFAULT 0 COMMENT '创建人（对用OA用户表id）',
  `created_date` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updated_by` int NOT NULL DEFAULT 0 COMMENT '更改人',
  `updated_date` int NOT NULL DEFAULT 0 COMMENT '更改时间',
  `is_delete` tinyint NOT NULL DEFAULT 1 COMMENT '是否删除 0删除 1正常',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-审批链对应的按钮信息配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_config_category
-- ----------------------------
DROP TABLE IF EXISTS `sys_config_category`;
CREATE TABLE `sys_config_category`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `category_alias` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `subject_id` tinyint(1) NOT NULL DEFAULT 0,
  `related_module` tinyint(1) NOT NULL DEFAULT 0,
  `format_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `type` int NOT NULL DEFAULT 1 COMMENT '1系统  2用户',
  `is_delete` tinyint NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 207 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-配置项类别' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_field
-- ----------------------------
DROP TABLE IF EXISTS `sys_field`;
CREATE TABLE `sys_field`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'id',
  `table_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '表单名称',
  `field_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '字段名称',
  `field_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '字段类型',
  `field_show_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '字段显示名称',
  `field_operate_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '字段操作类型',
  `field_search_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '字段搜索类型',
  `relation_business_no` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '关联关系业务编号',
  `relation_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '关联关系名称',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人（对用OA用户表id）',
  `created_date` int NULL DEFAULT NULL COMMENT '创建时间',
  `updated_by` int NULL DEFAULT NULL COMMENT '更改人',
  `updated_date` int NULL DEFAULT NULL COMMENT '更改时间',
  `is_delete` int NULL DEFAULT 1 COMMENT '1:显示，0.隐藏',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `table_name`(`table_name` ASC, `field_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 354 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-字段表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_field_value
-- ----------------------------
DROP TABLE IF EXISTS `sys_field_value`;
CREATE TABLE `sys_field_value`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'id',
  `field_id` int NULL DEFAULT 0,
  `table_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '表名称',
  `field_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '表字段',
  `module_id` int NULL DEFAULT NULL COMMENT '模块id',
  `module_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '模块名称',
  `field_value` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '字段值',
  `approval_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '审批链名称',
  `approval_chain_type_id` int NULL DEFAULT NULL COMMENT '审批链id',
  `sort` int NULL DEFAULT 0 COMMENT '排序',
  `is_enable` int NULL DEFAULT 1 COMMENT '是否启用(1:启用。0：不启用)',
  `created_by` int NULL DEFAULT 0 COMMENT '创建人（对用OA用户表id）',
  `created_date` int NULL DEFAULT 0 COMMENT '创建时间',
  `updated_by` int NULL DEFAULT 0 COMMENT '更改人',
  `updated_date` int NULL DEFAULT 0 COMMENT '更改时间',
  `is_delete` int NULL DEFAULT 1 COMMENT '1:显示，0.隐藏',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-字段值表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `pid` int NOT NULL DEFAULT 0 COMMENT '父级id',
  `subject_id` tinyint NULL DEFAULT 0 COMMENT '所属主体',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '菜单名称',
  `api_url` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '请求路径',
  `api_method` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '请求方法',
  `front_path` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '前端路由',
  `img_default` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '默认图标',
  `img_active` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '选中后图标',
  `module_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '关联表名id',
  `module_slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '关联表的别名',
  `form_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_menu` tinyint NOT NULL DEFAULT 1 COMMENT '是否菜单',
  `menu_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'system' COMMENT '菜单类型',
  `sort` tinyint NOT NULL DEFAULT 0 COMMENT '排序',
  `is_need_monitor` tinyint NOT NULL DEFAULT 0 COMMENT '是否需要监控0否 1是',
  `is_show` smallint NULL DEFAULT 1 COMMENT '0隐藏，1显示',
  `is_enable` smallint NULL DEFAULT 1 COMMENT '1启用，0停用',
  `created_by` int NOT NULL DEFAULT 0 COMMENT '创建人id',
  `created_date` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updated_by` int NULL DEFAULT 0 COMMENT '更新人id',
  `updated_date` int NULL DEFAULT 0 COMMENT '更新时间',
  `is_delete` tinyint NOT NULL DEFAULT 1 COMMENT '0删除，1正常',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 48 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统菜单' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_message_record
-- ----------------------------
DROP TABLE IF EXISTS `sys_message_record`;
CREATE TABLE `sys_message_record`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `receiver` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '接收人',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '消息类型',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '内容',
  `status` int NOT NULL DEFAULT 0 COMMENT '状态',
  `response_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '发送结果',
  `created_by` int NOT NULL DEFAULT 0 COMMENT '提交人',
  `created_date` int NOT NULL DEFAULT 0 COMMENT '发送时间',
  `updated_date` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 810 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_module
-- ----------------------------
DROP TABLE IF EXISTS `sys_module`;
CREATE TABLE `sys_module`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` tinyint NOT NULL DEFAULT 0 COMMENT '所属主体',
  `pid` int NOT NULL DEFAULT 0 COMMENT '父级',
  `module_slug` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '模块标识',
  `module_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '模块名称',
  `module_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'normal' COMMENT '模块类型',
  `multi_line` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否多行',
  `nav_slug` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '导航标识',
  `nav_label` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '导航名称',
  `db_conn` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '所选库',
  `table_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '所选表',
  `model_class` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '对应model类',
  `has_approval` tinyint NOT NULL DEFAULT 0 COMMENT '是否有审批',
  `is_auto_config` tinyint NOT NULL DEFAULT 0 COMMENT '是否自动配置',
  `logic_class` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '自定义数据源类',
  `logic_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '自定义数据源方法',
  `created_by` int NOT NULL DEFAULT 0 COMMENT '创建人id',
  `created_date` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updated_by` int NULL DEFAULT 0 COMMENT '更新人id',
  `updated_date` int NULL DEFAULT 0 COMMENT '更新时间',
  `is_delete` tinyint NOT NULL DEFAULT 1 COMMENT '0删除，1正常',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 89 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_module_column
-- ----------------------------
DROP TABLE IF EXISTS `sys_module_column`;
CREATE TABLE `sys_module_column`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `module_id` int NOT NULL DEFAULT 0 COMMENT '所属模块',
  `column_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '列key',
  `column_title` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '列名称',
  `relation_field` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '关联表字段',
  `property_details` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '属性详情',
  `created_by` int NOT NULL DEFAULT 0,
  `created_date` int NOT NULL DEFAULT 0,
  `updated_by` int NOT NULL DEFAULT 0,
  `updated_date` int NOT NULL DEFAULT 0,
  `is_delete` tinyint NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `module_id`(`module_id` ASC, `column_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4291 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_module_status
-- ----------------------------
DROP TABLE IF EXISTS `sys_module_status`;
CREATE TABLE `sys_module_status`  (
  `module_id` int NOT NULL DEFAULT 0 COMMENT '模块ID(sys_module表ID)',
  `pid` int NULL DEFAULT 0 COMMENT '状态父级ID',
  `status_id` int NOT NULL DEFAULT 0 COMMENT '状态ID(sys_status表ID)',
  INDEX `module_id`(`module_id` ASC, `status_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '模块状态表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_monitor_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_monitor_log`;
CREATE TABLE `sys_monitor_log`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` tinyint(1) NOT NULL DEFAULT 0,
  `monitor_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `log_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `log_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `log_remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `login_user_id` int NULL DEFAULT 0,
  `mock_user_id` int NULL DEFAULT 0,
  `is_mock` tinyint(1) NULL DEFAULT 0,
  `login_role` int NULL DEFAULT 0,
  `mock_role` int NULL DEFAULT 0,
  `role_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `user_info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `browser` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `plat_form` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `log_date` int NULL DEFAULT 0,
  `created_date` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 35192 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_read
-- ----------------------------
DROP TABLE IF EXISTS `sys_read`;
CREATE TABLE `sys_read`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_id` int NULL DEFAULT NULL COMMENT '模块ID',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '类型  business业务  remark消息',
  `business_id` int NULL DEFAULT NULL COMMENT '业务ID',
  `is_read` tinyint NULL DEFAULT NULL,
  `created_by` int NULL DEFAULT 0 COMMENT '操作人id',
  `created_date` int NULL DEFAULT 0 COMMENT '操作时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 341 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_right
-- ----------------------------
DROP TABLE IF EXISTS `sys_right`;
CREATE TABLE `sys_right`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` tinyint(1) NOT NULL DEFAULT 0 COMMENT '所属主体',
  `pid` int NOT NULL DEFAULT 0,
  `right_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `right_slug` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '权限标识',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '类型（视业务需求，如区分操作）',
  `relation_module_id` int NOT NULL DEFAULT 0 COMMENT '关联模块id',
  `relation_module` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '关联模块标识',
  `belong_id` int NOT NULL DEFAULT 0,
  `belong_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `belong_sort` int NOT NULL DEFAULT 0 COMMENT '归属根节点',
  `sort_level` int NOT NULL DEFAULT 0 COMMENT '归属层级节点，第二级及子级',
  `node_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `created_by` int NOT NULL DEFAULT 0,
  `created_date` int NOT NULL DEFAULT 0,
  `updated_by` int NOT NULL DEFAULT 0,
  `updated_date` int NOT NULL DEFAULT 0,
  `is_delete` tinyint NOT NULL DEFAULT 1 COMMENT '1:显示，0.隐藏',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `pid`(`subject_id` ASC, `pid` ASC, `type` ASC, `relation_module_id` ASC, `right_slug` ASC) USING BTREE,
  INDEX `type`(`type` ASC, `right_slug` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9954 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-权限表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` tinyint NOT NULL DEFAULT 0 COMMENT '所属主体',
  `role_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '角色名称',
  `role_slug` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '角色标识',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `created_by` int NULL DEFAULT 0 COMMENT '创建人（对用OA用户表id）',
  `created_date` int NULL DEFAULT 0 COMMENT '创建时间',
  `updated_by` int NULL DEFAULT 0 COMMENT '更改人',
  `updated_date` int NULL DEFAULT 0 COMMENT '更改时间',
  `is_delete` int NULL DEFAULT 1 COMMENT '1:显示，0.隐藏',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 50 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-角色表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_role_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_menu`;
CREATE TABLE `sys_role_menu`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `role_id` int NOT NULL COMMENT '外键sys_role的id 角色id',
  `menu_id` int NOT NULL COMMENT '外键sys_menu的id 目录id',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1268 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-角色目录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_role_right
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_right`;
CREATE TABLE `sys_role_right`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL COMMENT '外键sys_role的id 角色id',
  `right_id` int NOT NULL COMMENT '外键sys_right的id 角色id',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `role_id`(`role_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 566679 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-角色权限表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_role_right_data
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_right_data`;
CREATE TABLE `sys_role_right_data`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL DEFAULT 0,
  `right_id` int NOT NULL DEFAULT 0,
  `right_slug` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `data_ids` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `role_id`(`role_id` ASC, `right_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_role_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_user`;
CREATE TABLE `sys_role_user`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `subject_id` tinyint(1) NOT NULL DEFAULT 0 COMMENT '记录主体，方便查询',
  `role_id` int NOT NULL DEFAULT 0 COMMENT '外键sys_role的id 角色id',
  `user_id` int NOT NULL DEFAULT 0 COMMENT '外键sys_user的id 用户id',
  `user_type` tinyint(1) NOT NULL DEFAULT 1,
  `original_user_id` int NULL DEFAULT 0,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `role_id`(`role_id` ASC, `user_id` ASC, `original_user_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 239 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-角色用户表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_status
-- ----------------------------
DROP TABLE IF EXISTS `sys_status`;
CREATE TABLE `sys_status`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'id',
  `pid` int NULL DEFAULT 0 COMMENT '父id',
  `subject_id` tinyint NOT NULL DEFAULT 0 COMMENT '所属主体',
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '状态名称',
  `status_type` int NULL DEFAULT NULL COMMENT '分类（主状态，子状态）',
  `status_value` int NULL DEFAULT NULL COMMENT '状态值',
  `status_background` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '状态背景色',
  `status_font_color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '状态字体颜色',
  `is_enable` int NOT NULL DEFAULT 1 COMMENT '是否启用(1:启用。0：不启用)',
  `is_approval_show` int NOT NULL DEFAULT 0 COMMENT '审批是否显示(1:显示。0：不显示)',
  `is_next_approval_show` int NULL DEFAULT 1 COMMENT '下一审批是否审批显示(1:显示。0：不显示)',
  `is_current_approval_show` int NULL DEFAULT 1 COMMENT '当前审批是否审批显示(1:显示。0：不显示)',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人（对用OA用户表id）',
  `created_date` int NULL DEFAULT NULL COMMENT '创建时间',
  `updated_by` int NULL DEFAULT NULL COMMENT '更改人',
  `updated_date` int NULL DEFAULT NULL COMMENT '更改时间',
  `is_delete` int NULL DEFAULT NULL COMMENT '1:显示，0.隐藏',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 32 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统表-状态表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `user_type` tinyint NOT NULL DEFAULT 1 COMMENT '用户类型',
  `user_id` bigint NOT NULL DEFAULT 0 COMMENT '员工id(如果为内部用户不为0)',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '名称',
  `work_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '工号',
  `user_avatar` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '头像',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '手机',
  `short_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '对应企业微信简称',
  `sex` tinyint(1) NOT NULL DEFAULT 0 COMMENT '性别',
  `company_id` bigint NOT NULL DEFAULT 0 COMMENT '公司id(自动维护)',
  `company_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '所属公司/内部人员为主体',
  `depart_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '部门ids(内部)',
  `depart_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '部门名称',
  `leader_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '部门领导人',
  `position_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '职位名称',
  `subject_id` tinyint(1) NOT NULL DEFAULT 0 COMMENT '主体id',
  `subject_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '主体简称',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '密码',
  `status` tinyint(1) NOT NULL DEFAULT 2 COMMENT '状态',
  `employed_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '在职状态',
  `is_super` tinyint(1) NULL DEFAULT 0 COMMENT '是否超级人员',
  `created_by` bigint NOT NULL DEFAULT 0 COMMENT '创建人',
  `created_date` bigint NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updated_by` bigint NOT NULL DEFAULT 0 COMMENT '最后更新人',
  `updated_date` bigint NOT NULL DEFAULT 0 COMMENT '最后更新时间',
  `is_delete` tinyint NOT NULL DEFAULT 1 COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `work_number_unique`(`work_number` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 178 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_wechat_template
-- ----------------------------
DROP TABLE IF EXISTS `sys_wechat_template`;
CREATE TABLE `sys_wechat_template`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` tinyint(1) NOT NULL DEFAULT 0,
  `msg_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '消息标题',
  `send_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '发送类型',
  `accept_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '接收消息类型',
  `trigger` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '触发类型',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '消息内容',
  `other_to_user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '额外接收人id',
  `other_to_user_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '额外消息接收人姓名',
  `param_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '消息参数配置的id',
  `module_id` int NULL DEFAULT 0 COMMENT '模块的id',
  `module_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '模块类型名称',
  `is_approval` tinyint(1) NULL DEFAULT 1 COMMENT '1审批链，0非审批链',
  `created_by` int NULL DEFAULT 0 COMMENT '创建人',
  `created_date` int NULL DEFAULT 0 COMMENT '创建时间',
  `updated_by` int NULL DEFAULT 0 COMMENT '更新人id',
  `updated_date` int NULL DEFAULT 0 COMMENT '更新时间',
  `is_delete` tinyint(1) NULL DEFAULT 1 COMMENT '1正常，0删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 91 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_wechat_template_param
-- ----------------------------
DROP TABLE IF EXISTS `sys_wechat_template_param`;
CREATE TABLE `sys_wechat_template_param`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` tinyint(1) NOT NULL DEFAULT 0,
  `param_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '参数名称',
  `param_slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '参数标识',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '描述',
  `module_id` int NOT NULL DEFAULT 0 COMMENT '关联模块ID',
  `module_class` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '模块logic类',
  `module_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '关联模块名称',
  `column_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '关联表字段',
  `is_convert` tinyint NOT NULL DEFAULT 0 COMMENT '是否需要转换',
  `convert_method` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '转换方法',
  `created_by` int NOT NULL DEFAULT 0 COMMENT '创建人id',
  `created_date` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updated_by` int NOT NULL DEFAULT 0 COMMENT '更新人',
  `updated_date` int NOT NULL DEFAULT 0 COMMENT '更新时间',
  `is_show` tinyint NOT NULL DEFAULT 1 COMMENT '1显示，0隐藏',
  `is_delete` tinyint NOT NULL DEFAULT 1 COMMENT '1正常，0删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 106 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '姓名',
  `nick_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `user_avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '照片',
  `original_user_id` int NULL DEFAULT 0,
  `original_work_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `sex` tinyint NULL DEFAULT NULL COMMENT '性别',
  `subject_id` tinyint NOT NULL DEFAULT 0 COMMENT '主体',
  `short_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '对应企业微信简称',
  `work_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '工号',
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '手机号',
  `department_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '所属部门',
  `department_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '所属部门名称',
  `performance_type` int NULL DEFAULT NULL COMMENT '绩效工资',
  `user_status` int NOT NULL DEFAULT 0 COMMENT '员工状态',
  `job_status` int NULL DEFAULT 0 COMMENT '在岗状态',
  `state` tinyint NOT NULL DEFAULT 1 COMMENT '帐号状态 0禁用 1启用',
  `created_by` int NOT NULL DEFAULT 0 COMMENT '创建人id',
  `created_date` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `updated_by` int NOT NULL DEFAULT 0 COMMENT '更新人id',
  `updated_date` int NOT NULL DEFAULT 0 COMMENT '更新时间',
  `is_delete` tinyint NOT NULL DEFAULT 1 COMMENT '1正常，0删除',
  `job_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '岗位',
  `job_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `original_job` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `age` int NULL DEFAULT NULL COMMENT '年龄 根据出生日期自动计算',
  `job_class` int NULL DEFAULT NULL COMMENT '岗位分类',
  `original_job_class` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `job_level` int NULL DEFAULT NULL COMMENT '职等',
  `birthday` date NULL DEFAULT NULL COMMENT '出生日期',
  `hometown` int NULL DEFAULT NULL COMMENT '籍贯',
  `hometown_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '籍贯名称',
  `job_grade` int NULL DEFAULT NULL COMMENT '职级',
  `internal_ability_evaluation` int NULL DEFAULT NULL COMMENT '内部能力评价',
  `external_ability_evaluation` int NULL DEFAULT NULL COMMENT '外部能力评价',
  `user_IDCard` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '身份证号',
  `bank_type` int NULL DEFAULT NULL COMMENT '工资卡行别',
  `account` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '工资卡卡号',
  `bank` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '工资卡开户行',
  `totalmoney` double(10, 2) NULL DEFAULT NULL COMMENT '标准薪酬合计',
  `highest_education` int NULL DEFAULT NULL COMMENT '最高学历',
  `graduation_college` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最高学历毕业学院',
  `day_highest_education` int NULL DEFAULT NULL COMMENT '全日制最高学历',
  `day_graduation_college` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '全日制最高学历毕业学院',
  `work_year` int NULL DEFAULT 0 COMMENT '司龄',
  `contract_type` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '合同类型',
  `certificate_list` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '证书名称',
  `enter_date` int NULL DEFAULT 0 COMMENT '入职日期',
  `resignation_date` int NULL DEFAULT 0 COMMENT '离职日期',
  `wage_type` int NULL DEFAULT NULL COMMENT '工资形式',
  `is_history` tinyint NULL DEFAULT 1 COMMENT '最新版本',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 299 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '用户表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_agreement
-- ----------------------------
DROP TABLE IF EXISTS `user_agreement`;
CREATE TABLE `user_agreement`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `contract_type` int NULL DEFAULT NULL COMMENT '类型',
  `start_date` int NULL DEFAULT NULL COMMENT '开始日期',
  `end_date` int NULL DEFAULT NULL COMMENT '截止日期',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '主要约定条款',
  `file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '附件',
  `money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '金额',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '备注',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 185 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '合同协议' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_base
-- ----------------------------
DROP TABLE IF EXISTS `user_base`;
CREATE TABLE `user_base`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户id',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `sex` int NULL DEFAULT NULL COMMENT '用户性别',
  `job_class` int NULL DEFAULT NULL COMMENT '岗位分类',
  `original_job_class` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `position_id` int NULL DEFAULT NULL COMMENT '岗位id',
  `short_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '对应企业微信简称',
  `job_level` int NULL DEFAULT NULL COMMENT '职等',
  `job_grade` int NULL DEFAULT NULL COMMENT '职级',
  `enter_date` int NULL DEFAULT NULL COMMENT '入职日期',
  `resignation_date` int NULL DEFAULT NULL COMMENT '离职日期',
  `user_IDCard` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '身份证号',
  `user_IDCard_start_date` bigint NULL DEFAULT NULL COMMENT '身份证有效期开始时间',
  `user_IDCard_end_date` bigint NULL DEFAULT NULL COMMENT '身份证有效期结束时间',
  `user_IDCard_long_effective` tinyint NULL DEFAULT 0 COMMENT '身份证长期有效(0否1是)',
  `user_IDCard_valid_date` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '身份证有效期',
  `birthday` date NULL DEFAULT NULL COMMENT '出生日期',
  `hometown` int NULL DEFAULT NULL COMMENT '籍贯',
  `hometown_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '籍贯名称',
  `nationality` int NULL DEFAULT NULL COMMENT '民族',
  `political_appearance` int NULL DEFAULT NULL COMMENT '政治面貌',
  `day_highest_education` int NULL DEFAULT NULL COMMENT '全日制最高学历',
  `day_graduation_college` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '全日制最高学历毕业学院',
  `highest_education` int NULL DEFAULT NULL COMMENT '最高学历',
  `graduation_college` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '最高学历毕业学院',
  `address` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '现居住地',
  `marital` int NULL DEFAULT NULL COMMENT '婚姻状况',
  `household_type` int NULL DEFAULT NULL COMMENT '户口类型',
  `household_address` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '户籍地址',
  `work_before_year` int NULL DEFAULT NULL COMMENT '入职前工作年限-以月为单位',
  `work_current_year` int NULL DEFAULT NULL COMMENT '当前职位年限-以月为单位',
  `work_year` int NULL DEFAULT NULL COMMENT '司龄-以月为单位',
  `work_effective_date` int NULL DEFAULT NULL COMMENT '当前职位生效日期',
  `car_number` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '车牌号',
  `introduction_person` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '入职介绍人',
  `internal_ability_evaluation` int NULL DEFAULT NULL COMMENT '内部能力评价',
  `external_ability_evaluation` int NULL DEFAULT NULL COMMENT '外部能力评价',
  `user_card_front` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '身份证正面',
  `user_card_back` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '身份证反面',
  `driving_permit` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '行驶证',
  `driving_license` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '驾驶证',
  `longitude` varchar(72) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '经度',
  `latitude` varchar(72) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '纬度',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 295 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '用户基本信息表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_card
-- ----------------------------
DROP TABLE IF EXISTS `user_card`;
CREATE TABLE `user_card`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `card_type` int NULL DEFAULT NULL COMMENT '类型',
  `bank_type` int NULL DEFAULT NULL COMMENT '行别',
  `is_send` int NULL DEFAULT NULL COMMENT '是否为工资发放账户 1是 0否',
  `account` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '卡号',
  `bank` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '开户行',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 85 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '卡号信息' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_certificate_disability
-- ----------------------------
DROP TABLE IF EXISTS `user_certificate_disability`;
CREATE TABLE `user_certificate_disability`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `disability_type` int NULL DEFAULT NULL COMMENT '残疾类别',
  `disability_level` int NULL DEFAULT NULL COMMENT '残疾等级',
  `disability_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '残疾证编号',
  `start_date` int NULL DEFAULT NULL COMMENT '发证日期',
  `certificate_validity` int NULL DEFAULT NULL COMMENT '证书有效期',
  `authority` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '发证机构',
  `is_validity` int NULL DEFAULT NULL COMMENT '是否在有效期内',
  `certificate_file` json NULL COMMENT '证件附件',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 40 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '残疾证信息' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_certificate_other
-- ----------------------------
DROP TABLE IF EXISTS `user_certificate_other`;
CREATE TABLE `user_certificate_other`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `certificate_name` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '证书名称',
  `certificate_type` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '证书类型',
  `certificate_level` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '证书等级',
  `certificate_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '证书编号',
  `start_date` int NULL DEFAULT NULL COMMENT '有效期起',
  `end_date` int NULL DEFAULT NULL COMMENT '有效期止',
  `authority` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '发证机构',
  `certificate_validity` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '证书有效期',
  `interrogation_date` int NULL DEFAULT NULL COMMENT '发证日期',
  `certificate_file` json NULL COMMENT '证件附件',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 57 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '其他资格证书信息' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_certificate_qualification
-- ----------------------------
DROP TABLE IF EXISTS `user_certificate_qualification`;
CREATE TABLE `user_certificate_qualification`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `qualifocate_type` int NULL DEFAULT NULL COMMENT '资格属别',
  `qualifocate_class` int NULL DEFAULT NULL COMMENT '资格类别',
  `qualifocate_name` int NULL DEFAULT NULL COMMENT '职业资格名称',
  `qualifocate_level` int NULL DEFAULT NULL COMMENT '资格级别/作业类别/等级',
  `operation_items` int NULL DEFAULT NULL COMMENT '操作项目',
  `major` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '专业名称',
  `certificate_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '证书编号',
  `register_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '注册编号',
  `is_annual` int NULL DEFAULT NULL COMMENT '是否年审',
  `start_date` int NULL DEFAULT NULL COMMENT '有效期开始日期',
  `end_date` int NULL DEFAULT NULL COMMENT '有效期结束日期',
  `authority` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '发证部门',
  `certificate_file` json NULL COMMENT '证件附件',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 88 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '职业资格证书信息' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_contact
-- ----------------------------
DROP TABLE IF EXISTS `user_contact`;
CREATE TABLE `user_contact`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  `type` int NULL DEFAULT NULL COMMENT '类型 手机 座机 传真 微信 QQ 邮箱',
  `account` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '号码',
  `short_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '集团短号',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 514 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '联系方式' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_credit_rating
-- ----------------------------
DROP TABLE IF EXISTS `user_credit_rating`;
CREATE TABLE `user_credit_rating`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '信用等级' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_educate
-- ----------------------------
DROP TABLE IF EXISTS `user_educate`;
CREATE TABLE `user_educate`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `start_date` int NULL DEFAULT NULL COMMENT '开始日期',
  `end_date` int NULL DEFAULT NULL COMMENT '结束日期',
  `college` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '毕业学院',
  `education` int NULL DEFAULT NULL COMMENT '学历',
  `degree` int NULL DEFAULT NULL COMMENT '学位',
  `study_type` int NULL DEFAULT NULL COMMENT '学位形式 全日制 非全日制',
  `education_type` int NULL DEFAULT NULL COMMENT '毕业学院层次',
  `education_height` smallint NULL DEFAULT 0 COMMENT '最高学历',
  `education_full_time_height` smallint NULL DEFAULT 0 COMMENT '全日制最高学历',
  `major` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '专业',
  `major_type` int NULL DEFAULT NULL COMMENT '专业类型',
  `academic_type` int NULL DEFAULT NULL COMMENT '学术类型',
  `academic_level` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '学位层次',
  `diploma_send_date` int NULL DEFAULT NULL COMMENT '毕业证发放时间',
  `diploma_file` json NULL COMMENT '毕业证附件',
  `degree_send_date` int NULL DEFAULT NULL COMMENT '学位证发放时间',
  `degree_file` json NULL COMMENT '学位证附件',
  `is_high` tinyint(1) NULL DEFAULT 0 COMMENT '是否最高学历',
  `is_study_high` tinyint(1) NULL DEFAULT 0 COMMENT '是否全日制最高学历',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 203 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '教育经历' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_external_system
-- ----------------------------
DROP TABLE IF EXISTS `user_external_system`;
CREATE TABLE `user_external_system`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `type` int NULL DEFAULT NULL COMMENT '类型',
  `system_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '系统名称',
  `url` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '网址',
  `account` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '账户',
  `login_type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '登录方式',
  `registration_date` int NULL DEFAULT NULL COMMENT '注册日期',
  `stop_date` int NULL DEFAULT NULL COMMENT '系统终止日期',
  `authorized_start_date` int NULL DEFAULT NULL COMMENT '公司授权使用日期',
  `authorized_end_date` int NULL DEFAULT NULL COMMENT '授权终止日期',
  `role` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '角色',
  `cardId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '身份证号',
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '绑定手机号',
  `customer_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '客户识别码',
  `operation_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '操作员代码',
  `login_pass` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '登录密码',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 51 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '外部系统' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_family
-- ----------------------------
DROP TABLE IF EXISTS `user_family`;
CREATE TABLE `user_family`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `call` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '关系称呼',
  `name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '姓名',
  `tel` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '联系电话',
  `company` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '现阶段工作单位或学习情况',
  `is_contact` int NULL DEFAULT NULL COMMENT '是否紧急联系人',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 74 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '家庭关系' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_internal_system
-- ----------------------------
DROP TABLE IF EXISTS `user_internal_system`;
CREATE TABLE `user_internal_system`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `system_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '系统名称',
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '图标',
  `url` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '网址',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '内部系统' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_item
-- ----------------------------
DROP TABLE IF EXISTS `user_item`;
CREATE TABLE `user_item`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `type_id` int NULL DEFAULT NULL COMMENT '资产类别',
  `class_id` int NULL DEFAULT NULL COMMENT '资产分类',
  `stock_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '存货编码',
  `stock_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '存货名称',
  `stock_model` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '规格型号',
  `stock_unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '单位',
  `consuming_date` int NULL DEFAULT NULL COMMENT '领用日期',
  `consuming_num` int NULL DEFAULT NULL COMMENT '领用数量',
  `code` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '识别码',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 60 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '领用物品' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_job
-- ----------------------------
DROP TABLE IF EXISTS `user_job`;
CREATE TABLE `user_job`  (
  `user_id` int NOT NULL COMMENT '员工ID',
  `department_id` int NOT NULL DEFAULT 0 COMMENT '部门id',
  `job_id` int NOT NULL DEFAULT 0 COMMENT '岗位ID',
  `job_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '岗位名称',
  `subject_id` tinyint(1) NOT NULL DEFAULT 0 COMMENT '主体ID'
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '人员岗位记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_salary
-- ----------------------------
DROP TABLE IF EXISTS `user_salary`;
CREATE TABLE `user_salary`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `item` int NULL DEFAULT NULL COMMENT '项目',
  `class` int NULL DEFAULT NULL COMMENT '类别',
  `secrecy_level` int NULL DEFAULT NULL COMMENT '保密级别',
  `is_provide` int NULL DEFAULT NULL COMMENT '是否发放',
  `money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '标准(元)',
  `start_date` int NULL DEFAULT NULL COMMENT '初次发放日期',
  `end_date` int NULL DEFAULT NULL COMMENT '发放截至日期',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 202 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '工资' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_salary_benefits
-- ----------------------------
DROP TABLE IF EXISTS `user_salary_benefits`;
CREATE TABLE `user_salary_benefits`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `wage_type` int NULL DEFAULT NULL COMMENT '工资形式',
  `performance_type` int NULL DEFAULT NULL COMMENT '绩效工资',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 72 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '薪酬福利' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_seal
-- ----------------------------
DROP TABLE IF EXISTS `user_seal`;
CREATE TABLE `user_seal`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `class_id` int NULL DEFAULT NULL COMMENT '印章类型',
  `seal_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '印章编号',
  `seal_unit` int NULL DEFAULT NULL COMMENT '单位',
  `consuming_date` int NULL DEFAULT NULL COMMENT '领用日期',
  `consuming_num` int NULL DEFAULT NULL COMMENT '领用数量',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '印章' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_secret
-- ----------------------------
DROP TABLE IF EXISTS `user_secret`;
CREATE TABLE `user_secret`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID',
  `secret_name` varchar(62) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '名称',
  `secret_url` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '网址',
  `account` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '账户',
  `secret_type` int NULL DEFAULT NULL COMMENT 'U盾类型',
  `secret_number` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '编号',
  `secret_num` int NULL DEFAULT NULL COMMENT '数量',
  `secret_unit` int NULL DEFAULT NULL COMMENT '单位',
  `certificate_validity` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'CA证书有效期',
  `consuming_date` int NULL DEFAULT NULL COMMENT '领用日期',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'U盾/密匙' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_skill
-- ----------------------------
DROP TABLE IF EXISTS `user_skill`;
CREATE TABLE `user_skill`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `skill_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '技能名称',
  `proficiency` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '熟练水平',
  `skill_duration` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '技能年限',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 45 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '技能/语言' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_social_security
-- ----------------------------
DROP TABLE IF EXISTS `user_social_security`;
CREATE TABLE `user_social_security`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `item` int NULL DEFAULT NULL COMMENT '项目',
  `class` int NULL DEFAULT NULL COMMENT '类别',
  `secrecy_level` int NULL DEFAULT NULL COMMENT '保密级别',
  `is_provide` int NULL DEFAULT NULL COMMENT '是否发放',
  `money` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '社保、医保基数(元)',
  `payment_months` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '入职前累计缴费月数',
  `start_date` int NULL DEFAULT NULL COMMENT '入职后社保参保起始日期',
  `payment_place` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '入职后缴纳地',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 236 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '社保' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_work
-- ----------------------------
DROP TABLE IF EXISTS `user_work`;
CREATE TABLE `user_work`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `entry_date` int NULL DEFAULT NULL COMMENT '入职日期',
  `resign_date` int NULL DEFAULT NULL COMMENT '离职日期',
  `company` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '单位名称',
  `department` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '所属部门',
  `job` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '岗位工种',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 57 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '工作经历' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for word_mapping_record
-- ----------------------------
DROP TABLE IF EXISTS `word_mapping_record`;
CREATE TABLE `word_mapping_record`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_module_id` int NOT NULL DEFAULT 0,
  `module_id` int NOT NULL DEFAULT 0,
  `module_slug` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `business_id` int NOT NULL DEFAULT 0,
  `column_slug` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `word_id` int NOT NULL DEFAULT 0,
  `word_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `word_value` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `path` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `group_hash` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17103 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;
