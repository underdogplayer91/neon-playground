import { useEffect, useRef, useState } from 'react';
import { limitNeonInput, tokenizeNeonText, useFittedNeonText } from './neonText';
import { calculateNeonSize, getPreviewLetterSpacingEm, measurementSource, sizingFonts } from './neonSizing';
import { calculateNeonPrice, formatRm, isDoubleLineFont, minimumHeightForFont, productionModeForFont } from './pricingConfig';
import { calculateLayerDesign, createTextLayer, layoutAutomaticWords } from './neonLayers';
import { NeonLayerCanvas } from './NeonLayerCanvas';
import { getMetaAttribution, trackMetaEventOnce } from './metaPixel';
import { createDisplayReference } from './orderReference';
const EmptyIcon = () => null;
const ArrowDown = EmptyIcon, ArrowRight = EmptyIcon, Check = EmptyIcon, Eye = EmptyIcon;
const Heart = EmptyIcon, InstagramLogo = EmptyIcon, Lightning = EmptyIcon, MapPin = EmptyIcon;
const Moon = EmptyIcon, Palette = EmptyIcon, PencilSimple = EmptyIcon, ShieldCheck = EmptyIcon;
const ShoppingBagOpen = EmptyIcon, Sun = EmptyIcon, Truck = EmptyIcon;
const fonts = sizingFonts.filter((font) => font.id !== 'milford-hollow').map((font) => ({
  ...font,
  name: font.id === 'bouncy-personal-use-only' ? 'BOUNCY' : font.name,
  file: `/fonts/${encodeURIComponent(font.fileName)}`,
}));
const featuredFonts = fonts.slice(0, 6);
const otherFonts = fonts.slice(6);
const colors = [
  { id: 'cool-white', label: 'Cool White', value: '#f4f7ff', glow: '244,247,255' },
  { id: 'warm-white', label: 'Warm White', value: '#ffd89a', glow: '255,216,154' },
  { id: 'green', label: 'Green', value: '#15e66f', glow: '21,230,111' },
  { id: 'blue', label: 'Blue', value: '#3157ff', glow: '49,87,255' },
  { id: 'ice-blue', label: 'Ice Blue', value: '#31d7ff', glow: '49,215,255' },
  { id: 'pink', label: 'Pink', value: '#ff3bbd', glow: '255,59,189' },
  { id: 'red', label: 'Red', value: '#ff322b', glow: '255,50,43' },
  { id: 'purple', label: 'Purple', value: '#9b45ff', glow: '155,69,255' },
  { id: 'yellow', label: 'Yellow', value: '#ffe13b', glow: '255,225,59' },
  { id: 'orange', label: 'Orange', value: '#ff941f', glow: '255,148,31' },
];
const DEFAULT_PREVIEW_LAYERS = [
  { id: 'demo-warung', text: 'Warung', font_id: 'bouncy-personal-use-only', colour: 'green', target_height_cm: 15, letter_spacing_cm: 0, x_cm: 14.61, y_cm: 3, locked: false, visible: true, production_mode: 'double', word_mode: 'continuous', detached: true, line_index: 0, rotation_deg: 0 },
  { id: 'demo-pak', text: 'Pak', font_id: 'beachfront-cn', colour: 'yellow', target_height_cm: 14, letter_spacing_cm: 0, x_cm: 27.7, y_cm: 15.35, locked: false, visible: true, production_mode: 'single', word_mode: 'continuous', detached: true, line_index: 0, rotation_deg: 0 },
  { id: 'demo-atan', text: 'Atan', font_id: 'beachfront-cn', colour: 'yellow', target_height_cm: 14, letter_spacing_cm: 0, x_cm: 50.44, y_cm: 16.06, locked: false, visible: true, production_mode: 'single', word_mode: 'continuous', detached: true, line_index: 0, rotation_deg: 0 },
  { id: 'demo-kedai', text: 'Kedai', font_id: 'milan', colour: 'green', target_height_cm: 20, letter_spacing_cm: 0, x_cm: 100.21, y_cm: 0.95, locked: false, visible: true, production_mode: 'double', word_mode: 'continuous', detached: true, line_index: 0, rotation_deg: -31.5 },
  { id: 'demo-runcit', text: 'Runcit', font_id: 'beachfront-cn', colour: 'blue', target_height_cm: 15, letter_spacing_cm: 0, x_cm: 137.7, y_cm: 8.27, locked: false, visible: true, production_mode: 'single', word_mode: 'continuous', detached: true, line_index: 0, rotation_deg: 0 },
  { id: 'demo-aman', text: 'Aman', font_id: 'beachfront-cn', colour: 'blue', target_height_cm: 15, letter_spacing_cm: 0, x_cm: 127.28, y_cm: 21.86, locked: false, visible: true, production_mode: 'single', word_mode: 'continuous', detached: true, line_index: 0, rotation_deg: 0 },
  { id: 'demo-cafe', text: 'Cafe', font_id: 'royalty-cn', colour: 'pink', target_height_cm: 24, letter_spacing_cm: 0, x_cm: 180.9, y_cm: 35.51, locked: false, visible: true, production_mode: 'single', word_mode: 'continuous', detached: true, line_index: 0, rotation_deg: 0 },
  { id: 'demo-retro', text: 'Retro', font_id: 'milan', colour: 'ice-blue', target_height_cm: 15, letter_spacing_cm: 0, x_cm: 193.35, y_cm: 54, locked: false, visible: true, production_mode: 'double', word_mode: 'continuous', detached: true, line_index: 0, rotation_deg: 0 },
  { id: 'demo-restoran', text: 'Restoran', font_id: 'sci-fied-x-outline', colour: 'red', target_height_cm: 15, letter_spacing_cm: 0, x_cm: -0.36, y_cm: 47.76, locked: false, visible: true, production_mode: 'double', word_mode: 'continuous', detached: true, line_index: 0, rotation_deg: 0 },
  { id: 'demo-mamak', text: 'Mamak', font_id: 'beachfront-cn', colour: 'blue', target_height_cm: 15, letter_spacing_cm: 0, x_cm: 61.93, y_cm: 62.89, locked: false, visible: true, production_mode: 'single', word_mode: 'continuous', detached: true, line_index: 0, rotation_deg: 0 },
];
const cloneDefaultPreviewLayers = () => DEFAULT_PREVIEW_LAYERS.map((layer) => ({ ...layer }));
const playgroundRealityPairs = [
  { slug: 'adys', title: "Ady's Resort", preview: '/assets/playground-real/adys-a.jpg', real: '/assets/playground-real/adys-b.jpg', realObjectPosition: 'center 28%', className: '' },
  { slug: 'burger-kakza', title: 'Burger Kakza', preview: '/assets/playground-real/burger-kakza-preview.png', real: '/assets/playground-real/burger-kakza-real.jpg', realObjectPosition: 'center 42%', className: '' },
  { slug: 'mj', title: 'Michael Jackson', preview: '/assets/playground-real/mj-preview.png', real: '/assets/playground-real/mj-real.jpg', className: 'tall' },
  { slug: 'pickup-order', title: 'Pickup Here / Order Here', preview: '/assets/playground-real/pickup-order-preview.png', real: '/assets/playground-real/pickup-order-real.jpg', className: '' },
  { slug: 'feel', title: 'Feel the difference', preview: '/assets/playground-real/feel-preview.png', real: '/assets/playground-real/feel-real.jpg', className: 'wide' },
  { slug: 'moo', title: 'Enjoy the Moooment', preview: '/assets/playground-real/moo-preview.png', real: '/assets/playground-real/moo-real.jpg', className: '' },
  { slug: 'nasi', title: 'Nasi Lemak Utara', preview: '/assets/playground-real/nasi-preview.png', real: '/assets/playground-real/nasi-real.jpg', className: '' },
];
const posterSlides = Array.from({ length: 36 }, (_, index) => ({
  src: `/assets/customer-poster/poster-${String(index + 1).padStart(2, '0')}.jpg`,
  alt: `Hasil neon sebenar pelanggan ${index + 1}`,
}));
const testimonials = [
  {
    business: 'Daisy Coffee',
    label: 'Hasil kerja',
    src: '/assets/testimoni/testimoni-daisy-coffee.jpeg',
    alt: 'Screenshot testimoni sebenar pelanggan Daisy Coffee selepas menerima neon',
  },
  {
    business: 'Amir Tomyam',
    label: 'Nampak real',
    src: '/assets/testimoni/testimoni-amir-tomyam.jpeg',
    alt: 'Screenshot testimoni sebenar pelanggan Amir Tomyam selepas neon dipasang',
  },
  {
    business: 'Tang Wagyu',
    label: 'Cantik',
    src: '/assets/testimoni/testimoni-tang-wagyu.jpeg',
    alt: 'Screenshot testimoni sebenar pelanggan Tang Wagyu tentang neon yang cantik',
  },
  {
    business: 'Abah Cool Station',
    label: 'Kedai menyerlah',
    src: '/assets/testimoni/testimoni-abah-cool-station.jpeg',
    alt: 'Screenshot testimoni sebenar pelanggan Abah Cool Station selepas menggunakan neon',
  },
  {
    business: 'Mek Biha Lokcing',
    label: 'Kemas & comel',
    src: '/assets/testimoni/testimoni-mek-biha-lokcing.jpeg',
    alt: 'Screenshot testimoni sebenar pelanggan Mek Biha Lokcing semasa pemasangan neon',
  },
];
const heroImage = {
  src: '/assets/hero-storefront-v2.png',
  alt: 'Kedai Kopi Jiwa dengan neon pada cermin dalam paparan siang dan malam',
};
const countCharacters = (value) => [...value.replace(/\s/g, '')].length;
const ORDER_KEY = 'yh-neon-checkout-order';

