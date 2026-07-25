import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Notification } from 'animal-island-ui';
import { MessageCircle } from 'lucide-react';
import { COLORS } from '@/data/colors';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const sendCode = () => {
    if (phone.length < 11) {
      Notification.warning({ message: '先输入 11 位手机号哦', position: 'top' });
      return;
    }
    setCodeSent(true);
    Notification.success({ message: '验证码已发送（Mock：随便输 4 位即可）', position: 'top' });
  };

  const loginByPhone = () => {
    if (phone.length < 11 || code.length < 4) {
      Notification.warning({ message: '手机号和验证码都要填哦', position: 'top' });
      return;
    }
    onLogin();
  };

  return (
    <div className="flex h-full flex-col bg-[#f8f8f0] px-8">
      {/* Logo 区 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-16 flex flex-col items-center"
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-[26px] shadow-float"
          style={{ background: `linear-gradient(150deg, ${COLORS[0].hex}, ${COLORS[5].hex})` }}
        >
          <span className="text-4xl">🎨</span>
        </div>
        <h1 className="mt-5 font-round text-[26px] font-bold text-[#3b3b3e]">Color Catch</h1>
        <p className="mt-1.5 text-[12px] font-medium text-[#9d9da2]">抓住生活里的小颜色</p>
      </motion.div>

      {/* 登录表单 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mt-12"
      >
        <div className="space-y-3">
          <Input
            placeholder="手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="验证码"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <Button onClick={sendCode}>{codeSent ? '重新发送' : '获取验证码'}</Button>
          </div>
          <Button type="primary" block size="large" onClick={loginByPhone}>
            登录 / 注册
          </Button>
        </div>

        {/* 微信登录 */}
        <div className="mt-8 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e8e2ce]" />
          <span className="text-[11px] font-medium text-[#b4a88e]">其他登录方式</span>
          <span className="h-px flex-1 bg-[#e8e2ce]" />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onLogin}
          className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#7ec67e] text-white shadow-float"
          aria-label="微信登录"
        >
          <MessageCircle size={22} />
        </motion.button>
        <p className="mt-2 text-center text-[11px] font-medium text-[#9d9da2]">微信一键登录</p>
      </motion.div>

      <p className="mt-auto pb-8 text-center text-[10px] leading-relaxed text-[#b4a88e]">
        登录即代表同意《用户协议》和《隐私政策》
        <br />
        当前为原型演示，任意输入即可进入
      </p>
    </div>
  );
}
