import { useState, useEffect, FormEvent } from "react";
import { 
  Bot, 
  Settings, 
  Code2, 
  Terminal, 
  ShieldCheck, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Sparkles, 
  HelpCircle, 
  FolderGit2, 
  Send, 
  FileText, 
  AlertTriangle, 
  UserCheck, 
  Hourglass, 
  RotateCcw, 
  ExternalLink,
  Smartphone,
  CheckCircle2,
  Lock,
  Flame,
  Info
} from "lucide-react";
import { 
  generateConfigPy, 
  generateDatabasePy, 
  generateDownloaderPy, 
  generateCleanerPy, 
  generateMainPy, 
  generateRequirementsTxt, 
  generateReadmeMd, 
  BotConfig 
} from "./data/botCode";

export default function App() {
  // 1. Bot configuration state
  const [config, setConfig] = useState<BotConfig>({
    botToken: "7489304723:AAElK_X9-Y43M2kld_mXp2890J-mQwZ12Y0",
    adminId: "48293049",
    freeLimit: 5,
    nsfwFilter: true,
    premiumPrice: "۵۰,۰۰۰ تومان ماهانه",
    welcomeMsg: "با این رُبات می‌تونی فیلم و موزیک از یوتیوب، اینستاگرام، تیک‌تاک، توییتر و اسپاتیفای رو مستقیماً با بالاترین کیفیت دانلود کنی!",
    supportUsername: "AllDown_Support"
  });

  // 2. Active file viewer state
  const [activeFile, setActiveFile] = useState<string>("main.py");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // 3. Simulated Chat State
  const [messages, setMessages] = useState<Array<{
    sender: "user" | "bot";
    text: string;
    photo?: string;
    buttons?: Array<Array<{ text: string; action: string }>>;
    isAttachment?: boolean;
    attachmentName?: string;
    attachmentType?: "audio" | "document";
    isLoading?: boolean;
    progress?: number;
  }>>([
    {
      sender: "bot",
      text: `سلام **کاربر گرامی** عزیز! به ربات قدرتمند دانلودر **AllDown** خوش آمدید. 🙋‍♂️\n\nبا این رُبات می‌تونی فیلم و موزیک از یوتیوب، اینستاگرام، تیک‌تاک، توییتر و اسپاتیفای رو مستقیماً با بالاترین کیفیت دانلود کنی!\n\n👇 همین حالا لینک مورد نظر خود را بفرست تا دانلودش کنم!`,
      buttons: [
        [{ text: "👤 کاربر عادی (دانلود محدود روزانه)", action: "status_info" }],
        [{ text: "💎 خرید اشتراک ویژه (پرمیوم)", action: "buy_premium" }],
        [{ text: "ℹ️ راهنما و سایت‌های پشتیبانی شده", action: "help_info" }],
        [{ text: "📞 پشتیبانی ادمین", action: "support_contact" }]
      ]
    }
  ]);

  const [inputLink, setInputLink] = useState("");
  const [hasVerifiedAge, setHasVerifiedAge] = useState(false);
  const [isSimulatingDownload, setIsSimulatingDownload] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Code contents generated dynamically based on active state variables
  const fileContents: Record<string, string> = {
    "config.py": generateConfigPy(config),
    "main.py": generateMainPy(config),
    "downloader.py": generateDownloaderPy(),
    "database.py": generateDatabasePy(),
    "cleaner.py": generateCleanerPy(),
    "requirements.txt": generateRequirementsTxt(),
    "README.md": generateReadmeMd()
  };

  // Quick action to copy code to clipboard
  const handleCopyCode = (filename: string) => {
    const code = fileContents[filename];
    navigator.clipboard.writeText(code);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // Handle actual file download in browser
  const handleDownloadFile = (filename: string) => {
    const content = fileContents[filename];
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Reset emulator chat
  const handleResetChat = () => {
    setMessages([
      {
        sender: "bot",
        text: `سلام **کاربر گرامی** عزیز! به ربات قدرتمند دانلودر **AllDown** خوش آمدید. 🙋‍♂️\n\n${config.welcomeMsg}\n\n👇 همین حالا لینک مورد نظر خود را بفرست تا دانلودش کنم!`,
        buttons: [
          [{ text: "👤 کاربر عادی (دانلود محدود روزانه)", action: "status_info" }],
          [{ text: "💎 خرید اشتراک ویژه (پرمیوم)", action: "buy_premium" }],
          [{ text: "ℹ️ راهنما و سایت‌های پشتیبانی شده", action: "help_info" }],
          [{ text: "📞 پشتیبانی ادمین", action: "support_contact" }]
        ]
      }
    ]);
    setHasVerifiedAge(false);
    setIsSimulatingDownload(false);
    setDownloadProgress(0);
    setInputLink("");
  };

  // Emulation actions
  const handleBotAction = (action: string, btnText: string) => {
    // Add user response message
    setMessages(prev => [...prev, { sender: "user", text: btnText }]);

    setTimeout(() => {
      if (action === "status_info") {
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `👤 **وضعیت کاربری: رایگان**\n\n📥 تعداد دانلودهای شما در ۲۴ ساعت گذشته: **1**\n⚡️ تعداد دانلودهای مجاز باقیمانده برای امروز: **${config.freeLimit - 1}**\n\n⚠️ کاربران رایگان تا حجم ۵۰ مگابایت دانلود دارند. برای برداشتن محدودیت‌ها پرمیوم تهیه کنید.`
          }
        ]);
      } else if (action === "buy_premium") {
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `⭐️ **مزایای عضویت ویژه دائم AllDown:**\n۱. دانلود بدون محدودیت حجم و تعداد\n۲. لینک مستقیم صوتی و استخراج موزیک اسپاتیفای\n۳. سرعت دانلود اولویت فوق‌العاده بالا\n\n💵 هزینه تمدید اشتراک: **${config.premiumPrice}**\n\n✍️ جهت خرید و ارسال رسید به آیدی ادمین پشتیبانی پیام دهید:\n👉 @${config.supportUsername.replace('@', '')}`
          }
        ]);
      } else if (action === "help_info") {
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `📚 **راهنمای استفاده از ربات AllDown:**\n\nبرای شروع کافیست لینک مدیا را از یکی از شبکه‌های اجتماعی زیر در چت ارسال کنید:\n- **یوتیوب (YouTube)**: ویدیو تا کیفیت 1080p و فایل صوتی mp3\n- **اینستاگرام (Instagram)**: ریلز، پست‌ها و IGTV\n- **تیک‌تاک (TikTok)**: دانلود عالی ویدیوهای بدون واترمارک\n- **اسپاتیفای (Spotify)**: استخراج موزیک با آلبوم‌آرت اختصاصی\n- **توییتر (X / Twitter)**: دانلود سریع ویدیوهای توییت شده\n- **سایت‌های بزرگسالان (NSFW)**: حمایت از دانلود ایمن مجهز به سیستم احراز سن بالای ۱۸ سال\n\n⚙️ ربات به صورت کاملا اتوماتیک پلتفرم را تشخیص داده و گزینه‌های کیفی را ارسال می‌کند.`
          }
        ]);
      } else if (action === "support_contact") {
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `📞 جهت هرگونه مشکل در دانلود، خرابی ربات، خرید حساب کاربری ویژه یا ارائه انتقادات و پیشنهادها به آیدی زیر پیام دهید:\n\n👉 @${config.supportUsername.replace('@', '')}`
          }
        ]);
      } else if (action === "verify_yes") {
        setHasVerifiedAge(true);
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `✅ سن شما با موفقیت تایید شد! حالا می‌توانید مجدداً لینک بزرگسالان خود را ارسال کنید تا دانلود با موفقیت پردازش شود.`
          }
        ]);
      } else if (action === "verify_no") {
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `❌ از تایید شما انصراف داده شد. امکان دریافت محتوا برای شما وجود ندارد.`
          }
        ]);
      } else if (action.startsWith("download_")) {
        // Start simulated download
        const isAudio = action.includes("_audio");
        setIsSimulatingDownload(true);
        setDownloadProgress(0);
        
        // Add downlaod animation message in telegram style
        const downloadMsgIndex = messages.length + 1; // Predict next index
        
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `⚡️ **فرآیند دانلود روی سرور آغاز شد. این کار بسته به حجم فایل و سرعت ممکن است چند ثانیه زمان ببرد...**\n\n[▒▒▒▒▒▒▒▒▒▒] 0%`,
            isLoading: true,
            progress: 0
          }
        ]);
      }
    }, 600);
  };

  // Simulating the progress of a running download
  useEffect(() => {
    if (!isSimulatingDownload) return;

    const timer = setInterval(() => {
      setDownloadProgress(prev => {
        const next = prev + Math.floor(Math.random() * 25) + 10;
        if (next >= 100) {
          clearInterval(timer);
          setIsSimulatingDownload(false);
          
          // Complete and replace or append attachment message
          setMessages(prevMessages => {
            const filtered = prevMessages.filter(m => !m.isLoading);
            return [
              ...filtered,
              {
                sender: "bot",
                text: `📤 **دانلود روی سرور کامل شد! در حال آپلود فایل به تلگرام شما...**\n\n[██████████] 100%`
              },
              {
                sender: "bot",
                text: `💾 **AllDown Downloader Bot**\n\n🎥 **نام فایل:** AllDown_Result_${Math.floor(Math.random() * 9000) + 1000}\n⚡️ دانلود شده با بالاترین پایداری و بدون افت کیفیت.`,
                isAttachment: true,
                attachmentName: `AllDown_${Math.floor(Math.random() * 90) + 10}_Media.${downloadProgress > 50 && messages[messages.length-1]?.text.includes("audio") ? "mp3" : "mp4"}`,
                attachmentType: messages[messages.length-1]?.text.includes("audio") ? "audio" : "document"
              }
            ];
          });
          return 100;
        }
        
        // Update progress bar text on loading message
        setMessages(prevMessages => {
          return prevMessages.map(m => {
            if (m.isLoading) {
              const barsCount = Math.floor(next / 10);
              const filledBars = "█".repeat(barsCount);
              const emptyBars = "▒".repeat(10 - barsCount);
              return {
                ...m,
                progress: next,
                text: `⚡️ **فرآیند دانلود روی سرور آغاز شد. این کار بسته به حجم فایل و سرعت ممکن است چند ثانیه زمان ببرد...**\n\n[${filledBars}${emptyBars}] ${next}%`
              };
            }
            return m;
          });
        });
        
        return next;
      });
    }, 450);

    return () => clearInterval(timer);
  }, [isSimulatingDownload]);

  // Handle raw url submission in simulator
  const handleLinkSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputLink.trim()) return;

    const link = inputLink.trim();
    setInputLink("");

    // 1. Add user message
    setMessages(prev => [...prev, { sender: "user", text: link }]);

    // 2. Identify platform
    let platform = "unknown";
    const lowUrl = link.toLowerCase();
    if (lowUrl.includes("youtube.com") || lowUrl.includes("youtu.be")) platform = "YouTube";
    else if (lowUrl.includes("instagram.com")) platform = "Instagram";
    else if (lowUrl.includes("tiktok.com")) platform = "TikTok";
    else if (lowUrl.includes("spotify.com")) platform = "Spotify";
    else if (lowUrl.includes("twitter.com") || lowUrl.includes("x.com")) platform = "Twitter/X";
    else if (lowUrl.includes("pornhub.com") || lowUrl.includes("xvideos.com") || lowUrl.includes("xnxx.com") || lowUrl.includes("xhamster.com")) platform = "NSFW";

    setTimeout(() => {
      if (platform === "unknown") {
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `❌ **آدرس ارسال شده نامعتبر یا پشتیبانی نشده است!**\n\nلطفاً لینک صحیح را کپی و مجدد ارسال کنید. پشتیبانی دامین‌ها شامل یوتیوب، توییتر، تیک‌تاک، اینستاگرام، اسپاتیفای و سایت‌های بزرگسال است.`
          }
        ]);
        return;
      }

      if (platform === "NSFW" && config.nsfwFilter && !hasVerifiedAge) {
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `⚠️ **هشدار محتوای بزرگسالان (۱۸+)**\n\nلینک ارسال شده مربوط به پلتفرم‌های بزرگسالان است. جهت دسترسی و لود اطلاعات تایید سن الزامی است. آیا سن شما بیشتر از ۱۸ سال است؟`,
            buttons: [
              [{ text: "🔞 بله، بالای ۱۸ سال هستم", action: "verify_yes" }],
              [{ text: "خیر، انصراف من", action: "verify_no" }]
            ]
          }
        ]);
        return;
      }

      // Simulate parsing metadata
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: `⏳ **در حال استخراج اطلاعات مدیا و کیفیت‌ها... لطفاً شکیبا باشید.**`
        }
      ]);

      setTimeout(() => {
        // Remove "processing" message and add media formats options
        setMessages(prev => {
          const cleanList = prev.filter(m => !m.text.includes("در حال استخراج اطلاعات"));
          const mockTitle = platform === "Spotify" ? "Homayoun Shajarian - Ba Man Sanama (128kbps)" : `ویدیو دانلودی کاربری از پلتفرم ${platform} با کیفیت اصلی`;
          return [
            ...cleanList,
            {
              sender: "bot",
              text: `📝 **عنوان:** ${mockTitle}\n👤 **کانال/آپلودر:** AllDown_Studio\n⏱ **مدت زمان:** 03:45\n\n📥 **نوع رسانه:** ${platform.toUpperCase()}\n\n👇 کیفیت و فرمت ارسالی مدنظر خود را کلیک کنید:`,
              photo: platform === "Spotify" 
                ? "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?auto=format&fit=crop&q=80&w=400" 
                : "https://images.unsplash.com/photo-1574717024453-354056afd6fc?auto=format&fit=crop&q=80&w=400",
              buttons: platform === "Spotify" ? [
                [{ text: "🎵 استخراج صوتی با کیفیت عالی MP3", action: "download_audio" }]
              ] : [
                [{ text: "🎬 دانلود ویدیو کیفیت 1080p (MP4)", action: "download_1080" }],
                [{ text: "🎬 دانلود ویدیو کیفیت 720p (MP4)", action: "download_720" }],
                [{ text: "🎵 استخراج صوتی به فایل MP3", action: "download_audio" }]
              ]
            }
          ];
        });
      }, 1000);

    }, 500);
  };

  // Helper template for config file view
  const getFileIcon = (filename: string) => {
    if (filename.endsWith(".py")) return <Terminal className="w-4 h-4 text-emerald-400" />;
    if (filename.endsWith(".txt")) return <FileText className="w-4 h-4 text-sky-400" />;
    return <Code2 className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="min-h-screen flex flex-col font-vazir rtl text-right pb-14 selection:bg-[#00a884] selection:text-white bg-[#0b141a] text-[#e9edef]">
      
      {/* 1. Header Banner */}
      <header className="border-b border-[#3b4a54] bg-[#202c33]/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00a884] to-[#005c4b] shadow-lg shadow-black/40 border border-[#3b4a54]">
              <Bot className="w-7 h-7 text-[#e9edef] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#e9edef] font-vazir bg-clip-text">
                  AllDown Bot Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30">
                  نسخه پکیج v3.4
                </span>
              </div>
              <p className="text-xs text-[#8696a0] font-medium">
                سیستم همه‌کاره تولید، شخصی‌سازی و شبیه‌سازی کدهای پایتون ربات دانلودر تلگرام
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between border-t border-[#3b4a54] md:border-0 pt-2 md:pt-0">
            <div className="flex items-center gap-4 text-xs font-mono bg-[#111b21] px-3.5 py-1.5 rounded-lg border border-[#3b4a54] text-[#8696a0]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00a884] animate-ping"></span>
                <span className="text-[#e9edef]">aiogram v3</span>
              </div>
              <div className="w-px h-3 bg-[#3b4a54]"></div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#53bdeb]"></span>
                <span className="text-[#e9edef]">yt-dlp Engine</span>
              </div>
            </div>
            <button
              onClick={() => {
                // Bulk download all files in a folder structure
                ["config.py", "database.py", "downloader.py", "cleaner.py", "main.py", "requirements.txt", "README.md"].forEach(f => {
                  handleDownloadFile(f);
                });
                setFeedbackMsg("بسته‌ کامل کد با موفقیت در مرورگر شما دانلود شد! 📥");
                setTimeout(() => setFeedbackMsg(""), 4000);
              }}
              className="px-4 py-2 rounded-lg bg-[#00a884] hover:bg-[#008f72] text-white font-bold text-xs flex items-center gap-2 transition duration-250 cursor-pointer shadow-lg shadow-black/20"
            >
              <Download className="w-4 h-4" />
              دانلود کل بسته‌ فایلی (ZIP)
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* Alerts toast */}
        {feedbackMsg && (
          <div className="lg:col-span-12 bg-[#005c4b]/80 border border-[#00a884]/30 text-[#e9edef] p-3 rounded-lg text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00a884]" />
              <span>{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg("")} className="hover:text-white cursor-pointer text-base">×</button>
          </div>
        )}

        {/* 2. Left Panel: Configurations & Bot customization */}
        <section className="lg:col-span-4 bg-[#202c33] border border-[#3b4a54] rounded-2xl p-5 shadow-xl flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-[#3b4a54] pb-3">
            <Settings className="w-5 h-5 text-[#00a884]" />
            <h2 className="text-md font-bold text-[#e9edef]">تنظیمات سفارشی‌سازی ربات (Farsi)</h2>
          </div>

          <div className="flex flex-col gap-4">
            {/* Bot Token Entry */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#8696a0] flex items-center gap-1.5 justify-between">
                <span>توکن ربات تلگرام (BOT_TOKEN)</span>
                <span className="text-[10px] text-[#8696a0] font-mono">از BotFather@</span>
              </label>
              <input 
                type="text" 
                value={config.botToken}
                onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                className="bg-[#111b21] border border-[#3b4a54] rounded-lg px-3 py-2 text-xs font-mono text-[#e9edef] focus:outline-none focus:border-[#00a884] transition"
                placeholder="7489304723:AAElK_..."
              />
            </div>

            {/* Admin Telegram ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#8696a0] flex items-center gap-1.5 justify-between">
                <span>شناسه عددی تلگرام ادمین (ADMIN_ID)</span>
                <span className="text-[10px] text-[#8696a0] font-mono">دریافت با r_60bot@</span>
              </label>
              <input 
                type="text" 
                value={config.adminId}
                onChange={(e) => setConfig({ ...config, adminId: e.target.value })}
                className="bg-[#111b21] border border-[#3b4a54] rounded-lg px-3 py-2 text-xs font-mono text-[#e9edef] focus:outline-none focus:border-[#00a884] transition"
                placeholder="48293049"
              />
            </div>

            {/* Daily Download Quota for free users */}
            <div className="flex flex-col gap-1.5 bg-[#111b21] p-3.5 rounded-xl border border-[#3b4a54]">
              <div className="flex justify-between items-center text-xs font-semibold text-[#e9edef]">
                <span>سهمیه دانلود روزانه کاربر عادی</span>
                <span className="font-bold text-[#00a884] font-mono bg-[#00a884]/10 px-2 py-0.5 rounded-full text-[11px] border border-[#00a884]/20">
                  {config.freeLimit} دانلود / ۲۴ ساعت
                </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={config.freeLimit}
                onChange={(e) => setConfig({ ...config, freeLimit: parseInt(e.target.value) })}
                className="w-full accent-[#00a884] cursor-pointer my-1.5"
              />
              <span className="text-[10px] text-[#8696a0]">برای کنترل پهنای باند و جلوگیری از مسدود ساختن سرور به کاربران رایگان محدودیت اعمال می‌شود.</span>
            </div>

            {/* Premium Price Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#e9edef]">هزینه خرید اکانت پرمیوم (متن پیشنهادی)</label>
              <input 
                type="text" 
                value={config.premiumPrice}
                onChange={(e) => setConfig({ ...config, premiumPrice: e.target.value })}
                className="bg-[#111b21] border border-[#3b4a54] rounded-lg px-3 py-2 text-xs text-[#e9edef] focus:outline-none focus:border-[#00a884] transition"
                placeholder="مثلاً: ۵۰,۰۰۰ تومان ماهانه"
              />
            </div>

            {/* Admin Username for Support */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#e9edef]">آیدی تلگرام پشتیبان ادمین</label>
              <div className="relative">
                <span className="absolute right-3 top-2.5 text-xs text-[#8696a0] font-mono">@</span>
                <input 
                  type="text" 
                  value={config.supportUsername.replace('@', '')}
                  onChange={(e) => setConfig({ ...config, supportUsername: e.target.value })}
                  className="bg-[#111b21] border border-[#3b4a54] rounded-lg pr-7 pl-3 py-2 text-xs text-[#e9edef] focus:outline-none focus:border-[#00a884] transition w-full font-mono text-left"
                  placeholder="AllDown_Support"
                />
              </div>
            </div>

            {/* Adult site checking with Age verification toggle */}
            <div className="flex items-center justify-between gap-3 bg-red-950/15 p-3 rounded-xl border border-red-900/30 mt-1">
              <div className="flex flex-col gap-0.5 max-w-[80%]">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  احراز سن و فیلتر ۱۸+ بزرگسال
                </span>
                <span className="text-[10px] text-[#8696a0] leading-relaxed">
                  هشدار اجباری رد صلاحیت اخلاقی و احراز سن اختیاری با دکمه اینلاین قبل از دانلود.
                </span>
              </div>
              <button 
                onClick={() => setConfig({ ...config, nsfwFilter: !config.nsfwFilter })}
                className={`w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex items-center px-1 cursor-pointer ${config.nsfwFilter ? 'bg-[#00a884]' : 'bg-[#111b21] border border-[#3b4a54]'}`}
              >
                <span className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${config.nsfwFilter ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </button>
            </div>

            {/* Start welcome message personalization */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#e9edef]">پیام آغازین خوش‌آمد گویی ربات (/start)</label>
              <textarea 
                rows={3}
                value={config.welcomeMsg}
                onChange={(e) => setConfig({ ...config, welcomeMsg: e.target.value })}
                className="bg-[#111b21] border border-[#3b4a54] rounded-lg px-3 py-2 text-xs text-[#e9edef] focus:outline-none focus:border-[#00a884] transition resize-none leading-relaxed"
                placeholder="متن خوش آمدگویی فارسی..."
              />
            </div>
          </div>
          
          {/* Quick info badges */}
          <div className="mt-2 bg-[#111b21] p-3 rounded-xl border border-[#3b4a54] flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#e9edef] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#53bdeb]" />
              آیا کدهای بالا همزمان آپدیت می‌شوند؟
            </span>
            <p className="text-[11px] text-[#8696a0] leading-relaxed">
              بله! به محض تغییر هر متغیری در این پنل، درایو هوشمند AllDown تمامی فایل‌های سورس پایتون از جمله <code className="text-[#00a884] text-[10px] font-mono font-bold">config.py</code> و <code className="text-[#00a884] text-[10px] font-mono font-bold">main.py</code> را مجدداً به صورت آنی بیلد و بازنویسی می‌کند.
            </p>
          </div>
        </section>

        {/* 3. Right Section: Multi-file code workspace & guides */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* VS Code styled Workspace */}
          <div className="bg-[#202c33] border border-[#3b4a54] rounded-2xl shadow-xl overflow-hidden flex flex-col">
            
            {/* Simulated VS Code Header Tabs */}
            <div className="bg-[#111b21] border-b border-[#3b4a54] px-3 flex items-center justify-between flex-wrap gap-2 py-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#e9edef] mr-2">
                <FolderGit2 className="w-4 h-4 text-[#00a884]" />
                <span>سورس‌کدهای آماده دانلود ربات</span>
              </div>
              
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {Object.keys(fileContents).map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                      activeFile === filename 
                        ? 'bg-[#202c33] text-[#00a884] border border-[#3b4a54] font-bold' 
                        : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]/50'
                    }`}
                  >
                    {getFileIcon(filename)}
                    <span>{filename}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filename & Info Banner */}
            <div className="bg-[#202c33]/60 border-b border-[#3b4a54] px-4 py-2.5 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#8696a0]">فایل فعال:</span>
                <span className="font-mono text-[#00a884] bg-[#00a884]/10 px-2 py-0.5 rounded border border-[#00a884]/25 font-bold">{activeFile}</span>
                <span className="text-[#8696a0] font-mono">| UTF-8</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCode(activeFile)}
                  className="px-3 py-1 bg-[#111b21] hover:bg-[#202c33] hover:text-white rounded border border-[#3b4a54] text-[#e9edef] font-semibold flex items-center gap-1.5 transition text-[11px] cursor-pointer"
                >
                  {copiedFile === activeFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00a884]" />
                      کپی شد
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8696a0]" />
                      کپی کد
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDownloadFile(activeFile)}
                  className="px-3 py-1 bg-[#00a884]/10 hover:bg-[#00a884]/20 text-[#00a884] hover:text-white rounded border border-[#00a884]/35 font-bold flex items-center gap-1.5 transition text-[11px] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  دانلود فایل
                </button>
              </div>
            </div>

            {/* Code Highlight view or instruction renderer */}
            <div className="relative font-mono text-left text-xs p-4 bg-[#111b21] min-h-[420px] max-h-[580px] overflow-y-auto leading-relaxed border-b border-[#3b4a54]">
              <pre className="text-slate-300 whitespace-pre-wrap select-text font-mono">
                {fileContents[activeFile]}
              </pre>
            </div>
            
            {/* Bottom info log */}
            <div className="bg-[#111b21] px-4 py-2.5 flex justify-between items-center text-[11px] text-[#8696a0] font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00a884]"></span>
                <span>فایل‌ها آماده انتقال به کانتینر ابری یا لوکال</span>
              </div>
              <div>
                <span>Python 3.9+ Compatible</span>
              </div>
            </div>

          </div>

          {/* 4. Interactive Mobile Bot Simulator */}
          <div className="bg-[#202c33] border border-[#3b4a54] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
            
            {/* Panel Intro */}
            <div className="md:col-span-4 bg-[#111b21]/40 p-5 flex flex-col gap-3 justify-between border-b md:border-b-0 md:border-l border-[#3b4a54]">
              <div className="flex flex-col gap-2">
                <span className="px-2 py-1 bg-[#00a884]/15 text-[#00a884] rounded-lg text-[10px] uppercase font-bold tracking-wider self-start border border-[#00a884]/20">
                  Telegram Bot Emulator
                </span>
                <h3 className="text-md font-bold text-[#e9edef] flex items-center gap-1.5">
                  <Smartphone className="w-5 h-5 text-[#00a884]" />
                  شبیه‌ساز تلگرامی زنده
                </h3>
                <p className="text-[#8696a0] text-xs leading-relaxed">
                  با این شبیه‌ساز اختصاصی می‌توانید رفتار ربات AllDown را بدون نیاز به سرور یا توکن واقعی تست کرده و با تمام امکانات آن آشنا شوید!
                </p>
                
                {/* Simulated popular presets links for quick click */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[11px] font-bold text-[#8696a0]">لینک‌های پیش‌فرض تست:</span>
                  <button 
                    onClick={() => setInputLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ")}
                    className="w-full text-right p-2 rounded bg-[#111b21] hover:bg-[#202c33] text-[#e9edef] border border-[#3b4a54]/50 transition text-[11px] flex items-center justify-between gap-1 cursor-pointer"
                  >
                    <span className="truncate">🔴 موزیک ویدیو در یوتیوب</span>
                    <span className="text-[9px] text-[#00a884] bg-[#00a884]/10 px-1 py-0.5 rounded font-bold font-mono">YouTube</span>
                  </button>
                  <button 
                    onClick={() => setInputLink("https://www.instagram.com/reels/C8-q9Y6ovp9/")}
                    className="w-full text-right p-2 rounded bg-[#111b21] hover:bg-[#202c33] text-[#e9edef] border border-[#3b4a54]/50 transition text-[11px] flex items-center justify-between gap-1 cursor-pointer"
                  >
                    <span className="truncate">📸 ریلز اینستاگرام (Instagram Reels)</span>
                    <span className="text-[9px] text-pink-400 bg-pink-400/10 px-1 py-0.5 rounded font-bold font-mono">Reels</span>
                  </button>
                  <button 
                    onClick={() => setInputLink("https://open.spotify.com/track/4PTG3Z6ehGkBFST3zUV")}
                    className="w-full text-right p-2 rounded bg-[#111b21] hover:bg-[#202c33] text-[#e9edef] border border-[#3b4a54]/50 transition text-[11px] flex items-center justify-between gap-1 cursor-pointer"
                  >
                    <span className="truncate">🟢 موزیک ایرانی در اسپاتیفای</span>
                    <span className="text-[9px] text-[#53bdeb] bg-[#53bdeb]/10 px-1 py-0.5 rounded font-bold font-mono">Spotify</span>
                  </button>
                  {config.nsfwFilter && (
                    <button 
                      onClick={() => setInputLink("https://www.pornhub.com/view_video.php?viewkey=1804")}
                      className="w-full text-right p-2 rounded bg-red-950/10 hover:bg-red-950/20 text-red-300 border border-red-500/10 transition text-[11px] flex items-center justify-between gap-1 cursor-pointer"
                    >
                      <span className="truncate">🔞 ویدیو بزرگسال (تست محدودیت سن)</span>
                      <span className="text-[9px] text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded font-bold font-mono">18+ NSFW</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-[#3b4a54]/60">
                <button
                  onClick={handleResetChat}
                  className="w-full py-2 bg-[#111b21] hover:bg-[#202c33] text-[#e9edef] border border-[#3b4a54] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  ریست و پاکسازی چت
                </button>
              </div>
            </div>

            {/* Mobile Emulator Chat Wrapper */}
            <div className="md:col-span-8 flex flex-col h-[480px] bg-[#0b141a]">
              
              {/* Telegram Header */}
              <div className="bg-[#202c33] px-4 py-2.5 flex items-center justify-between border-b border-[#0b141a] shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00a884] to-[#005c4b] flex items-center justify-center text-white text-sm font-bold shadow border border-[#3b4a54]">
                    AD
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#e9edef] flex items-center gap-1">
                      AllDown Bot
                      <Sparkles className="w-3 h-3 text-[#00a884] animate-bounce" />
                    </span>
                    <span className="text-[10px] text-[#00a884] font-medium">bot • online / فعال</span>
                  </div>
                </div>
                
                <span className="text-[10px] text-[#8696a0] font-mono">Telegram Desktop</span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-[#0b141a]/95">
                {messages.map((m, idx) => (
                  <div 
                    key={idx}
                    className={`flex flex-col max-w-[85%] ${m.sender === "user" ? 'mr-auto items-end' : 'ml-auto items-start'}`}
                  >
                    {/* Simulated Message Balloon */}
                    <div className={`p-3 rounded-2xl shadow text-xs leading-relaxed whitespace-pre-wrap ${
                      m.sender === "user" 
                        ? 'bg-[#005c4b] text-[#e9edef] rounded-br-none font-sans font-medium' 
                        : 'bg-[#202c33] text-[#e9edef] rounded-bl-none border border-[#3b4a54]'
                    }`}>
                      {/* Optional Photo/Thumbnail in balloon */}
                      {m.photo && (
                        <img 
                          src={m.photo} 
                          alt="Cover" 
                          referrerPolicy="no-referrer"
                          className="w-full h-28 object-cover rounded-lg mb-2 shadow border border-[#3b4a54]"
                        />
                      )}

                      {/* Attachment View (Telegram styled document) */}
                      {m.isAttachment ? (
                        <div className="flex items-center gap-3 bg-[#111b21] p-2.5 rounded-xl border border-[#3b4a54] mb-2 font-sans">
                          <div className="w-10 h-10 rounded-lg bg-[#00a884]/15 flex items-center justify-center border border-[#00a884]/25">
                            {m.attachmentType === "audio" ? (
                              <Sparkles className="w-5 h-5 text-[#00a884]" />
                            ) : (
                              <FileText className="w-5 h-5 text-[#00a884]" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-[#e9edef] truncate font-mono">{m.attachmentName}</span>
                            <span className="text-[9px] text-[#8696a0] font-mono">Size: 14.2 MB | 128kbps stereo</span>
                          </div>
                          <Download className="w-4 h-4 text-[#00a884] bg-[#00a884]/10 p-1 rounded-full border border-[#00a884]/20" />
                        </div>
                      ) : null}

                      {/* Display Markdown parsed text simplified */}
                      {m.text}
                    </div>

                    {/* Inline Keyboard Buttons of Message */}
                    {m.buttons && m.buttons.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1.5 w-full font-vazir">
                        {m.buttons.map((row, rIdx) => (
                          <div key={rIdx} className="flex gap-1 w-full flex-wrap">
                            {row.map((btn, bIdx) => (
                              <button
                                key={bIdx}
                                onClick={() => handleBotAction(btn.action, btn.text)}
                                disabled={isSimulatingDownload}
                                className="flex-1 bg-[#111b21] hover:bg-[#202c33] active:bg-[#0b141a] text-[#00a884] text-[11px] font-bold py-1.5 px-3 rounded-lg border border-[#3b4a54] shadow text-center truncate transition disabled:opacity-50 cursor-pointer"
                              >
                                {btn.text}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat Input Field / Send Area */}
              <form onSubmit={handleLinkSubmit} className="bg-[#202c33] p-3 flex items-center gap-2 border-t border-[#0b141a]">
                <input 
                  type="text"
                  value={inputLink}
                  onChange={(e) => setInputLink(e.target.value)}
                  disabled={isSimulatingDownload}
                  placeholder="✍️ آدرس ویدیو یا موزیک مورد نظر را پیست کنید..."
                  className="flex-1 bg-[#111b21] border border-[#3b4a54] rounded-xl px-4 py-2.5 text-xs text-[#e9edef] focus:outline-none focus:border-[#00a884] placeholder:text-[#8696a0] disabled:opacity-45"
                />
                <button
                  type="submit"
                  disabled={isSimulatingDownload || !inputLink.trim()}
                  className="p-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f72] active:bg-[#005c4b] text-white transition font-bold disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          </div>

          {/* 5. Deploy & Security Guides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Deployment Guide */}
            <div className="bg-[#202c33] border border-[#3b4a54] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-[#3b4a54] pb-3">
                <ExternalLink className="w-5 h-5 text-[#00a884]" />
                <h3 className="text-md font-bold text-[#e9edef]">راهنمای ابری استقرار (Deployment)</h3>
              </div>
              <ul className="flex flex-col gap-3 text-xs leading-relaxed text-[#e9edef]">
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center font-bold text-[11px] shrink-0">۱</span>
                  <p>یک ریپازیتوری شخصی در <strong>GitHub</strong> بسازید و تمام کدهای این استودیو (main.py, config.py و...) را روی آن کامیت کنید.</p>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center font-bold text-[11px] shrink-0">۲</span>
                  <p>در حساب کاربری خود سرویس <strong>Railway</strong> یا <strong>Render</strong> را باز کرده و مخزن را به یک Background Worker متصل نمایید.</p>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center font-bold text-[11px] shrink-0">۳</span>
                  <p>در برگه کانفیگ‌ها (Environment Variables)، متغیر محیطی <code>BOT_TOKEN</code> و <code>ADMIN_ID</code> را ست کنید تا ایمن بارگذاری شوند.</p>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center font-bold text-[11px] shrink-0">۴</span>
                  <p>به علت عملیات ادغام صوتی و تصویری ویدیوهای 1080p، نصب بودن ابزار قدرتمند <strong>FFmpeg</strong> روی سرور ضرورت تام دارد. در سرور Railway با افزودن ffmpeg buildpack و در سرورهای لینوکس با کامند <code>sudo apt install ffmpeg</code> راه‌اندازی کنید.</p>
                </li>
              </ul>
            </div>

            {/* Anti Ban and Security Tips */}
            <div className="bg-[#202c33] border border-[#3b4a54] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-[#3b4a54] pb-3">
                <ShieldCheck className="w-5 h-5 text-[#53bdeb]" />
                <h3 className="text-md font-bold text-[#e9edef]">محافظت ضد بلاک شدن (Anti-Ban Pro)</h3>
              </div>
              <ul className="flex flex-col gap-3 text-xs leading-relaxed text-[#e9edef]">
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-[#53bdeb]/15 text-[#53bdeb] flex items-center justify-center font-bold text-[11px] shrink-0">🍪</span>
                  <p><strong>استفاده از کوکی ریلز و یوتیوب:</strong> با نصب افزونه Get Cookies.txt روی مرورگر، کوکی اکانت خود را استخراج و در فایل <code>cookies.txt</code> ذخیره کنید و کنار پروژه قرار دهید تا پلتفرم تشخیص بات را دور بزند.</p>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-[#53bdeb]/15 text-[#53bdeb] flex items-center justify-center font-bold text-[11px] shrink-0">🛑</span>
                  <p><strong>محدوبیت نرخ (Rate Limiting):</strong> فرود شدید ریکوئست‌ها باعث بن شدن توکن ادمین می‌شود. سهمیه دانلود که با SQLite متصل شده است به طور کامل جلوگیر خزندگان هجومی است.</p>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-[#53bdeb]/15 text-[#53bdeb] flex items-center justify-center font-bold text-[11px] shrink-0">🕒</span>
                  <p><strong>مدیریت دیسک موقت:</strong> رندها محدودیت حجم دیسک دارند (۵۰۰ مگابایت رایگان). تسک <code>cleaner.py</code> تعبیه شده در سورس به پایداری هارد کمک به‌شدتی می‌رساند.</p>
                </li>
              </ul>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}
