import { useCallback, useState } from 'react';
import { TrashIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { fetchAddApiToken, fetchDeleteApiToken } from '../../../utils/api';
import { useData } from '../hooks/useData';
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Loading } from "../../../components/Loading";
import { useToast } from "../../../components/ui/Toast";

export const ApiToken = () => {
  const [showAdd, setShowAdd] = useState(false);
  const { store, loading, reload } = useData();
  const { success, error } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await fetchDeleteApiToken(id);
        reload();
        success("删除成功");
      } catch (err) {
        error("删除失败!");
      }
    },
    [reload]
  );

  const handleCreate = useCallback(
    async () => {
      if (!formData.name) {
        error("请填写名称");
        return;
      }
      try {
        await fetchAddApiToken(formData);
        setShowAdd(false);
        reload();
        success("添加成功");
      } catch (err) {
        error("添加失败!");
      }
    },
    [formData, reload]
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      success("已复制到剪贴板");
    });
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <span className="text-sm text-gray-500 dark:text-gray-400">当前共 {store?.tokens?.length ?? 0} 条</span>
        <div className="flex gap-2">
          <Button onClick={() => { setFormData({ name: "" }); setShowAdd(true); }}>添加</Button>
          <Button variant="outline" onClick={() => reload()}>刷新</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg bg-white shadow-sm dark:bg-gray-800">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loading />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">序号</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">名称</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">值</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {store?.tokens?.map((record: any) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{record.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{record.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2 max-w-sm">
                      <span className="truncate font-mono bg-gray-100 px-2 py-0.5 rounded text-xs dark:bg-gray-700 dark:text-gray-300">{record.value}</span>
                      <button onClick={() => copyToClipboard(record.value)} className="text-gray-400 hover:text-blue-600">
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    <button onClick={() => {
                      setDeleteTargetId(record.id);
                      setDeleteConfirmOpen(true);
                    }} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="新建 Token"
        footer={<><Button variant="secondary" onClick={() => setShowAdd(false)}>取消</Button><Button onClick={handleCreate}>确定</Button></>}
      >
        <div className="space-y-4">
          <Input
            label="名称"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入 API Token 名称"
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (deleteTargetId) handleDelete(deleteTargetId);
        }}
        title="确认删除"
        description="确定要删除这个 Token 吗？"
        isDestructive
      />
    </div>
  );
};
