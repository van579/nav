import { useCallback, useState, useEffect } from "react";
import { Bars3Icon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
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
import {
  fetchAddCateLog,
  fetchDeleteCatelog,
  fetchUpdateCateLog,
  fetchUpdateCatelogsSort,
} from "../../../utils/api";
import { useData } from "../hooks/useData";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Switch } from "../../../components/ui/Switch";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Loading } from "../../../components/Loading";

interface DataType {
  id: number;
  name: string;
  sort: number;
  hide: boolean;
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

export const Catelog = () => {
  const { store, loading, reload } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const [formData, setFormData] = useState<any>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [dataSource, setDataSource] = useState<DataType[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (store?.catelogs) {
      setDataSource(store.catelogs);
    }
  }, [store?.catelogs]);

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
          sort: index + 1,
        }));
        fetchUpdateCatelogsSort(updates).then(() => reload());

        return newData;
      });
    }
  };

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await fetchDeleteCatelog(id);
        reload();
      } catch (err) {
        alert("删除分类失败!");
      }
    },
    [reload]
  );

  const handleCreate = useCallback(
    async () => {
      if (!formData.name) {
        alert("请填写分类名称");
        return;
      }
      try {
        await fetchAddCateLog(formData);
        setShowAdd(false);
        reload();
      } catch (err) {
        alert("添加失败!");
      }
    },
    [formData, reload]
  );

  const handleUpdate = useCallback(
    async () => {
      setRequestLoading(true);
      try {
        await fetchUpdateCateLog(formData);
        setShowEdit(false);
        reload();
      } catch (err) {
        alert("更新失败!");
      } finally {
        setRequestLoading(false);
      }
    },
    [formData, reload]
  );

  const openAdd = () => {
    setFormData({ sort: 1, hide: false, name: "" });
    setShowAdd(true);
  }

  const openEdit = (record: any) => {
    setFormData({ ...record });
    setShowEdit(true);
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <span className="text-sm text-gray-500 dark:text-gray-400">当前共 {dataSource.length} 条</span>
        <div className="flex gap-2">
          <Button onClick={openAdd}>添加</Button>
          <Button variant="outline" onClick={() => reload()}>刷新</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg bg-white shadow-sm dark:bg-gray-800">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loading />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="w-10 px-4 py-3 text-left">
                    {/* Handle col */}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">序号</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">名称</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">排序</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">隐藏</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">操作</th>
                </tr>
              </thead>
              <SortableContext
                items={dataSource.map(i => i.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {dataSource.map((record) => (
                    <SortableRow key={record.id} id={record.id.toString()}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{record.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{record.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{record.sort}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{record.hide ? "是" : "否"}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(record)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => {
                            setDeleteTargetId(record.id);
                            setDeleteConfirmOpen(true);
                          }} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
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

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="新建分类"
        footer={<><Button variant="secondary" onClick={() => setShowAdd(false)}>取消</Button><Button onClick={handleCreate}>确定</Button></>}
      >
        <div className="space-y-4">
          <Input
            label="名称"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入分类名称"
          />
          <Input
            label="排序"
            type="number"
            value={formData.sort}
            onChange={e => setFormData({ ...formData, sort: parseInt(e.target.value) })}
            placeholder="请输入分类排序"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">隐藏</span>
            <Switch checked={formData.hide} onChange={val => setFormData({ ...formData, hide: val })} />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="修改分类"
        footer={<><Button variant="secondary" onClick={() => setShowEdit(false)}>取消</Button><Button onClick={handleUpdate} isLoading={requestLoading}>确定</Button></>}
      >
        <div className="space-y-4">
          <Input label="序号" value={formData.id} disabled className="bg-gray-100" />
          <Input
            label="名称"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入分类名称"
          />
          <Input
            label="排序"
            type="number"
            value={formData.sort}
            onChange={e => setFormData({ ...formData, sort: parseInt(e.target.value) })}
            placeholder="请输入分类排序"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">隐藏</span>
            <Switch checked={formData.hide} onChange={val => setFormData({ ...formData, hide: val })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (deleteTargetId) handleDelete(deleteTargetId);
        }}
        title="确认删除"
        description="确定要删除这个分类吗？"
        isDestructive
      />
    </div>
  );
};
