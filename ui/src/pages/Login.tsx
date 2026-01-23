
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await login(username, password);
      if (response.success) {
        localStorage.setItem('_token', response.data.token);
        navigate('/admin');
      } else {
        setError(response.message || '登录失败，请检查用户名或密码');
      }
    } catch (error) {
      console.error('登录失败:', error);
      setError('登录请求失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            VanNav 登录
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Self-hosted application dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <Input
              label="用户名"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              disabled={isLoading}
            />
            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              登录
            </Button>
          </div>
        </form>

        <div className="flex justify-center">
          <a href="https://github.com/mereith/van-nav" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500 flex items-center gap-2 transition-colors">
            <svg
              height="20"
              width="20"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span>VanNav</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
