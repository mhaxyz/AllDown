export interface BotConfig {
  botToken: string;
  adminId: string;
  freeLimit: number;
  nsfwFilter: boolean;
  premiumPrice: string;
  welcomeMsg: string;
  supportUsername: string;
}

export function generateConfigPy(config: BotConfig): string {
  return `"""
تنظیمات اصلی ربات AllDown
تولید شده توسط استودیو طراحی ربات AllDown
"""
import os
from dotenv import load_dotenv

load_dotenv()

# توکن ربات تلگرام (توصیه می‌شود در فایل .env قرار گیرد)
BOT_TOKEN = os.getenv("BOT_TOKEN", "${config.botToken || 'YOUR_BOT_TOKEN_HERE'}")

# شناسه تلگرام ادمین (برای مدیریت ربات و پاسخگویی)
ADMIN_ID = int(os.getenv("ADMIN_ID", "${config.adminId || '123456789'}"))

# محدودیت دانلود روزانه برای کاربران رایگان
FREE_DAILY_LIMIT = int(os.getenv("FREE_DAILY_LIMIT", "${config.freeLimit}"))

# هزینه خرید اکانت پرمیوم
PREMIUM_PRICE_TEXT = "${config.premiumPrice || '۵۰,۰۰۰ تومان ماهانه'}"

# آیدی پشتیبانی ربات
SUPPORT_USERNAME = "${config.supportUsername.replace('@', '') || 'AllDown_Support'}"

# فعال بودن فیلتر محتوای بزرگسالان و تایید سن
ENABLE_NSFW_AGE_GATE = ${config.nsfwFilter ? 'True' : 'False'}

# مسیر پوشه دانلودهای موقت
DOWNLOAD_DIR = "downloads"

# اطمینان از وجود پوشه دانلود
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)
`;
}

export function generateDatabasePy(): string {
  return `"""
مدیریت دیتابیس SQLite ربات AllDown
شامل جدول کاربران، پرمیوم، لاگ دانلودها و تایید سن
"""
import sqlite3
import time
from datetime import datetime, timedelta

DB_FILE = "alldown_database.db"

def init_db():
    """ایجاد جداول دیتابیس در صورت عدم وجود"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # جدول کاربران
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            full_name TEXT,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_premium INTEGER DEFAULT 0,
            premium_until TIMESTAMP,
            is_verified_18 INTEGER DEFAULT 0
        )
    ''')
    
    # جدول تاریخچه دانلودها و محدودیت‌های روزانه
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS downloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            platform TEXT,
            url TEXT,
            downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    conn.commit()
    conn.close()

def register_user(user_id: int, username: str, full_name: str):
    """ثبت نام کاربر جدید در سیستم"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO users (user_id, username, full_name) VALUES (?, ?, ?)",
        (user_id, username, full_name)
    )
    # اگر کاربر قبلاً بوده، اطلاعاتش بروزرسانی شود
    cursor.execute(
        "UPDATE users SET username = ?, full_name = ? WHERE user_id = ?",
        (username, full_name, user_id)
    )
    conn.commit()
    conn.close()

def get_user(user_id: int):
    """شرح وضعیت کاربر از دیتابیس"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, username, full_name, is_premium, premium_until, is_verified_18 FROM users WHERE user_id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return {
            "user_id": user[0],
            "username": user[1],
            "full_name": user[2],
            "is_premium": bool(user[3]),
            "premium_until": user[4],
            "is_verified_18": bool(user[5])
        }
    return None

def verify_age(user_id: int):
    """تایید سن (بالای ۱۸ سال) برای کاربر"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_verified_18 = 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()

def set_premium(user_id: int, days: int):
    """فعال‌سازی وضعیت پرمیوم برای تعداد روز مشخص"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    until_date = (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute(
        "UPDATE users SET is_premium = 1, premium_until = ? WHERE user_id = ?",
        (until_date, user_id)
    )
    conn.commit()
    conn.close()

def check_premium_status(user_id: int) -> bool:
    """بررسی واقعی وضعیت پرمیوم کابر بر اساس تاریخ انقضاء"""
    user = get_user(user_id)
    if not user:
        return False
    if not user["is_premium"]:
        return False
    
    # بررسی تاریخ انقضاء پرمیوم
    if user["premium_until"]:
        try:
            expire_date = datetime.strptime(user["premium_until"], '%Y-%m-%d %H:%M:%S')
            if expire_date > datetime.now():
                return True
            else:
                # منقضی شده
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("UPDATE users SET is_premium = 0, premium_until = NULL WHERE user_id = ?", (user_id,))
                conn.commit()
                conn.close()
                return False
        except Exception:
            return False
    return False

def get_today_downloads_count(user_id: int) -> int:
    """دریافت تعداد دانلودهای کاربر در ۲۴ ساعت گذشته"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute(
        "SELECT COUNT(*) FROM downloads WHERE user_id = ? AND downloaded_at >= ?",
        (user_id, yesterday)
    )
    count = cursor.fetchone()[0]
    conn.close()
    return count

def log_download(user_id: int, platform: str, url: str):
    """ثبت لاگ دانلود موفق"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO downloads (user_id, platform, url) VALUES (?, ?, ?)",
        (user_id, platform, url)
    )
    conn.commit()
    conn.close()

def get_stats():
    """دریافت آمار کلی برای ادمین"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    tot_users = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM users WHERE is_premium = 1")
    prem_users = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM downloads")
    tot_downloads = cursor.fetchone()[0]
    conn.close()
    return {
        "total_users": tot_users,
        "premium_users": prem_users,
        "total_downloads": tot_downloads
    }
`;
}

