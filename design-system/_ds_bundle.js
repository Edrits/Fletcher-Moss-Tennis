/* @ds-bundle: {"format":4,"namespace":"FletcherMossDesignSystem_7e4605","components":[{"name":"Badge","sourcePath":"components/core/badge/Badge.jsx"},{"name":"Button","sourcePath":"components/core/button/Button.jsx"},{"name":"Card","sourcePath":"components/core/card/Card.jsx"},{"name":"InfoCard","sourcePath":"components/core/card/Card.jsx"},{"name":"NoticeCard","sourcePath":"components/core/card/Card.jsx"},{"name":"Icon","sourcePath":"components/core/icon/Icon.jsx"},{"name":"SectionHeading","sourcePath":"components/core/section-heading/SectionHeading.jsx"},{"name":"Banner","sourcePath":"components/feedback/banner/Banner.jsx"},{"name":"Select","sourcePath":"components/forms/select/Select.jsx"},{"name":"TextField","sourcePath":"components/forms/text-field/TextField.jsx"},{"name":"Footer","sourcePath":"components/navigation/footer/Footer.jsx"},{"name":"TopNav","sourcePath":"components/navigation/topnav/TopNav.jsx"}],"sourceHashes":{"components/core/badge/Badge.jsx":"b659006ea5cc","components/core/button/Button.jsx":"89b0848dc299","components/core/card/Card.jsx":"7f4fe613ab48","components/core/icon/Icon.jsx":"21768db1a9b3","components/core/section-heading/SectionHeading.jsx":"7ea89a56a8d9","components/feedback/banner/Banner.jsx":"58b09227943c","components/forms/select/Select.jsx":"16bb8ecf37fa","components/forms/text-field/TextField.jsx":"878f36dd5a1a","components/navigation/footer/Footer.jsx":"e4be32ea68dc","components/navigation/topnav/TopNav.jsx":"f950583e08b5","ui_kits/site/Home.jsx":"170e00d25727","ui_kits/site/League.jsx":"b77ab0b237ef","ui_kits/site/Pairings.jsx":"bf324bec20f1"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.FletcherMossDesignSystem_7e4605 = window.FletcherMossDesignSystem_7e4605 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/badge/Badge.jsx
try { (() => {
const tones = {
  neutral: {
    background: 'var(--paper-100)',
    color: 'var(--ink-700)',
    border: '1px solid var(--border-subtle)'
  },
  active: {
    background: 'var(--green-900)',
    color: 'var(--text-on-dark)'
  },
  sub: {
    background: 'var(--color-sub-bg)',
    color: 'var(--color-sub)',
    border: '1px solid #eccc9a'
  },
  success: {
    background: 'var(--green-50)',
    color: 'var(--green-800)',
    border: '1px solid var(--green-200)'
  },
  weather: {
    background: 'rgba(255,255,255,.2)',
    color: 'var(--text-on-dark)',
    border: '1px solid rgba(255,255,255,.4)',
    backdropFilter: 'blur(var(--blur-glass))'
  }
};
function Badge({
  children,
  tone = 'neutral',
  icon,
  style
}) {
  return React.createElement('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      padding: '6px 14px',
      borderRadius: 'var(--radius-pill)',
      ...tones[tone],
      ...style
    }
  }, icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/badge/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/button/Button.jsx
try { (() => {
const base = {
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'transform var(--duration-fast) var(--ease-standard),box-shadow var(--duration-fast) var(--ease-standard),background var(--duration-fast) var(--ease-standard)',
  textDecoration: 'none'
};
const sizes = {
  sm: {
    padding: '8px 16px',
    fontSize: 'var(--text-xs)'
  },
  md: {
    padding: '12px 24px',
    fontSize: 'var(--text-sm)'
  },
  lg: {
    padding: '15px 30px',
    fontSize: 'var(--text-base)'
  }
};
const variants = {
  primary: {
    background: 'var(--green-600)',
    color: 'var(--text-on-dark)',
    boxShadow: 'var(--shadow-sm)'
  },
  secondary: {
    background: 'transparent',
    color: 'var(--green-900)',
    border: '1.5px solid var(--green-900)'
  },
  inverse: {
    background: 'rgba(250,249,245,.96)',
    color: 'var(--green-900)',
    boxShadow: 'var(--shadow-sm)'
  },
  whatsapp: {
    background: 'var(--color-whatsapp)',
    color: 'var(--text-on-dark)',
    boxShadow: 'var(--shadow-sm)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--green-700)',
    padding: 0
  }
};
const hoverBg = {
  primary: 'var(--green-700)',
  whatsapp: '#1f7d59',
  inverse: '#fff',
  secondary: 'var(--green-900)'
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  as: Tag = 'button',
  icon,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const v = variants[variant] || variants.primary;
  const s = variant === 'ghost' ? {} : sizes[size];
  const hoverStyle = hover ? variant === 'secondary' ? {
    background: 'var(--green-900)',
    color: 'var(--text-on-dark)'
  } : variant === 'ghost' ? {
    textDecoration: 'underline'
  } : {
    background: hoverBg[variant],
    transform: 'translateY(-2px)',
    boxShadow: 'var(--shadow-md)'
  } : {};
  return React.createElement(Tag, {
    ...rest,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...s,
      ...v,
      ...hoverStyle,
      ...style
    }
  }, icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/button/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/card/Card.jsx
try { (() => {
const cardBase = {
  background: 'var(--surface-card)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
  transition: 'transform var(--duration-base) var(--ease-standard),box-shadow var(--duration-base) var(--ease-standard)'
};
function Card({
  children,
  hoverable = true,
  padding = 24,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return React.createElement('div', {
    ...rest,
    onMouseEnter: () => hoverable && setHover(true),
    onMouseLeave: () => hoverable && setHover(false),
    style: {
      ...cardBase,
      padding,
      transform: hover ? 'translateY(-3px)' : 'none',
      boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      ...style
    }
  }, children);
}
function InfoCard({
  title,
  icon,
  children,
  style
}) {
  return React.createElement(Card, {
    padding: 26,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      ...style
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, icon, React.createElement('h3', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 'var(--text-md)',
      color: 'var(--text-heading)',
      margin: 0
    }
  }, title)), React.createElement('p', {
    style: {
      margin: 0,
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-normal)'
    }
  }, children));
}
function NoticeCard({
  children,
  empty = false
}) {
  return React.createElement('div', {
    style: {
      background: 'var(--gradient-gold)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 28,
      boxShadow: 'var(--shadow-sm)'
    }
  }, React.createElement('div', {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-md)',
      padding: 24,
      minHeight: 120,
      whiteSpace: 'pre-wrap',
      fontSize: 'var(--text-base)',
      lineHeight: 'var(--leading-normal)',
      color: empty ? 'var(--brown-600)' : 'var(--text-body)',
      fontStyle: empty ? 'italic' : 'normal',
      textAlign: empty ? 'center' : 'left',
      boxShadow: 'var(--shadow-inset)'
    }
  }, children));
}
Object.assign(__ds_scope, { Card, InfoCard, NoticeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/card/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/icon/Icon.jsx
try { (() => {
const {
  useEffect,
  useRef
} = React;
/**
 * Icon wraps the Lucide icon set (CDN substitution — the source codebase has
 * no icon font/SVG set, only emoji). Requires the Lucide UMD script to be
 * loaded on the page: <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
 */
