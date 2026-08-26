package controllers

import (
	"monetizeai-backend/models"

	"gorm.io/gorm"
)

// fetchManagerUserMap returns a map[userID]bool for all admin users who have the tasks.manage permission.
func fetchManagerUserMap(db *gorm.DB) (map[uint]bool, error) {
	var managerIDs []uint
	err := db.Table("admin_user_permissions").
		Joins("JOIN admin_permissions ON admin_permissions.id = admin_user_permissions.admin_permission_id").
		Where("admin_permissions.`key` = ?", models.PermissionTasksManage).
		Pluck("admin_user_permissions.admin_user_id", &managerIDs).Error
	if err != nil {
		return nil, err
	}

	managerMap := make(map[uint]bool, len(managerIDs))
	for _, id := range managerIDs {
		managerMap[id] = true
	}
	return managerMap, nil
}
