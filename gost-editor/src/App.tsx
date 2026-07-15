import { useEffect } from 'react';
import EditorShell from './components/layout/EditorShell';
import { useEditorStore } from './store/editorStore';

function App() {
  const theme = useEditorStore((s) => s.settings.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return <EditorShell />;
}

export default App;