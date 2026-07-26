# Badge
One sentence: small pill-shaped status/label chip — generalises the source site's weather pill, sitting-out pill and box-league tally chip into one primitive.

```jsx
<Badge tone="weather" icon={<Icon name="cloud-sun" size={14}/>}>14°C · Partly cloudy</Badge>
<Badge tone="sub">Sub</Badge>
<Badge tone="active">Court 1</Badge>
```

Tones: `neutral` (default chip), `active` (filled dark green, e.g. selected tab/court), `sub` (warm amber, substitute player), `success` (pale green, confirmations), `weather` (glass, for use over photography).
