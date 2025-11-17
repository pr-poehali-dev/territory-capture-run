import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/icon';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');

  const [loginData, setLoginData] = useState({ credential: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    credential: '', 
    password: '', 
    confirmPassword: '', 
    name: '' 
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(loginData.credential, loginData.password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (registerData.password !== registerData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (registerData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      const isPhone = /^\+?\d+$/.test(registerData.credential);
      await register(registerData.credential, registerData.password, registerData.name, isPhone);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добро пожаловать!</DialogTitle>
          <DialogDescription>
            Войдите или создайте аккаунт для сохранения прогресса
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={loginType === 'email' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoginType('email')}
                    className="flex-1"
                  >
                    <Icon name="Mail" size={16} className="mr-1" />
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={loginType === 'phone' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoginType('phone')}
                    className="flex-1"
                  >
                    <Icon name="Phone" size={16} className="mr-1" />
                    Телефон
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-credential">
                  {loginType === 'email' ? 'Email' : 'Номер телефона'}
                </Label>
                <Input
                  id="login-credential"
                  type={loginType === 'email' ? 'email' : 'tel'}
                  placeholder={loginType === 'email' ? 'example@email.com' : '+7 999 123 45 67'}
                  value={loginData.credential}
                  onChange={(e) => setLoginData({ ...loginData, credential: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-destructive flex items-center gap-2">
                  <Icon name="AlertCircle" size={16} />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Имя</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Иван"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-credential">Email или телефон</Label>
                <Input
                  id="register-credential"
                  type="text"
                  placeholder="example@email.com или +7 999 123 45 67"
                  value={registerData.credential}
                  onChange={(e) => setRegisterData({ ...registerData, credential: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Пароль</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm">Повторите пароль</Label>
                <Input
                  id="register-confirm"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-destructive flex items-center gap-2">
                  <Icon name="AlertCircle" size={16} />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
