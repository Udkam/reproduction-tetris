import '@fontsource/geist-mono/latin-400.css';
import '@fontsource/geist-mono/latin-500.css';
import '@fontsource/geist-mono/latin-600.css';
import '@fontsource/geist-mono/latin-700.css';
import '@fontsource/noto-sans-sc/chinese-simplified-400.css';
import '@fontsource/noto-sans-sc/chinese-simplified-500.css';
import '@fontsource/noto-sans-sc/chinese-simplified-600.css';
import '@fontsource/noto-sans-sc/chinese-simplified-700.css';
import '@fontsource/playwrite-nz-basic/400.css';
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-600.css';
import '@fontsource/space-grotesk/latin-700.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './styles/tokens.css';
import './styles/mutation-vfx.css';
import './styles/hud.css';
import './styles/navigation.css';
import './styles/puzzle-library.css';
import './styles/result.css';
import './styles/settings.css';

const root = document.getElementById('root');
if (!root) throw new Error('TetraMorph root element is missing.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const bootScreen = document.getElementById('boot-screen');
    if (!bootScreen) return;
    bootScreen.classList.add('boot-screen--leaving');
    const remove = () => bootScreen.remove();
    bootScreen.addEventListener('transitionend', remove, { once: true });
    window.setTimeout(remove, 320);
  });
});
