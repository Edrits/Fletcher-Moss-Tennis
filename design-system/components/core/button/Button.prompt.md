# Button
One sentence: the club's single button primitive — solid green primary, outlined secondary, translucent inverse (for use over photography), and a WhatsApp join variant.

```jsx
<Button variant="primary" size="lg">Join Now</Button>
<Button variant="secondary" as="a" href="index.html">Home</Button>
<Button variant="whatsapp" icon={<Icon name="message-circle" size={18}/>}>Tap to Join via WhatsApp</Button>
```

Variants: `primary` (green fill), `secondary` (outlined, used for nav-style "Home" actions), `inverse` (translucent white, for hero/photo backgrounds), `whatsapp` (softened teal fill), `ghost` (text-only link action). Sizes: `sm`/`md`/`lg`. Hover always lifts 2px and deepens fill — never scales or bounces.
