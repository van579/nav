import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import clsx from "clsx";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon, PencilSquareIcon, TrashIcon, CloudArrowUpIcon, LinkIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { getOptions, mutiSearch } from "../../../utils/admin";
import {
  fetchAddTool,
  fetchBatchDeleteTools,
  fetchDeleteTool,
  fetchExportTools,
  fetchImportTools,
  fetchUpdateTool,
  fetchUpdateToolsSort,
  fetchToolsPage,
} from "../../../utils/api";
import { useData } from "../hooks/useData";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Switch } from "../../../components/ui/Switch";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Loading } from "../../../components/Loading";
import { useToast } from "../../../components/ui/Toast";
import { ToolLogo } from "../../../components/ToolLogo";
import { Pagination } from "../../../components/ui/Pagination";

interface DataType {
  id: number;
  name: string;
  sort: number;
  [key: string]: any;
}

// Draggable Row Component
interface SortableRowProps {
  id: string;
  children: React.ReactNode;
}

const SortableRow = ({ id, children }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: isDragging ? "relative" as const : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "bg-gray-50 shadow-md dark:bg-gray-700" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
    >
      {/* Pass listeners to children or specific handle */}
      <td className="w-10 px-4 py-3 align-middle">
        <div className="flex items-center justify-center">
          <button {...attributes} {...listeners} className="cursor-move text-gray-400 hover:text-gray-600">
            <Bars3Icon className="h-5 w-5" />
          </button>
        </div>
      </td>
      {children}
    </tr>
  );
};

// FormItem Component
const FormItem = ({ label, children, className = "" }: { label: string, children: React.ReactNode, className?: string }) => (
  <div className={`md:col-span-2 flex items-center gap-4 ${className}`}>
    <label className="w-12 flex-shrink-0 text-right text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <div className="flex-1 min-w-0">
      {children}
    </div>
  </div>
);

// ToolModal moved outside
interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isEdit: boolean;
  loading: boolean;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (isEdit: boolean) => void;
  categoryOptions: any[];
}

