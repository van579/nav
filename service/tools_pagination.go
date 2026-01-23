package service

import (
	"github.com/mereith/nav/database"
	"github.com/mereith/nav/types"
	"github.com/mereith/nav/utils"
)

func GetToolsPage(page, pageSize int, keyword string, catelog string) ([]types.Tool, int64) {
	offset := (page - 1) * pageSize
	whereClause := "WHERE 1=1"
	args := []interface{}{}

	if keyword != "" {
		whereClause += " AND (name LIKE ? OR desc LIKE ?)"
		likeKeyword := "%" + keyword + "%"
		args = append(args, likeKeyword, likeKeyword)
	}

	if catelog != "" {
		whereClause += " AND catelog = ?"
		args = append(args, catelog)
	}

	// Count query
	countSQL := "SELECT count(*) FROM nav_table " + whereClause
	var total int64
	err := database.DB.QueryRow(countSQL, args...).Scan(&total)
	if err != nil {
		utils.CheckErr(err)
		return nil, 0
	}

	// Data query
	dataSQL := "SELECT id,name,url,logo,catelog,desc,sort,hide FROM nav_table " + whereClause + " ORDER BY sort LIMIT ? OFFSET ?"
	args = append(args, pageSize, offset)

	results := make([]types.Tool, 0)
	rows, err := database.DB.Query(dataSQL, args...)
	if err != nil {
		utils.CheckErr(err)
		return nil, 0
	}
	defer rows.Close()

	for rows.Next() {
		var tool types.Tool
		var hide interface{}
		var sort interface{}
		err = rows.Scan(&tool.Id, &tool.Name, &tool.Url, &tool.Logo, &tool.Catelog, &tool.Desc, &sort, &hide)
		if hide == nil {
			tool.Hide = false
		} else {
			if hide.(int64) == 0 {
				tool.Hide = false
			} else {
				tool.Hide = true
			}
		}
		if sort == nil {
			tool.Sort = 0
		} else {
			i64 := sort.(int64)
			tool.Sort = int(i64)
		}
		utils.CheckErr(err)
		results = append(results, tool)
	}
	return results, total
}
