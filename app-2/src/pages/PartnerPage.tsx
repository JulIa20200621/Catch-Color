import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, MessageCircle, Swords, UserPlus, Send, Crown, Flame } from 'lucide-react';
import { Tabs, Modal, Button, Card, Drawer, Input, Progress, Notification } from 'animal-island-ui';
import PhotoArt from '@/components/PhotoArt';
import { FRIENDS, NEW_FRIENDS, POSTS, USER, type Friend, type Post } from '@/data/friends';
import { getColor, COLORS } from '@/data/colors';
import { WALK_DAYS } from '@/data/photos';

const MEDALS = ['🥇', '🥈', '🥉'];
type PkType = 'photos' | 'colors';
type PkStep = 'choose' | 'battle' | 'result';

export default function PartnerPage() {
  const [friends, setFriends] = useState(FRIENDS);
  const [addOpen, setAddOpen] = useState(false);
  const [candidates, setCandidates] = useState(NEW_FRIENDS);

  const [pk, setPk] = useState<Friend | null>(null);
  const [pkStep, setPkStep] = useState<PkStep>('choose');
  const [pkType, setPkType] = useState<PkType>('colors');
  const [pkView, setPkView] = useState<'photos' | 'map' | null>(null);
  const [vipOpen, setVipOpen] = useState(false);

  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishColor, setPublishColor] = useState(COLORS[0].id);
  const [publishText, setPublishText] = useState('');
  const [commentFor, setCommentFor] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');

  /* ---------- 好友榜 ---------- */
  const ranking = useMemo(() => {
    const rows = [
      { name: `${USER.name}（我）`, avatar: USER.avatar, todayColors: 3, streak: USER.walkDays, isMe: true, friend: undefined as Friend | undefined },
      ...friends.map((f) => ({ name: f.name, avatar: f.avatar, todayColors: f.todayColors, streak: f.streak, isMe: false, friend: f })),
    ];
    return rows.sort((a, b) => b.todayColors - a.todayColors);
  }, [friends]);
  const maxColors = ranking[0]?.todayColors ?? 5;

  const dotsOf = (name: string, count: number) => {
    const offset = name.length * 3;
    return COLORS.slice(offset % 3, offset % 3 + count + 2).slice(0, Math.max(count, 1));
  };

  /* ---------- PK ---------- */
  const startPk = (f: Friend) => {
    setPk(f);
    setPkStep('choose');
    setPkView(null);
  };
  const beginBattle = (t: PkType) => {
    setPkType(t);
    setPkStep('battle');
    setTimeout(() => setPkStep('result'), 1900);
  };
  const myScore = pkType === 'photos' ? USER.photos : USER.colors;
  const friendScore = pk ? (pkType === 'photos' ? pk.photos : pk.todayColors * 9) : 0;
  const iWin = myScore >= friendScore;

  /* ---------- 社区 ---------- */
  const toggleLike = (id: number) =>
    setPosts((ps) =>
      ps.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)),
    );

  const publish = () => {
    if (!publishText.trim()) {
      Notification.warning({ message: '写点什么再发布吧', position: 'top' });
      return;
    }
    const c = getColor(publishColor);
    setPosts((ps) => [
      {
        id: Date.now(), user: USER.name, avatar: USER.avatar, time: '刚刚',
        text: publishText, colorId: c.id, seed: 400 + ps.length, likes: 0, comments: [],
      },
      ...ps,
    ]);
    setPublishOpen(false);
    setPublishText('');
    Notification.success({ message: '已发布到社区 🌿', position: 'top' });
  };

  const sendComment = () => {
    if (!commentText.trim() || !commentFor) return;
    setPosts((ps) =>
      ps.map((p) =>
        p.id === commentFor.id
          ? { ...p, comments: [...p.comments, { user: USER.name, avatar: USER.avatar, text: commentText }] }
          : p,
      ),
    );
    setCommentFor((p) =>
      p ? { ...p, comments: [...p.comments, { user: USER.name, avatar: USER.avatar, text: commentText }] } : p,
    );
    setCommentText('');
  };

  const addFriend = (f: Friend) => {
    setFriends((fs) => [...fs, f]);
    setCandidates((cs) => cs.filter((c) => c.id !== f.id));
    Notification.success({ message: `已和 ${f.name} 成为伙伴 🎉`, position: 'top' });
  };

  return (
    <div className="flex h-full flex-col pb-24 pt-2">
      <div className="flex-1">
        <Tabs
          className="tabs-nowrap tabs-center"
          items={[
            {
              key: 'friends',
              label: '好友',
              children: (
                <div className="h-[calc(100dvh-210px)] space-y-3 overflow-y-auto px-2 no-scrollbar pt-3 sm:h-[630px]">
                  {/* 操作行 */}
                  <div className="flex gap-2">
                    <Button icon={<UserPlus size={13} />} block onClick={() => setAddOpen(true)}>
                      添加好友
                    </Button>
                    <Button icon={<Crown size={13} />} block onClick={() => setVipOpen(true)}>
                      多人 PK
                    </Button>
                  </div>

                  {/* 今日散步榜 */}
                  <Card>
                    <p className="font-round text-[13px] font-semibold">🏆 今日散步榜</p>
                    <div className="mt-3 space-y-3.5">
                      {ranking.map((r, i) => (
                        <motion.div
                          key={r.name}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.07, duration: 0.3 }}
                          className="flex items-center gap-2"
                        >
                          <span className="w-5 shrink-0 text-center text-[13px]">
                            {i < 3 ? MEDALS[i] : <span className="font-round text-[11px] font-semibold opacity-50">{i + 1}</span>}
                          </span>
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${r.isMe ? 'bg-[#d8ead9] ring-2 ring-[#8ac68a]' : 'bg-white/80'}`}>
                            {r.avatar}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <p className="shrink-0 font-round text-[12px] font-semibold">{r.name}</p>
                              <span className="flex shrink-0 -space-x-1">
                                {dotsOf(r.name, r.todayColors).slice(0, 4).map((c) => (
                                  <span key={c.id} className="h-2.5 w-2.5 rounded-full ring-1 ring-white" style={{ background: c.hex }} />
                                ))}
                              </span>
                              <span className="ml-auto flex shrink-0 items-center gap-0.5 font-round text-[10px] font-semibold opacity-60">
                                <Flame size={10} className="text-[#e59266]" />
                                {r.streak}
                              </span>
                            </div>
                            <div className="mt-1.5">
                              <Progress percent={Math.round((r.todayColors / maxColors) * 100)} size="small" showInfo={false} />
                            </div>
                          </div>
                          {r.isMe && (
                            <span className="shrink-0 rounded-full bg-[#8ac68a]/20 px-2.5 py-1 font-round text-[10px] font-semibold text-[#4a7a4a]">
                              是我
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </Card>

                  {/* 伙伴资料卡 */}
                  {friends.map((f, i) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                    >
                      <Card hoverable>
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-xl shadow-sm">
                            {f.avatar}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-round text-sm font-semibold">{f.name}</p>
                            <p className="mt-0.5 whitespace-nowrap text-[10px] font-medium opacity-70">
                              📷 {f.photos} · 🐾 {f.animals}
                            </p>
                            <div className="mt-1.5 flex -space-x-1">
                              {dotsOf(f.name, 4).map((c) => (
                                <span key={c.id} className="h-3.5 w-3.5 rounded-full ring-2 ring-[#f7f3df]" style={{ background: c.hex }} />
                              ))}
                            </div>
                          </div>
                          <Button size="small" icon={<Swords size={11} />} onClick={() => startPk(f)}>
                            PK
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ),
            },
            {
              key: 'community',
              label: '社区',
              children: (
                <div className="h-[calc(100dvh-210px)] space-y-4 overflow-y-auto px-2 no-scrollbar pt-3 sm:h-[630px]">
                  <Button type="primary" icon={<Send size={13} />} block onClick={() => setPublishOpen(true)}>
                    分享今天的小颜色
                  </Button>
                  {posts.map((p, i) => {
                    const c = getColor(p.colorId);
                    return (
                      <motion.article
                        key={p.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.35 }}
                      >
                        <Card>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sm">{p.avatar}</span>
                            <p className="flex-1 font-round text-[12px] font-semibold">{p.user}</p>
                            <span className="text-[10px] font-medium opacity-60">{p.time}</span>
                          </div>
                          <PhotoArt colorId={p.colorId} seed={p.seed} className="mt-2.5 aspect-[4/3] w-full rounded-xl" />
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ background: c.hex }} />
                            <span className="font-round text-[11px] font-medium">{c.name}</span>
                          </div>
                          <p className="mt-1.5 text-[12px] font-medium leading-relaxed opacity-85">{p.text}</p>
                          <div className="mt-2 flex items-center gap-4">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => toggleLike(p.id)}
                              className={`flex items-center gap-1 font-round text-[11px] font-medium ${p.liked ? 'text-[#d65f5f]' : 'opacity-60'}`}
                            >
                              <motion.span key={String(p.liked)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>
                                <Heart size={14} fill={p.liked ? '#d65f5f' : 'none'} strokeWidth={1.8} />
                              </motion.span>
                              {p.likes}
                            </motion.button>
                            <button
                              onClick={() => setCommentFor(p)}
                              className="flex items-center gap-1 font-round text-[11px] font-medium opacity-60"
                            >
                              <MessageCircle size={14} strokeWidth={1.8} />
                              {p.comments.length}
                            </button>
                          </div>
                        </Card>
                      </motion.article>
                    );
                  })}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* 添加好友 */}
      <Modal
        open={addOpen}
        title="添加好友"
        typewriter={false}
        width={310}
        onClose={() => setAddOpen(false)}
        footer={<Button block onClick={() => setAddOpen(false)}>完成</Button>}
      >
        <div className="space-y-3">
          {candidates.map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-lg">{f.avatar}</span>
              <div className="flex-1">
                <p className="font-round text-[12px] font-semibold">{f.name}</p>
                <p className="text-[10px] font-medium opacity-60">📷 {f.photos} · 连续 {f.streak} 天</p>
              </div>
              <Button size="small" type="primary" onClick={() => addFriend(f)}>添加</Button>
            </div>
          ))}
          {candidates.length === 0 && (
            <p className="py-3 text-center text-[12px] font-medium opacity-60">附近暂时没有新伙伴啦</p>
          )}
        </div>
      </Modal>

      {/* PK 流程（自制圆角卡片，文字完整展示） */}
      <AnimatePresence>
        {pk && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#3b3b3e]/25 px-8 backdrop-blur-[2px]"
            onClick={() => pkStep !== 'battle' && setPk(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[320px] rounded-[24px] bg-[#fdfbf2] p-6 shadow-float"
            >
              <p className="text-center font-round text-lg font-bold text-[#3b3b3e]">
                {pkStep === 'choose' ? '选择 PK 方式' : pkStep === 'battle' ? 'PK 进行中…' : 'PK 结果'}
              </p>

              {pkStep === 'choose' && (
                <>
                  <p className="mt-3 text-center text-[13px] font-medium leading-relaxed text-[#6b6b70]">
                    和 {pk.avatar} {pk.name} 比点什么？
                  </p>
                  <p className="mt-1 text-center text-[10px] font-medium text-[#9d9da2]">
                    （一次只能和一位伙伴 PK 哦）
                  </p>
                  <div className="mt-5 space-y-3">
                    <Button block onClick={() => beginBattle('photos')}>
                      📷 按照片数量
                    </Button>
                    <Button type="primary" block onClick={() => beginBattle('colors')}>
                      🎨 按颜色数量
                    </Button>
                  </div>
                </>
              )}

              {pkStep === 'battle' && (
                <div className="mt-4 flex items-center justify-around py-2">
                  <motion.div
                    animate={{ x: [0, 12, 0], rotate: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="text-center"
                  >
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#d8ead9] text-3xl">{USER.avatar}</span>
                    <p className="mt-1.5 font-round text-[11px] font-semibold">{USER.name}</p>
                  </motion.div>
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="font-round text-xl font-bold text-[#e59266]"
                  >
                    VS
                  </motion.span>
                  <motion.div
                    animate={{ x: [0, -12, 0], rotate: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="text-center"
                  >
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F6ECE9] text-3xl">{pk.avatar}</span>
                    <p className="mt-1.5 font-round text-[11px] font-semibold">{pk.name}</p>
                  </motion.div>
                </div>
              )}

              {pkStep === 'result' && (
                <>
                  <div className="mt-3 text-center">
                    <motion.p
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                      className="text-3xl"
                    >
                      {iWin ? '🎉' : '💪'}
                    </motion.p>
                    <p className="mt-2 font-round text-sm font-semibold">
                      {iWin ? '你赢啦！' : `${pk.name} 小胜一筹`}
                    </p>
                    <p className="mt-1 text-[11px] font-medium opacity-70">
                      {pkType === 'photos' ? '照片数量' : '颜色数量'} · 你 {myScore} : {friendScore} {pk.name}
                    </p>
                  </div>
                  <div className="mt-5 space-y-3">
                    <Button block onClick={() => setPkView('photos')}>看看双方的图片</Button>
                    <Button block onClick={() => setPkView('map')}>看看双方的路线</Button>
                    <Button type="primary" block onClick={() => setPk(null)}>结束 PK</Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PK 查看双方图片 */}
      <Drawer open={pkView === 'photos'} placement="bottom" height="70%" className="phone-drawer" title="双方的图片" onClose={() => setPkView(null)}>
        {pk && (
          <div className="grid grid-cols-2 gap-4 pb-6">
            {[
              { name: USER.name, avatar: USER.avatar, offset: 0 },
              { name: pk.name, avatar: pk.avatar, offset: 3 },
            ].map((side) => (
              <div key={side.name}>
                <p className="mb-2 text-center font-round text-[12px] font-semibold">
                  {side.avatar} {side.name}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {COLORS.slice(side.offset, side.offset + 4).map((c, i) => (
                    <PhotoArt key={c.id} colorId={c.id} seed={500 + side.offset * 10 + i} className="aspect-square w-full rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      {/* PK 查看双方路线 */}
      <Drawer open={pkView === 'map'} placement="bottom" height="70%" className="phone-drawer" title="双方的散步路线" onClose={() => setPkView(null)}>
        <div className="pb-6">
          <div className="overflow-hidden rounded-2xl" style={{ background: '#eef0dc' }}>
            <svg viewBox="0 0 340 420" className="h-72 w-full" preserveAspectRatio="xMidYMid slice">
              <rect x="24" y="30" width="126" height="100" rx="20" fill="#f8f3e0" />
              <rect x="190" y="220" width="120" height="110" rx="20" fill="#fdf9ea" />
              <path d="M 0 180 C 90 165, 180 200, 340 175 L 340 215 C 220 235, 100 205, 0 225 Z" fill="#c4e2da" />
              <path d="M 0 120 L 340 110" stroke="#fffdf4" strokeWidth="12" strokeLinecap="round" />
              <path d="M 170 0 L 180 420" stroke="#fffdf4" strokeWidth="10" strokeLinecap="round" />
              {[0, 1].map((k) => {
                const d = WALK_DAYS[k];
                const path = d.route.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y * 0.6}`).join(' ');
                return (
                  <path key={k} d={path} fill="none" stroke={k === 0 ? '#e59266' : '#6db5a8'} strokeWidth="5" strokeLinecap="round" strokeDasharray="1 12" />
                );
              })}
            </svg>
          </div>
          <div className="mt-3 flex justify-center gap-6 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-5 rounded-full bg-[#e59266]" /> {USER.avatar} {USER.name}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-5 rounded-full bg-[#6db5a8]" /> {pk?.avatar} {pk?.name}
            </span>
          </div>
        </div>
      </Drawer>

      {/* 多人 PK → 会员 */}
      <Modal
        open={vipOpen}
        title="多人 PK"
        typewriter={false}
        width={300}
        onClose={() => setVipOpen(false)}
        footer={
          <Button type="primary" block onClick={() => { setVipOpen(false); Notification.success({ message: '会员功能即将上线，敬请期待 👑', position: 'top' }); }}>
            升级会员解锁
          </Button>
        }
      >
        <p className="text-center text-[12px] font-medium leading-relaxed opacity-75">
          目前一次只能和一位伙伴 PK。
          <br />
          升级会员即可发起 3-5 人的颜色大乱斗 👑
        </p>
      </Modal>

      {/* 发布到社区 */}
      <Modal
        open={publishOpen}
        title="分享今天的小颜色"
        typewriter={false}
        width={320}
        onClose={() => setPublishOpen(false)}
        footer={
          <Button type="primary" block onClick={publish}>发布</Button>
        }
      >
        <p className="text-[11px] font-semibold opacity-70">选一张今天的照片</p>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setPublishColor(c.id)}
              className={`aspect-square rounded-lg transition-transform ${publishColor === c.id ? 'scale-110 ring-2 ring-[#7c81d8] ring-offset-2' : ''}`}
              style={{ background: `linear-gradient(160deg, ${c.hex}, ${c.soft})` }}
            />
          ))}
        </div>
        <div className="mt-3">
          <Input
            placeholder="写点什么…"
            value={publishText}
            onChange={(e) => setPublishText(e.target.value)}
          />
        </div>
      </Modal>

      {/* 评论 */}
      <Drawer
        open={commentFor !== null}
        placement="bottom"
        height="65%"
        className="phone-drawer"
        title={commentFor ? `${commentFor.user} 的评论区` : undefined}
        onClose={() => setCommentFor(null)}
      >
        {commentFor && (
          <div className="flex h-full flex-col pb-4">
            <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
              {commentFor.comments.length === 0 && (
                <p className="py-6 text-center text-[12px] font-medium opacity-60">还没有评论，抢个沙发～</p>
              )}
              {commentFor.comments.map((cm, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm">{cm.avatar}</span>
                  <div className="rounded-2xl rounded-tl-sm bg-white/70 px-3 py-2">
                    <p className="font-round text-[11px] font-semibold">{cm.user}</p>
                    <p className="text-[12px] font-medium opacity-85">{cm.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1">
                <Input placeholder="说点好听的…" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
              </div>
              <Button type="primary" icon={<Send size={13} />} onClick={sendComment} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
