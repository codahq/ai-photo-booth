import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

// Filesystems that can be read but never report changes. A Windows source tree
// reaches this container over 9p (drvfs), and 9p raises no inotify events at all,
// so fs.watch on the workspace is silent: HMR never fires and an edit only shows
// up after restarting the dev server. Polling is the only way to see changes on
// such a mount, but it burns CPU, so switch it on only when the source actually
// sits on one. Moving the repo onto the WSL2 ext4 filesystem gets real inotify
// back and leaves polling off here automatically.
const WATCHLESS_FSTYPES = new Set(['9p', 'vboxsf', 'cifs', 'nfs', 'nfs4']);

function needsPolling(dir: string): boolean {
  try {
    // The deepest mount point containing dir is the one dir actually lives on.
    const owning = readFileSync('/proc/mounts', 'utf8')
      .split('\n')
      .map((line: string) => line.split(' '))
      .filter(([, point]: string[]) => point && (dir === point || dir.startsWith(point === '/' ? '/' : point + '/')))
      .sort((a: string[], b: string[]) => b[1].length - a[1].length)[0];
    return owning ? WATCHLESS_FSTYPES.has(owning[2]) : false;
  } catch {
    // No /proc/mounts means macOS or Windows, where native watching works.
    return false;
  }
}

const usePolling = needsPolling(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // package.json is type: module, so __dirname isn't available here
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: usePolling ? { usePolling: true, interval: 300 } : undefined,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
});