function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  color = 'currentColor',
  style
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide && ref.current) {
      ref.current.innerHTML = '';
      window.lucide.createIcons({
        icons: window.lucide.icons,
        nameAttr: 'data-lucide'
      });
    }
  }, [name]);
  return React.createElement('i', {
    ref,
    'data-lucide': name,
    style: {
      width: size,
      height: size,
      display: 'inline-flex',
      color,
      strokeWidth,
      ...style
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/section-heading/SectionHeading.jsx
try { (() => {
function SectionHeading({
  kicker,
  title,
  align = 'center',
  inverse = false,
  style
}) {
  return React.createElement('div', {
    style: {
      textAlign: align,
      marginBottom: 'var(--space-8)',
      ...style
    }
  }, kicker && React.createElement('div', {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-wider)',
      textTransform: 'uppercase',
      color: inverse ? 'var(--text-on-dark-muted)' : 'var(--green-600)',
      marginBottom: 10
    }
  }, kicker), React.createElement('h2', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 'var(--text-2xl)',
      lineHeight: 'var(--leading-tight)',
      color: inverse ? 'var(--text-on-dark)' : 'var(--text-heading)',
      margin: 0
    }
  }, title));
}
Object.assign(__ds_scope, { SectionHeading });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/section-heading/SectionHeading.jsx", error: String((e && e.message) || e) }); }

// components/feedback/banner/Banner.jsx
try { (() => {
const tones = {
  alert: {
    background: 'var(--color-alert-bg)',
    color: '#5c2418',
    border: '1px solid #e3bcb1'
  },
  notice: {
    background: 'var(--gold-100)',
    color: 'var(--brown-800)',
    border: '1px solid var(--gold-300)'
  }
};
function Banner({
  tone = 'alert',
  icon,
  children,
  onClose
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      justifyContent: 'center',
      padding: '14px 20px',
      fontWeight: 600,
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-body)',
      borderRadius: 'var(--radius-sm)',
      ...tones[tone]
    }
  }, icon, React.createElement('span', null, children), onClose && React.createElement('button', {
    onClick: onClose,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'inherit',
      marginLeft: 8,
      display: 'flex'
    }
  }, '✕'));
}
Object.assign(__ds_scope, { Banner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/banner/Banner.jsx", error: String((e && e.message) || e) }); }

// components/forms/select/Select.jsx
try { (() => {
function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder
}) {
  return React.createElement('label', {
    style: {
      display: 'block',
      marginBottom: 'var(--space-4)'
    }
  }, label && React.createElement('span', {
    style: {
      display: 'block',
      fontWeight: 600,
      fontSize: 'var(--text-xs)',
      color: 'var(--text-heading)',
      marginBottom: 6,
      fontFamily: 'var(--font-display)'
    }
  }, label), React.createElement('select', {
    value,
    onChange,
    style: {
      width: '100%',
      padding: '12px 14px',
      border: '1.5px solid var(--border-strong)',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-body)',
      color: 'var(--text-body)',
      background: 'var(--paper-0)',
      outline: 'none'
    }
  }, placeholder && React.createElement('option', {
    value: ''
  }, placeholder), options.map(o => React.createElement('option', {
    key: o.value,
    value: o.value
  }, o.label))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/select/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/text-field/TextField.jsx
try { (() => {
const fieldStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-body)',
  color: 'var(--text-body)',
  background: 'var(--paper-0)',
  transition: 'border-color var(--duration-fast) var(--ease-standard)',
  outline: 'none'
};
function TextField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  multiline,
  style
}) {
  const Tag = multiline ? 'textarea' : 'input';
  const [focus, setFocus] = React.useState(false);
  return React.createElement('label', {
    style: {
      display: 'block',
      marginBottom: 'var(--space-4)'
    }
  }, label && React.createElement('span', {
    style: {
      display: 'block',
      fontWeight: 600,
      fontSize: 'var(--text-xs)',
      color: 'var(--text-heading)',
      marginBottom: 6,
      fontFamily: 'var(--font-display)'
    }
  }, label), React.createElement(Tag, {
    type: multiline ? undefined : type,
    placeholder,
    value,
    onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      ...fieldStyle,
      minHeight: multiline ? 140 : undefined,
      resize: multiline ? 'vertical' : undefined,
      borderColor: focus ? 'var(--color-focus)' : 'var(--border-strong)',
      ...style
    }
  }));
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/text-field/TextField.jsx", error: String((e && e.message) || e) }); }

// components/navigation/footer/Footer.jsx
try { (() => {
function Footer({
  logo,
  partnerLogo,
  name,
  address,
  sessions
}) {
  return React.createElement('footer', {
    style: {
      background: 'var(--gradient-band-green)',
      color: 'var(--text-on-dark)',
      textAlign: 'center',
      padding: '56px 20px'
    }
  }, React.createElement('div', {
    style: {
      maxWidth: 'var(--container-narrow)',
      margin: '0 auto'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 36,
      flexWrap: 'wrap',
      marginBottom: 28
    }
  }, logo && React.createElement('img', {
    src: logo,
    style: {
      height: 96,
      borderRadius: '50%',
      boxShadow: 'var(--shadow-md)'
    }
  }), partnerLogo && React.createElement('img', {
    src: partnerLogo,
    style: {
      height: 70,
      filter: 'brightness(0) invert(1)',
      opacity: .9
    }
  })), React.createElement('p', {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 'var(--text-md)',
      opacity: .95
    }
  }, name), React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'center',
      gap: 56,
      flexWrap: 'wrap',
      marginTop: 26,
      paddingTop: 26,
      borderTop: '1px solid rgba(255,255,255,.18)'
    }
  }, React.createElement('div', null, React.createElement('h4', {
    style: {
      fontSize: 'var(--text-2xs)',
      opacity: .65,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wider)'
    }
  }, 'Location'), React.createElement('p', {
    style: {
      opacity: .9,
      lineHeight: 'var(--leading-normal)'
    }
  }, address)), React.createElement('div', null, React.createElement('h4', {
    style: {
      fontSize: 'var(--text-2xs)',
      opacity: .65,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wider)'
    }
  }, 'Sessions'), React.createElement('p', {
    style: {
      opacity: .9,
      lineHeight: 'var(--leading-normal)'
    }
  }, sessions)))));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/footer/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/topnav/TopNav.jsx
try { (() => {
const {
  useState
} = React;
function TopNav({
  logo,
  title,
  subtitle,
  links = [],
  homeHref,
  active
}) {
  const [open, setOpen] = useState(false);
  return React.createElement('header', {
    style: {
      background: 'linear-gradient(160deg,rgba(21,43,12,.97),rgba(45,80,22,.94))',
      padding: '12px 30px',
      boxShadow: 'var(--shadow-md)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      fontFamily: 'var(--font-display)'
    }
  }, React.createElement('div', {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 20
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      minWidth: 0
    }
  }, logo && React.createElement('img', {
    src: logo,
    alt: title,
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      boxShadow: 'var(--shadow-sm)',
      flexShrink: 0
    }
  }), React.createElement('div', {
    style: {
      minWidth: 0
    }
  }, React.createElement('div', {
    style: {
      color: 'var(--text-on-dark)',
      fontWeight: 700,
      fontSize: 'var(--text-md)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), subtitle && React.createElement('div', {
    style: {
      color: 'var(--text-on-dark-muted)',
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      whiteSpace: 'nowrap'
    }
  }, subtitle))), React.createElement('nav', {
    className: 'fm-nav-desktop',
    style: {
      display: 'flex',
      gap: 22,
      alignItems: 'center'
    }
  }, links.map(l => React.createElement('a', {
    key: l.label,
    href: l.href,
    style: {
      color: 'var(--text-on-dark)',
      textDecoration: 'none',
      fontWeight: 600,
      fontSize: 'var(--text-sm)',
      opacity: active === l.label ? 1 : .82,
      borderBottom: active === l.label ? '2px solid var(--text-on-dark)' : '2px solid transparent',
      paddingBottom: 2
    }
  }, l.label))), React.createElement('button', {
    className: 'fm-hamburger',
    'aria-label': 'Open menu',
    onClick: () => setOpen(o => !o),
    style: {
      display: 'none',
      flexDirection: 'column',
      gap: 5,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 8
    }
  }, [0, 1, 2].map(i => React.createElement('span', {
    key: i,
    style: {
      width: 24,
      height: 2,
      background: '#fff',
      borderRadius: 2,
      display: 'block'
    }
  })))), open && React.createElement('nav', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(21,43,12,.98)',
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0
    }
  }, links.map(l => React.createElement('a', {
    key: l.label,
    href: l.href,
    onClick: () => setOpen(false),
    style: {
      color: '#fff',
      textDecoration: 'none',
      fontWeight: 600,
      padding: '16px 25px',
      borderBottom: '1px solid rgba(255,255,255,.1)'
    }
  }, l.label))), React.createElement('style', null, '@media(max-width:900px){.fm-nav-desktop{display:none!important}.fm-hamburger{display:flex!important}}'));
}
Object.assign(__ds_scope, { TopNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/topnav/TopNav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/Home.jsx
try { (() => {
const {
  useState,
  useEffect
} = React;
const {
  TopNav,
  Footer,
  Card,
  InfoCard,
  NoticeCard,
  Button,
  Badge,
  SectionHeading,
  Banner,
  Icon
} = window.FletcherMossDesignSystem_7e4605;
const NAV = [{
  label: 'About',
  href: '#about'
}, {
  label: 'Sessions',
  href: '#sessions'
}, {
  label: 'Noticeboard',
  href: '#noticeboard'
}, {
  label: 'Weather',
  href: '#weather'
}, {
  label: 'Join',
  href: '#join'
}, {
  label: 'Location',
  href: '#location'
}, {
  label: 'Singles League',
  href: '#league'
}, {
  label: 'Pairings',
  href: '#pairings'
}];
function Home({
  onNavigate,
  imgBase = '../../assets/'
}) {
  const [temp, setTemp] = useState('16°C');
  const [conditions, setConditions] = useState('Partly cloudy');
  const [rain, setRain] = useState('20%');
  useEffect(() => {/* static demo values — the real page fetches open-meteo live */}, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      background: 'var(--gradient-page)'
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    logo: imgBase + 'logo/fletcher-moss-logo.png',
    title: "Fletcher Moss Social Tennis Club",
    subtitle: "Didsbury Social Tennis",
    links: [...NAV, {
      label: 'Singles League',
      href: '#',
      onClick: () => onNavigate?.('league')
    }],
    active: "About"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 620,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: imgBase + 'imagery/courts-drone-aerial.jpg',
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--gradient-hero-scrim)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 20,
      gap: 22
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "weather",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "cloud-sun",
      size: 14
    })
  }, temp, " \xB7 ", conditions, " \xB7 ", rain, " rain"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 'var(--text-4xl)',
      color: '#fff',
      maxWidth: 820,
      lineHeight: 'var(--leading-tight)',
      textShadow: '0 2px 20px rgba(0,0,0,.45)'
    }
  }, "Free social tennis, right in the heart of Didsbury"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-lg)',
      color: 'rgba(255,255,255,.92)',
      maxWidth: 560
    }
  }, "Community-run, all abilities welcome \u2014 just turn up and play."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      flexWrap: 'wrap',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    as: "a",
    href: "#about",
    variant: "inverse",
    size: "lg"
  }, "Learn more"), /*#__PURE__*/React.createElement(Button, {
    as: "a",
    href: "#join",
    variant: "primary",
    size: "lg"
  }, "Join now")))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '-64px auto 0',
      padding: '0 30px 100px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("section", {
    id: "about",
    style: {
      marginBottom: 88
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "Who we are",
    title: "Free social tennis in Didsbury"
  }), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      flexWrap: 'wrap',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      color: 'var(--text-heading)',
      fontSize: 'var(--text-lg)',
      flex: 1,
      minWidth: 200,
      margin: 0
    }
  }, "About us"), /*#__PURE__*/React.createElement("img", {
    src: imgBase + 'logo/mcractive-logo.jpg',
    style: {
      height: 56
    }
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: 'var(--text-base)',
      lineHeight: 'var(--leading-normal)',
      margin: 0
    }
  }, "Community-run tennis organised by volunteers who give their time freely, supported by ", /*#__PURE__*/React.createElement("a", {
    href: "https://mcractive.com/",
    style: {
      color: 'var(--text-link)',
      fontWeight: 600
    }
  }, "McrActive"), " to provide accessible tennis for Didsbury and South Manchester. An inclusive, friendly environment where fun and social connection are at the heart of every session.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(InfoCard, {
    title: "Sociable & inclusive",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "users",
      color: "var(--green-700)"
    })
  }, "Warm, friendly atmosphere where everyone's welcome. Random partnering keeps things fresh and helps you meet new people."), /*#__PURE__*/React.createElement(InfoCard, {
    title: "Beautiful location",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "trees",
      color: "var(--green-700)"
    })
  }, "Set in the lovely surroundings of Fletcher Moss Park \u2014 a great way to exercise, unwind, and enjoy the outdoors."), /*#__PURE__*/React.createElement(InfoCard, {
    title: "No fees or contracts",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "banknote",
      color: "var(--green-700)"
    })
  }, "No membership fees or contracts. Just a small contribution towards balls every few months to keep things running."), /*#__PURE__*/React.createElement(InfoCard, {
    title: "Your first session",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      color: "var(--green-700)"
    })
  }, "Just turn up, introduce yourself and you'll be paired up straight away. We rotate partners so you'll play with everyone."))), /*#__PURE__*/React.createElement("section", {
    id: "sessions",
    style: {
      marginBottom: 88
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "When we play",
    title: "Session times"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 20
    }
  }, [['Monday', '6:00 – 8:00 PM'], ['Thursday', '6:00 – 8:00 PM'], ['Saturday', '11:00 AM – 2:00 PM']].map(([d, t]) => /*#__PURE__*/React.createElement(Card, {
    key: d,
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 'var(--text-lg)',
      color: 'var(--text-heading)'
    }
  }, d), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, t))))), /*#__PURE__*/React.createElement("section", {
    id: "noticeboard",
    style: {
      marginBottom: 88
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "What's on",
    title: "Noticeboard"
  }), /*#__PURE__*/React.createElement(NoticeCard, {
    empty: true
  }, "No current updates \u2014 check back soon!"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Admin"))), /*#__PURE__*/React.createElement("section", {
    id: "weather",
    style: {
      marginBottom: 88
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "Before you head out",
    title: "Court weather check"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--gradient-sky)',
      borderRadius: 'var(--radius-xl)',
      padding: 36,
      color: '#fff',
      textAlign: 'center',
      boxShadow: 'var(--shadow-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 'var(--text-xl)'
    }
  }, "Didsbury conditions"), /*#__PURE__*/React.createElement("p", {
    style: {
      opacity: .9,
      marginTop: 6
    }
  }, "Check the weather before heading to the courts."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 20,
      marginTop: 24
    }
  }, [['Temperature', temp], ['Conditions', conditions], ['Rain chance', rain]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      background: 'rgba(255,255,255,.16)',
      backdropFilter: 'blur(var(--blur-glass))',
      border: '1px solid rgba(255,255,255,.3)',
      borderRadius: 'var(--radius-md)',
      padding: '18px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      opacity: .85,
      marginBottom: 8
    }
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 700,
      fontFamily: 'var(--font-display)'
    }
  }, v)))))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 88
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "Getting involved",
    title: "How it works"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      gap: 20,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(InfoCard, {
    title: "Join the WhatsApp group",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "message-circle",
      color: "var(--green-700)"
    })
  }, "All coordination happens via WhatsApp. Scan the QR code below to request access."), /*#__PURE__*/React.createElement(InfoCard, {
    title: "\xA310 contribution",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "banknote",
      color: "var(--green-700)"
    })
  }, "Payment covers new tennis balls, collected every 3\u20136 months as needed.")), /*#__PURE__*/React.createElement(Card, {
    style: {
      background: 'var(--gold-100)',
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--brown-800)',
      lineHeight: 'var(--leading-normal)'
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Skill level:"), " we welcome intermediate to advanced players. Beginners are advised to get some lessons first to feel comfortable with the basics before requesting to join."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 0',
      color: 'var(--brown-800)',
      lineHeight: 'var(--leading-normal)'
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Risk assessment:"), " while organisers conduct informal safety checks before each session, all participants play at their own risk and are responsible for their own safety."))), /*#__PURE__*/React.createElement("section", {
    id: "join",
    style: {
      marginBottom: 88,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "Ready to play?",
    title: "Join our WhatsApp group"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      maxWidth: 520,
      margin: '0 auto 20px',
      lineHeight: 'var(--leading-normal)'
    }
  }, "All session updates, cancellations and banter happen on WhatsApp. Scan the code below to request access \u2014 we'll get you on court as soon as possible."), /*#__PURE__*/React.createElement("img", {
    src: imgBase + 'imagery/court-shot-night.jpg',
    style: {
      width: 220,
      height: 220,
      objectFit: 'cover',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      marginBottom: 20
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, {
    variant: "whatsapp",
    size: "lg",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "message-circle",
      size: 18
    })
  }, "Tap to join via WhatsApp"))), /*#__PURE__*/React.createElement("section", {
    id: "location"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "Find us",
    title: "Fletcher Moss Park tennis courts"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      color: 'var(--text-muted)',
      marginBottom: 24
    }
  }, "Didsbury, Manchester M20 2SW"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 340,
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: imgBase + 'imagery/park-path-autumn.jpg',
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg,rgba(21,43,12,.25),rgba(21,43,12,.55))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: '#fff',
      textAlign: 'center',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-2xl)',
      margin: 0
    }
  }, "Play at Fletcher Moss"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 10,
      fontSize: 'var(--text-md)'
    }
  }, "Beautiful outdoor courts in the heart of Didsbury"))))), /*#__PURE__*/React.createElement(Footer, {
    logo: imgBase + 'logo/fletcher-moss-logo.png',
    partnerLogo: imgBase + 'logo/mcractive-logo.jpg',
    name: "Fletcher Moss Social Tennis Club",
    address: /*#__PURE__*/React.createElement(React.Fragment, null, "Fletcher Moss Park", /*#__PURE__*/React.createElement("br", null), "Didsbury, Manchester", /*#__PURE__*/React.createElement("br", null), "M20 2SW, United Kingdom"),
    sessions: /*#__PURE__*/React.createElement(React.Fragment, null, "Monday 6:00 \u2013 8:00 PM", /*#__PURE__*/React.createElement("br", null), "Thursday 6:00 \u2013 8:00 PM", /*#__PURE__*/React.createElement("br", null), "Saturday 11:00 AM \u2013 2:00 PM")
  }));
}
window.Home = Home;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/League.jsx
try { (() => {
const {
  useState
} = React;
const {
  TopNav,
  Footer,
  Card,
  Button,
  Badge,
  SectionHeading,
  Select,
  TextField,
  Icon
} = window.FletcherMossDesignSystem_7e4605;
const NAV = [{
  label: 'Home',
  href: '#'
}];
const BOXES = [{
  name: 'Box A',
  players: [{
    name: 'Alex R.',
    pts: 9,
    played: 4
  }, {
    name: 'Sam T.',
    pts: 7,
    played: 4
  }, {
    name: 'Priya K.',
    pts: 6,
    played: 3
  }, {
    name: 'Jordan M.',
    pts: 4,
    played: 4
  }]
}, {
  name: 'Box B',
  players: [{
    name: 'Chris L.',
    pts: 8,
    played: 3
  }, {
    name: 'Nina F.',
    pts: 6,
    played: 3
  }, {
    name: 'Owen D.',
    pts: 5,
    played: 4
  }, {
    name: 'Maya S.',
    pts: 3,
    played: 3
  }]
}];
function League({
  onNavigate,
  imgBase = '../../assets/'
}) {
  const [adminOpen, setAdminOpen] = useState(false);
  const [box, setBox] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      background: 'var(--gradient-page)',
      minHeight: '100vh'
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    logo: imgBase + 'logo/fletcher-moss-logo.png',
    title: "Fletcher Moss Social Tennis Club",
    subtitle: "FMST Singles League",
    links: [{
      label: 'Home',
      href: '#',
      onClick: () => onNavigate?.('home')
    }],
    active: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '56px 30px 100px'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "Season standings",
    title: "FMST Singles League",
    align: "left"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      marginTop: -20,
      marginBottom: 32
    }
  }, "Points: ", /*#__PURE__*/React.createElement("strong", null, "3"), " for a win \xB7 ", /*#__PURE__*/React.createElement("strong", null, "1"), " for playing \xB7 ", /*#__PURE__*/React.createElement("strong", null, "0"), " for a no-show. Walkovers count as wins."), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 14
    }),
    onClick: () => setAdminOpen(o => !o)
  }, "Admin portal")), adminOpen && /*#__PURE__*/React.createElement(Card, {
    style: {
      marginBottom: 32,
      background: 'var(--gold-100)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      color: 'var(--brown-800)',
      marginTop: 0
    }
  }, "Admin \u2014 player & match management"), /*#__PURE__*/React.createElement(TextField, {
    label: "Admin password",
    type: "password",
    placeholder: "Enter admin password"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "Edit player names, undo match results, or reset the league from here (demo \u2014 not wired to live data).")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      gap: 24,
      marginBottom: 48
    }
  }, BOXES.map(b => /*#__PURE__*/React.createElement(Card, {
    key: b.name
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      color: 'var(--text-heading)',
      borderBottom: '1px solid var(--border-subtle)',
      paddingBottom: 10,
      marginTop: 0
    }
  }, b.name), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 'var(--text-sm)'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: 'var(--green-50)'
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'left',
      padding: 10,
      color: 'var(--green-800)'
    }
  }, "Player"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right',
      padding: 10,
      color: 'var(--green-800)'
    }
  }, "Played"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right',
      padding: 10,
      color: 'var(--green-800)'
    }
  }, "Points"))), /*#__PURE__*/React.createElement("tbody", null, b.players.sort((a, c) => c.pts - a.pts).map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.name
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 10,
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, p.name), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 10,
      textAlign: 'right',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, p.played), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 10,
      textAlign: 'right',
      borderBottom: '1px solid var(--border-subtle)',
      fontWeight: 700,
      color: 'var(--green-700)'
    }
  }, p.pts)))))))), /*#__PURE__*/React.createElement(Card, {
    style: {
      background: 'var(--green-50)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      color: 'var(--text-heading)',
      marginTop: 0
    }
  }, "Submit match result"), submitted ? /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--green-700)',
      fontWeight: 600
    }
  }, "Result submitted \u2014 thanks! Standings update on save.") : /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      setSubmitted(true);
    },
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1/-1'
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "League",
    placeholder: "Select league\u2026",
    value: box,
    onChange: e => setBox(e.target.value),
    options: BOXES.map(b => ({
      value: b.name,
      label: b.name
    }))
  })), /*#__PURE__*/React.createElement(Select, {
    label: "Player 1",
    placeholder: "Select league first",
    options: box ? BOXES.find(b => b.name === box).players.map(p => ({
      value: p.name,
      label: p.name
    })) : []
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Player 2",
    placeholder: "Select league first",
    options: box ? BOXES.find(b => b.name === box).players.map(p => ({
      value: p.name,
      label: p.name
    })) : []
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1/-1'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "md",
    as: "button",
    type: "submit"
  }, "Submit result"))))), /*#__PURE__*/React.createElement(Footer, {
    logo: imgBase + 'logo/fletcher-moss-logo.png',
    partnerLogo: imgBase + 'logo/mcractive-logo.jpg',
    name: "Fletcher Moss Social Tennis Club",
    address: /*#__PURE__*/React.createElement(React.Fragment, null, "Fletcher Moss Park", /*#__PURE__*/React.createElement("br", null), "Didsbury, Manchester", /*#__PURE__*/React.createElement("br", null), "M20 2SW"),
    sessions: /*#__PURE__*/React.createElement(React.Fragment, null, "Monday 6:00 \u2013 8:00 PM", /*#__PURE__*/React.createElement("br", null), "Thursday 6:00 \u2013 8:00 PM", /*#__PURE__*/React.createElement("br", null), "Saturday 11:00 AM \u2013 2:00 PM")
  }));
}
window.League = League;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/League.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/Pairings.jsx
try { (() => {
const {
  useState
} = React;
const {
  TopNav,
  Footer,
  Card,
  Button,
  Badge,
  SectionHeading,
  TextField,
  Icon
} = window.FletcherMossDesignSystem_7e4605;
const DEFAULT_PLAYERS = ['Alex', 'Sam', 'Priya', 'Jordan', 'Chris', 'Nina', 'Owen', 'Maya', 'Ravi', 'Tom'];
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function Pairings({
  onNavigate,
  imgBase = '../../assets/'
}) {
  const [raw, setRaw] = useState(DEFAULT_PLAYERS.join('\n'));
  const [courts, setCourts] = useState(null);
  const [sitting, setSitting] = useState([]);
  function generate() {
    const players = shuffle(raw.split('\n').map(s => s.trim()).filter(Boolean));
    const perCourt = 4;
    const numCourts = Math.floor(players.length / perCourt);
    const playing = players.slice(0, numCourts * perCourt);
    const sit = players.slice(numCourts * perCourt);
    const cs = [];
    for (let i = 0; i < numCourts; i++) {
      const four = playing.slice(i * 4, i * 4 + 4);
      cs.push({
        court: i + 1,
        teamA: [four[0], four[1]],
        teamB: [four[2], four[3]]
      });
    }
    setCourts(cs);
    setSitting(sit);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      background: 'var(--gradient-page)',
      minHeight: '100vh'
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    logo: imgBase + 'logo/fletcher-moss-logo.png',
    title: "Fletcher Moss Social Tennis Club",
    subtitle: "Court Pairings",
    links: [{
      label: 'Home',
      href: '#',
      onClick: () => onNavigate?.('home')
    }],
    active: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-narrow)',
      margin: '0 auto',
      padding: '56px 24px 100px'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    kicker: "Session tool",
    title: "Generate tonight's pairings",
    align: "left"
  }), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      color: 'var(--text-heading)',
      marginTop: 0,
      fontSize: 'var(--text-md)'
    }
  }, "Who's playing tonight?"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)',
      marginTop: 0
    }
  }, "One name per line. We'll randomise courts and rotate anyone sitting out."), /*#__PURE__*/React.createElement(TextField, {
    multiline: true,
    value: raw,
    onChange: e => setRaw(e.target.value),
    style: {
      minHeight: 160,
      fontFamily: 'var(--font-body)'
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "shuffle",
      size: 18
    }),
    onClick: generate,
    style: {
      width: '100%',
      justifyContent: 'center'
    }
  }, "Generate pairings")), courts && /*#__PURE__*/React.createElement(React.Fragment, null, sitting.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--gold-100)',
      border: '1px solid var(--gold-300)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      marginBottom: 20,
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-wider)',
      textTransform: 'uppercase',
      color: 'var(--color-sub)'
    }
  }, "Sitting out"), sitting.map(p => /*#__PURE__*/React.createElement(Badge, {
    key: p,
    tone: "sub"
  }, p))) : /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--green-50)',
      border: '1px solid var(--green-200)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      marginBottom: 20,
      color: 'var(--green-800)',
      fontWeight: 600,
      fontSize: 'var(--text-sm)'
    }
  }, "Everyone's on a court tonight."), courts.map(c => /*#__PURE__*/React.createElement(Card, {
    key: c.court,
    style: {
      marginBottom: 14,
      padding: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 16px',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--green-600)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      fontWeight: 800,
      letterSpacing: 'var(--tracking-wider)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Court ", c.court)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 38px 1fr',
      alignItems: 'center',
      padding: '16px 14px',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      textAlign: 'center',
      marginBottom: 2
    }
  }, "Team A"), c.teamA.map(p => /*#__PURE__*/React.createElement("div", {
    key: p,
    style: {
      background: 'var(--green-50)',
      border: '1px solid var(--green-200)',
      color: 'var(--green-800)',
      borderRadius: 7,
      padding: 8,
      fontWeight: 600,
      fontSize: 13,
      textAlign: 'center'
    }
  }, p))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 30,
      height: 30,
      borderRadius: '50%',
      border: '2px solid var(--border-strong)',
      fontSize: 9,
      fontWeight: 900,
      color: 'var(--text-muted)',
      lineHeight: '26px'
    }
  }, "VS")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      textAlign: 'center',
      marginBottom: 2
    }
  }, "Team B"), c.teamB.map(p => /*#__PURE__*/React.createElement("div", {
    key: p,
    style: {
      background: 'var(--green-50)',
      border: '1px solid var(--green-200)',
      color: 'var(--green-800)',
      borderRadius: 7,
      padding: 8,
      fontWeight: 600,
      fontSize: 13,
      textAlign: 'center'
    }
  }, p)))))))), /*#__PURE__*/React.createElement(Footer, {
    logo: imgBase + 'logo/fletcher-moss-logo.png',
    partnerLogo: imgBase + 'logo/mcractive-logo.jpg',
    name: "Fletcher Moss Social Tennis Club",
    address: /*#__PURE__*/React.createElement(React.Fragment, null, "Fletcher Moss Park", /*#__PURE__*/React.createElement("br", null), "Didsbury, Manchester", /*#__PURE__*/React.createElement("br", null), "M20 2SW"),
    sessions: /*#__PURE__*/React.createElement(React.Fragment, null, "Monday 6:00 \u2013 8:00 PM", /*#__PURE__*/React.createElement("br", null), "Thursday 6:00 \u2013 8:00 PM", /*#__PURE__*/React.createElement("br", null), "Saturday 11:00 AM \u2013 2:00 PM")
  }));
}
window.Pairings = Pairings;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/Pairings.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.InfoCard = __ds_scope.InfoCard;

__ds_ns.NoticeCard = __ds_scope.NoticeCard;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.SectionHeading = __ds_scope.SectionHeading;

__ds_ns.Banner = __ds_scope.Banner;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.TopNav = __ds_scope.TopNav;

})();
