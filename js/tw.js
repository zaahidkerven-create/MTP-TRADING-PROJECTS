tailwind.config = {
  theme: {
    extend: {
      colors: {
        graphite: { 950: '#0C0C0E', 900: '#15161A', 850: '#1A1C20', 800: '#212328', 700: '#2D3036', 600: '#3D4149' },
        brand:    { 300: '#F7C29E', 400: '#EE9256', 500: '#D3692B', 600: '#9D4A1B' },
        navy:     { 500: '#9D4A1B' },
        signal:   { 500: '#5FBE8C' },
        chalk:    { 50: '#F8F8F6', 100: '#ECECE8', 200: '#D6D6D0' },
        steel:    { 400: '#9C9C96', 500: '#7A7A74' },
        ink:      { 900: '#0B0B0D' },
      },
      fontFamily: {
        display: ['"Saira Condensed"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      maxWidth: { content: '76rem' },
    },
  },
};
