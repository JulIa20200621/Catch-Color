import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cursor } from 'animal-island-ui';
import BottomNavigation, { type TabKey } from '@/components/BottomNavigation';
import LoginPage from '@/pages/LoginPage';
import CameraPage from '@/pages/CameraPage';
import AlbumPage from '@/pages/AlbumPage';
import DiaryPage from '@/pages/DiaryPage';
import PartnerPage from '@/pages/PartnerPage';
import ProfilePage from '@/pages/ProfilePage';

const PAGES: Record<TabKey, React.ComponentType> = {
  camera: CameraPage,
  album: AlbumPage,
  diary: DiaryPage,
  partner: PartnerPage,
  profile: ProfilePage,
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState<TabKey>('camera');
  const Page = PAGES[tab];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ddd3b8] py-0 sm:py-6">
      {/* 手机外框（桌面端展示） */}
      <Cursor className="relative h-[100dvh] w-full overflow-hidden bg-[#f8f8f0] sm:h-[844px] sm:w-[390px] sm:rounded-[40px] sm:shadow-float sm:ring-1 sm:ring-black/5">
        {/* 状态栏 */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-40 flex items-center justify-between px-7 pt-3.5">
          <span className="font-round text-[11px] font-semibold text-[#3b3b3e]/60">9:41</span>
          <span className="font-round text-[11px] font-semibold text-[#3b3b3e]/40">●●●</span>
        </div>

        {!loggedIn ? (
          <div className="h-full pt-9">
            <LoginPage onLogin={() => setLoggedIn(true)} />
          </div>
        ) : (
          <>
            <div className="relative h-full pt-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="h-full"
                >
                  <Page />
                </motion.div>
              </AnimatePresence>
            </div>
            <BottomNavigation active={tab} onChange={setTab} />
          </>
        )}
      </Cursor>
    </div>
  );
}
