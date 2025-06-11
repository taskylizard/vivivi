import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';

type UseToggleReactScanControlled = {
  mode: 'controlled';
  enabled: boolean;
  setEnabled: Dispatch<SetStateAction<boolean>>;
};

type UseToggleReactScanUncontrolled = {
  mode?: 'uncontrolled';
};

type UseToggleReactScanOptions =
  | UseToggleReactScanControlled
  | UseToggleReactScanUncontrolled;

const STORAGE_KEY = 'react-scan-enabled';

export const useToggleReactScan = (
  options: UseToggleReactScanOptions = { mode: 'uncontrolled' },
) => {
  const isControlled = options.mode === 'controlled';

  const [internalEnabled, setInternalEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const enabled = isControlled ? options.enabled : internalEnabled;
  const setEnabled: Dispatch<SetStateAction<boolean>> = isControlled
    ? options.setEnabled
    : setInternalEnabled;

  const applyToDOM = useCallback((on: boolean) => {
    const root = document.getElementById('react-scan-root');
    if (root) {
      root.style.display = on ? '' : 'none';
      const input = root.shadowRoot?.querySelector<HTMLInputElement>(
        ".react-scan-toggle input[type='checkbox']",
      );
      if (input && input.checked !== on) input.click();
    }
  }, []);

  useEffect(() => {
    applyToDOM(enabled);
    if (!isControlled && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    }
  }, [enabled, applyToDOM, isControlled]);

  const enable = useCallback(() => {
    setEnabled(true);
  }, [setEnabled]);

  const disable = useCallback(() => {
    setEnabled(false);
  }, [setEnabled]);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, [setEnabled]);

  return { enabled, enable, disable, toggle, setEnabled };
};