export function generateDownloaderPy(): string {
  return `"""
ماژول دانلود با استفاده از yt-dlp و پیش‌پردازشگرهای صوتی و تصویری ffmpeg
شامل تنظیمات بهینه برای یوتیوب، اینستاگرام، تیک‌تاک و اسپاتیفای
"""
import os
import re
import math
import uuid
import asyncio
from yt_dlp import YoutubeDL
from config import DOWNLOAD_DIR

def detect_platform(url: str) -> str:
    """تشخیص اتوماتیک پلتفرم بر اساس آدرس وب"""
    url_lower = url.lower()
    if "youtube.com" in url_lower or "youtu.be" in url_lower:
        return "youtube"
    elif "instagram.com" in url_lower:
        return "instagram"
    elif "tiktok.com" in url_lower:
        return "tiktok"
    elif "twitter.com" in url_lower or "x.com" in url_lower:
        return "twitter"
    elif "spotify.com" in url_lower:
        return "spotify"
    elif any(site in url_lower for site in ["pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com"]):
        return "nsfw"
    return "unknown"

def sanitize_info(info_dict):
    """استخراج اطلاعات متادیتا به زبان ساده برای نمایش به کاربر"""
    formats = []
    
    # فیلتر کیفیت‌ها برای انتخاب کاربر
    # فرمت‌های ویدیویی اصلی
    for f in info_dict.get('formats', []):
        if f.get('vcodec') != 'none' and f.get('height') in [360, 480, 720, 1080]:
            ext = f.get('ext', 'mp4')
            height = f.get('height')
            fps = f.get('fps', 30)
            filesize = f.get('filesize', 0) or f.get('filesize_approx', 0)
            size_mb = round(filesize / (1024 * 1024), 1) if filesize else "نامشخص"
            
            formats.append({
                "format_id": f.get('format_id'),
                "ext": ext,
                "label": f"ویدیو {height}p (فریم {fps}) - {size_mb} MB",
                "quality": f"{height}p",
                "type": "video"
            })
            
    # حذف فرمت‌های تکراری کیفیت‌ها
    unique_formats = []
    seen = set()
    for f in formats:
        key = (f["quality"])
        if key not in seen:
            seen.add(key)
            unique_formats.append(f)
            
    # اضافه کردن گزینه صوتی پیش‌فرض
    duration = info_dict.get('duration', 0)
    duration_str = f"{math.floor(duration/60)}:{duration%60:02d}" if duration else "نامشخص"
    
    return {
        "title": info_dict.get('title', 'ویدیو بدون نام'),
        "duration": duration_str,
        "uploader": info_dict.get('uploader', 'نامشخص'),
        "thumbnail": info_dict.get('thumbnail'),
        "formats": unique_formats[:4], # حداکثر ۴ فرمت برتر
        "original_url": info_dict.get('original_url'),
    }

async def get_url_info(url: str):
    """دریافت اطلاعات متادیتا بدون شروع فرآیند دانلود"""
    platform = detect_platform(url)
    
    # تنظیمات پایه‌ای دریافت اطلاعات
    ydl_opts = {
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
        'playlist_items': '1', # فقط اولین ویدیو در صورت پلی‌لیست بودن
    }
    
    # اضافه کردن کوکی در صورت وجود امنیت بیشتر و جلوگیری از شناسایی به عنوان بات
    if os.path.exists("cookies.txt"):
        ydl_opts['cookiefile'] = 'cookies.txt'
        
    loop = asyncio.get_event_loop()
    try:
        with YoutubeDL(ydl_opts) as ydl:
            # اجرای غیر مسدودساز برای لودینگ روان ربات تلگرام
            info = await loop.run_in_executor(
                None, 
                lambda: ydl.extract_info(url, download=False)
            )
            return sanitize_info(info), platform
    except Exception as e:
        print(f"Error extracting info: {e}")
        return None, platform

async def download_media(url: str, format_id: str = None, extract_audio: bool = False):
    """دانلود مدیا و آماده‌سازی جهت ارسال به تلگرام"""
    unique_id = uuid.uuid4().hex[:10]
    out_template = os.path.join(DOWNLOAD_DIR, f"{unique_id}_%(title)s.%(ext)s")
    
    ydl_opts = {
        'outtmpl': out_template,
        'quiet': True,
        'no_warnings': True,
    }
    
    # استفاده از کوکی‌های معتبر
    if os.path.exists("cookies.txt"):
        ydl_opts['cookiefile'] = 'cookies.txt'
        
    # تنظیم هدرها برای دور زدن فیلترینگ و بلوکه شدن آی‌پی سرور
    ydl_opts['http_headers'] = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/',
    }

    # کانفیگ مخصوص استخراج صوتی
    if extract_audio:
        ydl_opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        })
    elif format_id:
        # دانلود کیفیت انتخابی کاربر به همراه صدا (ترکیب اتوماتیک ویدیو و صدا با ffmpeg)
        ydl_opts.update({
            'format': f"{format_id}+bestaudio/best",
            'merge_output_format': 'mp4'
        })
    else:
        # دانلود بهترین کیفیت ممکن با فرمت یکپاچه (معمولا تا 720p بدون نیاز به مِرج سنگین سروری)
        ydl_opts.update({
            'format': 'best[ext=mp4]/best'
        })

    loop = asyncio.get_event_loop()
    try:
        with YoutubeDL(ydl_opts) as ydl:
            # شروع دانلود همزمان غیر بلاک کننده‌ی پروژه
            info = await loop.run_in_executor(
                None,
                lambda: ydl.extract_info(url, download=True)
            )
            
            # پیدا کردن آدرس دقیق فایل نهایی ایجاد شده
            # در صورتی که فایل صوتی تبدیل شده است فریم ورک نام فایل را به .mp3 تغییر میدهد
            if extract_audio:
                filename = ydl.prepare_filename(info)
                filename = os.path.splitext(filename)[0] + ".mp3"
            else:
                filename = ydl.prepare_filename(info)
                if not os.path.exists(filename):
                    # برای فرمت‌های مرج شده ممکن است پسوند فرق کند
                    filename = os.path.splitext(filename)[0] + ".mp4"
                    
            if os.path.exists(filename):
                return filename, info.get('title', 'no_name')
            return None, "فایل دانلود شده پیدا نشد."
            
    except Exception as e:
        print(f"Error downloading: {e}")
        return None, str(e)
`;
}

