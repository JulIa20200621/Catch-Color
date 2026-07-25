import { motion } from 'framer-motion';
import { Icon, type IconName } from 'animal-island-ui';

export type TabKey = 'camera' | 'album' | 'diary' | 'partner' | 'profile';

const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'camera', label: '拍摄', icon: 'icon-camera' },
  { key: 'album', label: '相册', icon: 'icon-design' },
  { key: 'diary', label: '日记', icon: 'icon-critterpedia' },
  { key: 'partner', label: '伙伴', icon: 'icon-chat' },
  { key: 'profile', label: '我的', icon: 'icon-miles' },
];

export default function BottomNavigation({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40 border-t border-[#e8e2ce] bg-[#fdfbf2]/95 pb-5 pt-3 backdrop-blur-sm">
      <div className="flex items-start justify-around px-2">
        {TABS.map(({ key, label, icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="flex w-14 flex-col items-center gap-1"
            >
              <motion.span
                animate={isActive ? { y: -2, scale: 1.08 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className={isActive ? '' : 'opacity-35 grayscale'}
              >
                <Icon name={icon} size={28} bounce={isActive} />
              </motion.span>
              <span
                className="font-round text-[11px] tracking-wide transition-colors"
                style={{ color: isActive ? '#725d42' : '#b4a88e', fontWeight: isActive ? 700 : 500 }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
