import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, ChevronRight } from 'lucide-react';
import { Card, Title, Tag, Wallet, Drawer, Switch, Modal, Button, Notification, Divider } from 'animal-island-ui';
import { COLORS, getColor } from '@/data/colors';
import { ANIMALS, type Animal } from '@/data/animals';
import { USER, MOODS } from '@/data/friends';

const STATS = [
  { value: USER.colors, label: '已捕捉颜色种类' },
  { value: USER.photos, label: '已拍摄照片' },
  { value: USER.walkDays, label: '捕捉天数' },
];

export default function ProfilePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calmMode, setCalmMode] = useState(true);
  const [mood, setMood] = useState<number | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);

  const pickMood = (i: number) => {
    setMood(i);
    Notification.success({ message: MOODS[i].desc, position: 'top' });
  };

  return (
    <div className="h-full overflow-y-auto px-5 pb-24 pt-2 no-scrollbar">
      {/* 设置入口 */}
      <div className="flex justify-end">
        <motion.button
          whileTap={{ scale: 0.85, rotate: 40 }}
          onClick={() => setSettingsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#b4a88e]"
        >
          <Settings size={19} strokeWidth={1.5} />
        </motion.button>
      </div>

      {/* 用户 */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-2 flex flex-col items-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#B2CCE2]">
          <span className="text-3xl font-semibold text-[#3b3b3e]">鹿</span>
        </span>
        <p className="mt-4 text-lg font-semibold text-[#3b3b3e]">{USER.name}</p>
        <p className="mt-1 text-[11px] font-medium tracking-wide text-[#9d9da2]">{USER.level}</p>
        <div className="mt-3">
          <Wallet value={12680} size="small" icon={<span>🎨</span>} />
        </div>
      </motion.div>

      {/* 数据 */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="mt-8">
        <Card>
          <div className="grid grid-cols-3 py-1">
            {STATS.map((s, i) => (
              <div key={s.label} className={`text-center ${i > 0 ? 'border-l border-black/10' : ''}`}>
                <p className="font-round text-2xl font-semibold">{s.value}</p>
                <p className="mt-1.5 text-[10px] font-medium opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* 心情打卡（压力改善模式开启时显示） */}
      <AnimatePresence>
        {calmMode && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mt-8">
            <Card color="app-blue">
              <p className="font-round text-[13px] font-semibold">今天散步后，心情怎么样？</p>
              <div className="mt-3 flex justify-between">
                {MOODS.map((m, i) => (
                  <motion.button
                    key={m.label}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => pickMood(i)}
                    className={`flex flex-col items-center gap-1 rounded-2xl px-1.5 py-1 transition-colors ${
                      mood === i ? 'bg-white/80 shadow-sm' : ''
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className={`text-[9px] font-medium ${mood === i ? 'font-semibold' : 'opacity-70'}`}>{m.label}</span>
                  </motion.button>
                ))}
              </div>
              {mood !== null && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-xl bg-white/60 px-3 py-2 text-center text-[11px] font-medium">
                  {MOODS[mood].desc} 🌷
                </motion.p>
              )}
            </Card>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 专属色盘（12 色） */}
      <section className="mt-10">
        <Title size="small" color="app-teal">我的专属色盘</Title>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-4">
          <Card>
            <div className="grid grid-cols-6 gap-x-2 gap-y-3 py-1">
              {COLORS.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.03, type: 'spring', stiffness: 320, damping: 18 }}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className="h-9 w-9 rounded-full border border-black/[0.05]"
                    style={{ background: `linear-gradient(145deg, ${c.hex}, ${c.soft})` }}
                  />
                  <span className="text-[8px] font-medium opacity-60">{c.name.slice(0, 2)}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </section>

      {/* 动物伙伴（12 只） */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <Title size="small" color="app-pink">动物伙伴</Title>
          <span className="font-round text-[11px] font-medium text-[#9d9da2]">
            {ANIMALS.filter((a) => a.unlocked).length} / {ANIMALS.length}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-y-7">
          {ANIMALS.map((a, i) => {
            const c = getColor(a.colorId);
            return (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setAnimal(a)}
                className="flex flex-col items-center"
              >
                <span
                  className={`flex h-16 w-16 items-center justify-center rounded-full ${
                    a.unlocked ? '' : 'border border-dashed border-[#d6ccb2]'
                  }`}
                  style={a.unlocked ? { background: c.soft } : undefined}
                >
                  <span className={`text-2xl ${a.unlocked ? '' : 'opacity-25 grayscale'}`}>{a.emoji}</span>
                </span>
                <span className={`mt-2 text-[10px] font-semibold ${a.unlocked ? 'text-[#3b3b3e]' : 'text-[#c2bda9]'}`}>
                  {c.name}
                </span>
              </motion.button>
            );
          })}
        </div>
        <p className="mt-4 text-center text-[10px] font-medium text-[#b4a88e]">
          同一种颜色还可能遇见更多伙伴，敬请期待 🐾
        </p>
      </section>

      {/* 设置抽屉 */}
      <Drawer
        open={settingsOpen}
        placement="bottom"
        height="75%"
        className="phone-drawer"
        title="设置"
        onClose={() => setSettingsOpen(false)}
      >
        <div className="space-y-5 pb-8">
          {/* 账号信息 */}
          <div>
            <p className="font-round text-[12px] font-semibold opacity-70">账号信息</p>
            <div className="mt-2 divide-y divide-black/5 rounded-2xl bg-white/60 px-4">
              <div className="flex items-center justify-between py-3">
                <span className="text-[12px] font-medium">手机号</span>
                <span className="font-round text-[12px] font-semibold">{USER.phone}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[12px] font-medium">微信</span>
                <span className="font-round text-[12px] font-semibold text-[#4a7a4a]">{USER.wechat} ✓</span>
              </div>
            </div>
          </div>

          <Divider />

          {/* 压力改善模式 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold">压力改善模式</p>
              <p className="mt-0.5 text-[10px] font-medium opacity-60">开启后，每天散步结束都会问问你的心情</p>
            </div>
            <Switch checked={calmMode} onChange={(v) => setCalmMode(v)} />
          </div>

          {/* 其他 */}
          <div className="divide-y divide-black/5 rounded-2xl bg-white/60 px-4">
            {['消息通知', '隐私', '关于 Color Catch', '退出登录'].map((item) => (
              <button
                key={item}
                className={`flex w-full items-center justify-between py-3 text-[12px] font-medium ${item === '退出登录' ? 'text-[#d65f5f]' : ''}`}
                onClick={() => Notification.info({ message: `「${item}」原型中暂未开放`, position: 'top' })}
              >
                {item}
                <ChevronRight size={14} className="opacity-40" />
              </button>
            ))}
          </div>

          <p className="text-center text-[10px] font-medium text-[#b4a88e]">Color Catch · 原型 v0.4</p>
        </div>
      </Drawer>

      {/* 动物详情 */}
      <Modal
        open={animal !== null}
        title={animal ? animal.name : ''}
        typewriter={false}
        width={300}
        onClose={() => setAnimal(null)}
        footer={
          <Button type="primary" block onClick={() => setAnimal(null)}>
            {animal?.unlocked ? '一起散步 🌿' : '去收集对应颜色'}
          </Button>
        }
      >
        {animal && (
          <div className="text-center">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-5xl"
              style={{ background: getColor(animal.colorId).soft }}
            >
              <span className={animal.unlocked ? '' : 'opacity-30 grayscale'}>{animal.emoji}</span>
            </motion.span>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Tag color="app-teal" variant="outlined" size="small">
                {getColor(animal.colorId).name}
              </Tag>
              <Tag variant={animal.unlocked ? 'solid' : 'dashed'} color="app-yellow" size="small">
                {animal.unlocked ? '已成为伙伴' : '未解锁'}
              </Tag>
            </div>
            <p className="mt-3 text-[12px] font-medium leading-relaxed opacity-80">{animal.personality}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