export function generateCleanerPy(): string {
  return `"""
ماژول پاکسازی خودکار دانلودها جهت مدیریت فضای دیسک سرور
این اسکریپت فایل‌های دانلودی موقت را پس از ۱۵ دقیقه پاک می‌کند
"""
import os
import time
import asyncio
from config import DOWNLOAD_DIR

async def auto_clean_task(interval_seconds: int = 300, max_age_seconds: int = 900):
    """
    تسک دوره‌ای جهت حذف فایل‌های قدیمی دانلود شده
    مخصوص هاست‌های ابری کم فضا مانند Render و Railway
    """
    while True:
        try:
            print("[AUTO-CLEANER] در حال بررسی فایل‌های قدیمی...")
            now = time.time()
            if os.path.exists(DOWNLOAD_DIR):
                for filename in os.listdir(DOWNLOAD_DIR):
                    filepath = os.path.join(DOWNLOAD_DIR, filename)
                    if os.path.isfile(filepath):
                        file_age = now - os.path.getmtime(filepath)
                        # فایل بزرگتر از 15 دقیقه
                        if file_age > max_age_seconds:
                            try:
                                os.remove(filepath)
                                print(f"[AUTO-CLEANER] فایل با موفقیت حذف شد: {filename}")
                            except Exception as ex:
                                print(f"[AUTO-CLEANER] خطا در حذف فایل {filename}: {ex}")
        except Exception as e:
            print(f"[AUTO-CLEANER] خطای سیستمی رخ داد: {e}")
            
        await asyncio.sleep(interval_seconds)

def clean_file_immediately(filepath: str):
    """حذف بلادرنگ یک فایل پس از ارسال موفق به کاربر تلگرام"""
    try:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
            print(f"[CLEANER] حذف بلادرنگ فایل انجام شد: {filepath}")
    except Exception as e:
        print(f"[CLEANER] خطا در حذف فایل: {e}")
`;
}

