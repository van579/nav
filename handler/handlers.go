package handler

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"net/http"
	"net/url"
	urlPkg "net/url"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/mereith/nav/database"
	"github.com/mereith/nav/logger"
	"github.com/mereith/nav/service"
	"github.com/mereith/nav/types"
	"github.com/mereith/nav/utils"
)

func ExportToolsHandler(c *gin.Context) {
	tools := service.GetAllTool()
	c.JSON(200, gin.H{
		"success": true,
		"message": "导出工具成功",
		"data":    tools,
	})
}

func ImportToolsHandler(c *gin.Context) {
	var tools []types.Tool
	err := c.ShouldBindJSON(&tools)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	// 导入所有工具
	service.ImportTools(tools)
	c.JSON(200, gin.H{
		"success": true,
		"message": "导入工具成功",
	})
}

func DeleteApiTokenHandler(c *gin.Context) {
	// 删除 Token
	id := c.Param("id")
	sql_delete_api_token := `
		UPDATE nav_api_token
		SET disabled = 1
		WHERE id = ?;
		`
	stmt, err := database.DB.Prepare(sql_delete_api_token)
	utils.CheckErr(err)
	res, err := stmt.Exec(id)
	utils.CheckErr(err)
	_, err = res.RowsAffected()
	utils.CheckErr(err)
	c.JSON(200, gin.H{
		"success": true,
		"message": "删除 API Token 成功",
	})
}

func AddApiTokenHandler(c *gin.Context) {
	var token types.AddTokenDto
	err := c.ShouldBindJSON(&token)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	newId := utils.GenerateId()
	var signedJwt string
	signedJwt, err = utils.SignJWTForAPI(token.Name, newId)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	service.AddApiTokenInDB(types.Token{
		Name:     token.Name,
		Value:    signedJwt,
		Id:       newId,
		Disabled: 0,
	})
	// 签名 jwt
	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"id":    newId,
			"Value": signedJwt,
			"Name":  token.Name,
		},
		"message": "添加 Token 成功",
	})
}

func UpdateSettingHandler(c *gin.Context) {
	var data types.Setting
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	logger.LogInfo("更新配置: %+v", data)
	err := service.UpdateSetting(data)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"message": "更新配置成功",
	})
}

func UpdateUserHandler(c *gin.Context) {
	var data types.UpdateUserDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	service.UpdateUser(data)
	c.JSON(200, gin.H{
		"success": true,
		"message": "更新用户成功",
	})
}

func sha256Hash(s string) string {
	h := sha256.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}

func GetAllHandler(c *gin.Context) {
	setting := service.GetSetting()

	// Check Guest Password
	realPwd := service.GetRealGuestPassword()
	isLocked := false
	if realPwd != "" {
		// Check cookie
		cookie, err := c.Cookie("guest_authorized")
		// Verify if cookie matches SHA256(realPwd)
		if err != nil || cookie != sha256Hash(realPwd) {
			isLocked = true
		}
	}

	if isLocked {
		c.JSON(200, gin.H{
			"success": true,
			"data": gin.H{
				"tools":    []types.Tool{},
				"catelogs": []types.Catelog{},
				"setting":  setting,
				"locked":   true,
			},
		})
		return
	}

	tools := service.GetAllTool()
	// 获取全部数据
	catelogs := service.GetAllCatelog()
	if !utils.IsLogin(c) {
		// 过滤掉隐藏工具
		tools = utils.FilterHideTools(tools, catelogs)
	}
	if !utils.IsLogin(c) {
		// 过滤掉隐藏分类
		catelogs = utils.FilterHideCates(catelogs)
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"tools":    tools,
			"catelogs": catelogs,
			"setting":  setting,
			"locked":   false,
		},
	})
}

func VerifyGuestHandler(c *gin.Context) {
	var input struct {
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errorMessage": "参数错误"})
		return
	}

	realPwd := service.GetRealGuestPassword()
	if realPwd == "" {
		// No password set, always success
		// Set a dummy hash or clear it, strictly speaking no lock means no cookie needed,
		// but to be consistent let's just return success without cookie or empty cookie.
		// Actually if no password is set, the frontend/GetAllHandler won't check it.
		c.JSON(200, gin.H{"success": true})
		return
	}

	if input.Password == realPwd {
		// Set SHA256 hash of the password as cookie
		cookieVal := sha256Hash(realPwd)
		c.SetCookie("guest_authorized", cookieVal, 3600*24*30, "/", "", false, false)
		c.JSON(200, gin.H{"success": true})
	} else {
		c.JSON(200, gin.H{"success": false, "errorMessage": "密码错误"})
	}
}

