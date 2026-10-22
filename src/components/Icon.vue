<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.home" /></svg></template>
<script>
const paths = {
 home: 'M3 10 12 3l9 7M5 9v12h14V9M9 21v-7h6v7',
 grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
 people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 building: 'M4 21V5l8-3 8 3v16M2 21h20M8 7h1M15 7h1M8 11h1M15 11h1M8 15h1M15 15h1M10 21v-3h4v3',
 arrow: 'M5 12h14M14 7l5 5-5 5', plus: 'M12 5v14M5 12h14',
 search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 refresh: 'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2l1 4M4 12l1 4a8 8 0 0 0 13 2',
 logout: 'M9 4H4v16h5M10 12h11M17 8l4 4-4 4',
 chevron: 'M9 5l7 7-7 7', shield: 'M12 3l8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3M8 12l3 3 5-6',
 eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 layers: 'M12 3 2 8l10 5 10-5-10-5M2 12l10 5 10-5M2 16l10 5 10-5',
 check: 'M5 12l4 4L19 6', clock: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
};
export default { props: { name: String, size: { type: [Number, String], default: 20 } }, data: () => ({ paths }) };
</script>