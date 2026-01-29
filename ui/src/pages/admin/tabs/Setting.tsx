import { useCallback, useEffect, useState } from "react";
import { fetchUpdateSetting, fetchUpdateUser } from "../../../utils/api";
import { useData } from "../hooks/useData";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Switch } from "../../../components/ui/Switch";
import { Loading } from "../../../components/Loading";

import toast from "react-hot-toast";

export const Setting = () => {
  const { store, loading, reload } = useData();
  const [userData, setUserData] = useState<any>({});
  const [settingData, setSettingData] = useState<any>({});
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    if (store?.user) setUserData(store.user);
    if (store?.setting) setSettingData(store.setting);
  }, [store])

  const handleUpdateUser = useCallback(
    async () => {
      if (!userData.name || !userData.password) {
        toast.error("请输入用户名和密码");
        return;
      }
      setRequestLoading(true);
      try {
        await fetchUpdateUser({ ...userData, id: store?.user?.id });
        toast.success("修改成功!");
        reload();
      } catch (err: any) {
        toast.error(err.message || "修改失败!");
      } finally {
        setRequestLoading(false);
      }
    },
    [userData, store, reload]
  );

  const handleUpdateWebSite = useCallback(
    async () => {
      setRequestLoading(true);
      try {
        await fetchUpdateSetting(settingData);
        toast.success("修改成功!");
        reload();
      } catch (err: any) {
        toast.error(err.message || "修改失败!");
      } finally {
        setRequestLoading(false);
      }
    },
    [settingData, reload]
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h2 className="mb-6 text-lg font-medium text-gray-900 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-700">修改用户信息</h2>
        <div className="space-y-4 max-w-lg">
          <Input
            label="用户名"
            value={userData.name || ''}
            onChange={e => setUserData({ ...userData, name: e.target.value })}
          />
          <Input
            label="密码"
            type="password"
            value={userData.password || ''}
            onChange={e => setUserData({ ...userData, password: e.target.value })}
            placeholder="请输入新密码"
          />
          <div className="pt-2">
            <Button onClick={handleUpdateUser} isLoading={requestLoading}>提交修改</Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h2 className="mb-6 text-lg font-medium text-gray-900 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-700">修改网站信息</h2>
        <div className="space-y-5 max-w-2xl">
          <Input
            label="网站 logo"
            value={settingData.favicon || ''}
            onChange={e => setSettingData({ ...settingData, favicon: e.target.value })}
            placeholder="输入 logo 的 url，仅支持 png 或 svg 格式"
          />
          <Input
            label="网站标题"
            value={settingData.title || ''}
            onChange={e => setSettingData({ ...settingData, title: e.target.value })}
          />
          <Input
            label="公信部备案"
            value={settingData.govRecord || ''}
            onChange={e => setSettingData({ ...settingData, govRecord: e.target.value })}
            placeholder="请输入网站备案信息"
          />

          <div>
            <Select
              label="默认跳转方式"
              value={settingData.jumpTargetBlank}
              options={[
                { label: "新标签页", value: true as any },
                { label: "原地跳转", value: false as any }
              ]}
              onChange={val => setSettingData({ ...settingData, jumpTargetBlank: val })}
            />
            <p className="mt-1 text-sm text-gray-500">选择点击卡片后默认的跳转方式</p>
          </div>

          <Input
            label="logo 192x192"
            value={settingData.logo192 || ''}
            onChange={e => setSettingData({ ...settingData, logo192: e.target.value })}
            placeholder="用于 PWA 应用图标"
          />
          <Input
            label="logo 512x512"
            value={settingData.logo512 || ''}
            onChange={e => setSettingData({ ...settingData, logo512: e.target.value })}
            placeholder="用于 PWA 应用图标"
          />

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">隐藏管理员后台卡片</span>
              <p className="text-xs text-gray-500">开启后将在前台隐藏管理员入口卡片</p>
            </div>
            <Switch checked={!!settingData.hideAdmin} onChange={val => setSettingData({ ...settingData, hideAdmin: val })} />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">隐藏 Github 按钮</span>
              <p className="text-xs text-gray-500">开启后将在前台隐藏 Github 悬浮按钮</p>
            </div>
            <Switch checked={!!settingData.hideGithub} onChange={val => setSettingData({ ...settingData, hideGithub: val })} />
          </div>

          <Input
            label="访客密码"
            value={settingData.guestPassword || ''}
            onChange={e => setSettingData({ ...settingData, guestPassword: e.target.value })}
            placeholder="设置后，访问首页需输入密码（留空则不限制）"
            type="password"
          />
          <p className="text-xs text-gray-500 -mt-3">若设置为 "********" 表示密码未变动</p>
        </div>

        <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              自定义 CSS
            </label>
            <textarea
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm"
              value={settingData.customCSS || ''}
              onChange={e => setSettingData({ ...settingData, customCSS: e.target.value })}
              placeholder="/* 输入自定义 CSS 样式 */"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              自定义 JavaScript
            </label>
            <textarea
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm"
              value={settingData.customJS || ''}
              onChange={e => setSettingData({ ...settingData, customJS: e.target.value })}
              placeholder="// 输入自定义 JavaScript 代码 (如统计脚本)"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleUpdateWebSite} isLoading={requestLoading}>提交修改</Button>
        </div>
      </div>
    </div>
  );
};