func GetLogoImgHandler(c *gin.Context) {
	url := c.Query("url")
	// Robust fix for unencoded input URLs: extract everything after "url="
	rawQuery := c.Request.URL.RawQuery
	idx := strings.Index(rawQuery, "url=")
	if idx != -1 {
		// Extract potential full URL string (handling unencoded & chars)
		candidate := rawQuery[idx+4:]
		// Attempt to unescape, but fallback to candidate if it fails or if candidate was already "valid"
		decoded, err := urlPkg.QueryUnescape(candidate)
		if err == nil && len(decoded) > len(url) {
			url = decoded
		}
	}

	if url == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "URL参数不能为空",
		})
		return
	}
	img := service.GetImgFromDB(url)
	if img.Id == 0 {
		c.Redirect(http.StatusFound, url)
		return
	}
	// Check if the value is a URL (legacy data or manual insertion)
	if strings.HasPrefix(img.Value, "http") || strings.HasPrefix(img.Value, "//") {
		c.Redirect(http.StatusFound, img.Value)
		return
	}
	imgBuffer, err := base64.StdEncoding.DecodeString(img.Value)
	if err != nil {
		// Fallback to original URL if decoding fails
		c.Redirect(http.StatusFound, url)
		return
	}
	l := strings.Split(url, ".")
	suffix := l[len(l)-1]
	t := "image/x-icon"
	if suffix == "svg" || strings.Contains(url, ".svg") {
		t = "image/svg+xml"
	} else if suffix == "png" {
		t = "image/png"
	}
	// 直接输出二进制数据，避免string转换导致的内存多分配
	c.Data(http.StatusOK, t, imgBuffer)
}

func GetAdminAllDataHandler(c *gin.Context) {
	// 管理员获取全部数据，还有个用户名。
	tools := service.GetAllTool()
	catelogs := service.GetAllCatelog()
	setting := service.GetSetting()
	tokens := service.GetApiTokens()
	userId, ok := c.Get("uid")
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "不存在该用户！",
		})
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"tools":    tools,
			"catelogs": catelogs,
			"setting":  setting,
			"user": gin.H{
				"name": c.GetString("username"),
				"id":   userId,
			},
			"tokens": tokens,
		},
	})
}

func LoginHandler(c *gin.Context) {
	var data types.LoginDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	user := service.GetUser(data.Name)
	if user.Name == "" {
		c.JSON(200, gin.H{
			"success":      false,
			"errorMessage": "用户名不存在",
		})
		return
	}
	if user.Password != data.Password {
		c.JSON(200, gin.H{
			"success":      false,
			"errorMessage": "密码错误",
		})
		return
	}
	// 生成 token
	token, err := utils.SignJWT(user)
	utils.CheckErr(err)

	c.JSON(200, gin.H{
		"success": true,
		"message": "登录成功",
		"data": gin.H{
			"user":  user,
			"token": token,
		},
	})

}

// 退出登录
func LogoutHandler(c *gin.Context) {
	c.JSON(200, gin.H{
		"success": true,
		"message": "登出成功",
	})
}

func AddToolHandler(c *gin.Context) {
	// 添加工具
	var data types.AddToolDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	logger.LogInfo("%s 获取 logo: %s", data.Name, data.Logo)
	id, err := service.AddTool(data)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	if data.Logo == "" {
		go service.LazyFetchLogo(data.Url, id)
	}
	c.JSON(200, gin.H{
		"success": true,
		"message": "添加成功",
	})
}

func DeleteToolHandler(c *gin.Context) {
	// 删除工具
	id := c.Param("id")
	sql_delete_tool := `
		DELETE FROM nav_table WHERE id = ?;
		`
	stmt, err := database.DB.Prepare(sql_delete_tool)
	utils.CheckErr(err)
	res, err := stmt.Exec(id)
	utils.CheckErr(err)
	_, err = res.RowsAffected()
	utils.CheckErr(err)
	// 删除工具的 logo，如果有
	numberId, err := strconv.Atoi(id)
	utils.CheckErr(err)
	url1 := service.GetToolLogoUrlById(numberId)
	urlEncoded := url.QueryEscape(url1)
	sql_delete_tool_img := `
		DELETE FROM nav_img WHERE url = ?;
		`
	stmt, err = database.DB.Prepare(sql_delete_tool_img)
	utils.CheckErr(err)
	res, err = stmt.Exec(urlEncoded)
	utils.CheckErr(err)
	_, err = res.RowsAffected()
	utils.CheckErr(err)
	c.JSON(200, gin.H{
		"success": true,
		"message": "删除成功",
	})
}

func UpdateToolHandler(c *gin.Context) {
	// 更新工具
	var data types.UpdateToolDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	service.UpdateTool(data)
	if data.Logo == "" {
		logger.LogInfo("%s 获取 logo: %s", data.Name, data.Logo)
		go service.LazyFetchLogo(data.Url, int64(data.Id))
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "更新成功",
	})
}