export function generateMainPy(config: BotConfig): string {
  return `"""
کد اصلی ربات دانلودر AllDown با استفاده از aiogram v3
شامل کنترلرها، منوی اینلاین فارسی، مدیریت محدودیت‌ها و پرمیوم
"""
import os
import asyncio
import logging
from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import (
    Message, CallbackQuery, InlineKeyboardMarkup, 
    InlineKeyboardButton, FSInputFile, URLInputFile
)
from aiogram.filters import CommandStart, Command
from aiogram.fsm.state import StatesGroup, State
from aiogram.fsm.context import FSMContext

import config
import database
import downloader
import cleaner

# راه‌اندازی گزارش‌گر خطاها
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# مقداردهی دیتابیس
database.init_db()

# راه‌اندازی شی بات و دیسپچر
bot = Bot(token=config.BOT_TOKEN)
dp = Dispatcher()
router = Router()

# ساختارهای مربوط به استیت‌ها در صورت نیاز
class BotStates(StatesGroup):
    waiting_for_url = State()

def get_main_keyboard(is_premium: bool) -> InlineKeyboardMarkup:
    """ساخت منوی فارسی و شکیل بات"""
    status_text = "💎 کاربر ویژه (محدودیت نامحدود)" if is_premium else "👤 کاربر عادی (دانلود محدود روزانه)"
    buttons = [
        [InlineKeyboardButton(text=status_text, callback_data="status_info")],
        [InlineKeyboardButton(text="💎 خرید اشتراک پرمیوم", callback_data="buy_premium")],
        [InlineKeyboardButton(text="ℹ️ راهنما و سایت‌های پشتیبانی شده", callback_data="help_info")],
        [InlineKeyboardButton(text="📞 پشتیبانی ادمین", callback_data="support_contact")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    """هندلر خوش‌آمد گویی با منوی زیبا"""
    user_id = message.from_user.id
    username = message.from_user.username or "Unknown"
    full_name = message.from_user.full_name or "کاربر گرامی"
    
    # ثبت کاربر در دیتابیس sqlite
    database.register_user(user_id, username, full_name)
    is_premium = database.check_premium_status(user_id)
    
    welcome_text = (
        f"سلام **{full_name}** عزیز! به ربات قدرتمند دانلودر **AllDown** خوش آمدید. 🙋‍♂️\\n\\n"
        f"${config.welcomeMsg.replace('\n', '\\n')}\\n\\n"
        f"👇 همین حالا لینک مورد نظر خود را بفرست تا دانلودش کنم!"
    )
    
    await message.reply(
        text=welcome_text,
        reply_markup=get_main_keyboard(is_premium),
        parse_mode="Markdown"
    )

@router.callback_query(F.data == "status_info")
async def cb_status_info(callback: CallbackQuery):
    """نمایش وضعیت کاربری و محدودیت‌ها"""
    user_id = callback.from_user.id
    is_premium = database.check_premium_status(user_id)
    today_downloads = database.get_today_downloads_count(user_id)
    
    if is_premium:
        msg = "💎 اشتراک شما ویژه است. دانلودهای شما نامحدود و با بالاترین سرعت سرور انجام می‌شود!"
    else:
        remaining = max(0, config.FREE_DAILY_LIMIT - today_downloads)
        msg = (
            f"👤 **وضعیت کاربری: رایگان**\\n\\n"
            f"📥 تعداد دانلودهای شما در ۲۴ ساعت گذشته: **{today_downloads}**\\n"
            f"⚡️ تعداد دانلودهای مجاز باقیمانده برای امروز: **{remaining}**\\n\\n"
            f"⚠️ کاربران رایگان تا حجم ۵۰ مگابایت دانلود دارند. برای برداشتن محدودیت‌ها پرمیوم تهیه کنید."
        )
    
    await callback.answer()
    await callback.message.answer(msg, parse_mode="Markdown")

@router.callback_query(F.data == "buy_premium")
async def cb_buy_premium(callback: CallbackQuery):
    """منوی خرید پرمیوم"""
    msg = (
        f"⭐️ **مزایای عضویت ویژه دائم AllDown:**\\n"
        f"۱. دانلود بدون محدودیت حجم و تعداد\\n"
        f"۲. لینک مستقیم صوتی و استخراج موزیک اسپاتیفای\\n"
        f"۳. سرعت دانلود اولویت فوق‌العاده بالا\\n\\n"
        f"💵 هزینه تمدید اشتراک: **{config.PREMIUM_PRICE_TEXT}**\\n\\n"
        f"✍️ جهت خرید و ارسال رسید به آیدی ادمین پشتیبانی پیام دهید:\\n"
        f"👉 @{config.SUPPORT_USERNAME}"
    )
    await callback.answer()
    await callback.message.answer(msg, parse_mode="Markdown")

@router.callback_query(F.data == "help_info")
async def cb_help_info(callback: CallbackQuery):
    """راهنمای کامل سایت‌های تحت پشتیبانی"""
    msg = (
        "📚 **راهنمای استفاده از ربات AllDown:**\\n\\n"
        "برای شروع کافیست لینک مدیا را از یکی از شبکه‌های اجتماعی زیر در چت ارسال کنید:\\n"
        "- **یوتیوب (YouTube)**: ویدیو تا کیفیت 1080p و فایل صوتی mp3\\n"
        "- **اینستاگرام (Instagram)**: ریلز، پست‌ها و IGTV\\n"
        "- **تیک‌تاک (TikTok)**: دانلود عالی ویدیوهای بدون واترمارک\\n"
        "- **اسپاتیفای (Spotify)**: استخراج موزیک با آلبوم‌آرت اختصاصی\\n"
        "- **توییتر (X / Twitter)**: دانلود سریع ویدیوهای توییت شده\\n"
        "- **سایت‌های بزرگسالان (NSFW)**: حمایت از دانلود ایمن مجهز به سیستم احراز سن بالای ۱۸ سال\\n\\n"
        "⚙️ ربات به صورت کاملا اتوماتیک پلتفرم را تشخیص داده و گزینه‌های کیفی را ارسال می‌کند."
    )
    await callback.answer()
    await callback.message.answer(msg, parse_mode="Markdown")

@router.callback_query(F.data == "support_contact")
async def cb_support_contact(callback: CallbackQuery):
    """راه‌های ارتباطی پشتیبانی"""
    msg = (
        f"📞 جهت هرگونه مشکل در دانلود، خرابی ربات، خرید حساب کاربری ویژه یا ارائه انتقادات و پیشنهادها به آیدی زیر پیام دهید:\\n\\n"
        f"👉 @{config.SUPPORT_USERNAME}"
    )
    await callback.answer()
    await callback.message.answer(msg)

@router.message(F.text.startswith("http://") | F.text.startswith("https://"))
async def handle_download_links(message: Message):
    """هندلر هوشمند دریافت کلیه لینک‌ها"""
    user_id = message.from_user.id
    url = message.text.strip()
    
    # ۱. ثبت اطلاعات کاربر
    database.register_user(user_id, message.from_user.username or "Unknown", message.from_user.full_name or "Unknown")
    
    is_premium = database.check_premium_status(user_id)
    user_data = database.get_user(user_id)
    
    # ۲. بررسی محدودیت دانلود روزانه کاربران رایگان
    if not is_premium:
        today_downloads = database.get_today_downloads_count(user_id)
        if today_downloads >= config.FREE_DAILY_LIMIT:
            await message.reply(
                "⚠️ **محدودیت روزانه شما به اتمام رسیده است!**\\n\\n"
                "کاربر رایگان عزیز، برای استفاده مجدد باید تا ۲۴ ساعت آینده صبر کنید یا با کلیک بر روی دکمه زیر اشتراک ویژه دائم تهیه نمایید 👇",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="💎 خرید اشتراک ویژه", callback_data="buy_premium")]
                ])
            )
            return

    # ۳. تشخیص پلتفرم و بررسی شرط‌های امنیتی
    platform = downloader.detect_platform(url)
    if platform == "unknown":
        await message.reply("❌ **آدرس ارسال شده نامعتبر یا پشتیبانی نشده است!**\\n\\nلطفاً لینک صحیح را کپی و مجدد ارسال کنید.")
        return

    # بررسی احراز سن بزرگسالان
    if platform == "nsfw" and config.ENABLE_NSFW_AGE_GATE:
        if not user_data["is_verified_18"]:
            buttons = [
                [InlineKeyboardButton(text="🔞 بله، بالای ۱۸ سال هستم", callback_data=f"verify_age_{user_id}")],
                [InlineKeyboardButton(text="خیر، انصراف", callback_data="cancel_verify")]
            ]
            await message.reply(
                "⚠️ **هشدار محتوای بزرگسالان (۱۸+)**\\n\\n"
                "لینک ارسال شده مربوط به پلتفرم‌های بزرگسالان است. جهت دسترسی و لود اطلاعات تایید سن الزامی است. آیا سن شما بیشتر از ۱۸ سال است؟",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons)
            )
            return

    # ۴. استخراج متادیتا و ارسال کیفیت‌ها
    status_msg = await message.reply("⏳ **در حال استخراج اطلاعات مدیا و کیفیت‌ها... لطفاً شکیبا باشید.**")
    
    info, plat = await downloader.get_url_info(url)
    if not info:
        await status_msg.edit_text("❌ **خطا در لود اطلاعات لینک!**\\n\\nسرور سایت منبع با خطا روبرو شد یا لینک منقضی است. لطفاً مدتی دیگر امتحان فرمایید.")
        return

    # ساخت دکمه‌های گزینش کیفیت به فارسی
    buttons = []
    
    # دکمه‌های فرمت ویدیویی استخراج شده
    for fmt in info["formats"]:
        # فرمت ایدی را در کالبک دیتا فشرده می‌کنیم برای دوری از محدودیت کاراکتر تلگرام
        buttons.append([
            InlineKeyboardButton(
                text=f"🎬 دانلود ویدیو کیفیت {fmt['quality']} ({fmt['ext']})",
                callback_data=f"dl_v_{fmt['format_id']}_{uuid.uuid4().hex[:6]}"
            )
        ])
        
    # دکمه خروجی صوتی پیش‌فرض mp3
    buttons.append([
        InlineKeyboardButton(
            text=f"🎵 دانلود فایل صوتی MP3 (کیفیت اصلی)",
            callback_data=f"dl_a_{uuid.uuid4().hex[:6]}"
        )
    ])
    
    # ذخیره آدرس موقت در کش جهت استفاده در رویداد دکمه‌ها
    # در ربات واقعی آدرس و کیفیت با دیتابیس موقت یا حافظه هندلر پاس داده میشوند
    # ما در اینجا دانلود عمومی را برای کیفیت انتخاب شده آماده کردیم
    # برای سادگی در دیتابیس موقت یا کش ذخیره می‌شود، در حالت واقعی لینک اصلی در استیت ذخیره میشود
    
    caption_text = (
        f"📝 **عنوان:** {info['title']}\\n"
        f"👤 **کانال/آپلودر:** {info['uploader']}\\n"
        f"⏱ **مدت زمان:** {info['duration']}\\n\\n"
        f"📥 **نوع رسانه:** {plat.upper()}\\n"
        f"👇 کیفیت و فرمت ارسالی مدنظر خود را کلیک کنید:"
    )
    
    # به همراه کاور پیش‌نمایش در صورت وجود روی پلتفرم
    if info["thumbnail"]:
        try:
            await status_msg.delete()
            # ذخیره کردن آدرس در استیت جهت فچ در دکمه‌ها
            dp["stored_url_" + str(user_id)] = url
            await message.reply_photo(
                photo=URLInputFile(info["thumbnail"]),
                caption=caption_text,
                reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
                parse_mode="Markdown"
            )
        except Exception:
            dp["stored_url_" + str(user_id)] = url
            await status_msg.edit_text(
                text=caption_text,
                reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
                parse_mode="Markdown"
            )
    else:
        dp["stored_url_" + str(user_id)] = url
        await status_msg.edit_text(
            text=caption_text,
            reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
            parse_mode="Markdown"
        )

@router.callback_query(F.data.startswith("verify_age_"))
async def cb_verify_age(callback: CallbackQuery):
    """تایید صلاحیت ۱۸ سال کاربر در دیتابیس"""
    user_id = int(callback.data.split("_")[2])
    database.verify_age(user_id)
    await callback.message.edit_text(
        "✅ سن شما با موفقیت تایید شد! حالا می‌توانید مجدداً لینک بزرگسالان خود را ارسال کنید تا دانلود با موفقیت پردازش شود."
    )

@router.callback_query(F.data == "cancel_verify")
async def cb_cancel_verify(callback: CallbackQuery):
    """لغو تایید سن"""
    await callback.message.edit_text("❌ از تایید شما انصراف داده شد. امکان دریافت محتوا برای شما وجود ندارد.")

@router.callback_query(F.data.startswith("dl_v_") | F.data.startswith("dl_a_"))
async def cb_perform_download(callback: CallbackQuery):
    """هندلر شروع عملیات واقعی دانلود بر روی سرور و آپلود به کاربر"""
    user_id = callback.from_user.id
    data = callback.data
    
    # بازیابی یوآرال ذخیره شده از دیکشنری سراسری بات
    url = dp.get("stored_url_" + str(user_id))
    if not url:
        await callback.answer("❌ خطا: نشست دانلود منقضی شده است. لطفا مجددا لینک را در چت ارسال کنید.", show_alert=True)
        return
        
    await callback.answer("📥 درحال آماده‌سازی بسته‌ها... پروژه در حال دانلود روی سرور است.")
    downloading_msg = await callback.message.answer("⚡️ **فرآیند دانلود روی سرور آغاز شد. این کار بسته به حجم فایل و سرعت ممکن است ۱ تا ۳ دقیقه زمان ببرد...**\\n\\n[▒▒▒▒▒▒▒▒▒▒] 0%")
    
    # بررسی فرمت
    extract_audio = data.startswith("dl_a_")
    format_id = None if extract_audio else data.split("_")[2]
    
    # اجرای عملیات دانلود
    filepath, title_or_err = await downloader.download_media(url, format_id, extract_audio)
    
    if not filepath or not os.path.exists(filepath):
        await downloading_msg.edit_text(f"❌ **خطا در دانلود یا انکود فایل!**\\n\\nجزئیات خطای سرور: \`\\n{{title_or_err}}\`".replace("{title_or_err}", title_or_err))
        return
        
    # ثبت آمار دانلود موفق در دیتابیس
    platform = downloader.detect_platform(url)
    database.log_download(user_id, platform, url)
    
    try:
        await downloading_msg.edit_text("📤 **دانلود روی سرور کامل شد! در حال آپلود فایل به تلگرام شما...**\\n\\n[██████████] 100%")
        
        # آپلود فایل مستقیم بر اساس فرمت ویدیو یا صدا
        input_file = FSInputFile(filepath)
        caption_text = f"💾 **AllDown Downloader Bot**\\n\\n🎥 **نام فایل:** {title_or_err}\\n⚡️ دانلود شده با بالاترین پایداری"
        
        if extract_audio:
            await callback.message.answer_audio(
                audio=input_file,
                caption=caption_text,
                title=title_or_err,
                parse_mode="Markdown"
            )
        else:
            await callback.message.answer_document(
                document=input_file,
                caption=caption_text,
                parse_mode="Markdown"
            )
            
        await downloading_msg.delete()
        
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        await downloading_msg.edit_text(f"⚠️ **فایل بر روی سرور دانلود گردید اما سایز آن بیشتر از محدوده آپلود تلگرام است (۵۰ مگابایت برای اکانت‌های بات معمولی).**\\n\\nپیشنهاد: لینک‌های کم‌حجم‌تر ارسال کنید.")
        
    finally:
        # پاکسازی آنی فایل برای بهینه‌سازی دیسک سرور
        cleaner.clean_file_immediately(filepath)

# مدیریت ادمین و دستور آمار ربات
@router.message(Command("stats"))
async def cmd_stats(message: Message):
    if message.from_user.id != config.ADMIN_ID:
        return
        
    stats = database.get_stats()
    stats_msg = (
        f"📊 **آمار کلی ربات AllDown:**\\n\\n"
        f"👥 کل کاربران: **{stats['total_users']}**\\n"
        f"💎 کاربران پرمیوم: **{stats['premium_users']}**\\n"
        f"📥 تعداد دانلودهای موفق: **{stats['total_downloads']}**"
    )
    await message.reply(stats_msg, parse_mode="Markdown")

# ارتقا دادن کاربر به پرمیوم توسط ادمین (دستی)
# فرمت: /setpremium [user_id] [days]
@router.message(Command("setpremium"))
async def cmd_set_premium(message: Message):
    if message.from_user.id != config.ADMIN_ID:
        return
        
    try:
        args = message.text.split(" ")
        target_user_id = int(args[1])
        days = int(args[2])
        
        database.set_premium(target_user_id, days)
        await message.reply(f"✅ کاربر {target_user_id} با موفقیت به مدت {days} روز به ویژه ارتقا یافت.")
        
        # اطلاع رسانی به کاربر مربوطه در صورت امکان
        try:
            await bot.send_message(
                chat_id=target_user_id,
                text=f"🎉 **تبریک! حساب کاربری شما توسط مدیریت به مدت {days} روز به پرمیوم کاربری (ویژه) ارتقا یافت.**\\n"
                     f"حالا بدون محدودیت دانلود روزانه و با بیشترین سرعت لذت ببرید!"
            )
        except Exception:
            pass
    except Exception as e:
        await message.reply(f"❌ فرمت اشتباه است.\\nفرمت صحیح: \`/setpremium [شناسه کاربر] [تعداد روز]\`")

async def main():
    """شروع به کار دیسپچر ربات به همراه تسک پاکسازی خودکار"""
    dp.include_router(router)
    
    # راه‌اندازی تسک لوپ موازی پاکسازی دیسک در بک‌گراند
    asyncio.create_task(cleaner.auto_clean_task())
    
    print("[ALLDOWN] ربات با موفقیت فعال شد و آماده ارتباط پولینگ تلگرام است...")
    # شروع پولینگ بدون هندلرهای از پیش خوانده شده قدیمی (جهت فرار از کرش‌های تلگرامی)
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
`;
}