const ToolModal = ({
  isOpen,
  onClose,
  title,
  isEdit,
  loading,
  formData,
  setFormData,
  onSubmit,
  categoryOptions
}: ToolModalProps) => {
  const { error } = useToast();
  const [logoMode, setLogoMode] = useState<"google" | "url" | "upload">("google");
  const [tempUrl, setTempUrl] = useState("");

  // Initialize logo mode based on existing data
  useEffect(() => {
    if (isOpen) {
      if (!formData.logo) {
        setLogoMode("google");
        setTempUrl("");
      } else if (formData.logo.startsWith("data:")) {
        setLogoMode("upload");
        setTempUrl("");
      } else if (formData.logo.startsWith("https://t3.gstatic.cn/faviconV2")) {
        setLogoMode("google");
        setTempUrl("");
      } else {
        setLogoMode("url");
        setTempUrl(formData.logo);
      }
    }
  }, [isOpen]);



  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024) { // 100KB limit
      error("文件大小不能超过 100KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (result) => {
      setFormData({ ...formData, logo: result.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleManualUrlChange = (val: string) => {
    setTempUrl(val);
    setFormData({ ...formData, logo: val });
  };

  const handleModeChange = (val: any) => {
    setLogoMode(val);
    if (val === 'url') {
      // Explicitly use current tempUrl
      setFormData((prev: any) => ({ ...prev, logo: tempUrl }));
    } else if (val === 'google') {
      if (formData.url) {
        const googleUrl = `https://t3.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(formData.url)}&size=64`;
        setFormData((prev: any) => ({ ...prev, logo: googleUrl }));
      }
    } else if (val === 'upload') {
      setFormData((prev: any) => ({ ...prev, logo: "" }));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} panelClassName="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>取消</Button>
          <Button onClick={() => onSubmit(isEdit)} isLoading={loading}>确定</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isEdit && (
          <FormItem label="ID">
            <Input value={formData.id} disabled className="bg-gray-100" />
          </FormItem>
        )}
        <FormItem label="名称">
          <Input
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="工具名称"
          />
        </FormItem>
        <FormItem label="网址">
          <Input
            value={formData.url}
            onChange={e => {
              const newUrl = e.target.value;
              let newLogo = formData.logo;
              if (logoMode === "google") {
                newLogo = `https://t3.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(newUrl)}&size=64`;
              }
              setFormData({ ...formData, url: newUrl, logo: newLogo });
            }}
            placeholder="https://"
          />
        </FormItem>
        <FormItem label="Logo">
          <div className="flex flex-col gap-2 w-full">
            <Select
              value={logoMode}
              options={[
                { label: "Google Favicon", value: "google" },
                { label: "手动输入 URL", value: "url" },
                { label: "上传图片", value: "upload" },
              ]}
              onChange={handleModeChange}
            />

            {logoMode === "url" && (
              <Input
                value={tempUrl}
                onChange={e => handleManualUrlChange(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            )}

            {logoMode === "upload" && (
              <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <span>选择文件</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
                <span className="text-xs text-gray-500">最大 100KB</span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">预览:</span>
              {formData.logo ? (
                <img
                  src={(formData.logo.startsWith("data:") || formData.logo.startsWith("http")) ? formData.logo : `/api/img?url=${encodeURIComponent(formData.logo)}`}
                  alt="Preview"
                  className="h-8 w-8 rounded object-contain border bg-white"
                  onError={(e) => { }}
                />
              ) : (
                <span className="text-xs text-gray-400">暂无</span>
              )}
            </div>
          </div>
        </FormItem>
        <FormItem label="分类">
          <Select
            value={formData.catelog}
            options={categoryOptions}
            onChange={val => setFormData({ ...formData, catelog: val })}
            placeholder="选择分类"
          />
        </FormItem>
        <FormItem label="描述" className="items-start">
          <Input
            textarea
            rows={3}
            value={formData.desc}
            onChange={e => setFormData({ ...formData, desc: e.target.value })}
          />
        </FormItem>
        <FormItem label="排序">
          <Input
            type="number"
            value={formData.sort}
            onChange={e => setFormData({ ...formData, sort: parseInt(e.target.value) })}
          />
        </FormItem>
        <FormItem label="隐藏">
          <Switch checked={!!formData.hide} onChange={val => setFormData({ ...formData, hide: val })} />
        </FormItem>
      </div>
    </Modal>
  );
};

export const Tools = () => {
  const { store, loading, reload } = useData();
  const { success, error } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [searchString, setSearchString] = useState("");
  const [catelogName, setCatelogName] = useState("");
  const [dataSource, setDataSource] = useState<DataType[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Form States
  const [formData, setFormData] = useState<any>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadData = useCallback(async () => {
    setRequestLoading(true);
    try {
      const res = await fetchToolsPage(page, pageSize, searchString, catelogName);
      setDataSource(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      error("加载数据失败");
    } finally {
      setRequestLoading(false);
    }
  }, [page, pageSize, searchString, catelogName]);

  useEffect(() => {
    // Debounce for search
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setDataSource((previous) => {
        const oldIndex = previous.findIndex((i) => i.id.toString() === active.id);
        const newIndex = previous.findIndex((i) => i.id.toString() === over?.id);
        const newData = arrayMove(previous, oldIndex, newIndex);

        // Update sort order in backend
        const updates = newData.map((item, index) => ({
          id: item.id,
          sort: (page - 1) * pageSize + index + 1,
        }));
        // Fire and forget, or handle error
        fetchUpdateToolsSort(updates).then(() => loadData());

        return newData;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      sort: 1,
      hide: false,
      name: "",
      url: "",
      logo: "",
      catelog: "",
      desc: ""
    });
  };

  const openAdd = () => {
    resetForm();
    setShowAdd(true);
  };

  const openEdit = (record: any) => {
    setFormData({ ...record });
    setShowEdit(true);
  };

  const handleSave = async (isEdit: boolean) => {
    // Basic Validation
    if (!formData.name || !formData.url || !formData.catelog) {
      error("请填写必要信息 (名称, 网址, 分类)");
      return;
    }

    setRequestLoading(true);
    try {
      if (isEdit) {
        await fetchUpdateTool(formData);
      } else {
        await fetchAddTool(formData);
      }
      loadData();
      reload(); // Update global store if needed (e.g. for counts elsewhere)
      setShowAdd(false);
      setShowEdit(false);
      success("保存成功");
    } catch (e) {
      error("操作失败");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetchDeleteTool(id);
      success("删除成功");
      loadData();
      reload();
    } catch (e) {
      error("删除失败");
    }
  };

  const handleExport = async () => {
    const data = await fetchExportTools();
    const jsr = JSON.stringify(data);
    const blob = new Blob([jsr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tools.json";
    document.documentElement.appendChild(a);
    a.click();
    document.documentElement.removeChild(a);
    success("导出成功");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (result) => {
      try {
        const json = JSON.parse(result.target?.result as string);
        await fetchImportTools(json);
        loadData();
        reload();
        success("导入成功");
      } catch (e) {
        error("导入失败: 格式错误");
      }
    }
    reader.readAsText(file);
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === dataSource.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(dataSource.map(i => i.id));
    }
  }

  const categoryOptions = getOptions(store?.catelogs || []);



  return (
    <div className="h-full flex flex-col p-4">
      {/* Actions Bar */}
      <div className={clsx("van-tools-actions-bar", styles.actionsBar)}>
        <div className={clsx("van-tools-actions-stats", styles.actionsStats)}>
          <span className="text-sm text-gray-500 dark:text-gray-400">共 {total} 条</span>
          {selectedIds.length > 0 && (
            <Button variant="danger" size="sm" onClick={() => setBulkDeleteConfirmOpen(true)}>
              删除选中
            </Button>
          )}
        </div>

        <div className={clsx("van-tools-actions-buttons", styles.actionsButtons)}>
          <div className="w-40">
            <Select
              value={catelogName}
              options={[{ label: "所有分类", value: "" }, ...categoryOptions]}
              onChange={setCatelogName}
              placeholder="筛选分类"
            />
          </div>
          <div className="w-48">
            <Input
              placeholder="搜索..."
              value={searchString}
              onChange={e => setSearchString(e.target.value)}
            />
          </div>
          <Button onClick={() => openAdd()}>添加</Button>
          <Button variant="outline" onClick={() => loadData()}>刷新</Button>

          <div className="relative">
            <input type="file" accept=".json" className="absolute inset-0 w-full opacity-0 cursor-pointer" onChange={handleImport} />
            <Button variant="outline">导入</Button>
          </div>
          <Button variant="outline" onClick={handleExport}>导出</Button>
        </div>
      </div>

      {/* Table Area */}
      <div className={clsx("van-tools-table-container", styles.tableContainer)}>
        {requestLoading && dataSource.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loading />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className={clsx("van-tools-table", styles.table)}>
              <thead className={clsx("van-tools-table-head", styles.tableHead)}>
                <tr>
                  <th scope="col" className="w-10 px-4 py-3 text-left">
                    {/* Handle col */}
                  </th>
                  <th scope="col" className="w-10 px-4 py-3">
                    <input type="checkbox"
                      checked={selectedIds.length === dataSource.length && dataSource.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th scope="col" className={clsx("van-tools-th", styles.th)}>
                    名称
                  </th>
                  <th scope="col" className={clsx("van-tools-th", styles.th)}>
                    分类
                  </th>
                  <th scope="col" className={clsx("van-tools-th", styles.th)}>
                    网址
                  </th>
                  <th scope="col" className={clsx("van-tools-th", styles.th)}>
                    隐藏
                  </th>
                  <th scope="col" className={clsx("van-tools-th text-right", styles.th, "text-right")}>
                    操作
                  </th>
                </tr>
              </thead>
              <SortableContext
                items={dataSource.map(i => i.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <tbody className={clsx("van-tools-table-body", styles.tableBody)}>
                  {dataSource.map((record) => (
                    <SortableRow key={record.id} id={record.id.toString()}>
                      <td className="w-10 px-4 py-3 align-middle">
                        <input type="checkbox"
                          checked={selectedIds.includes(record.id)}
                          onChange={() => toggleSelect(record.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 max-w-[200px] sm:max-w-[300px] whitespace-nowrap">
                        <div className="flex items-center">
                          <ToolLogo logo={record.logo} name={record.name} className="h-8 w-8 rounded-full mr-3 text-xs" />
                          <span className="font-medium text-gray-900 dark:text-white truncate" title={record.name}>{record.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.catelog}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={record.url}>
                        {record.url}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.hide ? "是" : "否"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(record)} className={clsx("van-tools-action-btn", styles.actionBtn, "text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300")}>
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => {
                            setDeleteTargetId(record.id);
                            setDeleteConfirmOpen(true);
                          }} className={clsx("van-tools-action-btn", styles.actionBtn, "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300")}>
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </SortableRow>
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        )}
      </div>

      <Pagination
        currentPage={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => setPage(p)}
      />

      {/* Modals */}
      <ToolModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="新建工具"
        isEdit={false}
        loading={requestLoading}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSave}
        categoryOptions={categoryOptions}
      />
      <ToolModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="修改工具"
        isEdit={true}
        loading={requestLoading}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSave}
        categoryOptions={categoryOptions}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (deleteTargetId) handleDelete(deleteTargetId);
        }}
        title="确认删除"
        description="确定要删除这个工具吗？此操作无法撤销。"
        isDestructive
      />

      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await fetchBatchDeleteTools(selectedIds);
            success("批量删除成功");
            loadData();
            reload();
            setSelectedIds([]);
          } catch (e) {
            error("批量删除失败");
          }
        }}
        title="确认批量删除"
        description={`确定要删除选中的 ${selectedIds.length} 项吗？此操作无法撤销。`}
        isDestructive
      />
    </div >
  );
};

const styles = {
  actionsBar: "mb-4 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800",
  actionsStats: "flex items-center gap-2",
  actionsButtons: "flex flex-wrap items-center gap-3",
  tableContainer: "flex-1 overflow-auto rounded-lg bg-white shadow-sm dark:bg-gray-800",
  table: "min-w-full divide-y divide-gray-200 dark:divide-gray-700",
  tableHead: "bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10",
  th: "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400",
  tableBody: "divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800",
  actionBtn: "",
};
