/// <reference types="vite/client" />
/// <reference types="node" />

interface ImportMetaEnv {
  // 예: const title = import.meta.env.VITE_APP_TITLE;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}