function Header() {
  return <header className="site-header">
    <a className="brand" href="#top"><span>PAKAR LED &amp; NEON</span><i>BY YH</i></a>
    <nav><a href="#playground">Reka Neon</a><a href="#inspirasi">Inspirasi</a><a href="#faq">FAQ</a></nav>
    <a className="header-cta" href="#playground"><PencilSimple weight="bold" /> Cuba Sekarang</a>
  </header>;
}

export function App() {
  const [text, setText] = useState('');
  const [fontId, setFontId] = useState('melbourne-cn');
  const [targetTextHeightCm, setTargetTextHeightCm] = useState(15);
  const [letterSpacingCm, setLetterSpacingCm] = useState(3);
  const [sizePreset, setSizePreset] = useState('custom');
  const [backboardStyle, setBackboardStyle] = useState('black');
  const [colorId, setColorId] = useState('green');
  const [colorMode, setColorMode] = useState('multi');
  const [wordColorIds, setWordColorIds] = useState({ 0: 'pink', 1: 'yellow', 2: 'pink' });
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [colorMessage, setColorMessage] = useState('');
  const [isOtherFontsOpen, setIsOtherFontsOpen] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(3);
  const [activePosterSlide, setActivePosterSlide] = useState(0);
  const [realityReveal, setRealityReveal] = useState(50);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [, setFontLoadRevision] = useState(0);
  const [layers, setLayers] = useState(cloneDefaultPreviewLayers);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const previewStageRef = useRef(null);
  const nameFieldRef = useRef(null);
  const namePromptTimerRef = useRef(null);
  const effectiveActiveLayerId = layers.some((layer) => layer.id === activeLayerId) ? activeLayerId : layers[0]?.id;
  const activeLayer = layers.find((layer) => layer.id === effectiveActiveLayerId) || layers[0];
  const positionedLayers = layoutAutomaticWords(layers);
  const layerDesign = calculateLayerDesign(positionedLayers);
  const isShowingDefaultPreview = !text.trim();
  const combinedText = isShowingDefaultPreview ? '' : layers.filter((layer) => layer.visible).map((layer) => layer.text.trim()).filter(Boolean).join(' ');
  const characterCount = countCharacters(combinedText);
  const displayText = text.trim() || 'tulis nama anda';
  const selectedFont = fonts.find((font) => font.id === fontId);
  const selectedColor = colors.find((color) => color.id === colorId);
  const previewTokens = tokenizeNeonText(displayText);
  const wordTokens = previewTokens.filter((token) => token.type === 'word');
  const activeColorId = colorMode === 'multi' ? (wordColorIds[activeWordIndex] || colorId) : colorId;
  const getWordColor = (wordIndex) => colors.find((color) => color.id === (wordColorIds[wordIndex] || colorId)) || selectedColor;
  const previewFontSize = useFittedNeonText(previewStageRef, displayText, selectedFont.family);
  const neonMeasurement = layerDesign.layers.find((layer) => layer.id === effectiveActiveLayerId)?.measurement || null;
  const previewLetterSpacingEm = getPreviewLetterSpacingEm(fontId, targetTextHeightCm, letterSpacingCm);
  const selectedColourLabels = [...new Set(layers.filter((layer) => layer.visible && layer.text.trim()).map((layer) => colors.find((color) => color.id === layer.colour)?.label).filter(Boolean))];
  const designProductionLine = layers.some((layer) => layer.visible && layer.text.trim() && isDoubleLineFont(layer.font_id)) ? 'double' : 'single';
  const pricingWords = layerDesign.layers
    .filter((layer) => layer.visible && layer.text.trim() && layer.measurement?.complete)
    .map((layer) => ({
      productionLine: isDoubleLineFont(layer.font_id) ? 'double' : 'single',
      visualAreaCm2: layer.measurement.visualTextWidthCm * layer.measurement.visualTextHeightCm,
    }));
  const hasSingleLinePricingWord = pricingWords.some((word) => word.productionLine === 'single');
  const hasDoubleLinePricingWord = pricingWords.some((word) => word.productionLine === 'double');
  const designProductionLabel = hasSingleLinePricingWord && hasDoubleLinePricingWord
    ? 'Single-line & Double-line font'
    : hasDoubleLinePricingWord ? 'Double-line font' : 'Single-line font';
  const designUsesDoubleLineFont = layers.some((layer) => layer.visible && isDoubleLineFont(layer.font_id));
  const minimumDesignHeightCm = designUsesDoubleLineFont ? 15 : 10;
  const livePrice = characterCount && layerDesign.complete ? calculateNeonPrice({
    visualTextWidthCm: layerDesign.designWidthCm,
    backboardWidthCm: layerDesign.backboardWidthCm,
    backboardHeightCm: layerDesign.backboardHeightCm,
    productionLine: designProductionLine,
    wordPricing: pricingWords,
    backboardStyle,
  }) : null;
  const estimatedOrderPrice = livePrice?.finalPriceRm ?? null;
  const acrylicAddonPrice = characterCount && layerDesign.complete ? calculateNeonPrice({
    visualTextWidthCm: layerDesign.designWidthCm,
    backboardWidthCm: layerDesign.backboardWidthCm,
    backboardHeightCm: layerDesign.backboardHeightCm,
    productionLine: designProductionLine,
    wordPricing: pricingWords,
    backboardStyle: 'transparent',
  }).acrylicPriceRm : null;
  const requiresDesignDeposit = estimatedOrderPrice !== null && estimatedOrderPrice >= 200;
  const amountDueNow = estimatedOrderPrice === null ? null : requiresDesignDeposit ? 100 : estimatedOrderPrice;
  useEffect(() => {
    if (window.location.hash) return;
    const playground = document.getElementById('playground');
    if (!playground) return;
    window.history.replaceState(null, '', '#playground');
    window.requestAnimationFrame(() => playground.scrollIntoView({ block: 'start' }));
  }, []);
  useEffect(() => {
    if (!isTutorialOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setIsTutorialOpen(false); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isTutorialOpen]);
  useEffect(() => {
    trackMetaEventOnce('view-content:landing', 'ViewContent', {
      content_name: 'Custom Neon LED',
      content_category: 'Indoor Custom Neon LED',
      content_type: 'product',
      currency: 'MYR',
      value: 150,
    });
  }, []);
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(fonts.map((font) => {
      const face = new FontFace(font.family, `url("${font.file}") format("truetype")`);
      return face.load().then((loaded) => document.fonts.add(loaded));
    })).then(() => { if (!cancelled) setFontLoadRevision((revision) => revision + 1); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      setActivePosterSlide((current) => {
        return (current + 1) % posterSlides.length;
      });
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (activeWordIndex >= wordTokens.length) setActiveWordIndex(Math.max(0, wordTokens.length - 1));
  }, [activeWordIndex, wordTokens.length]);
  useEffect(() => {
    if (!designUsesDoubleLineFont || targetTextHeightCm >= 15) return;
    setTargetTextHeightCm(15);
    setSizePreset('medium');
    setLayers((current) => current.map((layer) => ({ ...layer, target_height_cm: 15 })));
  }, [designUsesDoubleLineFont, targetTextHeightCm]);
  useEffect(() => () => window.clearTimeout(namePromptTimerRef.current), []);
  const updateActiveLayer = (patch) => setLayers((current) => current.map((layer) => layer.id === effectiveActiveLayerId ? { ...layer, ...patch } : layer));
  const selectLayer = (id) => {
    const layer = layers.find((item) => item.id === id);
    if (!layer) return;
    setActiveLayerId(id);
    setFontId(layer.font_id); setColorId(layer.colour);
    setLetterSpacingCm(layer.letter_spacing_cm);
    setSizePreset([10, 15, 20].includes(layer.target_height_cm) ? ({ 10: 'small', 15: 'medium', 20: 'large' })[layer.target_height_cm] : 'custom');
  };
  const updateWordsFromText = (value) => {
    const words = value.split('\n').flatMap((line, lineIndex) => line.trim().split(/\s+/).filter(Boolean).map((word) => ({ word, lineIndex })));
    if (!words.length) {
      setLayers(cloneDefaultPreviewLayers());
      setActiveLayerId(null);
      setFontId('melbourne-cn'); setColorId('green'); setLetterSpacingCm(3); setTargetTextHeightCm(15); setSizePreset('custom');
      return;
    }
    const replacingDefaultPreview = !text.trim();
    if (replacingDefaultPreview) {
      setActiveLayerId(null);
      setFontId('beachfront-cn'); setColorId('pink'); setLetterSpacingCm(0); setTargetTextHeightCm(15); setSizePreset('medium');
    }
    setLayers((current) => {
      const next = words.map(({ word, lineIndex }, index) => {
        const existing = replacingDefaultPreview ? null : current[index];
        return existing ? { ...existing, text: word, line_index: lineIndex, detached: false, rotation_deg: 0, x_cm: 3, y_cm: 3 } : createTextLayer({ text: word, line_index: lineIndex, font_id: replacingDefaultPreview ? 'beachfront-cn' : fontId, colour: replacingDefaultPreview ? 'pink' : colorId, target_height_cm: 15, letter_spacing_cm: replacingDefaultPreview ? 0 : letterSpacingCm, production_mode: productionModeForFont(replacingDefaultPreview ? 'beachfront-cn' : fontId) });
      });
      return next;
    });
  };
  const chooseColor = (nextColorId) => {
    setColorId(nextColorId);
    updateActiveLayer({ colour: nextColorId });
    setColorMessage('');
    interact();
  };
  const chooseFont = (font) => {
    const minimumHeight = minimumHeightForFont(font.id);
    setFontId(font.id);
    updateActiveLayer({
      font_id: font.id,
      production_mode: productionModeForFont(font.id),
      target_height_cm: Math.max(minimumHeight, activeLayer?.target_height_cm || targetTextHeightCm),
    });
    if (targetTextHeightCm < minimumHeight) {
      setTargetTextHeightCm(minimumHeight);
      setLayers((current) => current.map((layer) => ({ ...layer, target_height_cm: minimumHeight })));
      setSizePreset(minimumHeight === 15 ? 'medium' : 'small');
    }
    setIsOtherFontsOpen(false);
    interact();
  };
  const applyFontToAllWords = () => {
    const minimumHeight = minimumHeightForFont(fontId);
    const nextHeight = Math.max(minimumHeight, targetTextHeightCm);
    setLayers((current) => current.map((layer) => ({
      ...layer,
      font_id: fontId,
      production_mode: productionModeForFont(fontId),
      target_height_cm: nextHeight,
    })));
    if (nextHeight !== targetTextHeightCm) {
      setTargetTextHeightCm(nextHeight);
      setSizePreset(nextHeight === 15 ? 'medium' : 'custom');
    }
    interact();
  };
  const checkoutUrl = characterCount ? '/checkout' : '#playground';
  const prepareCheckout = () => {
    if (!characterCount || estimatedOrderPrice === null) return;
    const tier = requiresDesignDeposit ? 'custom' : 'basic';
    window.sessionStorage.setItem(ORDER_KEY, JSON.stringify({
      reference: `YH-${Date.now().toString(36).toUpperCase()}`,
      displayReference: createDisplayReference(),
      tier,
      packageName: requiresDesignDeposit ? 'Deposit Custom Neon' : 'Custom Neon',
      price: amountDueNow,
      estimatedPrice: estimatedOrderPrice,
      text: combinedText,
      characterCount,
      fontName: selectedFont.name,
      fontFamily: selectedFont.family,
      colorLabel: selectedColor.label,
      colorValue: selectedColor.value,
      colorGlow: selectedColor.glow,
      colorMode,
      wordColors: colorMode === 'multi' ? wordTokens.map((token) => {
        const wordColor = getWordColor(token.wordIndex);
        return { wordIndex: token.wordIndex, text: token.value, colorId: wordColor.id, label: wordColor.label, value: wordColor.value, glow: wordColor.glow };
      }) : [],
      designSnapshot: {
        boardOriginX: layerDesign.boardOriginX,
        boardOriginY: layerDesign.boardOriginY,
        backboardWidthCm: layerDesign.backboardWidthCm,
        backboardHeightCm: layerDesign.backboardHeightCm,
        layers: layerDesign.layers.filter((layer) => layer.visible && layer.measurement?.complete).map((layer) => {
          const layerFont = fonts.find((font) => font.id === layer.font_id);
          const layerColor = colors.find((color) => color.id === layer.colour) || colors[0];
          return {
            id: layer.id,
            text: layer.text,
            x_cm: layer.x_cm,
            y_cm: layer.y_cm,
            rotation_deg: layer.rotation_deg || 0,
            target_height_cm: layer.target_height_cm,
            letter_spacing_cm: layer.letter_spacing_cm,
            width_cm: layer.measurement.visualTextWidthCm,
            fontName: layerFont?.name || layer.font_id,
            fontFamily: layerFont?.family || selectedFont.family,
            fontFile: layerFont?.file || '',
            colorLabel: layerColor.label,
            colorValue: layerColor.value,
            colorGlow: layerColor.glow,
          };
        }),
      },
      backgroundMode: 'night',
      tracking: getMetaAttribution(),
      sizeNote: `${Math.round(layerDesign.designWidthCm)} × ${Math.round(layerDesign.designHeightCm)} cm`,
      backboardSizeNote: `${Math.round(layerDesign.backboardWidthCm)} × ${Math.round(layerDesign.backboardHeightCm)} cm`,
    }));
  };
  const prepareCustomCheckout = () => window.sessionStorage.setItem(ORDER_KEY, JSON.stringify({
    reference: `YH-${Date.now().toString(36).toUpperCase()}`,
    displayReference: createDisplayReference(),
    tier: 'custom',
    packageName: 'Design Custom',
    price: 100,
    text: '',
    characterCount: 0,
    fontName: '',
    fontFamily: 'Manrope Variable',
    colorLabel: '',
    colorValue: '#31d7ff',
    colorGlow: '49,215,255',
    backgroundMode: 'night',
    tracking: getMetaAttribution(),
    sizeNote: 'Custom size & design',
  }));
  const interact = () => {
    trackMetaEventOnce('customize-product', 'CustomizeProduct', {
      content_name: 'Neon Playground',
      interaction_type: 'configurator',
    }, { custom: true });
  };
  const focusNameField = (event) => {
    event.preventDefault();
    const field = nameFieldRef.current;
    if (!field) return;
    window.clearTimeout(namePromptTimerRef.current);
    setShowNamePrompt(false);
    window.requestAnimationFrame(() => {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field.focus({ preventScroll: true });
      setShowNamePrompt(true);
      namePromptTimerRef.current = window.setTimeout(() => setShowNamePrompt(false), 1600);
    });
  };
  const handleMobileOrderClick = (event) => {
    if (!characterCount) {
      focusNameField(event);
      return;
    }
    prepareCheckout();
  };

  return <main id="top">
    <Header />
    <section className="hero">
      <div className="hero-slides"><img className="active" src={heroImage.src} alt={heroImage.alt} fetchPriority="high" /></div>
      <div className="hero-shade" />
      <div className="hero-content">
        <p className="eyebrow"><MapPin weight="fill" /> Untuk bisnes, ruang &amp; momen anda</p>
        <h1>Dari ruang yang suram<br />kepada suasana yang<br /><em>hidup menyala.</em></h1>
        <p className="hero-copy">Meriahkan kedai, bilik, acara atau studio dengan Custom Neon LED daripada nama dan kata-kata pilihan anda.</p>
        <a className="primary-button" href="#playground">Tulis Nama Anda Disini <ArrowDown weight="bold" /></a>
        <div className="hero-note"><Check weight="bold" /> Reka · Sahkan · Baru kami hasilkan</div>
      </div>
      <div className="day-label">Siang biasa-biasa.</div><div className="night-label">Malam semua nampak kedai anda.</div>
    </section>

    <section className="benefit-strip">
      <article><span>01</span><Eye /><div><h3>Tak lagi tenggelam</h3><p>Nama kedai lebih jelas bila malam.</p></div></article>
      <article><span>02</span><Heart /><div><h3>Nampak & dikenali</h3><p>Bina identiti yang orang mudah ingat.</p></div></article>
      <article><span>03</span><InstagramLogo /><div><h3>Jadi photo spot</h3><p>Buat pelanggan mahu rakam dan kongsi.</p></div></article>
    </section>

    <section className="playground-section" id="playground">
      <div className="section-intro light"><p className="eyebrow"><Lightning weight="fill" /> Neon Playground</p><h2>Tulis perkataan anda.<br /><em>Biar ia menyala.</em></h2><p className="playground-prompt">Tak tahu nak tulis apa? Cuba nama anda, nama kedai, barang yang dijual, tajuk podcast, hiasan bilik, kata-kata hikmah atau quote untuk kafe.</p><button type="button" className="tutorial-button" onClick={() => setIsTutorialOpen(true)}><span aria-hidden="true">▶</span> Tengok tutorial Playground</button></div>
      <div className="configurator">
        <div className="customizer-panel">
          <div className="customizer-heading"><div><span>Custom neon studio</span><h3>Reka neon anda</h3></div><small>Ukuran sebenar daripada data font</small></div>

          <section className="config-step">
            <div className="config-step-title"><span>01</span><label htmlFor="custom-neon-text">Enter Your Text</label></div>
            <textarea ref={nameFieldRef} id="custom-neon-text" className={showNamePrompt ? 'name-attention' : ''} value={text} maxLength={240} rows={3} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(event) => { const value = limitNeonInput(event.target.value); setText(value); updateWordsFromText(value); interact(); }} placeholder="Contoh: pakar neon" />
            <div className="config-meta"><small>Tekan mana-mana perkataan di preview untuk ubah font atau warna perkataan itu.</small></div>
          </section>

          <section className="config-step">
            <div className="config-step-title"><span>02</span><strong>Select Font</strong></div>
            <div className="featured-fonts" role="radiogroup" aria-label="Pilihan font utama">
              {featuredFonts.map((font) => <button key={font.id} type="button" className={fontId === font.id ? 'selected' : ''} style={{ fontFamily: font.family }} onClick={() => chooseFont(font)} role="radio" aria-checked={fontId === font.id}>{font.name}</button>)}
            </div>
            <div className="font-dropdown customizer-font-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsOtherFontsOpen(false); }}>
              <button type="button" className="font-dropdown-trigger" aria-expanded={isOtherFontsOpen} aria-controls="custom-font-options" onClick={() => setIsOtherFontsOpen((current) => !current)} style={{ fontFamily: otherFonts.some((font) => font.id === fontId) ? selectedFont.family : undefined }}><span>{otherFonts.some((font) => font.id === fontId) ? selectedFont.name : `Lihat ${otherFonts.length} font lagi`}</span><i aria-hidden="true">⌄</i></button>
              {isOtherFontsOpen && <div className="font-dropdown-list" id="custom-font-options" role="listbox" aria-label="Pilihan font lain">{otherFonts.map((font) => <button type="button" key={font.id} role="option" aria-selected={fontId === font.id} className={fontId === font.id ? 'selected' : ''} style={{ fontFamily: font.family }} onClick={() => chooseFont(font)}>{font.name}</button>)}</div>}
            </div>
            <button type="button" className="apply-font-all" disabled={!combinedText} onClick={applyFontToAllWords}>Gunakan font ini untuk semua perkataan</button>
          </section>

          <section className="config-step">
            <div className="config-step-title"><span>03</span><strong>Select Color</strong></div>
            <p className="selected-word-note">Warna untuk: <strong>{activeLayer?.text || 'perkataan dipilih'}</strong></p>
            <div className="color-options" role="radiogroup">{colors.map((color) => <button type="button" key={color.id} className={colorId === color.id ? 'selected' : ''} style={{ '--swatch': color.value }} onClick={() => chooseColor(color.id)} aria-label={color.label} role="radio" aria-checked={colorId === color.id} />)}</div>
          </section>

          <section className="config-step">
            <div className="config-step-title"><span>04</span><strong>Select Size</strong></div>
            <div className="size-presets" role="radiogroup" aria-label="Preset tinggi tulisan">{[
              ['small', 'Small', 10], ['medium', 'Medium', 15], ['large', 'Large', 20], ['custom', 'Custom', null],
            ].map(([id, label, height]) => {
              const unavailableSmall = id === 'small' && designUsesDoubleLineFont;
              return <button type="button" key={id} disabled={unavailableSmall} role="radio" aria-checked={sizePreset === id} className={sizePreset === id ? 'selected' : ''} onClick={() => { if (unavailableSmall) return; setSizePreset(id); if (height) { setTargetTextHeightCm(height); setLayers((current) => current.map((layer) => ({ ...layer, target_height_cm: height }))); } interact(); }}><strong>{label}</strong><small>{unavailableSmall ? 'Tulisan ini tiada untuk Small' : height ? `${height} cm` : `${minimumDesignHeightCm}–50 cm`}</small></button>;
            })}</div>
            {sizePreset === 'custom' && <div className="measurement-control custom-height-control"><div><strong>{Math.max(minimumDesignHeightCm, targetTextHeightCm)} cm</strong><small>Target text height semua perkataan</small></div><input aria-label="Custom target text height" type="range" min={minimumDesignHeightCm} max="50" step="1" value={Math.max(minimumDesignHeightCm, targetTextHeightCm)} onChange={(event) => { const height = Number(event.target.value); setTargetTextHeightCm(height); setLayers((current) => current.map((layer) => ({ ...layer, target_height_cm: height }))); interact(); }} /></div>}
          </section>

          <section className="config-step">
            <div className="config-step-title"><span>05</span><label htmlFor="custom-letter-spacing">Letter Spacing</label></div>
            <div className="measurement-control"><div><strong>{letterSpacingCm > 0 ? '+' : ''}{letterSpacingCm.toFixed(1)} cm</strong><small>Digunakan pada semua perkataan</small></div><input id="custom-letter-spacing" type="range" min="-0.5" max="3" step="0.1" value={letterSpacingCm} onChange={(event) => { const spacing = Number(event.target.value); setLetterSpacingCm(spacing); setLayers((current) => current.map((layer) => ({ ...layer, letter_spacing_cm: spacing }))); interact(); }} /></div>
          </section>

          <section className="config-step">
            <div className="config-step-title"><span>06</span><strong>Backboard Style</strong></div>
            <div className="choice-cards backboard-choices" role="radiogroup"><button type="button" className={backboardStyle === 'transparent' ? 'selected' : ''} role="radio" aria-checked={backboardStyle === 'transparent'} onClick={() => setBackboardStyle('transparent')}><i className="acrylic-sample transparent" /><span><strong>Transparent acrylic</strong><small>{acrylicAddonPrice !== null ? `Tambahan ${formatRm(acrylicAddonPrice)}` : 'Tambahan dikira selepas isi teks'}</small></span></button><button type="button" className={backboardStyle === 'black' ? 'selected' : ''} role="radio" aria-checked={backboardStyle === 'black'} onClick={() => setBackboardStyle('black')}><i className="acrylic-sample black" /><span><strong>Black PVC foamboard</strong><small>Tiada caj tambahan</small></span></button></div>
          </section>

          <section className="config-step price-step">
            <div className="config-step-title"><span>07</span><strong>Harga Anggaran</strong></div>
            {livePrice && layerDesign.complete ? <>
              <dl className="price-breakdown"><div><dt>Saiz design gabungan</dt><dd>{Math.round(layerDesign.designWidthCm)} × {Math.round(layerDesign.designHeightCm)} cm</dd></div><div><dt>Saiz acrylic/backboard</dt><dd>{Math.round(layerDesign.backboardWidthCm)} × {Math.round(layerDesign.backboardHeightCm)} cm</dd></div><div><dt>Jenis font</dt><dd>{designProductionLabel}</dd></div><div><dt>Backboard</dt><dd>{backboardStyle === 'black' ? 'Black PVC foamboard' : 'Transparent acrylic'}</dd></div><div><dt>Warna</dt><dd>{selectedColourLabels.join(', ')}</dd></div></dl>
              <div className="estimated-total"><span>Harga anggaran</span><strong>{formatRm(livePrice.finalPriceRm)}</strong></div>
            </> : <div className="price-placeholder"><strong>Masukkan teks untuk kira harga</strong><small>Harga berubah mengikut bentuk glyph, saiz dan pilihan anda.</small></div>}
            <p className="price-disclaimer">Harga akhir tertakluk kepada semakan design.</p>
          </section>
        </div>
        <div className="controls-panel">
          <div className="field-head"><span>01</span><label htmlFor="shop-name">Taip nama kedai anda</label></div>
          <textarea id="shop-name" className={showNamePrompt ? 'name-attention' : ''} value={text} maxLength={240} rows={4} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(e) => { setText(limitNeonInput(e.target.value)); interact(); }} placeholder="Masukkan nama anda" />
          <p className="lowercase-tip">Saranan: Huruf kecil semua lebih digalakkan untuk tulisan bersambung supaya nampak lebih kemas dan profesional.</p>
          <div className={`count-row ${characterCount > 15 ? 'over' : ''}`}><span>{characterCount} huruf</span><small>Maks. 6 baris · 30 huruf/perkataan</small></div>
          <div className="field-head"><span>02</span><label htmlFor="other-font-select">Pilih font</label></div>
          <div className="featured-fonts" role="radiogroup" aria-label="Pilihan font utama">
            {featuredFonts.map((font) => <button
              key={font.id}
              type="button"
              className={fontId === font.id ? 'selected' : ''}
              style={{ fontFamily: font.family }}
              onClick={() => { setFontId(font.id); setIsOtherFontsOpen(false); interact(); }}
              role="radio"
              aria-checked={fontId === font.id}
            >{font.name}</button>)}
          </div>
          <div className="other-font-field">
            <span className="other-font-label" id="other-font-label">Other Font · {otherFonts.length} pilihan lagi</span>
            <div className="font-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsOtherFontsOpen(false); }}>
              <button
                type="button"
                className="font-dropdown-trigger"
                aria-labelledby="other-font-label other-font-trigger-text"
                aria-expanded={isOtherFontsOpen}
                aria-controls="other-font-options"
                onClick={() => setIsOtherFontsOpen((current) => !current)}
                style={{ fontFamily: otherFonts.some((font) => font.id === fontId) ? selectedFont.family : undefined }}
              ><span id="other-font-trigger-text">{otherFonts.some((font) => font.id === fontId) ? selectedFont.name : 'Pilih font lain'}</span><i aria-hidden="true">⌄</i></button>
              {isOtherFontsOpen && <div className="font-dropdown-list" id="other-font-options" role="listbox" aria-label="Pilihan font lain">
                {otherFonts.map((font) => <button
                  type="button"
                  key={font.id}
                  role="option"
                  aria-selected={fontId === font.id}
                  className={fontId === font.id ? 'selected' : ''}
                  style={{ fontFamily: font.family }}
                  onClick={() => { setFontId(font.id); setIsOtherFontsOpen(false); interact(); }}
                >{font.name}</button>)}
              </div>}
            </div>
          </div>
          <div className="field-head"><span>03</span><label htmlFor="text-height">Tinggi tulisan</label></div>
          <div className="measurement-control">
            <div><strong>{targetTextHeightCm} cm</strong><small>Tinggi rujukan font</small></div>
            <input id="text-height" type="range" min="10" max="50" step="1" value={Math.max(10, targetTextHeightCm)} onChange={(event) => { setTargetTextHeightCm(Number(event.target.value)); interact(); }} />
          </div>
          <div className="field-head"><span>04</span><label htmlFor="letter-spacing">Letter spacing</label></div>
          <div className="measurement-control">
            <div><strong>{letterSpacingCm > 0 ? '+' : ''}{letterSpacingCm.toFixed(1)} cm</strong><small>Tambahan antara aksara</small></div>
            <input id="letter-spacing" type="range" min="-0.5" max="3" step="0.1" value={letterSpacingCm} onChange={(event) => { setLetterSpacingCm(Number(event.target.value)); interact(); }} />
          </div>
          <div className="field-head"><span>05</span><label>Pilih warna</label></div>
          <div className="color-mode-tabs" aria-label="Cara pemilihan warna">
            <button type="button" className={colorMode === 'single' ? 'active' : ''} onClick={() => { setColorMode('single'); setColorMessage(''); interact(); }}>Satu warna</button>
            <button type="button" className={colorMode === 'multi' ? 'active' : ''} onClick={() => { setColorMode('multi'); setActiveWordIndex(0); setColorMessage(''); interact(); }}>Ikut perkataan</button>
          </div>
          {colorMode === 'multi' && <div className="word-color-picker">
            <small>Tekan perkataan, kemudian pilih warna · maks. 3 warna</small>
            <div>{wordTokens.map((token) => {
              const wordColor = getWordColor(token.wordIndex);
              return <button type="button" key={`${token.value}-${token.wordIndex}`} className={activeWordIndex === token.wordIndex ? 'active' : ''} onClick={() => { setActiveWordIndex(token.wordIndex); setColorMessage(''); }} style={{ '--word-color': wordColor.value }}><i />{token.value}</button>;
            })}</div>
          </div>}
          <div className="color-options" role="radiogroup">{colors.map((color) => <button key={color.id} className={activeColorId === color.id ? 'selected' : ''} style={{ '--swatch': color.value }} onClick={() => chooseColor(color.id)} aria-label={colorMode === 'multi' ? `${color.label} untuk ${wordTokens[activeWordIndex]?.value || 'perkataan'}` : color.label} role="radio" aria-checked={activeColorId === color.id} />)}</div>
          {colorMessage && <p className="color-message" role="status">{colorMessage}</p>}
          <div className="size-results" aria-live="polite">
            <div className="size-results-head"><span>Ukuran design</span><small>Sumber: {measurementSource}</small></div>
            {neonMeasurement ? <>
              <div className="size-grid">
                <div><span>Tulisan visual</span><strong>{neonMeasurement.complete ? `${neonMeasurement.visualTextWidthCm} × ${neonMeasurement.visualTextHeightCm} cm` : 'Semakan diperlukan'}</strong></div>
                <div><span>Acrylic / backboard</span><strong>{neonMeasurement.complete ? `${Math.round(neonMeasurement.backboardWidthCm)} × ${Math.round(neonMeasurement.backboardHeightCm)} cm` : 'Semakan diperlukan'}</strong></div>
              </div>
              <div className="dfm-status">
                <strong>Semakan neon</strong>
                {neonMeasurement.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                <p>Tube neon flex: {neonMeasurement.tubeWidthMm} mm.</p>
                <p>{neonMeasurement.tubeLengthStatus}.</p>
              </div>
            </> : <p className="size-empty">Masukkan teks untuk melihat ukuran sebenar.</p>}
          </div>
        </div>
        <div className="preview-stage" ref={previewStageRef}>
          <img className="preview-wall" src="/assets/configurator-wall-branded.png" alt="Preview neon pada dinding sebelum ditempah" />
          <div className="layer-canvas-wrap"><NeonLayerCanvas design={layerDesign} activeLayerId={activeLayerId} fonts={fonts} colors={colors} previewScaleHeightCm={targetTextHeightCm} onSelect={selectLayer} onDeselect={() => setActiveLayerId(null)} onMove={(id, x, y) => setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, x_cm: Number(x.toFixed(2)), y_cm: Number(y.toFixed(2)), detached: true } : layer))} onResize={(id, height, x, y) => setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, target_height_cm: height, x_cm: x, y_cm: y, detached: true } : layer))} onRotate={(id, rotation) => setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, rotation_deg: rotation, detached: true } : layer))} /></div>
          <a className="preview-result-jump" href="#playground-results" aria-label="Lihat contoh design Playground dan hasil neon sebenar pelanggan" onClick={(event) => { event.preventDefault(); document.getElementById('playground-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); window.history.replaceState(null, '', '#playground-results'); }}>
            <img src="/assets/playground-real/adys-b.jpg" alt="Hasil neon sebenar pelanggan Ady's Resort" />
            <span><small>Contoh pelanggan</small><strong>Lihat hasil sebenar</strong></span>
            <span className="preview-result-arrow" aria-hidden="true">↓</span>
          </a>
          {!combinedText && !isShowingDefaultPreview && <span className="preview-hint">Taip teks untuk mula</span>}
        </div>
      </div>
      <div className="live-summary" aria-live="polite">
        <div><span>Pilihan anda</span><strong>{characterCount ? 'Custom Neon' : 'Belum dipilih'}</strong></div>
        <div className="summary-price"><span>Harga anggaran</span><strong>{estimatedOrderPrice !== null ? formatRm(estimatedOrderPrice) : '—'}</strong>{requiresDesignDeposit && <small>Bayar deposit RM100 sekarang · Kami hubungi untuk pengesahan</small>}</div>
        <a className={`order-button ${!characterCount ? 'disabled' : ''}`} href={checkoutUrl} onClick={prepareCheckout}><ShoppingBagOpen weight="fill" /> Tempah Sekarang</a>
      </div>
      <a className="testimonial-jump" href="#testimoni">Lihat Apa Kata Pelanggan Kami <ArrowDown weight="bold" /></a>
    </section>

    <section className="playground-reality" id="playground-results" aria-labelledby="playground-reality-title">
      <div className="section-intro light">
        <p className="eyebrow">Daripada preview kepada neon sebenar</p>
        <h2 id="playground-reality-title">Tarik untuk lihat<br /><em>hasil yang dah siap.</em></h2>
        <p>Setiap pasangan di bawah ialah design Playground dan hasil neon sebenar daripada tempahan yang sama.</p>
      </div>
      <div className="comparison-stage" style={{ '--reality-reveal': `${realityReveal}%` }}>
        <div className="comparison-side-label preview-label">Playground</div>
        <div className="comparison-side-label real-label">Hasil sebenar</div>
        <div className="comparison-collage preview-collage">
          {playgroundRealityPairs.map((item) => <figure key={`${item.slug}-preview`} className={item.className}><img src={item.preview} alt={`Preview Playground untuk ${item.title}`} loading="lazy" /><figcaption>{item.title}</figcaption></figure>)}
        </div>
        <div className="comparison-collage real-collage" aria-hidden="true">
          {playgroundRealityPairs.map((item) => <figure key={`${item.slug}-real`} className={item.className}><img src={item.real} alt="" loading="lazy" style={item.realObjectPosition ? { objectPosition: item.realObjectPosition } : undefined} /><figcaption>{item.title}</figcaption></figure>)}
        </div>
        <div className="comparison-divider" aria-hidden="true"><span /></div>
        <input className="comparison-range" type="range" min="0" max="100" value={realityReveal} onChange={(event) => setRealityReveal(Number(event.target.value))} aria-label="Tarik untuk bandingkan design Playground dengan hasil sebenar" />
      </div>
      <p className="comparison-hint">Sentuh dan tarik garis untuk lihat perubahan.</p>
    </section>

    <section className="pricing" id="harga">
      <div className="section-intro"><p className="eyebrow"><Palette weight="fill" /> Perlukan rekaan khas?</p><h2>Ada logo sendiri<br /><em>atau custom size?</em></h2><p>Jika rekaan anda bukan sekadar tulisan dalam configurator, pilih pakej ini untuk logo, simbol, bentuk atau ukuran khas.</p></div>
      <div className="price-list">
        <article className="custom-package"><span className="package-number">01</span><div><p>Untuk logo sendiri, simbol, bentuk atau ukuran khas</p><h3>Design Custom</h3></div><strong>RM100</strong><a href="/checkout" onClick={prepareCustomCheckout}>Pilih pakej ini <ArrowRight /></a></article>
      </div><div className="pricing-clarity"><p><strong>Bayaran RM100:</strong> sebagai tanda komitmen untuk memulakan rekaan custom. Selepas bayaran, kami akan menghubungi anda untuk mendapatkan fail logo atau maklumat saiz dan mengesahkan harga akhir. Bayaran ini akan ditolak daripada harga akhir.</p></div>
    </section>

    <section className="inspiration" id="inspirasi">
      <div className="section-intro light"><h2>Hasil customer yang<br /><em>Custom Logo.</em></h2></div>
      <div className="customer-poster-shell">
        <figure className="poster-slideshow rotating-customer-poster" aria-label="Poster berpusing hasil neon sebenar" aria-live="polite">
          {posterSlides.map((slide, index) => <img key={slide.src} className={activePosterSlide === index ? 'active' : ''} src={slide.src} alt={slide.alt} aria-hidden={activePosterSlide !== index} loading="lazy" />)}
          <figcaption><span>Hasil sebenar</span><strong>{String(activePosterSlide + 1).padStart(2, '0')} / {String(posterSlides.length).padStart(2, '0')}</strong><div><button type="button" onClick={() => setActivePosterSlide((activePosterSlide - 1 + posterSlides.length) % posterSlides.length)} aria-label="Poster sebelumnya">←</button><button type="button" onClick={() => setActivePosterSlide((activePosterSlide + 1) % posterSlides.length)} aria-label="Poster seterusnya">→</button></div></figcaption>
        </figure>
      </div>
    </section>

    <section className="transformation-section">
      <div className="section-intro"><p className="eyebrow">Sebelum dan selepas</p><h2>Dari lampu atas meja<br /><em>ke tarikan dalam kedai.</em></h2><p>Dua pemasangan sebenar yang menunjukkan bagaimana neon berubah apabila masuk ke ruang pelanggan.</p></div>
      <div className="transformation-grid"><figure><img src="/assets/media/before-after-pizza.webp" alt="Sebelum dan selepas neon 480 Pizza dipasang" loading="lazy" /><figcaption><span>480 Pizza</span><strong>Nampak dari luar premis</strong></figcaption></figure><figure><img src="/assets/media/before-after-amir.webp" alt="Sebelum dan selepas neon Amir Tomyam dipasang" loading="lazy" /><figcaption><span>Amir Tomyam</span><strong>Jadi titik fokus ruang makan</strong></figcaption></figure></div>
    </section>

    <section className="testimonials-section" id="testimoni" aria-label="Testimoni pelanggan sebenar">
      <div className="testimonial-intro"><p className="eyebrow">Screenshot sebenar pelanggan</p><h2>Apa pelanggan<br /><em>cakap lepas pasang.</em></h2><p>Screenshot WhatsApp asal digunakan tanpa mereka semula conversation. Klik nama untuk lihat testimoni seterusnya.</p><div className="testimonial-tabs" role="tablist">{testimonials.map((item, index) => <button key={item.business} className={activeTestimonial === index ? 'active' : ''} onClick={() => setActiveTestimonial(index)} role="tab" aria-selected={activeTestimonial === index}>{item.business}</button>)}</div></div>
      <figure className="testimonial-proof" aria-live="polite"><div className="testimonial-proof-head"><div className="chat-avatar">{testimonials[activeTestimonial].business.charAt(0)}</div><div><strong>{testimonials[activeTestimonial].business}</strong><span>{testimonials[activeTestimonial].label}</span></div><i>Gambar asal</i></div><div className="testimonial-proof-image"><img key={testimonials[activeTestimonial].src} src={testimonials[activeTestimonial].src} alt={testimonials[activeTestimonial].alt} /></div><figcaption className="chat-foot"><button onClick={() => setActiveTestimonial((activeTestimonial - 1 + testimonials.length) % testimonials.length)} aria-label="Testimoni sebelumnya">←</button><span>{String(activeTestimonial + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}</span><button onClick={() => setActiveTestimonial((activeTestimonial + 1) % testimonials.length)} aria-label="Testimoni seterusnya">→</button></figcaption></figure>
    </section>

    <section className="making-section" id="proses-pembuatan">
      <div className="making-heading"><div><p className="eyebrow">Di sebalik neon</p><h2>Macam mana kami<br /><em>jadikan ia lampu.</em></h2></div><p>Daripada tapak PVC yang dipotong mengikut design, LED dipasang satu persatu sebelum setiap neon diuji dan dinyalakan.</p></div>
      <figure className="making-video-frame">
        <video autoPlay muted loop playsInline preload="metadata" poster="/assets/proses-neon/proses-pembuatan-neon-poster.jpg" aria-label="Video proses menghasilkan custom neon LED">
          <source src="/assets/proses-neon/proses-pembuatan-neon.mp4" type="video/mp4" />
          Browser anda tidak menyokong video HTML5.
        </video>
      </figure>
    </section>

    <section className="faq" id="faq"><div className="section-intro light"><p className="eyebrow">Soalan biasa</p><h2>Sebelum neon anda<br /><em>mula menyala.</em></h2></div><div className="faq-list"><details><summary>Bagaimana harga tulisan dalam configurator dikira?</summary><p>Harga anggaran berubah mengikut saiz keseluruhan rekaan, font, warna, bahan backboard dan pilihan lain yang dibuat dalam configurator.</p></details><details><summary>Bilakah saya perlu pilih Design Custom RM100?</summary><p>Pilih Design Custom jika anda mempunyai logo sendiri atau memerlukan simbol, bentuk dan ukuran khas yang tidak boleh dibina terus dalam configurator. Bayaran RM100 akan ditolak daripada harga akhir.</p></details><details><summary>Apa berlaku selepas saya pilih Design Custom?</summary><p>Selepas bayaran dibuat, kami akan menghubungi anda untuk mendapatkan fail logo atau maklumat rekaan, kemudian mengesahkan ukuran dan harga akhir sebelum pengeluaran.</p></details><details><summary>Boleh digunakan di luar kedai?</summary><p>Tawaran standard ialah untuk indoor. Permintaan outdoor memerlukan semakan bahan dan quotation manual melalui WhatsApp.</p></details></div></section>
    <footer><div className="brand footer-brand"><span>PAKAR LED &amp; NEON</span><i>BY YH</i></div><p>Jangan biar kedai anda tenggelam bila malam.</p><a href="#playground">Cuba nama kedai anda <ArrowRight /></a></footer>
    {isTutorialOpen && <div className="tutorial-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsTutorialOpen(false); }}>
      <section className="tutorial-modal" role="dialog" aria-modal="true" aria-labelledby="tutorial-modal-title">
        <div className="tutorial-modal-head"><div><span>NEON PLAYGROUND</span><h2 id="tutorial-modal-title">Cara guna Playground</h2></div><button type="button" className="tutorial-close" onClick={() => setIsTutorialOpen(false)} aria-label="Tutup tutorial">×</button></div>
        <video controls autoPlay playsInline preload="metadata"><source src="/assets/playground-tutorial.mp4" type="video/mp4" />Browser anda tidak menyokong video HTML5.</video>
      </section>
    </div>}
    <div className={`mobile-sticky ${characterCount ? 'has-design' : ''}`}><div><small>{estimatedOrderPrice !== null ? `Harga anggaran ${formatRm(estimatedOrderPrice)}` : 'Mulakan tempahan'}</small><strong>{characterCount ? (requiresDesignDeposit ? 'Deposit RM100' : `Bayar ${formatRm(amountDueNow)}`) : 'Masukkan nama anda'}</strong></div><a className={!characterCount ? 'needs-name' : ''} href={characterCount ? checkoutUrl : '#custom-neon-text'} onClick={handleMobileOrderClick}><ShoppingBagOpen weight="fill" /> Tempah Sekarang</a></div>
  </main>;
}