func AddCatelogHandler(c *gin.Context) {
	// 添加分类
	var data types.AddCatelogDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	service.AddCatelog(data)

	c.JSON(200, gin.H{
		"success": true,
		"message": "增加分类成功",
	})
}

func DeleteCatelogHandler(c *gin.Context) {
	// 删除分类
	id := c.Param("id")
	sql_delete_catelog := `
		DELETE FROM nav_catelog WHERE id = ?;
		`
	stmt, err := database.DB.Prepare(sql_delete_catelog)
	utils.CheckErr(err)
	res, err := stmt.Exec(id)
	utils.CheckErr(err)
	_, err = res.RowsAffected()
	utils.CheckErr(err)
	c.JSON(200, gin.H{
		"success": true,
		"message": "删除分类成功",
	})
}

func UpdateCatelogHandler(c *gin.Context) {
	// 更新分类
	var data types.UpdateCatelogDto
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}
	service.UpdateCatelog(data)

	c.JSON(200, gin.H{
		"success": true,
		"message": "更新分类成功",
	})
}

func ManifastHanlder(c *gin.Context) {

	setting := service.GetSetting()
	title := setting.Title

	var icons = []gin.H{}

	logo192 := setting.Logo192
	if logo192 == "" {
		logo192 = "logo192.png"
	}

	logo512 := setting.Logo512
	if logo512 == "" {
		logo512 = "logo512.png"
	}

	icons = append(icons, gin.H{
		"src":   logo192,
		"type":  "image/png",
		"sizes": "192x192",
	})
	icons = append(icons, gin.H{
		"src":   logo512,
		"type":  "image/png",
		"sizes": "512x512",
	})

	if title == "" {
		title = "Van nav"
	}
	c.JSON(200, gin.H{
		"short_name":       title,
		"name":             title,
		"icons":            icons,
		"start_url":        "/",
		"display":          "standalone",
		"scope":            "/",
		"theme_color":      "#000000",
		"background_color": "#ffffff",
	})
}

func UpdateToolsSortHandler(c *gin.Context) {
	var updates []types.UpdateToolsSortDto
	if err := c.ShouldBindJSON(&updates); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	err := service.UpdateToolsSort(updates)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "更新排序成功",
	})
}

func UpdateCatelogsSortHandler(c *gin.Context) {
	var updates []types.UpdateCatelogsSortDto
	if err := c.ShouldBindJSON(&updates); err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	err := service.UpdateCatelogsSort(updates)
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "更新分类排序成功",
	})
}

func BatchDeleteToolHandler(c *gin.Context) {
	var ids []int
	if err := c.ShouldBindJSON(&ids); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":      false,
			"errorMessage": "无效的参数",
		})
		return
	}

	// 1. Collect Logo URLs first (Read operation)
	var logoUrls []string
	for _, id := range ids {
		url := service.GetToolLogoUrlById(id)
		if url != "" {
			logoUrls = append(logoUrls, url)
		}
	}

	// 2. Start Transaction (Write operation)
	tx, err := database.DB.Begin()
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": "数据库忙，请稍后重试",
		})
		return
	}

	// Prepare statements
	sql_delete_tool := "DELETE FROM nav_table WHERE id = ?;"
	stmtTool, err := tx.Prepare(sql_delete_tool)
	if err != nil {
		tx.Rollback()
		utils.CheckErr(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": "准备删除语句失败",
		})
		return
	}
	defer stmtTool.Close()

	sql_delete_img := "DELETE FROM nav_img WHERE url = ?;"
	stmtImg, err := tx.Prepare(sql_delete_img)
	if err != nil {
		tx.Rollback()
		utils.CheckErr(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": "准备图片删除语句失败",
		})
		return
	}
	defer stmtImg.Close()

	// Execute Deletes
	for _, id := range ids {
		_, err := stmtTool.Exec(id)
		if err != nil {
			tx.Rollback()
			utils.CheckErr(err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success":      false,
				"errorMessage": "删除工具失败: " + strconv.Itoa(id),
			})
			return
		}
	}

	for _, url := range logoUrls {
		if url == "" {
			continue
		}
		urlEncoded := urlPkg.QueryEscape(url)
		_, err := stmtImg.Exec(urlEncoded)
		if err != nil {
			logger.LogError("Failed to delete image: %s, error: %s", url, err)
		}
	}

	err = tx.Commit()
	if err != nil {
		utils.CheckErr(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":      false,
			"errorMessage": "提交事务失败",
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "批量删除成功",
	})
}

func GetToolsPageHandler(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("size", "20")
	keyword := c.Query("q")
	catelog := c.Query("catelog")

	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	tools, total := service.GetToolsPage(page, pageSize, keyword, catelog)

	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"items": tools,
			"total": total,
			"page":  page,
			"size":  pageSize,
		},
	})
}
