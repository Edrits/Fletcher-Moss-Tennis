# Card family
One sentence: the base white elevated surface, plus two specialised variants — `InfoCard` (icon + title + body, used for "how it works" tiles) and `NoticeCard` (the cork-board noticeboard display).

```jsx
<Card>Any content</Card>
<InfoCard title="Join WhatsApp Group" icon={<Icon name="message-circle"/>}>All coordination happens via WhatsApp.</InfoCard>
<NoticeCard empty>No current updates — check back soon.</NoticeCard>
```

All shadow-only (no border), 18px radius, soft two-layer elevation. Hover lifts `Card`/`InfoCard` 3px; `NoticeCard` doesn't hover (it's a display panel, not an action target).
