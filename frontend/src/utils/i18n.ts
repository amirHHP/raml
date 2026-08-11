import type { ClassType, EquipSlot, Language, StatKey } from '../types/game';

export const TRANSLATIONS = {
  fa: {
    // General / Common
    appName: 'رمل',
    loading: 'در حال بارگذاری رمل...',
    connectionError: 'اتصال به سرور برقرار نشد',
    retry: 'تلاش دوباره',
    close: 'بستن',
    cancel: 'لغو',
    confirm: 'تأیید',
    copy: 'کپی',
    copied: 'کپی شد!',
    back: 'بازگشت',

    // Status / Header
    levelShort: 'سطح',
    energy: 'انرژی',
    hp: 'سلامت',
    mana: 'مانا',
    gold: 'طلا',
    location: 'مکان',
    settings: 'تنظیمات',
    inbox: 'صندوق پیام',

    // Tabs
    tabStory: 'داستان',
    tabHome: 'خانه',
    tabInventory: 'کوله‌پشتی',
    tabStats: 'وضعیت',
    tabShop: 'فروشگاه',

    // Awaken Screen
    awakenTitle: 'چشم‌هایت را باز کن',
    awakenSubtitle: 'در تاریکی کویر، نامی را نجوا کن تا هستی‌ات شکل گیرد...',
    namePlaceholder: 'نام قهرمان خود را وارد کنید...',
    chooseClassHint: 'کلاس خود را انتخاب کنید (اختیاری):',
    openEyesButton: 'باز کردن چشم‌ها',
    restoreSaveCode: 'بازیابی با کد ذخیره',
    restoreModalTitle: 'بازیابی پیشرفت بازی',
    restoreModalHint: 'شناسه دستگاه یا کد ذخیره قبلی خود را وارد کنید:',
    restoreInputPlaceholder: 'مثال: 9b1deb4d-3b7d-4b69...',
    restoreButton: 'بازیابی بازی',
    restoreError: 'کد ذخیره واردشده نامعتبر است یا پیدا نشد',
    languageToggle: 'زبان / Language',

    // Classes
    classWarrior: 'جنگجو',
    classWarriorDesc: 'قدرت بالا و سلامت زیاد (پیش‌فرض)',
    classMage: 'جادوگر',
    classMageDesc: 'خرد بالا و مانای افزون',
    classRogue: 'سایه (سارق)',
    classRogueDesc: 'چابکی بالا و طلای اولیه زیاد',
    classRanger: 'کماندار',
    classRangerDesc: 'تعادل بین چابکی و خرد',

    // Dice Roller
    diceCheckTitle: 'آزمون مهارت',
    rollDiceButton: 'ریختن تاس D20',
    rollResultSuccess: 'موفقیت!',
    rollResultFailure: 'شکست!',
    rollModifier: 'اصلاح‌گر',
    totalRoll: 'مجموع',
    targetScore: 'حداقل نیاز',

    // Energy Depleted
    energyEmptyTitle: 'انرژی شما به پایان رسید!',
    energyEmptySubtitle: 'برای ادامهٔ بازی می‌توانید کمی صبر کنید یا با تماشای ویدیو و خرید، انرژی را شارژ نمایید.',
    rechargeTimerLabel: 'زمان شارژ بعدی:',
    watchAdButton: 'تماشای ویدیو (+۵ انرژی)',
    buyRefillButton: 'شارژ مجدد انرژی',

    // Inventory Panel
    inventoryTitle: 'کوله‌پشتی قهرمان',
    inventoryEmpty: 'کوله‌پشتی شما خالی است.',
    equippedBadge: 'تجهیزشده',
    equipButton: 'تجهیز',
    unequipButton: 'خارج کردن',

    // Equip Slot Labels
    slotHead: 'سر',
    slotChest: 'سینه',
    slotHands: 'دست',
    slotLegs: 'پا',
    slotFeet: 'کفش',
    slotWeapon: 'سلاح',
    slotAccessory: 'زیور',

    // Stats Panel
    statsTitle: 'مشخصات و آمار',
    statStrength: 'قدرت (STR)',
    statAgility: 'چابکی (AGI)',
    statIntellect: 'خرد (INT)',
    statXp: 'امتیاز تجربه (XP)',
    equipmentSilhouetteTitle: 'تجهیزات بدن',

    // Home Panel
    homeTitle: 'پناهگاه امن (خانه)',
    returnHomeButton: 'بازگشت به خانه',
    enterCaveButton: 'ورود به غار و ادامه داستان',
    activitiesTitle: 'فعالیت‌های روزانه',
    startActivityButton: 'شروع تمرین',
    speedUpButton: 'تسریع با سکه',
    cancelActivityButton: 'لغو فعالیت',
    claimRewardButton: 'دریافت پاداش',
    activityInProgress: 'در حال انجام فعالیت...',
    timeLeftLabel: 'زمان باقی‌مانده:',

    // Activity Names & Descs
    actSwordTraining: 'تمرین شمشیرزنی',
    actSwordDesc: 'افزایش قدرت قهرمان',
    actObstacleJump: 'پرش از موانع',
    actObstacleDesc: 'افزایش چابکی',
    actMeditation: 'مدیتیشن و تمرکز',
    actMeditationDesc: 'افزایش خرد و مانا',
    actExcavation: 'حفاری و جستجو',
    actExcavationDesc: 'کشف سکه و طلا',
    actHunting: 'شکار در کویر',
    actHuntingDesc: 'کشف غنیمت و غذا',

    // Shop Panel
    shopTitle: 'فروشگاه رمل',
    shopSubtitle: 'خرید بسته‌ها و آنلاک‌های بازی',
    buyButton: 'خرید',
    tomanCurrency: 'تومان',
    coinCurrency: 'سکه',

    // Settings Modal
    settingsTitle: 'تنظیمات بازی',
    gameLanguageLabel: 'زبان بازی / Game Language',
    saveCodeLabel: 'شناسه دستگاه (کد ذخیره):',
    saveCodeDescription: 'پیشرفت بازی روی این کد ذخیره می‌شود. آن را جایی امن نگه دار — اگر داده‌ها پاک شوند، با همین کد می‌توانی دوباره وارد شوی.',
    copySaveCode: 'کپی کد',
    playDayCountLabel: 'روزهای بازی:',
    fullUiUnlockedMsg: 'رابط کامل بازی فعال است.',
    unlockFullUiButton: 'آنلاک کامل بازی (دیباگ)',

    // Audio Settings
    audioSettingsTitle: 'تنظیمات صدا و موزیک',
    bgmLabel: 'موزیک زمینه (BGM)',
    sfxLabel: 'جلوه‌های صوتی (SFX)',
    volumeLabel: 'شدت صدا',
    audioOn: 'روشن',
    audioOff: 'خاموش',

    // Inbox Modal
    inboxTitle: 'صندوق پیام‌ها',
    inboxEmpty: 'هیچ پیامی در صندوق وجود ندارد.',
    markReadButton: 'علامت به‌عنوان خوانده‌شده',

    // Changelog
    changelogTitle: 'تاریخچه تغییرات',
    changelogEmpty: 'هنوز تغییراتی ثبت نشده.',
    changelogButton: 'تاریخچه تغییرات',

    // Referral
    referralTitle: 'دعوت دوستان',
    referralSubtitle: 'کد دعوتت رو با دوستات به اشتراک بذار. وقتی دوستت بازی رو شروع کنه، هر دوتاتون سکه می‌گیرین!',
    referralCodeLabel: 'کد دعوت تو:',
    referralCopyCode: 'کپی کد',
    referralShare: 'اشتراک‌گذاری',
    referralProgress: 'دعوت‌های موفق:',
    referralFriendsTitle: 'دوستان دعوت‌شده:',
    referralNoFriends: 'هنوز کسی رو دعوت نکردی.',
    referralEnterCode: 'کد دعوت دوستت رو وارد کن:',
    referralApply: 'ثبت کد دعوت',
    referralApplied: 'کد دعوت ثبت شد!',
    referralRewardNote: 'هر دعوت: +۵۰ طلا برای تو، +۲۵ طلا برای دوستت',
    referralShareText: 'بیا تو بازی رمل! کد دعوت من: {code} 🎮',
    referralAlreadyApplied: 'قبلاً کد دعوت ثبت شده.',

    // iOS WebApp Install Prompt
    iosInstallTitle: 'نصب اپلیکیشن رمل (WebApp)',
    iosInstallSubtitle: 'برای تجربهٔ کامل، روان و بدون کادر مرورگر، رمل را به صفحهٔ اصلی آیفون یا آیپد خود اضافه کنید:',
    iosInstallStep1Title: '۱. دکمهٔ اشتراک‌گذاری (Share)',
    iosInstallStep1Desc: 'در پایین مرورگر سَفاری (Safari)، روی آیکون اشتراک‌گذاری (کادر با فلش رو به بالا) بزنید.',
    iosInstallStep2Title: '۲. افزودن به صفحه اصلی',
    iosInstallStep2Desc: 'منو را به پایین بکشید و گزینهٔ «افزودن به صفحه اصلی» (Add to Home Screen) را انتخاب کنید.',
    iosInstallStep3Title: '۳. تایید و افزودن',
    iosInstallStep3Desc: 'در بالای صفحه روی «افزودن» (Add) بزنید تا آیکون بازی به صفحهٔ برنامه‌هایتان اضافه شود.',
    iosInstallDismiss: 'متوجه شدم / بعداً',
    installPwaButton: 'راهنمای نصب وب‌اپلیکیشن (PWA)',
  },

  en: {
    // General / Common
    appName: 'Raml',
    loading: 'Loading Raml...',
    connectionError: 'Could not connect to server',
    retry: 'Retry',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    copy: 'Copy',
    copied: 'Copied!',
    back: 'Back',

    // Status / Header
    levelShort: 'Lvl',
    energy: 'Energy',
    hp: 'HP',
    mana: 'Mana',
    gold: 'Gold',
    location: 'Location',
    settings: 'Settings',
    inbox: 'Inbox',

    // Tabs
    tabStory: 'Story',
    tabHome: 'Home',
    tabInventory: 'Inventory',
    tabStats: 'Stats',
    tabShop: 'Shop',

    // Awaken Screen
    awakenTitle: 'Open Your Eyes',
    awakenSubtitle: 'Whisper a name in the desert darkness to awaken your soul...',
    namePlaceholder: 'Enter your hero name...',
    chooseClassHint: 'Select your class (optional):',
    openEyesButton: 'Open Your Eyes',
    restoreSaveCode: 'Restore with Save Code',
    restoreModalTitle: 'Restore Game Progress',
    restoreModalHint: 'Enter your prior device ID or save code:',
    restoreInputPlaceholder: 'Example: 9b1deb4d-3b7d-4b69...',
    restoreButton: 'Restore Game',
    restoreError: 'The save code entered is invalid or was not found',
    languageToggle: 'Language / زبان',

    // Classes
    classWarrior: 'Warrior',
    classWarriorDesc: 'High Strength & Max HP (Default)',
    classMage: 'Mage',
    classMageDesc: 'High Intellect & Extra Mana',
    classRogue: 'Rogue',
    classRogueDesc: 'High Agility & Extra Starting Gold',
    classRanger: 'Ranger',
    classRangerDesc: 'Balanced Agility & Intellect',

    // Dice Roller
    diceCheckTitle: 'Skill Check',
    rollDiceButton: 'Roll D20 Dice',
    rollResultSuccess: 'Success!',
    rollResultFailure: 'Failure!',
    rollModifier: 'Modifier',
    totalRoll: 'Total',
    targetScore: 'Required Target',

    // Energy Depleted
    energyEmptyTitle: 'Out of Energy!',
    energyEmptySubtitle: 'Wait for recharge or watch a rewarded ad to restore your energy.',
    rechargeTimerLabel: 'Next recharge in:',
    watchAdButton: 'Watch Video (+5 Energy)',
    buyRefillButton: 'Buy Energy Refill',

    // Inventory Panel
    inventoryTitle: 'Hero Inventory',
    inventoryEmpty: 'Your inventory is empty.',
    equippedBadge: 'Equipped',
    equipButton: 'Equip',
    unequipButton: 'Unequip',

    // Equip Slot Labels
    slotHead: 'Head',
    slotChest: 'Chest',
    slotHands: 'Hands',
    slotLegs: 'Legs',
    slotFeet: 'Feet',
    slotWeapon: 'Weapon',
    slotAccessory: 'Accessory',

    // Stats Panel
    statsTitle: 'Hero Stats & Attributes',
    statStrength: 'Strength (STR)',
    statAgility: 'Agility (AGI)',
    statIntellect: 'Intellect (INT)',
    statXp: 'Experience (XP)',
    equipmentSilhouetteTitle: 'Equipment Slots',

    // Home Panel
    homeTitle: 'Safe Haven (Home)',
    returnHomeButton: 'Return Home',
    enterCaveButton: 'Enter Cavern & Continue Story',
    activitiesTitle: 'Daily Training & Activities',
    startActivityButton: 'Start Activity',
    speedUpButton: 'Speed Up with Coins',
    cancelActivityButton: 'Cancel Activity',
    claimRewardButton: 'Claim Rewards',
    activityInProgress: 'Training in progress...',
    timeLeftLabel: 'Time remaining:',

    // Activity Names & Descs
    actSwordTraining: 'Sword Training',
    actSwordDesc: 'Increases hero Strength',
    actObstacleJump: 'Obstacle Course',
    actObstacleDesc: 'Increases Agility',
    actMeditation: 'Meditation & Focus',
    actMeditationDesc: 'Increases Intellect & Mana',
    actExcavation: 'Excavation & Search',
    actExcavationDesc: 'Find Coins & Gold',
    actHunting: 'Desert Hunting',
    actHuntingDesc: 'Gather Food & Rations',

    // Shop Panel
    shopTitle: 'Raml Shop',
    shopSubtitle: 'Purchase energy refills, coins, and unlocks',
    buyButton: 'Buy',
    tomanCurrency: 'Tomans',
    coinCurrency: 'Coins',

    // Settings Modal
    settingsTitle: 'Game Settings',
    gameLanguageLabel: 'Game Language / زبان بازی',
    saveCodeLabel: 'Device ID (Save Code):',
    saveCodeDescription: 'Game progress is saved under this code. Keep it somewhere safe — if data is cleared, you can restore your game using this code.',
    copySaveCode: 'Copy Code',
    playDayCountLabel: 'Days Played:',
    fullUiUnlockedMsg: 'Full game interface unlocked.',
    unlockFullUiButton: 'Unlock Full Interface (Debug)',

    // Audio Settings
    audioSettingsTitle: 'Sound & Music Settings',
    bgmLabel: 'Background Music (BGM)',
    sfxLabel: 'Sound Effects (SFX)',
    volumeLabel: 'Volume',
    audioOn: 'On',
    audioOff: 'Off',

    // Inbox Modal
    inboxTitle: 'Messages Inbox',
    inboxEmpty: 'No messages in inbox.',
    markReadButton: 'Mark as Read',

    // Changelog
    changelogTitle: 'Changelog',
    changelogEmpty: 'No changelogs yet.',
    changelogButton: 'Changelog',

    // Referral
    referralTitle: 'Invite Friends',
    referralSubtitle: 'Share your invite code with friends. When they start playing, you both earn coins!',
    referralCodeLabel: 'Your Invite Code:',
    referralCopyCode: 'Copy Code',
    referralShare: 'Share',
    referralProgress: 'Successful Invites:',
    referralFriendsTitle: 'Invited Friends:',
    referralNoFriends: 'No friends invited yet.',
    referralEnterCode: 'Enter your friend\'s invite code:',
    referralApply: 'Apply Code',
    referralApplied: 'Invite code applied!',
    referralRewardNote: 'Each invite: +50 Gold for you, +25 Gold for your friend',
    referralShareText: 'Join me in Raml! My invite code: {code} 🎮',
    referralAlreadyApplied: 'Invite code already applied.',

    // iOS WebApp Install Prompt
    iosInstallTitle: 'Install Raml App (WebApp)',
    iosInstallSubtitle: 'For a full-screen, immersive experience without browser bars, add Raml to your Home Screen:',
    iosInstallStep1Title: '1. Tap the Share button',
    iosInstallStep1Desc: 'At the bottom of Safari, tap the Share icon (square with an upward arrow).',
    iosInstallStep2Title: '2. Select "Add to Home Screen"',
    iosInstallStep2Desc: 'Scroll down the menu options and tap "Add to Home Screen".',
    iosInstallStep3Title: '3. Tap "Add"',
    iosInstallStep3Desc: 'Tap "Add" in the top-right corner to place Raml on your home screen.',
    iosInstallDismiss: 'Got it / Later',
    installPwaButton: 'WebApp (PWA) Installation Guide',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.fa;

export function t(key: TranslationKey, lang: Language = 'fa'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.fa;
  return dict[key] || TRANSLATIONS.fa[key] || String(key);
}

export function getClassLabel(classType: ClassType, lang: Language = 'fa'): string {
  switch (classType) {
    case 'warrior':
      return t('classWarrior', lang);
    case 'mage':
      return t('classMage', lang);
    case 'rogue':
      return t('classRogue', lang);
    case 'ranger':
      return t('classRanger', lang);
  }
}

export function getSlotLabel(slot: EquipSlot, lang: Language = 'fa'): string {
  switch (slot) {
    case 'head':
      return t('slotHead', lang);
    case 'chest':
      return t('slotChest', lang);
    case 'hands':
      return t('slotHands', lang);
    case 'legs':
      return t('slotLegs', lang);
    case 'feet':
      return t('slotFeet', lang);
    case 'weapon':
      return t('slotWeapon', lang);
    case 'accessory':
      return t('slotAccessory', lang);
  }
}

export function getStatLabel(stat: StatKey, lang: Language = 'fa'): string {
  switch (stat) {
    case 'hp':
      return t('hp', lang);
    case 'mana':
      return t('mana', lang);
    case 'gold':
      return t('gold', lang);
    case 'energy':
      return t('energy', lang);
    case 'strength':
      return t('statStrength', lang);
    case 'agility':
      return t('statAgility', lang);
    case 'intellect':
      return t('statIntellect', lang);
  }
}
