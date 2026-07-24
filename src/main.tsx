import '@fontsource-variable/space-grotesk/index.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import '@fontsource-variable/bricolage-grotesque/wght.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Tetramorph root element is missing.');

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