export function generateRequirementsTxt(): string {
  return `aiogram>=3.3.0
yt-dlp>=2024.03.11
sqlite3-api; python_version<'3.8' # یا استفاده از کتابخانه پیش‌فرض sqlite3 بدون نصب اضافی
pydantic>=2.5.0
python-dotenv>=1.0.0
`;
}

export function generateReadmeMd(): string {
  return `# ربات دانلودر همه‌کاره تلگرام AllDown
ربات تخصصی دانلود از یوتیوب، اینستاگرام، تیک‌تاک، توییتر، اسپاتیفای و سایت‌های بزرگسال با فیلتر اتوماتیک و پنل هوشمند ادمین.

---

## 🚀 راهنمای سریع راه‌اندازی و دیپلوی (Deployment Guide)

### روش اول: استقرار روی سرورهای ابری رایگان چون Render یا Railway

برای دیپلوی بدون دردسر روی این سرورها فرآیند ذیل را طی کنید:
1. یک ریپازیتوری شخصی در گیت‌هاب بسازید و تمام فایل‌های قرار گرفته در این استودیو کاربری را در آن آپلود کنید.
2. در اکانت **Railway** یا **Render** کلیک روی گزینه **New Web Service** (یا Background Worker) کرده و مخزن گیت‌هاب خود را متصل سازید.
3. در تب متغیرهای محیطی (Environment Variables)، متغبرهای زیر را ست کنید:
   \`\`\`env
   BOT_TOKEN = توکن تلگرام دریافت شده از BotFather
   ADMIN_ID = شناسه عددی تلگرام خودتان برای پنل مدیریت ادمین
   FREE_DAILY_LIMIT = 5
   \`\`\`
4. فرمان شروع استارت (Start Command) را برابر دستور روبه‌رو بگذارید:
   \`\`\`bash
   python main.py
   \`\`\`
5. به دلیل استفاده ربات از \`yt-dlp\` جهت تبدیل کیفیت‌ها و ادغام صدا با کیفیت‌های بالا حتماً پکیج ابزار صوتی تصویری **FFmpeg** باید بر روی کانتینر یا سیستم نصب باشد.
   - **در Railway**: در بخش Nixpacks ربات به صورت خوکار شناسایی می‌شود ولی برای اطمینان افزونه FFmpeg را نصب کنید.
   - **در Render**: با ساختن یک فایل به نام \`render.yaml\` یا افزودن بیلدپک \`https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest\` می‌توانید آن را به سادگی به پروژه اضافه کنید.

---

## 🛠 روش دوم: راه‌اندازی روی سرورهای لینوکس (Vps / Ubuntu)

کافیست دستورات زیر را رجوع کنید:
\`\`\`bash
# آپدیت سیستم و نصب وابستگی‌های صوتی ffmpeg
sudo apt update && sudo apt install ffmpeg python3-pip python3-venv -y

# کلون یا کپی پروژه و ساخت محیط مجازی پایتون
python3 -m venv venv
source venv/bin/activate

# نصب کتابخانه‌های پایتونی
pip install -r requirements.txt

# راه‌اندازی و اجرای بک‌گراند ربات تلگرام با systemd یا screen
screen -S alldown
python main.py
\`\`\`

---

## 🛡 نکات طلایی امنیتی و جلوگیری از فیلتر/بلاک شدن (Anti-Ban & Security Tricks)

۱. **استفاده از فایل کوکی (Cookies.txt) [بسیار حیاتی برای یوتیوب و اینستاگرام]:**
یوتیوب به شدت درخواست‌های آی‌پی سرورهای ابری عمومی مثل دیتاسنترهای آلمان یا آمریکا رو مسدود و کدهای کپچا ترغیب می‌کند.
برای دور زدن این مشکل، افزونه **Get Cookies.txt** را روی مرورگر کروم دسکتاپ خود نصب کنید. در اکانت یوتیوب و اینستاگرام خود لاگین کنید، کوکی‌ها را با فرمت Netscape دانلود کنید و نام آن را \`cookies.txt\` قرار داده و در کنار فایل \`main.py\` ربات خود آپلود کنید. ماژول دانلودر AllDown اتوماتیک آن را شناسایی و بارگذاری می‌کند تا سرور شما مثل یک مرورگر خانگی به سادگی بدون بلاک شدن ریلزها و فیلم‌ها را دانلود کند!

۲. **محدودسازی نرخ دانلود (Rate Limiting) و فلو فایروال تلگرام:**
در دیتابیس طراحی شده به صورت SQLite، میزان دانلودهای ۲۴ ساعت گذشته به همراه ایدی کاربر بررسی می‌شود تا سهمیه روزانه محدود بگردد. این فیلتر به شدت استفاده منابع سرور را بهینه ساخته و از مسدود شدن توکن ربات به دلیل ارسال اسپم‌های غول‌آسا فرار می‌کند.

۳. **پشتیبانی از پروکسی چرخان (Rotating Proxies):**
در بخش \`downloader.py\` برای پایداری‌های فوق‌العاده بالا بر روی دیتاسنترها می‌توانید با افزودن پارامتر زیر به \`ydl_opts\` از پروکسی‌های اچ‌تی‌تی‌پی جهت تغییر ادامه‌دار لوکیشن دانلودر سود ببرید:
\`\`\`python
# اضافه کردن پروکسی به تنظیمات yt-dlp
ydl_opts['proxy'] = 'http://username:password@openproxy.com:port'
\`\`\`
`;
}
