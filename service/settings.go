package service

import (
	"database/sql"

	"github.com/mereith/nav/database"
	"github.com/mereith/nav/logger"
	"github.com/mereith/nav/types"
)

func GetSetting() types.Setting {
	sql_get_user := `
		SELECT id,favicon,title,govRecord,logo192,logo512,hideAdmin,hideGithub,jumpTargetBlank,customJS,customCSS,guestPassword
		FROM nav_setting 
		ORDER BY id ASC 
		LIMIT 1;
		`
	var setting types.Setting
	row := database.DB.QueryRow(sql_get_user)
	// 建立一个空变量
	var hideGithub interface{}
	var hideAdmin interface{}
	var jumpTargetBlank interface{}
	var customJS sql.NullString
	var customCSS sql.NullString
	var guestPassword sql.NullString

	err := row.Scan(&setting.Id, &setting.Favicon, &setting.Title, &setting.GovRecord, &setting.Logo192, &setting.Logo512, &hideAdmin, &hideGithub, &jumpTargetBlank, &customJS, &customCSS, &guestPassword)
	if err != nil {
		logger.LogError("获取配置失败: %s", err)
		return types.Setting{
			Id:              1,
			Favicon:         "favicon.ico",
			Title:           "Van Nav",
			GovRecord:       "",
			Logo192:         "logo192.png",
			Logo512:         "logo512.png",
			HideAdmin:       false,
			HideGithub:      false,
			JumpTargetBlank: true,
		}
	}
	if hideGithub == nil {
		setting.HideGithub = false
	} else {
		if hideGithub.(int64) == 0 {
			setting.HideGithub = false
		} else {
			setting.HideGithub = true
		}
	}
	if hideAdmin == nil {
		setting.HideAdmin = false
	} else {
		if hideAdmin.(int64) == 0 {
			setting.HideAdmin = false
		} else {
			setting.HideAdmin = true
		}
	}

	if jumpTargetBlank == nil {
		setting.JumpTargetBlank = true
	} else {
		if jumpTargetBlank.(int64) == 0 {
			setting.JumpTargetBlank = false
		} else {
			setting.JumpTargetBlank = true
		}
	}

	if customJS.Valid {
		setting.CustomJS = customJS.String
	}
	if customCSS.Valid {
		setting.CustomCSS = customCSS.String
	}
	// Mask the password for security
	if guestPassword.Valid && guestPassword.String != "" {
		setting.GuestPassword = "********"
	} else {
		setting.GuestPassword = ""
	}

	return setting
}

// Internal function to get real password
func GetRealGuestPassword() string {
	sql_get := `SELECT guestPassword FROM nav_setting ORDER BY id ASC LIMIT 1`
	var guestPassword sql.NullString
	err := database.DB.QueryRow(sql_get).Scan(&guestPassword)
	if err != nil {
		return ""
	}
	if guestPassword.Valid {
		return guestPassword.String
	}
	return ""
}

func UpdateSetting(data types.Setting) error {
	// If password is "********", it means no change, so we don't update it
	// If it is empty, we might want to clear it? No, usually empty input means clear.
	// But current UI pattern: we might need logic.
	// Let's assume: if input is "********", ignore update for password field.
	// If input is "", clear it? or ignore?
	// For simplicity: If user sends "********", we keep old password.
	// If user sends anything else, we update it. (Empty string clears it)

	currentRealPwd := GetRealGuestPassword()
	newPwd := data.GuestPassword
	if newPwd == "********" {
		newPwd = currentRealPwd
	}

	sql_update_setting := `
		UPDATE nav_setting
		SET favicon = ?, title = ?, govRecord = ?, logo192 = ?, logo512 = ?, hideAdmin = ?, hideGithub = ?, jumpTargetBlank = ?, customJS = ?, customCSS = ?, guestPassword = ?
		WHERE id = (SELECT id FROM nav_setting ORDER BY id ASC LIMIT 1);
		`

	stmt, err := database.DB.Prepare(sql_update_setting)
	if err != nil {
		return err
	}
	res, err := stmt.Exec(data.Favicon, data.Title, data.GovRecord, data.Logo192, data.Logo512, data.HideAdmin, data.HideGithub, data.JumpTargetBlank, data.CustomJS, data.CustomCSS, newPwd)
	if err != nil {
		return err
	}
	_, err = res.RowsAffected()
	if err != nil {
		return err
	}
	return nil
}
