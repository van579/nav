import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useToast } from "../ui/Toast";

interface LockScreenProps {
    onUnlock: () => void;
}

const LockScreen = ({ onUnlock }: LockScreenProps) => {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { error } = useToast();
    const handleUnlock = async () => {
        if (!password) {
            error("请输入密码");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/guest/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (data.success) {
                onUnlock();
            } else {
                error(data.errorMessage || "密码错误");
            }
        } catch (e) {
            error("验证请求失败");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleUnlock();
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl dark:bg-gray-800">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        访客访问限制
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        该站点已设置密码保护，请输入访客密码继续访问。
                    </p>
                </div>
                <div className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm -space-y-px">
                        <Input
                            label="访客密码"
                            type="password"
                            placeholder="请输入密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={onKeyDown}
                        />
                    </div>

                    <div>
                        <Button
                            onClick={handleUnlock}
                            isLoading={loading}
                            className="group relative flex w-full justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            解锁访问
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LockScreen;
